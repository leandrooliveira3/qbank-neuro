import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { syncEngine } from '../services/syncEngine';
import { storageService } from '../services/storage';
import { Flashcard } from '../types';
import { 
    Upload, FileText, ArrowLeft, Loader2, CheckCircle2, 
    AlertCircle, Layers, FileJson, Table, FileCode, Download,
    Info, X, Image as ImageIcon
} from 'lucide-react';
import { decompress } from 'fzstd';
import JSZip from 'jszip';
import initSqlJs from 'sql.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedCard {
    front: string;
    back: string;
    tags?: string[];
    frontImageBlob?: Blob;
    frontImageExt?: string;
    frontImageUrl?: string;
    backImageBlob?: Blob;
    backImageExt?: string;
    backImageUrl?: string;
}

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
    
    const SPECIALTIES = [
        "Neurologia", "Clínica Médica", "Cardiologia", "Neurocirurgia", 
        "Pediatria", "Ginecologia e Obstetrícia", "Cirurgia Geral", 
        "Ortopedia e Traumatologia", "Psiquiatria", "Endocrinologia e Metabologia"
    ];

    const [importedCount, setImportedCount] = useState(0);
    const [mediaCount, setMediaCount] = useState(0);

    // ── File selection ──────────────────────────────────────────────────────
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setParsedCards([]);
        setLoading(true);
        setLoadingMsg('Processando arquivo...');

        try {
            const cards = await parseFile(selectedFile);
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
            case 'csv':  return parseCsv(text);
            case 'json': return parseJson(text);
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

        let dbBuf: ArrayBuffer | null = null;
        let db: any = null;

        setLoadingMsg('Lendo banco de dados SQLite...');
        for (const name of candidateNames) {
            const entry = zip.file(name);
            if (!entry) continue;
            try {
                let buf = await entry.async('uint8array');
                
                const isSqlite = buf.length > 16 && String.fromCharCode(...buf.subarray(0, 15)) === "SQLite format 3";
                if (!isSqlite) {
                    try {
                        buf = decompress(buf);
                    } catch (err) {
                        console.warn(`Failed to decompress ${name}:`, err);
                    }
                }

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
                        console.log(`[Anki] Loaded db from ${name}, count=${count}, isSqlite=${isSqlite}`);
                        dbBuf = buf;
                        db = tempDb;
                        break; // Encontrado o DB válido
                    } else {
                        // Mantém como fallback se for o único, mas continua procurando
                        if (!db) {
                            dbBuf = buf;
                            db = tempDb;
                        } else {
                            tempDb.close();
                        }
                    }
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

        const result = db.exec('SELECT flds, tags FROM notes');
        db.close();

        setLoadingMsg('Lendo arquivos de mídia...');
        const mediaMap: Record<string, string> = {};
        const mediaEntry = zip.file('media');
        if (mediaEntry) {
            try {
                const raw = await mediaEntry.async('string');
                const parsed = JSON.parse(raw);
                for (const [numId, filename] of Object.entries(parsed as Record<string, string>)) {
                    mediaMap[filename] = numId;
                }
            } catch {}
        }

        const cards: ParsedCard[] = [];
        const rows = result?.[0]?.values ?? [];
        for (const row of rows) {
            const flds = String(row[0] ?? '');
            const tagStr = String(row[1] ?? '');
            const fields = flds.split('\x1f');
            const frontRaw = fields[0] ?? '';
            const backRaw  = fields.slice(1).join('\n') ?? '';
            
            let frontText = '';
            let backText = '';

            const clozeRegex = /\{\{c\d+::(.*?)(?:::(.*?))?\}\}/gs;
            if (frontRaw.includes('{{c')) {
                let fText = frontRaw.replace(/\{\{c\d+::(.*?)(?:::(.*?))?\}\}/gs, (...args) => {
                    return `[${args[2] || '...'}]`;
                });
                // Para o verso do flashcard, revela a oclusão (grupo $1 - o texto oculto)
                let bText = frontRaw.replace(/\{\{c\d+::(.*?)(?:::(.*?))?\}\}/gs, '$1');
                
                frontText = stripHtml(fText);
                backText = stripHtml(bText);
                if (backRaw.trim()) {
                    backText += '\n\n' + stripHtml(backRaw);
                }
            } else {
                frontText = stripHtml(frontRaw);
                backText  = stripHtml(backRaw);
            }

            const frontImgSrc = extractImgSrc(frontRaw);
            const backImgSrc  = extractImgSrc(backRaw);

            if (!frontText && !frontImgSrc && !backText && !backImgSrc) continue;

            const card: ParsedCard = {
                front: frontText || (frontImgSrc ? '(imagem)' : ''),
                back:  backText  || (backImgSrc ? '(imagem)' : ''),
                tags:  tagStr.split(' ').filter(Boolean),
            };

            if (frontImgSrc) {
                const zipId = mediaMap[frontImgSrc];
                if (zipId) {
                    const imgEntry = zip.file(zipId);
                    if (imgEntry) {
                        card.frontImageBlob = await imgEntry.async('blob');
                        card.frontImageExt  = getExt(frontImgSrc);
                    }
                }
            }
            
            if (backImgSrc && backImgSrc !== frontImgSrc) {
                const zipId = mediaMap[backImgSrc];
                if (zipId) {
                    const imgEntry = zip.file(zipId);
                    if (imgEntry) {
                        card.backImageBlob = await imgEntry.async('blob');
                        card.backImageExt  = getExt(backImgSrc);
                    }
                }
            }
            cards.push(card);
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

    const parseCsv = (text: string): ParsedCard[] => {
        const lines = text.split('\n').filter(l => l.trim());
        const cards: ParsedCard[] = [];
        let start = 0;
        if (lines[0]?.toLowerCase().includes('front')) start = 1;
        for (let i = start; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 2) {
                const front = parts[0].replace(/^"|"$/g, '').trim();
                const back  = parts.slice(1).join(',').replace(/^"|"$/g, '').trim();
                if (front && back) cards.push({ front, back });
            }
        }
        return cards;
    };

    const parseJson = (text: string): ParsedCard[] => {
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : (data.cards || data.notes || []);
        return items.map((item: any) => ({
            front: item.front || item.question || '',
            back:  item.back  || item.answer   || '',
            tags:  item.tags  || [],
        })).filter((c: ParsedCard) => c.front && c.back);
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

            for (const card of parsedCards) {
                let fUrl = undefined;
                let bUrl = undefined;
                if (card.frontImageBlob) {
                    setLoadingMsg(`Enviando mídia ${++uploaded}/${total}...`);
                    const f = new File([card.frontImageBlob], `anki_${crypto.randomUUID()}.${card.frontImageExt || 'jpg'}`, { type: card.frontImageBlob.type });
                    const customName = [category, bankName, card.front].filter(Boolean).join('_');
                    fUrl = await storageService.uploadImage(f, 'flashcards', customName);
                }
                if (card.backImageBlob) {
                    setLoadingMsg(`Enviando mídia ${++uploaded}/${total}...`);
                    const f = new File([card.backImageBlob], `anki_${crypto.randomUUID()}.${card.backImageExt || 'jpg'}`, { type: card.backImageBlob.type });
                    const customName = [category, bankName, card.back].filter(Boolean).join('_');
                    bUrl = await storageService.uploadImage(f, 'flashcards', customName);
                }
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
                occlusions: [],
                status: autoAddToRevision ? 'new' : 'inactive',
                interval: 0,
                ease_factor: 2.5,
                repetitions: 0,
                next_review: new Date().toISOString(),
                created_at: new Date().toISOString(),
                last_review: new Date().toISOString(),
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

    const resetForm = () => {
        setFile(null);
        setParsedCards([]);
        setError(null);
        setImportSuccess(false);
        setBankName('Importado');
        setCategory('Geral');
        setMediaCount(0);
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
                        onClick={() => setMode('file')}
                        className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'file' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}
                    >
                        Arquivos (Anki/CSV)
                    </button>
                    <button 
                        onClick={() => setMode('themes')}
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

                            <div className="bg-white dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[2rem] p-10 text-center hover:border-primary transition-colors cursor-pointer" 
                                 onClick={() => !file && fileInputRef.current?.click()}>
                                <input ref={fileInputRef} type="file" accept=".apkg,.colpkg,.txt,.csv,.json,.md" onChange={handleFileSelect} className="hidden" />
                                {loading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{loadingMsg}</p>
                                    </div>
                                ) : file ? (
                                    <div className="flex flex-col items-center">
                                        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"><FileText className="h-8 w-8 text-primary" /></div>
                                        <p className="font-black text-slate-900 dark:text-white mb-1">{file.name}</p>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{parsedCards.length} cards · {mediaCount} imagens</p>
                                        <button onClick={(e) => { e.stopPropagation(); resetForm(); }} className="mt-4 text-[9px] font-bold text-red-500 uppercase flex items-center gap-1"><X className="h-3 w-3" /> Remover</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="h-16 w-16 bg-slate-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4"><Upload className="h-8 w-8 text-slate-400" /></div>
                                        <p className="font-black text-slate-900 dark:text-white mb-1">Arraste ou clique para selecionar</p>
                                    </div>
                                )}
                            </div>

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

                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={autoAddToRevision} onChange={e => setAutoAddToRevision(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                        <div className="flex-1">
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
                                    <Layers className="h-4 w-4 text-primary" /> Temas Disponíveis no Banco de Dados
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                                    {SPECIALTIES.map(theme => (
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
                                    <p className="text-xs text-slate-500 font-bold mb-4">Escolha os temas e restaure os cards oficiais.</p>
                                    <button 
                                        disabled={selectedThemes.length === 0 || loading}
                                        onClick={async () => {
                                            setLoading(true);
                                            setLoadingMsg("Sincronizando temas...");
                                            try {
                                                const newCards: Flashcard[] = [];
                                                for (const theme of selectedThemes) {
                                                    for (let i = 1; i <= 10; i++) {
                                                        newCards.push({
                                                            id: crypto.randomUUID(),
                                                            user_id: user?.id || '',
                                                            bank_name: `Banco Oficial: ${theme}`,
                                                            front: `Pergunta de Revisão: ${theme} #${i}`,
                                                            back: `Esta é uma resposta padrão para o card de revisão do tema ${theme}.`,
                                                            category: theme,
                                                            status: 'new',
                                                            interval: 0,
                                                            ease_factor: 2.5,
                                                            repetitions: 0,
                                                            next_review: new Date().toISOString(),
                                                            created_at: new Date().toISOString(),
                                                        });
                                                    }
                                                }
                                                await syncEngine.bulkEnqueue('flashcards', newCards);
                                                setImportedCount(newCards.length);
                                                setBankName("Banco Oficial");
                                                setImportSuccess(true);
                                            } catch (err: any) {
                                                setError(err.message);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Restaurar ${selectedThemes.length} Temas`}
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
