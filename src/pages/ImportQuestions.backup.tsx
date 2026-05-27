
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Upload, FileText, Loader2, Save, 
  Sparkles, Send, Bot, Plus, ChevronLeft,
  FileUp, Image as ImageIcon, X,
  Brain, MessageSquare, ListChecks, Database,
  Settings2, Activity, Terminal, Layers, ImagePlus, Trash2,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { processFileQuestions, generateQuestionsFromPrompt } from '../services/ai';
import { AIImportedQuestion, Difficulty } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router';
import { syncEngine } from '../services/syncEngine';
import { storageService } from '../services/storage';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configuração estável do Worker via unpkg
if (typeof window !== 'undefined') {
    const version = '5.4.530';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

// Limites otimizados para evitar WORKER_LIMIT nas Edge Functions
const MAX_PAGES_VISUAL = 10; 
const MAX_PAGES_TEXT = 100;

const normalizeDifficulty = (d: string): Difficulty => {
  const val = (d || '').toLowerCase();
  if (val.includes('fác') || val.includes('easy')) return 'Fácil';
  if (val.includes('méd') || val.includes('medium') || val.includes('inter')) return 'Médio';
  if (val.includes('dif') || val.includes('hard') || val.includes('difí')) return 'Difícil';
  return 'Médio';
};

export const ImportQuestions: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'file' | 'chat' | 'manual'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [importStep, setImportStep] = useState<'input' | 'preview'>('input');
  const [previewData, setPreviewData] = useState<AIImportedQuestion[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [imageStrategy, setImageStrategy] = useState<'manual' | 'auto'>('auto');
  const [selectedPreviewImages, setSelectedPreviewImages] = useState<Record<number, { file: File | Blob, url: string }>>({});

  const [file, setFile] = useState<File | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- MANUAL FORM STATE ---
  const [manualData, setManualData] = useState({ category: '', subcategory: '', difficulty: 'Médio' as Difficulty, statement: '', explanation: '' });
  const [alternatives, setAlternatives] = useState([
    { id: '1', text: '', is_correct: true },
    { id: '2', text: '', is_correct: false },
    { id: '3', text: '', is_correct: false },
    { id: '4', text: '', is_correct: false },
    { id: '5', text: '', is_correct: false },
  ]);
  const [manualInputImage, setManualInputImage] = useState<File | null>(null);
  const [manualInputPreview, setManualInputPreview] = useState('');
  const manualInputFileRef = useRef<HTMLInputElement>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'bot' | 'status', text: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isLoading]);

  const cropImageFromCoordinates = async (base64Image: string, coords: number[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let [ymin, xmin, ymax, xmax] = coords.map(c => Number(c));
            
            const realX = (xmin / 1000) * img.width;
            const realY = (ymin / 1000) * img.height;
            const realW = ((xmax - xmin) / 1000) * img.width;
            const realH = ((ymax - ymin) / 1000) * img.height;
            
            // Padding cirúrgico
            const pad = 0.02;
            const finalX = Math.max(0, realX - realW * pad);
            const finalY = Math.max(0, realY - realH * pad);
            const finalW = Math.min(img.width - finalX, realW * (1 + pad * 2));
            const finalH = Math.min(img.height - finalY, realH * (1 + pad * 2));

            canvas.width = finalW;
            canvas.height = finalH;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject("Canvas Context Error"); return; }
            ctx.drawImage(img, finalX, finalY, finalW, finalH, 0, 0, finalW, finalH);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject("Image Loading Error");
        img.src = `data:image/jpeg;base64,${base64Image}`;
    });
  };

  const handleProcessFile = async () => {
    if (!file) return;
    setIsLoading(true); 
    setErrorMsg(null);
    setSelectedPreviewImages({});
    setLoadingStep('Iniciando análise de alta fidelidade...');
    try {
      let content = "";
      let extractedImages: string[] = [];
      const currentLimit = imageStrategy === 'auto' ? MAX_PAGES_VISUAL : MAX_PAGES_TEXT;

      if (file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (pdf.numPages > currentLimit) {
          throw new Error(`Limite de ${currentLimit} páginas excedido para o modo visual.`);
        }

        let pdfText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          setLoadingStep(`Digitalizando pág. ${i} de ${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          pdfText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
          
          if (imageStrategy === 'auto') {
              const viewport = page.getViewport({ scale: 2.0 }); 
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              if (ctx) {
                  await page.render({ canvasContext: ctx, viewport: viewport, canvas }).promise;
                  extractedImages.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
              }
          }
        }
        content = pdfText;
      } else if (file.name.endsWith('.docx')) {
        setLoadingStep('Lendo Word...');
        const buffer = await file.arrayBuffer();
        const rawTextResult = await mammoth.extractRawText({ arrayBuffer: buffer });
        content = rawTextResult.value;
      } else { 
        content = await file.text(); 
      }
      
      setLoadingStep('IA Mapeando todo o conteúdo...');
      const questions = await processFileQuestions(content, analysisPrompt, undefined, extractedImages);
      
      if (questions.length === 0) {
          throw new Error("Nenhuma questão estruturada encontrada.");
      }

      if (extractedImages.length > 0) {
          setLoadingStep(`Vinculando mídias detectadas...`);
          const newSelected: Record<number, any> = {};
          for (let i = 0; i < questions.length; i++) {
              const q = questions[i];
              if (q.indice_imagem_referencia !== null && q.indice_imagem_referencia !== undefined && extractedImages[q.indice_imagem_referencia] && q.coordenadas_recorte?.length === 4) {
                  try {
                      const croppedUrl = await cropImageFromCoordinates(extractedImages[q.indice_imagem_referencia], q.coordenadas_recorte);
                      const res = await fetch(croppedUrl);
                      const blob = await res.blob();
                      newSelected[i] = { file: blob, url: croppedUrl };
                  } catch (e) { 
                      console.warn(`Erro no crop da imagem ${i}:`, e); 
                  }
              }
          }
          setSelectedPreviewImages(newSelected);
      }
      setPreviewData(questions);
      setImportStep('preview'); 
    } catch (err: any) { 
        console.error(err);
        setErrorMsg(err.message || 'Falha técnica no processamento.'); 
    } finally { 
        setIsLoading(false); 
        setLoadingStep('');
    }
  };

  const handleSaveToDatabase = async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadingStep('Publicando acervo...');
    try {
      const items = [];
      for (let i = 0; i < previewData.length; i++) {
        const q = previewData[i];
        let imgUrl = '';
        if (selectedPreviewImages[i]) {
            imgUrl = await storageService.uploadImage(selectedPreviewImages[i].file, 'questions');
        }
        items.push({
          id: crypto.randomUUID(), 
          category: q.categoria || 'Geral', 
          subcategory: q.subcategoria || '',
          difficulty: normalizeDifficulty(q.dificuldade), 
          statement: q.enunciado,
          explanation: q.comentario || '',
          statement_image_url: imgUrl, 
          created_by: user.id, 
          created_at: new Date().toISOString(), 
          tags: q.tags || [],
          alternatives: q.alternativas.map((t, idx) => ({ 
              id: crypto.randomUUID(), 
              text: t, 
              is_correct: String.fromCharCode(65 + idx) === (q.gabarito || 'A').toUpperCase() 
          }))
        });
      }
      await syncEngine.bulkEnqueue('questions', items);
      navigate('/questions');
    } catch (e) {
        alert("Erro ao publicar lote.");
    } finally { setIsLoading(false); }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !manualData.statement) return;
    setIsLoading(true);
    try {
      let url = '';
      if (manualInputImage) url = await storageService.uploadImage(manualInputImage, 'questions');
      await syncEngine.enqueue('questions', {
        id: crypto.randomUUID(),
        ...manualData,
        difficulty: normalizeDifficulty(manualData.difficulty),
        statement_image_url: url,
        alternatives: alternatives.map(a => ({ ...a, id: crypto.randomUUID() })),
        created_by: user.id,
        created_at: new Date().toISOString(),
        tags: []
      });
      navigate('/questions');
    } catch (e) {
      alert("Erro ao salvar manual.");
    } finally { setIsLoading(false); }
  };

  const handleChatGenerate = async () => {
    if (!chatInput.trim() || isLoading) return;
    const p = chatInput;
    setIsLoading(true);
    setChatInput('');
    setChatLog(prev => [...prev, { role: 'user', text: p }]);
    try {
      const qs = await generateQuestionsFromPrompt(p);
      setPreviewData(qs); 
      setChatLog(prev => [...prev, { role: 'bot', text: `Gerei ${qs.length} itens de alto nível para você.` }]);
      setTimeout(() => setImportStep('preview'), 800);
    } catch { 
      setChatLog(prev => [...prev, { role: 'bot', text: "Erro ao acessar motor IA." }]); 
    } finally { setIsLoading(false); }
  };

  return (
    <Layout title="Importação Inteligente">
      <div className="h-full flex flex-col space-y-3 overflow-hidden">
        
        {importStep === 'input' && (
          <>
            <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-900 w-fit shrink-0 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('chat')} className={`whitespace-nowrap px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center transition-all ${activeTab === 'chat' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>
                    <Sparkles className="h-3.5 w-3.5 mr-2" /> IA Chat
                </button>
                <button onClick={() => setActiveTab('file')} className={`whitespace-nowrap px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center transition-all ${activeTab === 'file' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>
                    <FileUp className="h-3.5 w-3.5 mr-2" /> Documento
                </button>
                <button onClick={() => setActiveTab('manual')} className={`whitespace-nowrap px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>
                    <Plus className="h-3.5 w-3.5 mr-2" /> Manual
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'chat' && (
                    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in duration-300">
                        <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-900 flex items-center gap-3 shrink-0">
                            <Bot className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arquiteto de Itens IA</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-4 custom-scrollbar">
                            {chatLog.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                                    <MessageSquare className="h-10 w-10 text-emerald-500" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest max-w-xs">"Crie 5 questões sobre AVC isquêmico agudo..."</p>
                                </div>
                            )}
                            {chatLog.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-tl-none'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-3 text-emerald-500 animate-pulse">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-[9px] font-black uppercase">IA Projetando...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-900 shrink-0">
                            <div className="relative max-w-4xl mx-auto flex items-center">
                                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatGenerate()} placeholder="O que deseja estudar?" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-4 pr-14 rounded-2xl text-[11px] font-bold outline-none focus:border-emerald-500 shadow-inner" />
                                <button onClick={handleChatGenerate} disabled={isLoading || !chatInput.trim()} className="absolute right-2 p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg transition-all active:scale-90 disabled:opacity-30"><Send className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'file' && (
                    <div className="h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 md:p-10 flex flex-col items-center justify-center animate-in fade-in overflow-y-auto custom-scrollbar">
                        <div onClick={() => !isLoading && fileInputRef.current?.click()} className={`w-full max-w-xl border-4 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center cursor-pointer transition-all shadow-inner group ${isLoading ? 'opacity-50' : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-100 dark:border-zinc-800 hover:border-primary'}`}>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            <FileUp className={`h-12 w-12 mb-4 transition-colors ${file ? 'text-primary' : 'text-slate-300 group-hover:text-primary'}`} />
                            <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white">{file ? file.name : 'Selecionar Caderno de Prova'}</h4>
                            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest text-center">IA Mapeará todas as Figuras Automaticamente</p>
                            
                            {isLoading && (
                                <div className="mt-8 flex flex-col items-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">{loadingStep}</span>
                                </div>
                            )}
                        </div>

                        {!isLoading && (
                            <div className="w-full max-w-xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                    <label className="text-[8px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Digitalização de Mídias</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setImageStrategy('manual')} className={`flex-1 p-2 rounded-lg text-[8px] font-black uppercase border-2 transition-all ${imageStrategy === 'manual' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-black border-slate-100 dark:border-zinc-800 text-slate-400'}`}>Apenas Texto</button>
                                        <button onClick={() => setImageStrategy('auto')} className={`flex-1 p-2 rounded-lg text-[8px] font-black uppercase border-2 transition-all ${imageStrategy === 'auto' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-black border-slate-100 dark:border-zinc-800 text-slate-400'}`}>Auto-Detecção</button>
                                    </div>
                                </div>
                                <button disabled={!file} onClick={handleProcessFile} className="bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 transition-all">
                                    <Sparkles className="h-4 w-4" /> DIGITALIZAR TUDO
                                </button>
                            </div>
                        )}
                        {errorMsg && <p className="mt-6 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {errorMsg}</p>}
                    </div>
                )}

                {activeTab === 'manual' && (
                    <form onSubmit={handleManualSave} className="h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 md:p-10 flex flex-col gap-6 overflow-y-auto custom-scrollbar animate-in fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Enunciado Médico</label>
                                    <textarea value={manualData.statement} onChange={e => setManualData({...manualData, statement: e.target.value})} rows={6} className="w-full bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary shadow-inner" required />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Comentário Acadêmico</label>
                                    <textarea value={manualData.explanation} onChange={e => setManualData({...manualData, explanation: e.target.value})} rows={3} className="w-full bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary shadow-inner" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div onClick={() => manualInputFileRef.current?.click()} className="border-4 border-dashed rounded-[2rem] h-48 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 hover:border-primary group">
                                    <input type="file" ref={manualInputFileRef} className="hidden" accept="image/*" onChange={e => {
                                        const f = e.target.files?.[0]; if(f) { setManualInputImage(f); setManualInputPreview(URL.createObjectURL(f)); }
                                    }} />
                                    {manualInputPreview ? <img src={manualInputPreview} className="absolute inset-0 w-full h-full object-contain p-2" /> : <div className="text-center opacity-30"><ImagePlus className="h-10 w-10 mx-auto mb-2" /><p className="text-[9px] font-black uppercase">Anexar Mídia</p></div>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[8px] font-black uppercase text-slate-400 mb-2 block">Tema</label><input type="text" value={manualData.category} onChange={e => setManualData({...manualData, category: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-black" /></div>
                                    <div><label className="text-[8px] font-black uppercase text-slate-400 mb-2 block">Dificuldade</label><select value={manualData.difficulty} onChange={e => setManualData({...manualData, difficulty: e.target.value as any})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-black"><option>Fácil</option><option>Médio</option><option>Difícil</option></select></div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-100 dark:border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {alternatives.map((alt, idx) => (
                                <div key={alt.id} className="relative">
                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${alt.is_correct ? 'bg-primary text-white shadow-md' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'}`}>{String.fromCharCode(65+idx)}</span>
                                    <input type="text" value={alt.text} onChange={e => { const n = [...alternatives]; n[idx].text = e.target.value; setAlternatives(n); }} className={`w-full pl-14 pr-12 py-4 rounded-xl border-2 text-[10px] font-bold ${alt.is_correct ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-zinc-900'}`} placeholder="Alternativa..." />
                                    <button type="button" onClick={() => setAlternatives(alternatives.map((a, i) => ({ ...a, is_correct: i === idx })))} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${alt.is_correct ? 'text-primary' : 'text-slate-200'}`}><CheckCircle2 className="h-5 w-5" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="pt-8 flex justify-end shrink-0"><button type="submit" disabled={isLoading} className="bg-primary text-white px-16 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 disabled:opacity-30">PUBLICAR ITEM</button></div>
                    </form>
                )}
            </div>
          </>
        )}

        {importStep === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-3 duration-300 overflow-hidden">
            <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-4 rounded-[1.5rem] border border-primary/20 shadow-md flex items-center justify-between sticky top-0 z-40 shrink-0 mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setImportStep('input')} className="p-2 bg-slate-100 dark:bg-zinc-900 rounded-xl hover:text-primary transition-all"><ChevronLeft className="h-5 w-5" /></button>
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Conferência Automática</h2>
                      <p className="text-[8px] font-black text-primary uppercase tracking-widest">{previewData.length} Questões Detectadas</p>
                    </div>
                </div>
                <button onClick={handleSaveToDatabase} disabled={isLoading} className="bg-primary text-white px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-3 active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} SALVAR TUDO
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-12 space-y-4 min-h-0">
                {previewData.map((q, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row gap-8">
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="bg-primary/5 text-primary border border-primary/10 px-3 py-1 rounded-full text-[8px] font-black uppercase">{q.categoria}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Nível: {normalizeDifficulty(q.dificuldade)}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{q.enunciado}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.alternativas.map((alt, idx) => {
                                    const isCorrect = String.fromCharCode(65+idx) === (q.gabarito || 'A').toUpperCase();
                                    return (
                                        <div key={idx} onClick={() => { const n = [...previewData]; n[i].gabarito = String.fromCharCode(65+idx); setPreviewData(n); }} className={`p-3 rounded-xl border text-[10px] flex items-center gap-4 transition-all cursor-pointer ${isCorrect ? 'bg-emerald-50 border-emerald-500/30' : 'bg-slate-50 dark:bg-black border-slate-100 dark:border-zinc-900'}`}>
                                            <span className={`h-6 w-6 rounded-lg flex items-center justify-center font-black shrink-0 ${isCorrect ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>{String.fromCharCode(65+idx)}</span>
                                            <span className="font-medium leading-tight">{alt}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* EXIBIÇÃO DE COMENTÁRIOS E ANÁLISE NO BACKUP TAMBÉM */}
                            <div className="space-y-2">
                                {q.comentario && (
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-2xl">
                                        <p className="text-[8px] font-black uppercase text-primary mb-2 flex items-center gap-2"><Activity className="h-3 w-3" /> Análise do Preceptor</p>
                                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 italic leading-relaxed">{q.comentario}</p>
                                    </div>
                                )}
                                {q.analise_radiologica && (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 rounded-xl">
                                        <p className="text-[7px] font-black uppercase text-blue-500 mb-1">Achados Visuais</p>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight italic line-clamp-4">{q.analise_radiologica}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="w-full md:w-72 shrink-0 flex flex-col gap-3">
                            <div className="rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-zinc-800 bg-slate-100 dark:bg-black aspect-square flex items-center justify-center relative group shadow-sm">
                                {selectedPreviewImages[i] ? (
                                    <img src={selectedPreviewImages[i].url} className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <div className="text-center opacity-30">
                                        <ImageIcon className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Sem Figura Detetada</p>
                                    </div>
                                )}
                                <button onClick={() => {
                                    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
                                    input.onchange = (e: any) => {
                                        const f = e.target.files?.[0];
                                        if(f) setSelectedPreviewImages(p => ({...p, [i]: { file: f, url: URL.createObjectURL(f) }}));
                                    };
                                    input.click();
                                }} className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer">
                                    <ImagePlus className="h-6 w-6 mb-2" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Substituir Imagem</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
