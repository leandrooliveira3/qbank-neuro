import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';
import { storageService } from '../services/storage';
import { Flashcard } from '../types';
import { parseFlashcardCsv, parseFlashcardJson, type ParsedFlashcard as ParsedCard } from '../services/flashcardImport';
import { 
    Upload, FileText, ArrowLeft, Loader2, CheckCircle2, 
    AlertCircle, Layers, FileJson, Table, FileCode, Download,
    Info, X, Image as ImageIcon
} from 'lucide-react';
import { ankiImageBlob, decodeAnkiBytes, expandAnkiCloze, readAnkiMediaMap } from '../services/ankiFlashcards';
import JSZip from 'jszip';
import initSqlJs from 'sql.js';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Supported formats ────────────────────────────────────────────────────────

const SUPPORTED_FORMATS = [
    { ext: '.apkg / .colpkg', name: 'Anki Package', icon: Download, desc: 'Deck ou coleção exportada do Anki' },
    { ext: '.txt', name: 'Texto', icon: FileText, desc: 'Frente;Verso ou Frente[TAB]Verso' },
    { ext: '.csv', name: 'CSV', icon: Table, desc: 'Primeira coluna = frente, segunda = verso' },
    { ext: '.json', name: 'JSON', icon: FileJson, desc: 'Array de objetos com front/back' },
    { ext: '.md', name: 'Markdown', icon: FileCode, desc: 'Blocos Q:/A: separados por ---' },
];

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n\s*\n/g, '\n')
        .trim();
}

function extractImgSrc(html: string): string | undefined {
    const m = html.match(/<img[^>]+src=["']?([^"'\s>]+)["']?/i);
    return m?.[1];
}

function getExt(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ImportFlashcards: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('Processando arquivo...');
    const [error, setError] = useState<string | null>(null);
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
    const [bankName, setBankName] = useState('Importado');
    const [category, setCategory] = useState('Geral');
    const [importSuccess, setImportSuccess] = useState(false);
    const [mode, setMode] = useState<'file' | 'themes'>('file');
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [autoAddToRevision, setAutoAddToRevision] = useState(false);
    
    const themes = Array.from({ length: 8 }, (_, index) => `NRI · Bloco ${index + 1}`);

    const [importedCount, setImportedCount] = useState(0);
    const [mediaCount, setMediaCount] = useState(0);
    const uploadedImages = useRef(new WeakMap<Blob, string>());
    const [pastedJsonText, setPastedJsonText] = useState('');

    const handleRawTextImport = () => {
        if (!pastedJsonText.trim()) return;
        setError(null);
        setParsedCards([]);
        setLoading(true);
        setLoadingMsg('Processando texto colado...');

        try {
            let cards: ParsedCard[] = [];
            let text = pastedJsonText.trim();
            
            if (text.startsWith('[') || text.startsWith('{')) {
                cards = parseFlashcardJson(text);
            } else if (text.includes('Q:') || text.includes('Pergunta:') || text.includes('Frente:')) {
                cards = parseMarkdown(text);
            } else {
                cards = parseTxt(text);
            }

            if (cards.length === 0) {
                throw new Error('Nenhum flashcard válido encontrado no texto colado.');
            }

            setParsedCards(cards);
            setMediaCount(0);
            setBankName('Importado (Texto)');
        } catch (err: any) {
            setError(err.message || 'Erro ao parsear o conteúdo de texto.');
        } finally {
            setLoading(false);
        }
    };

    // ── File selection ──────────────────────────────────────────────────────
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        e.target.value = '';
        if (selectedFile) await selectFile(selectedFile);
    };

    const selectFile = async (selectedFile: File) => {
        if (loading) return;

        setFile(selectedFile);
        setError(null);
        setParsedCards([]);
        setLoading(true);
        setLoadingMsg('Processando arquivo...');

        try {
            const cards = await parseFile(selectedFile);
            if (!cards.length) throw new Error('Nenhum flashcard válido encontrado no arquivo.');
            setParsedCards(cards);
            setMediaCount(cards.filter(c => c.frontImageBlob).length);
            const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
            setBankName(fileName || 'Importado');
        } catch (err: any) {
            setError(err.message || 'Erro ao processar arquivo');
        } finally {
            setLoading(false);
        }
    };

    // ── Dispatch by extension ───────────────────────────────────────────────
    const parseFile = async (f: File): Promise<ParsedCard[]> => {
        const ext = f.name.toLowerCase().split('.').pop();
        if (ext === 'apkg' || ext === 'colpkg') return parseAnkiPackage(f);
        const text = await f.text();
        switch (ext) {
            case 'txt':  return parseTxt(text);
            case 'csv':  return parseFlashcardCsv(text);
            case 'json': return parseFlashcardJson(text);
            case 'md':   return parseMarkdown(text);
            default:     throw new Error(`Formato não suportado: .${ext}`);
        }
    };

    // ── Anki parser ─────────────────────────────────────────────────────────
    const parseAnkiPackage = async (f: File): Promise<ParsedCard[]> => {
        setLoadingMsg('Descompactando arquivo...');
        const zip = await new JSZip().loadAsync(f);
        
        setLoadingMsg('Iniciando SQL.js...');
        const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });

        const files = Object.keys(zip.files);
        const candidateNames = files.filter(n => n.includes('collection.anki2')).sort((a,b) => b.length - a.length); // anki21b before anki21 before anki2
        
        if (candidateNames.length === 0) {
            throw new Error(`Arquivo Anki inválido: banco de dados não encontrado. Arquivos: ${files.join(', ')}`);
        }

        let modern = false;
        let db: InstanceType<typeof SQL.Database> | null = null;

        setLoadingMsg('Lendo banco de dados SQLite...');
        for (const name of candidateNames) {
            const entry = zip.file(name);
            if (!entry) continue;
            try {
                const buf = decodeAnkiBytes(await entry.async('uint8array'));

                const tempDb = new SQL.Database(buf);
                
                try {
                    const res = tempDb.exec('SELECT count(*) FROM notes');
                    const count = res[0]?.values[0]?.[0] as number;
                    let isDummy = false;
                    
                    if (count === 1) {
                        const rr = tempDb.exec('SELECT flds FROM notes LIMIT 1');
                        const text = (rr[0]?.values[0]?.[0] as string) || '';
                        if (text.includes('Atualize') || text.includes('update to the latest')) {
                            isDummy = true;
                        }
                    }
                    
                    if (!isDummy) {
                        db?.close();
                        modern = name.endsWith('.anki21b');
                        db = tempDb;
                        break;
                    }
                    tempDb.close();
                } catch(e) {
                    tempDb.close(); // Ignora databases inválidos
                }
            } catch(e) {
                console.warn(`Erro ao ler o candidato ${name}:`, e);
            }
        }

        if (!db) {
            throw new Error('Falha ao abrir banco de dados SQLite do Anki.');
        }

        let rows: (string | number | Uint8Array | null)[][];
        try {
            rows = db.exec('SELECT flds, tags FROM notes')[0]?.values ?? [];
        } finally {
            db.close();
        }

        setLoadingMsg('Lendo arquivos de mídia...');
        const mediaEntry = zip.file('media');
        const mediaMap = mediaEntry ? readAnkiMediaMap(await mediaEntry.async('uint8array'), modern) : new Map<string, string>();
        const images = new Map<string, Blob>();
        const loadImage = async (filename: string | undefined) => {
            if (!filename) return undefined;
            const existing = images.get(filename);
            if (existing) return existing;
            const key = mediaMap.get(filename);
            const entry = key === undefined ? undefined : zip.file(key);
            if (!entry) return undefined;
            const blob = ankiImageBlob(await entry.async('uint8array'), getExt(filename));
            images.set(filename, blob);
            return blob;
        };

        const cards: ParsedCard[] = [];
        for (const row of rows) {
            const flds = String(row[0] ?? '');
            const tagStr = String(row[1] ?? '');
            const fields = flds.split('\x1f');
            const frontRaw = fields[0] ?? '';
            const backRaw  = fields.slice(1).join('\n') ?? '';
            
            const cloze = expandAnkiCloze(frontRaw);
            const pairs = cloze.length
                ? cloze.map(pair => ({ front: pair.front, back: [pair.back, backRaw].filter(Boolean).join('\n\n') }))
                : [{ front: frontRaw, back: backRaw }];
            for (const pair of pairs) {
                const frontImg = extractImgSrc(pair.front);
                const backImg = extractImgSrc(pair.back);
                const frontImageBlob = await loadImage(frontImg);
                const sameImage = frontImageBlob && frontImg === backImg;
                const backImageBlob = sameImage ? undefined : await loadImage(backImg);
                const front = stripHtml(pair.front) || (frontImageBlob ? '(imagem)' : '');
                const back = stripHtml(pair.back) || (backImageBlob || sameImage ? '(imagem)' : '');
                if (!front && !back) continue;
                cards.push({
                    front, back, tags: tagStr.split(' ').filter(Boolean),
                    frontImageBlob, backImageBlob, imageSide: sameImage ? 'both' : undefined,
                    frontImageExt: frontImg && getExt(frontImg), backImageExt: backImg && getExt(backImg),
                });
            }
        }
        if (cards.length === 0) throw new Error('Nenhuma nota encontrada.');
        return cards;
    };

    const parseTxt = (text: string): ParsedCard[] => {
        const lines = text.split('\n').filter(l => l.trim());
        const cards: ParsedCard[] = [];
        for (const line of lines) {
            let parts = line.split('\t');
            if (parts.length < 2) parts = line.split(';');
            if (parts.length >= 2) {
                const front = parts[0].trim();
                const back  = parts[1].trim();
                const tags  = parts[2]?.split(',').map(t => t.trim()).filter(Boolean);
                if (front && back) cards.push({ front, back, tags });
            }
        }
        return cards;
    };

    const parseMarkdown = (text: string): ParsedCard[] => {
        const blocks = text.split(/\n(?:---+|\*\*\*+|___+)\n/);
        const cards: ParsedCard[] = [];
        for (const block of blocks) {
            const trimmed = block.trim();
            if (!trimmed) continue;
            const qa = trimmed.match(/(?:Q:|Pergunta:|Frente:)\s*([\s\S]*?)(?:\n\s*(?:A:|Resposta:|Verso:)\s*([\s\S]*))/i);
            if (qa) {
                cards.push({ front: qa[1].trim(), back: qa[2].trim() });
            } else {
                const parts = trimmed.split(/\n\n+/);
                if (parts.length >= 2) cards.push({ front: parts[0].trim(), back: parts.slice(1).join('\n\n').trim() });
            }
        }
        return cards;
    };

    const handleImport = async () => {
        if (!user || parsedCards.length === 0) return;
        setLoading(true);
        setError(null);
        try {
            const withUrls: ParsedCard[] = [];
            let uploaded = 0;
            const total = parsedCards.filter(c => c.frontImageBlob).length + parsedCards.filter(c => c.backImageBlob).length;
            const upload = async (blob: Blob, extension: string | undefined, label: string) => {
                setLoadingMsg(`Enviando mídia ${++uploaded}/${total}...`);
                const saved = uploadedImages.current.get(blob);
                if (saved) return saved;
                const file = new File([blob], `anki_${crypto.randomUUID()}.${extension || 'jpg'}`, { type: blob.type });
                const url = await storageService.uploadImage(file, 'flashcards', [category, bankName, label].filter(Boolean).join('_'));
                uploadedImages.current.set(blob, url);
                return url;
            };

            for (const card of parsedCards) {
                let fUrl = card.frontImageUrl;
                let bUrl = card.backImageUrl;
                if (card.frontImageBlob) fUrl = await upload(card.frontImageBlob, card.frontImageExt, card.front);
                if (card.backImageBlob) bUrl = await upload(card.backImageBlob, card.backImageExt, card.back);
                withUrls.push({ ...card, frontImageUrl: fUrl, backImageUrl: bUrl });
            }

            setLoadingMsg('Salvando flashcards...');
            const flashcards: Flashcard[] = withUrls.map(card => ({
                id: crypto.randomUUID(),
                user_id: user.id,
                bank_name: bankName,
                front: card.front,
                back: card.back,
                category: category,
                front_image_url: card.frontImageUrl || '',
                back_image_url: card.backImageUrl || '',
                image_side: card.imageSide ?? (card.frontImageUrl ? 'front' : 'back'),
                occlusions: card.occlusions ?? [],
                status: autoAddToRevision ? 'new' : 'inactive',
                interval: 0,
                ease_factor: 2.5,
                repetitions: 0,
                next_review: new Date().toISOString(),
                created_at: new Date().toISOString(),
            }));
            await syncEngine.bulkEnqueue('flashcards', flashcards);
            setImportedCount(flashcards.length);
            setImportSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const restoreThemes = async () => {
        if (!user || loading || !selectedThemes.length) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.BASE_URL}nri-material/flashcards-blocos-1-a-8.json`);
            if (!response.ok) throw new Error('O catálogo de flashcards NRI está indisponível.');
            const catalog = parseFlashcardJson(await response.text());
            const bank = 'Curso NRI · Revisão';
            const existing = await localDB.getAll('flashcards');
            const key = (category: string, front: string) => JSON.stringify([category, front]);
            const seen = new Set(existing.filter(card => card.user_id === user.id && card.bank_name === bank)
                .map(card => key(card.category, card.front)));
            const now = new Date().toISOString();
            const cards: Flashcard[] = [];
            for (const item of catalog) {
                const match = item.tags?.join(' ').match(/\bNRI-Bloco-0([1-8])\b/);
                const category = match ? themes[Number(match[1]) - 1] : '';
                if (!selectedThemes.includes(category) || seen.has(key(category, item.front))) continue;
                seen.add(key(category, item.front));
                cards.push({
                    id: crypto.randomUUID(), user_id: user.id, bank_name: bank, category,
                    front: item.front, back: item.back, status: 'new', interval: 0,
                    ease_factor: 2.5, repetitions: 0, next_review: now, created_at: now,
                });
            }
            if (!cards.length) throw new Error('Os cartões dos blocos escolhidos já estão no seu deck.');
            await syncEngine.bulkEnqueue('flashcards', cards);
            setImportedCount(cards.length);
            setImportSuccess(true);
        } catch (error) {
            setError((error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setParsedCards([]);
        setError(null);
        setImportSuccess(false);
        setBankName('Importado');
        setCategory('Geral');
        setMediaCount(0);
        setPastedJsonText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (importSuccess) {
        return (
            <Layout title="Importar Flashcards">
                <div className="h-full flex flex-col items-center justify-center p-6">
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-10 text-center max-w-md w-full shadow-xl animate-in zoom-in-95">
                        <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Importado com Sucesso!</h2>
                        <p className="text-slate-500 text-sm mb-2">
                            <span className="text-emerald-600 font-bold">{importedCount}</span> flashcards adicionados
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={resetForm} className="flex-1 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                Importar Mais
                            </button>
                            <button onClick={() => navigate('/flashcards')} className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                                Ver Flashcards
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Importar Flashcards">
            <div className="h-full flex flex-col space-y-4 overflow-hidden">
                <div className="flex items-center gap-4 shrink-0 px-2 lg:px-0">
                    <button onClick={() => navigate('/flashcards')} className="p-2 bg-slate-100 dark:bg-zinc-900 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Importar Flashcards</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adicione novos cards ao seu banco</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-900 w-fit shrink-0 mx-2 lg:mx-0">
                    <button 
                        onClick={() => { setError(null); setMode('file'); }}
                        className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'file' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}
                    >
                        Arquivos (Anki/CSV)
                    </button>
                    <button 
                        onClick={() => { setError(null); setMode('themes'); }}
                        className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'themes' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}
                    >
                        Banco de Temas
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-6 pb-6 px-2 lg:px-0">
                    {mode === 'file' ? (
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Info className="h-4 w-4 text-primary" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Formatos Suportados</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {SUPPORTED_FORMATS.map(fmt => (
                                        <div key={fmt.ext} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-center">
                                            <fmt.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                                            <p className="text-[9px] font-black uppercase text-slate-900 dark:text-white">{fmt.ext}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div className="bg-white dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[2rem] p-10 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{loadingMsg}</p>
                                    </div>
                                </div>
                            ) : parsedCards.length === 0 ? (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 block">Cole o JSON dos Flashcards ou Texto Bruto</label>
                                        <textarea 
                                            value={pastedJsonText}
                                            onChange={e => setPastedJsonText(e.target.value)}
                                            placeholder='Cole seu JSON aqui. Exemplo:&#10;[&#10;  {"front": "O que é mRs?", "back": "Modified Rankin Scale", "tags": ["AVC"]}&#10;]'
                                            className="w-full h-44 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary focus:ring-2 shadow-inner"
                                        />
                                        <button 
                                            onClick={handleRawTextImport}
                                            disabled={!pastedJsonText.trim()}
                                            className="w-full bg-slate-900 dark:bg-zinc-900 text-white dark:text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all hover:bg-opacity-90"
                                        >
                                            <FileText className="h-4 w-4" /> PROCESSAR TEXTO / JSON COLADO
                                        </button>
                                    </div>

                                    <div className="relative flex items-center justify-center py-2">
                                        <hr className="absolute w-full border-slate-200 dark:border-zinc-800" />
                                        <span className="relative bg-slate-50 dark:bg-zinc-900 px-4 text-[9px] font-black uppercase text-slate-400">ou exportação de arquivo</span>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[2rem] p-10 text-center hover:border-primary transition-colors cursor-pointer" 
                                         onDragOver={event => event.preventDefault()}
                                         onDrop={event => {
                                             event.preventDefault();
                                             const dropped = event.dataTransfer.files[0];
                                             if (dropped) void selectFile(dropped);
                                         }}
                                         onClick={() => fileInputRef.current?.click()}>
                                        <input ref={fileInputRef} type="file" accept=".apkg,.colpkg,.txt,.csv,.json,.md" onChange={handleFileSelect} className="hidden" />
                                        <div className="flex flex-col items-center">
                                            <div className="h-16 w-16 bg-slate-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4"><Upload className="h-8 w-8 text-slate-400" /></div>
                                            <p className="font-black text-slate-900 dark:text-white mb-1">Arraste ou clique para selecionar arquivo</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Dados Carregados Prontos</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                {file ? `Arquivo: ${file.name}` : 'Conteúdo do JSON / Texto colado'} · {parsedCards.length} cards detectados
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={resetForm} 
                                        className="text-[9px] font-black text-red-500 uppercase border border-red-200 dark:border-red-900/50 px-3 py-1.5 rounded-lg hover:bg-red-50"
                                    >
                                        Remover
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {parsedCards.length > 0 && !loading && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Nome do Banco</label>
                                            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-primary focus:ring-2" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Categoria</label>
                                            <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-primary focus:ring-2" />
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl overflow-hidden">
                                        <div className="bg-slate-50 dark:bg-zinc-900 px-5 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preview (5 de {parsedCards.length})</span>
                                            <Layers className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-zinc-900 max-h-80 overflow-y-auto">
                                            {parsedCards.slice(0, 5).map((card, i) => (
                                                <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[8px] font-black uppercase text-primary tracking-widest">Frente</span>
                                                            <p className="text-sm text-slate-900 dark:text-white mt-1 line-clamp-2">{card.front}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Verso</span>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{card.back}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => setAutoAddToRevision(!autoAddToRevision)}
                                        className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-900/80 transition-colors"
                                    >
                                        <button
                                            type="button"
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                autoAddToRevision ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    autoAddToRevision ? 'translate-x-4' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                        <div className="flex-1 select-none">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white block">Adicionar à Fila de Revisão</span>
                                            <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Se desativado, os cards ficarão inativos para você adicioná-los manualmente depois.</span>
                                        </div>
                                    </div>

                                    <button onClick={handleImport} disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                                        <Download className="h-5 w-5" /> Importar {parsedCards.length} Flashcards
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-8 shadow-sm">
                                <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" /> Blocos do Curso NRI
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                                    {themes.map(theme => (
                                        <button 
                                            key={theme}
                                            onClick={() => setSelectedThemes(prev => prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme])}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${selectedThemes.includes(theme) ? 'border-primary bg-primary/5' : 'border-slate-50 dark:border-zinc-900 hover:border-slate-200'}`}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${selectedThemes.includes(theme) ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{theme}</span>
                                            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${selectedThemes.includes(theme) ? 'bg-primary border-primary text-white' : 'border-slate-200'}`}>
                                                {selectedThemes.includes(theme) && <CheckCircle2 className="h-3 w-3" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800 text-center">
                                    {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
                                    <p className="text-xs text-slate-500 font-bold mb-4">Escolha os blocos para adicionar os flashcards do Curso NRI ao seu deck.</p>
                                    <button 
                                        disabled={selectedThemes.length === 0 || loading}
                                        onClick={restoreThemes}
                                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Adicionar ${selectedThemes.length} ${selectedThemes.length === 1 ? 'bloco' : 'blocos'}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};
