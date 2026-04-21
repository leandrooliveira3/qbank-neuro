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
import JSZip from 'jszip';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedCard {
    front: string;
    back: string;
    tags?: string[];
    frontImageBlob?: Blob;
    frontImageExt?: string;
    frontImageUrl?: string;
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
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
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
        // 1. Unzip
        setLoadingMsg('Descompactando arquivo...');
        const zip = await new JSZip().loadAsync(f);

        // 2. Locate the SQLite DB (may be anki21 or anki2)
        const dbEntry = zip.file('collection.anki21') || zip.file('collection.anki2');
        if (!dbEntry) {
            throw new Error('Arquivo Anki inválido: banco de dados não encontrado dentro do pacote.');
        }

        setLoadingMsg('Lendo banco de dados SQLite...');
        const dbBuf = await dbEntry.async('arraybuffer');

        // 3. Init sql.js (WASM served from /public) - dynamic import to avoid bundling issues
        const initSqlJs = (await import('sql.js')).default;
        const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
        const db = new SQL.Database(new Uint8Array(dbBuf));

        // 4. Query all notes (limit 5000 to avoid memory issues)
        const result = db.exec('SELECT flds, tags FROM notes LIMIT 5000');
        db.close();

        // 5. Parse media mapping: {"0": "cat.jpg", "1": "dog.png"} → {"cat.jpg": "0", ...}
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

        // 6. Build cards
        const cards: ParsedCard[] = [];
        const rows = result?.[0]?.values ?? [];

        for (const row of rows) {
            const flds = String(row[0] ?? '');
            const tagStr = String(row[1] ?? '');
            const fields = flds.split('\x1f');

            const frontRaw = fields[0] ?? '';
            const backRaw  = fields[1] ?? '';

            const frontText = stripHtml(frontRaw);
            const backText  = stripHtml(backRaw);
            const imgSrc    = extractImgSrc(frontRaw) || extractImgSrc(backRaw);

            if (!frontText && !imgSrc) continue;

            const card: ParsedCard = {
                front: frontText || '(imagem)',
                back:  backText  || '',
                tags:  tagStr.split(' ').filter(Boolean),
            };

            // Attach image blob if present
            if (imgSrc) {
                const zipId = mediaMap[imgSrc];
                if (zipId) {
                    const imgEntry = zip.file(zipId);
                    if (imgEntry) {
                        card.frontImageBlob = await imgEntry.async('blob');
                        card.frontImageExt  = getExt(imgSrc);
                    }
                }
            }

            cards.push(card);
        }

        if (cards.length === 0) {
            throw new Error('Nenhuma nota encontrada. Verifique se o arquivo está correto.');
        }

        return cards;
    };

    // ── Plain-text parsers (unchanged) ──────────────────────────────────────
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
        if (cards.length === 0) throw new Error('Nenhum card encontrado. Use formato: Frente;Verso ou Frente[TAB]Verso');
        return cards;
    };

    const parseCsv = (text: string): ParsedCard[] => {
        const lines = text.split('\n').filter(l => l.trim());
        const cards: ParsedCard[] = [];
        let start = 0;
        const first = lines[0]?.toLowerCase() || '';
        if (first.includes('front') || first.includes('frente') || first.includes('question')) start = 1;
        for (let i = start; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 2) {
                const front = parts[0].replace(/^"|"$/g, '').trim();
                const back  = parts.slice(1).join(',').replace(/^"|"$/g, '').trim();
                if (front && back) cards.push({ front, back });
            }
        }
        if (cards.length === 0) throw new Error('Nenhum card encontrado no CSV.');
        return cards;
    };

    const parseJson = (text: string): ParsedCard[] => {
        try {
            const data = JSON.parse(text);
            const items = Array.isArray(data) ? data : (data.cards || data.notes || data.flashcards || []);
            const cards = items.map((item: any) => ({
                front: item.front || item.question || item.frente || item.q || '',
                back:  item.back  || item.answer   || item.verso  || item.a || '',
                tags:  item.tags  || [],
            })).filter((c: ParsedCard) => c.front && c.back);
            if (cards.length === 0) throw new Error('Nenhum card válido no JSON.');
            return cards;
        } catch {
            throw new Error('JSON inválido ou sem cards válidos.');
        }
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
        if (cards.length === 0) throw new Error('Nenhum card encontrado. Use Q:/A: separados por ---');
        return cards;
    };

    // ── Import: upload media then bulk-save flashcards ──────────────────────
    const handleImport = async () => {
        if (!user || parsedCards.length === 0) return;
        setLoading(true);
        setError(null);

        try {
            // Upload images card-by-card so we can track progress
            const withUrls: ParsedCard[] = [];
            let uploaded = 0;
            const total = parsedCards.filter(c => c.frontImageBlob).length;

            for (const card of parsedCards) {
                if (card.frontImageBlob) {
                    setLoadingMsg(`Enviando mídia ${++uploaded}/${total}...`);
                    try {
                        const file = new File(
                            [card.frontImageBlob],
                            `anki_${crypto.randomUUID()}.${card.frontImageExt || 'jpg'}`,
                            { type: card.frontImageBlob.type || 'image/jpeg' }
                        );
                        const url = await storageService.uploadImage(file, 'flashcards');
                        withUrls.push({ ...card, frontImageUrl: url });
                    } catch {
                        // If upload fails, keep the card without image
                        withUrls.push({ ...card });
                    }
                } else {
                    withUrls.push(card);
                }
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
                occlusions: [],
                status: 'new' as const,
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
            setError(err.message || 'Erro ao importar flashcards');
        } finally {
            setLoading(false);
        }
    };

    // ── Reset ───────────────────────────────────────────────────────────────
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

    // ── Success screen ──────────────────────────────────────────────────────
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
                            <span className="text-emerald-600 font-bold">{importedCount}</span> flashcards adicionados ao banco <span className="font-bold">"{bankName}"</span>
                        </p>
                        {mediaCount > 0 && (
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-6">{mediaCount} imagens enviadas para o servidor</p>
                        )}
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

    // ── Main render ─────────────────────────────────────────────────────────
    return (
        <Layout title="Importar Flashcards">
            <div className="h-full flex flex-col space-y-4 overflow-hidden">
                <div className="flex items-center gap-4 shrink-0">
                    <button onClick={() => navigate('/flashcards')} className="p-2 bg-slate-100 dark:bg-zinc-900 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Importar Flashcards</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anki, CSV, TXT, JSON, Markdown</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-6 pb-6">

                    {/* Formatos */}
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
                                    <p className="text-[8px] text-slate-400 mt-1">{fmt.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upload */}
                    <div className="bg-white dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[2rem] p-10 text-center hover:border-primary transition-colors">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".apkg,.colpkg,.txt,.csv,.json,.md"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="flashcard-import"
                        />
                        <label htmlFor="flashcard-import" className="cursor-pointer block">
                            {loading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{loadingMsg}</p>
                                </div>
                            ) : file ? (
                                <div className="flex flex-col items-center">
                                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                        <FileText className="h-8 w-8 text-primary" />
                                    </div>
                                    <p className="font-black text-slate-900 dark:text-white mb-1">{file.name}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                        {parsedCards.length} cards encontrados
                                        {mediaCount > 0 && <span className="ml-2 text-blue-500">· {mediaCount} imagens</span>}
                                    </p>
                                    <button
                                        onClick={(e) => { e.preventDefault(); resetForm(); }}
                                        className="mt-4 text-[9px] font-bold text-red-500 hover:text-red-600 uppercase flex items-center gap-1"
                                    >
                                        <X className="h-3 w-3" /> Remover arquivo
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="h-16 w-16 bg-slate-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
                                        <Upload className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="font-black text-slate-900 dark:text-white mb-1">Arraste ou clique para selecionar</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        .apkg, .colpkg, .txt, .csv, .json, .md
                                    </p>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Config + Preview + Import */}
                    {parsedCards.length > 0 && !loading && (
                        <>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Banco</label>
                                    <input
                                        type="text"
                                        value={bankName}
                                        onChange={e => setBankName(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
                                        placeholder="Ex: Neurologia, Farmacologia..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
                                        placeholder="Ex: Geral, Anatomia..."
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl overflow-hidden">
                                <div className="bg-slate-50 dark:bg-zinc-900 px-5 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        Preview ({Math.min(5, parsedCards.length)} de {parsedCards.length})
                                    </span>
                                    <Layers className="h-4 w-4 text-primary" />
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-zinc-900 max-h-[320px] overflow-y-auto custom-scrollbar">
                                    {parsedCards.slice(0, 5).map((card, i) => (
                                        <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[8px] font-black uppercase text-primary tracking-widest">Frente</span>
                                                    {card.frontImageBlob && (
                                                        <div className="mt-1 h-16 w-24 bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                                                            <img
                                                                src={URL.createObjectURL(card.frontImageBlob)}
                                                                alt="preview"
                                                                className="h-full object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    <p className="text-sm text-slate-900 dark:text-white mt-1 line-clamp-3">{card.front}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Verso</span>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">{card.back}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Media warning */}
                            {mediaCount > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 flex items-center gap-3">
                                    <ImageIcon className="h-5 w-5 text-blue-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                        {mediaCount} imagem{mediaCount !== 1 ? 's' : ''} encontrada{mediaCount !== 1 ? 's' : ''} — serão enviadas para o servidor durante a importação.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleImport}
                                disabled={loading}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <><Loader2 className="h-5 w-5 animate-spin" /> {loadingMsg}</>
                                ) : (
                                    <><Download className="h-5 w-5" /> Importar {parsedCards.length} Flashcards</>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};
