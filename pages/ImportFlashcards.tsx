import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { syncEngine } from '../services/syncEngine';
import { Flashcard } from '../types';
import { 
    Upload, FileText, ArrowLeft, Loader2, CheckCircle2, 
    AlertCircle, Layers, FileJson, Table, FileCode, Download,
    Info, X
} from 'lucide-react';
import JSZip from 'jszip';

interface ParsedCard {
    front: string;
    back: string;
    tags?: string[];
}

const SUPPORTED_FORMATS = [
    { ext: '.apkg', name: 'Anki Package', icon: Download, desc: 'Deck exportado do Anki' },
    { ext: '.txt', name: 'Texto (Tab/Semicolon)', icon: FileText, desc: 'Frente;Verso ou Frente\\tVerso' },
    { ext: '.csv', name: 'CSV', icon: Table, desc: 'Primeira coluna = frente, segunda = verso' },
    { ext: '.json', name: 'JSON', icon: FileJson, desc: 'Array de objetos com front/back' },
    { ext: '.md', name: 'Markdown', icon: FileCode, desc: 'Blocos separados por ---' },
];

export const ImportFlashcards: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
    const [bankName, setBankName] = useState('Importado');
    const [category, setCategory] = useState('Geral');
    const [importSuccess, setImportSuccess] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        
        setFile(selectedFile);
        setError(null);
        setParsedCards([]);
        setLoading(true);
        
        try {
            const cards = await parseFile(selectedFile);
            setParsedCards(cards);
            
            // Auto-set bank name from file name
            const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
            setBankName(fileName || 'Importado');
        } catch (err: any) {
            setError(err.message || 'Erro ao processar arquivo');
        } finally {
            setLoading(false);
        }
    };
    
    const parseFile = async (file: File): Promise<ParsedCard[]> => {
        const ext = file.name.toLowerCase().split('.').pop();
        const text = ext !== 'apkg' ? await file.text() : '';
        
        switch (ext) {
            case 'apkg':
                return parseAnkiPackage(file);
            case 'txt':
                return parseTxt(text);
            case 'csv':
                return parseCsv(text);
            case 'json':
                return parseJson(text);
            case 'md':
                return parseMarkdown(text);
            default:
                throw new Error(`Formato não suportado: .${ext}`);
        }
    };
    
    const parseAnkiPackage = async (file: File): Promise<ParsedCard[]> => {
        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            
            // APKG contains a SQLite database, but we can try to extract from collection.anki2
            // For simplicity, we'll look for media and notes in a simplified way
            // Real APKG parsing would require sqlite.js
            
            // Check if there's a decks JSON or similar
            const mediaFile = contents.file('media');
            let mediaMapping: Record<string, string> = {};
            
            if (mediaFile) {
                try {
                    const mediaContent = await mediaFile.async('string');
                    mediaMapping = JSON.parse(mediaContent);
                } catch {}
            }
            
            // Try to find any text/json files that might contain card data
            const cards: ParsedCard[] = [];
            
            for (const [filename, zipEntry] of Object.entries(contents.files)) {
                if (filename.endsWith('.txt') || filename.endsWith('.json')) {
                    try {
                        const content = await zipEntry.async('string');
                        if (filename.endsWith('.json')) {
                            const parsed = parseJson(content);
                            cards.push(...parsed);
                        } else {
                            const parsed = parseTxt(content);
                            cards.push(...parsed);
                        }
                    } catch {}
                }
            }
            
            if (cards.length === 0) {
                // Fallback: try to parse the db file as text (won't work for real SQLite but might catch some exports)
                throw new Error('Arquivo APKG não contém dados legíveis. Tente exportar do Anki como TXT ou CSV.');
            }
            
            return cards;
        } catch (err: any) {
            throw new Error('Erro ao processar arquivo Anki: ' + (err.message || 'formato inválido'));
        }
    };
    
    const parseTxt = (text: string): ParsedCard[] => {
        const lines = text.split('\n').filter(line => line.trim());
        const cards: ParsedCard[] = [];
        
        for (const line of lines) {
            // Try tab first, then semicolon
            let parts = line.split('\t');
            if (parts.length < 2) {
                parts = line.split(';');
            }
            
            if (parts.length >= 2) {
                const front = parts[0].trim();
                const back = parts[1].trim();
                const tags = parts[2]?.split(',').map(t => t.trim()).filter(Boolean);
                
                if (front && back) {
                    cards.push({ front, back, tags });
                }
            }
        }
        
        if (cards.length === 0) {
            throw new Error('Nenhum card encontrado. Use formato: Frente;Verso ou Frente[TAB]Verso');
        }
        
        return cards;
    };
    
    const parseCsv = (text: string): ParsedCard[] => {
        const lines = text.split('\n').filter(line => line.trim());
        const cards: ParsedCard[] = [];
        
        // Skip header if it looks like one
        let startIndex = 0;
        const firstLine = lines[0]?.toLowerCase();
        if (firstLine?.includes('front') || firstLine?.includes('frente') || firstLine?.includes('question')) {
            startIndex = 1;
        }
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            // Handle quoted CSV
            const matches = line.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g);
            
            if (matches && matches.length >= 2) {
                const front = matches[0].replace(/^,?"?|"?$/g, '').replace(/""/g, '"').trim();
                const back = matches[1].replace(/^,?"?|"?$/g, '').replace(/""/g, '"').trim();
                
                if (front && back) {
                    cards.push({ front, back });
                }
            } else {
                // Simple comma split
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const front = parts[0].trim();
                    const back = parts.slice(1).join(',').trim();
                    if (front && back) {
                        cards.push({ front, back });
                    }
                }
            }
        }
        
        if (cards.length === 0) {
            throw new Error('Nenhum card encontrado no CSV. Use formato: frente,verso');
        }
        
        return cards;
    };
    
    const parseJson = (text: string): ParsedCard[] => {
        try {
            const data = JSON.parse(text);
            const items = Array.isArray(data) ? data : data.cards || data.notes || data.flashcards || [];
            
            return items.map((item: any) => ({
                front: item.front || item.question || item.frente || item.q || '',
                back: item.back || item.answer || item.verso || item.a || '',
                tags: item.tags || item.labels || []
            })).filter((c: ParsedCard) => c.front && c.back);
        } catch {
            throw new Error('JSON inválido');
        }
    };
    
    const parseMarkdown = (text: string): ParsedCard[] => {
        // Split by --- or *** or ___
        const blocks = text.split(/\n(?:---+|\*\*\*+|___+)\n/);
        const cards: ParsedCard[] = [];
        
        for (const block of blocks) {
            const trimmed = block.trim();
            if (!trimmed) continue;
            
            // Try to find Q/A pattern
            const qaMatch = trimmed.match(/(?:Q:|Pergunta:|Frente:)\s*([\s\S]*?)(?:\n\s*(?:A:|Resposta:|Verso:)\s*([\s\S]*))/i);
            
            if (qaMatch) {
                cards.push({
                    front: qaMatch[1].trim(),
                    back: qaMatch[2].trim()
                });
            } else {
                // Split by double newline
                const parts = trimmed.split(/\n\n+/);
                if (parts.length >= 2) {
                    cards.push({
                        front: parts[0].trim(),
                        back: parts.slice(1).join('\n\n').trim()
                    });
                }
            }
        }
        
        if (cards.length === 0) {
            throw new Error('Nenhum card encontrado. Use formato: Frente\\n\\nVerso separado por ---');
        }
        
        return cards;
    };
    
    const handleImport = async () => {
        if (!user || parsedCards.length === 0) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const flashcards: Flashcard[] = parsedCards.map(card => ({
                id: crypto.randomUUID(),
                user_id: user.id,
                bank_name: bankName,
                front: card.front,
                back: card.back,
                category: category,
                status: 'new',
                interval: 0,
                ease_factor: 2.5,
                repetitions: 0,
                next_review: new Date().toISOString(),
                created_at: new Date().toISOString()
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
    
    const resetForm = () => {
        setFile(null);
        setParsedCards([]);
        setError(null);
        setImportSuccess(false);
        setBankName('Importado');
        setCategory('Geral');
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
                        <p className="text-slate-500 text-sm mb-6">
                            <span className="text-emerald-600 font-bold">{importedCount}</span> flashcards foram adicionados ao banco <span className="font-bold">"{bankName}"</span>
                        </p>
                        <div className="flex gap-3">
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
                    {/* Formatos Suportados */}
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
                    
                    {/* Upload Area */}
                    <div className="bg-white dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[2rem] p-10 text-center hover:border-primary transition-colors">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".apkg,.txt,.csv,.json,.md"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="flashcard-import"
                        />
                        <label htmlFor="flashcard-import" className="cursor-pointer block">
                            {loading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Processando arquivo...</p>
                                </div>
                            ) : file ? (
                                <div className="flex flex-col items-center">
                                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                        <FileText className="h-8 w-8 text-primary" />
                                    </div>
                                    <p className="font-black text-slate-900 dark:text-white mb-1">{file.name}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                        {parsedCards.length} cards encontrados
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
                                        .apkg, .txt, .csv, .json, .md
                                    </p>
                                </div>
                            )}
                        </label>
                    </div>
                    
                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Config & Preview */}
                    {parsedCards.length > 0 && (
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
                                        placeholder="Ex: Geral, Anatomia, Fisiologia..."
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
                                <div className="divide-y divide-slate-100 dark:divide-zinc-900 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {parsedCards.slice(0, 5).map((card, i) => (
                                        <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[8px] font-black uppercase text-primary tracking-widest">Frente</span>
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
                            
                            {/* Import Button */}
                            <button
                                onClick={handleImport}
                                disabled={loading}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Download className="h-5 w-5" />
                                        Importar {parsedCards.length} Flashcards
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};
