import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Upload, FileText, Loader2, Save, 
  Sparkles, Send, Bot, Plus, ChevronLeft,
  FileUp, Image as ImageIcon, X,
  Brain, MessageSquare, ListChecks, Database,
  Settings2, Activity, Terminal, Layers, ImagePlus, Trash2,
  CheckCircle2, AlertCircle, Zap, Play, AlertTriangle, Minimize2,
  Maximize2, FileType, Lock
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { generateQuestionsFromPrompt, processFileQuestions } from '../services/ai';
import { questionProcessor } from '../services/questionProcessor'; 
import { AIImportedQuestion, Difficulty, Question } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { useImportStore } from '../store/useImportStore';
import { useNavigate } from 'react-router';
import { syncEngine } from '../services/syncEngine';
import { storageService } from '../services/storage';
import { localDB } from '../services/localDB';

const ADMIN_EMAIL = 'steamleandro@hotmail.com';
const MAX_FILE_MB = 10;
const MAX_PAGES = 20;

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
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  const { 
      isProcessing, progress, statusMessage, results, errors, 
      isMinimized, maximize, minimize, clearAll, addResults, updateResult, removeResult, finishProcess
  } = useImportStore();

  const [activeTab, setActiveTab] = useState<'file' | 'neurochat' | 'rawtext' | 'manual'>('file');
  const [targetBankName, setTargetBankName] = useState('Novo Banco');
  const [existingBanks, setExistingBanks] = useState<string[]>([]);
  const [isCreatingNewBank, setIsCreatingNewBank] = useState(true);
  
  const [fileSourceType, setFileSourceType] = useState<'exam' | 'study'>('exam');
  const [totalQuestionsTarget, setTotalQuestionsTarget] = useState<number>(10);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = async (f: File): Promise<string | null> => {
    if (isAdmin) return null;
    const sizeMB = f.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      return `Arquivo muito grande (${sizeMB.toFixed(1)} MB). O limite é ${MAX_FILE_MB} MB.`;
    }
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      try {
        const buf = await f.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        if (pdf.numPages > MAX_PAGES) {
          return `PDF com ${pdf.numPages} páginas. O limite é ${MAX_PAGES} páginas por arquivo.`;
        }
      } catch {
        return 'Não foi possível ler o PDF. Verifique se o arquivo não está corrompido.';
      }
    }
    return null;
  };

  const handleFileChange = async (f: File | undefined) => {
    if (!f) { setFile(null); setFileError(null); return; }
    setFileError(null);
    const err = await validateFile(f);
    if (err) {
      setFile(null);
      setFileError(err);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setFile(f);
    }
  };

  // States para upload manual de imagem na revisão
  const [manualImageMap, setManualImageMap] = useState<Record<number, File>>({});
  const manualImageInputRef = useRef<HTMLInputElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);

  const [forceReviewMode, setForceReviewMode] = useState(false);

  // NeuroChat states
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Raw Text states
  const [rawText, setRawText] = useState('');
  const [rawTextQuestionsTarget, setRawTextQuestionsTarget] = useState<number>(10);
  const [isRawTextLoading, setIsRawTextLoading] = useState(false);

  // Manual form states
  const [manualData, setManualData] = useState({ 
    category: '', 
    subcategory: '', 
    difficulty: 'Médio' as Difficulty, 
    statement: '', 
    explanation: '',
    wrongExplanations: ''
  });
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

  useEffect(() => {
      const loadBanks = async () => {
          if (!user) return;
          const questions = await localDB.getAll('questions');
          const myQuestions = questions.filter(q => q.created_by === user.id);
          const banks = Array.from(new Set(myQuestions.map(q => q.bank_name || 'Geral').filter(Boolean)));
          setExistingBanks(banks);
          if (banks.length > 0) {
              setTargetBankName(banks[0]);
              setIsCreatingNewBank(false);
          }
      };
      loadBanks();
  }, [user]);

  const handleProcessFile = async () => {
    if (!file || fileError) return;
    setIsUploading(true); 
    setForceReviewMode(false);
    
    setTimeout(async () => {
        try {
            await questionProcessor.processPDF(file, {
                sourceType: fileSourceType,
                customPrompt: analysisPrompt,
                totalQuestionsTarget: fileSourceType === 'study' ? totalQuestionsTarget : undefined
            });
        } finally {
            setIsUploading(false); 
        }
    }, 100);
  };

  const handleCancelProcess = () => {
      questionProcessor.cancel();
      clearAll();
      setIsUploading(false);
      setForceReviewMode(false);
  };

  // NeuroChat - Generate questions from prompt
  const handleNeuroChatGenerate = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    setIsChatLoading(true);
    try {
      const questions = await generateQuestionsFromPrompt(chatInput);
      if (questions && questions.length > 0) {
        addResults(questions);
        setChatInput('');
        setForceReviewMode(true);
      } else {
        alert('Nenhuma questão foi gerada. Tente novamente com um tema diferente.');
      }
    } catch (e: any) {
      alert('Erro ao gerar questões: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setIsChatLoading(false);
    }
  };

  // Raw Text - Generate questions from raw text
  const handleRawTextGenerate = async () => {
    if (!rawText.trim() || isRawTextLoading) return;
    setIsRawTextLoading(true);
    try {
      const questions = await processFileQuestions(
        rawText, 
        '', 
        undefined, 
        [], 
        rawTextQuestionsTarget, 
        'generate', 
        'study'
      );
      if (questions && questions.length > 0) {
        addResults(questions);
        setRawText('');
        setForceReviewMode(true);
      } else {
        alert('Nenhuma questão foi gerada. Tente com mais conteúdo.');
      }
    } catch (e: any) {
      alert('Erro ao processar texto: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setIsRawTextLoading(false);
    }
  };

  // Manual form save
  const handleManualSave = async () => {
    if (!user || !manualData.statement.trim()) {
      alert('Preencha pelo menos o enunciado da questão.');
      return;
    }
    
    const filledAlternatives = alternatives.filter(a => a.text.trim());
    if (filledAlternatives.length < 2) {
      alert('Preencha pelo menos 2 alternativas.');
      return;
    }

    const correctAlt = alternatives.find(a => a.is_correct);
    if (!correctAlt || !correctAlt.text.trim()) {
      alert('Selecione uma alternativa correta e preencha seu texto.');
      return;
    }

    setIsUploading(true);
    try {
      let imageUrl = '';
      if (manualInputImage) {
        imageUrl = await storageService.uploadImage(manualInputImage, 'questions');
      }

      const correctIndex = alternatives.findIndex(a => a.is_correct);
      const gabarito = String.fromCharCode(65 + correctIndex);

      const newQuestion: AIImportedQuestion = {
        enunciado: manualData.statement,
        alternativas: filledAlternatives.map(a => a.text),
        gabarito: gabarito,
        comentario: manualData.explanation,
        categoria: manualData.category || 'Geral',
        subcategoria: manualData.subcategory,
        dificuldade: manualData.difficulty,
        tags: [],
        imagem: imageUrl || undefined
      };

      addResults([newQuestion]);
      
      // Reset form
      setManualData({ category: '', subcategory: '', difficulty: 'Médio', statement: '', explanation: '', wrongExplanations: '' });
      setAlternatives([
        { id: '1', text: '', is_correct: true },
        { id: '2', text: '', is_correct: false },
        { id: '3', text: '', is_correct: false },
        { id: '4', text: '', is_correct: false },
        { id: '5', text: '', is_correct: false },
      ]);
      setManualInputImage(null);
      setManualInputPreview('');
      
      setForceReviewMode(true);
    } catch (e: any) {
      alert('Erro ao adicionar questão: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!user || results.length === 0) return;
    setIsUploading(true);
    try {
      const items: Question[] = [];
      const bankName = isCreatingNewBank ? targetBankName : targetBankName;
      
      for (let i = 0; i < results.length; i++) {
        const q = results[i];
        
        let imageUrl = q.imagem || '';
        const manualFile = manualImageMap[i];
        
        if (manualFile) {
            imageUrl = await storageService.uploadImage(manualFile, 'questions');
        } else if (imageUrl && imageUrl.startsWith('data:')) {
            imageUrl = await storageService.uploadBase64(imageUrl.split(',')[1], 'questions');
        }

        const match = (q.gabarito || 'A').match(/([A-E])/i);
        const correctChar = match ? match[0].toUpperCase() : 'A';

        const cleanComment = (q.comentario || '').replace('[ANEXAR_IMAGEM_MANUAL]', '').trim();

        items.push({
          id: crypto.randomUUID(), 
          bank_name: bankName,
          category: q.categoria || 'Geral', 
          subcategory: q.subcategoria || '',
          difficulty: normalizeDifficulty(q.dificuldade), 
          statement: q.enunciado,
          explanation: cleanComment,
          statement_image_url: imageUrl, 
          created_by: user.id, 
          created_at: new Date().toISOString(), 
          tags: q.tags || [],
          alternatives: (q.alternativas || []).map((t, idx) => ({ 
              id: crypto.randomUUID(), 
              text: t, 
              is_correct: String.fromCharCode(65 + idx) === correctChar 
          }))
        });
      }
      await syncEngine.bulkEnqueue('questions', items);
      clearAll(); 
      navigate('/questions');
    } catch (e) {
        alert("Erro ao salvar.");
    } finally {
        setIsUploading(false);
    }
  };

  const isReviewing = results.length > 0 && (!isProcessing || forceReviewMode);

  return (
    <Layout title="Gerador de Questões">
      <div className="flex flex-col space-y-3 h-full overflow-hidden max-w-full">
        
        <input type="file" ref={manualImageInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && currentImageIndex !== null) {
                setManualImageMap(prev => ({ ...prev, [currentImageIndex]: file }));
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const result = ev.target?.result as string;
                    if (result) updateResult(currentImageIndex, { ...results[currentImageIndex], imagem: result });
                };
                reader.readAsDataURL(file);
            }
        }} />

        <input type="file" ref={manualInputFileRef} className="hidden" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
                setManualInputImage(f);
                setManualInputPreview(URL.createObjectURL(f));
            }
        }} />

        {/* Tab Navigation - Only show when not reviewing */}
        {!isReviewing && !isProcessing && !isUploading && (
            <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-900 w-full md:w-fit shrink-0 overflow-x-auto no-scrollbar gap-1">
                <button 
                  onClick={() => setActiveTab('file')} 
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeTab === 'file' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}
                >
                  <FileUp className="h-3.5 w-3.5" /> Arquivo
                </button>
                <button 
                  onClick={() => setActiveTab('neurochat')} 
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeTab === 'neurochat' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}
                >
                  <Sparkles className="h-3.5 w-3.5" /> NeuroChat
                </button>
                <button 
                  onClick={() => setActiveTab('rawtext')} 
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeTab === 'rawtext' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}
                >
                  <FileType className="h-3.5 w-3.5" /> Texto Bruto
                </button>
                <button 
                  onClick={() => setActiveTab('manual')} 
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeTab === 'manual' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}
                >
                  <Plus className="h-3.5 w-3.5" /> Manual
                </button>
            </div>
        )}

        {isReviewing ? (
             <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-emerald-500/30 rounded-[1.5rem] shadow-sm animate-in slide-in-from-bottom-4 overflow-hidden">
                <div className="p-3 md:p-4 border-b border-slate-100 dark:border-zinc-900 bg-emerald-50/30 dark:bg-emerald-900/10 flex flex-col md:flex-row justify-between items-center shrink-0 gap-3">
                    <div className="w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1.5"><ListChecks className="h-4 w-4" /> Revisão</h2>
                            {isProcessing && (
                                <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                    <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                                    <span className="text-[8px] font-bold text-emerald-700 dark:text-emerald-400">IA Gerando...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 max-w-md bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg text-emerald-600"><Database className="h-3.5 w-3.5" /></div>
                        <div className="flex-1">
                            {isCreatingNewBank ? (
                                <input value={targetBankName} onChange={e => setTargetBankName(e.target.value)} className="w-full bg-transparent border-b border-emerald-200 dark:border-emerald-800 p-0 text-[10px] font-black uppercase focus:border-emerald-500 outline-none" placeholder="Novo banco..." />
                            ) : (
                                <select value={targetBankName} onChange={e => setTargetBankName(e.target.value)} className="w-full bg-transparent p-0 text-[10px] font-black uppercase outline-none cursor-pointer">
                                    {existingBanks.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            )}
                        </div>
                        <button onClick={() => setIsCreatingNewBank(!isCreatingNewBank)} className="text-[7px] font-black text-slate-400 px-2 uppercase hover:text-emerald-500">{isCreatingNewBank ? 'LISTA' : '+ NOVO'}</button>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={handleCancelProcess} className="flex-1 md:flex-none px-3 py-2 rounded-lg text-[8px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">Descartar</button>
                        <button onClick={handleSaveToDatabase} className="flex-1 md:flex-none bg-emerald-600 text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase shadow-lg active:scale-95 flex items-center gap-2">
                            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} SALVAR TUDO
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-5 space-y-3 bg-slate-50/30 dark:bg-black/10">
                    {results.map((q, i) => {
                        const match = (q.gabarito || 'A').match(/([A-E])/i);
                        const correctChar = match ? match[0].toUpperCase() : 'A';
                        const needsManualImage = q.comentario?.includes('[ANEXAR_IMAGEM_MANUAL]');
                        
                        return (
                            <div key={i} className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 md:p-5 bg-white dark:bg-zinc-900/40 relative flex flex-col gap-2 group animate-in slide-in-from-bottom-2">
                                <div className="absolute -left-2 top-4 w-5 h-5 bg-emerald-500 text-white rounded-md flex items-center justify-center text-[9px] font-black shadow-lg">#{i+1}</div>
                                <div className="flex justify-between items-start ml-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[8px] font-black uppercase text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{q.categoria || 'Geral'}</span>
                                        {needsManualImage && (
                                            <span className="text-[8px] font-black uppercase bg-red-500 text-white px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                                                <ImageIcon className="h-2.5 w-2.5" /> Anexo Necessário
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setCurrentImageIndex(i); manualImageInputRef.current?.click(); }} className="p-1 text-slate-300 hover:text-blue-500" title="Anexar Imagem"><ImagePlus className="h-3.5 w-3.5"/></button>
                                        <button onClick={() => removeResult(i)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5"/></button>
                                    </div>
                                </div>
                                {q.imagem && <div className="ml-2 mb-2 w-32 h-32 rounded-lg overflow-hidden border border-slate-200 relative group/img"><img src={q.imagem} alt="" className="w-full h-full object-cover" /><button onClick={() => updateResult(i, {...q, imagem: undefined})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"><X className="h-3 w-3" /></button></div>}
                                <p className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed whitespace-pre-wrap ml-2 text-justify">{q.enunciado}</p>
                                <div className="space-y-1 pl-4 border-l border-slate-100 dark:border-zinc-800 ml-2">
                                    {(q.alternativas || []).map((alt, idx) => (
                                        <div key={idx} className={`text-[10px] p-1.5 rounded-lg flex gap-2 ${String.fromCharCode(65+idx) === correctChar ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/20' : 'text-slate-500 dark:text-slate-400'}`}><span className="font-black shrink-0">{String.fromCharCode(65+idx)})</span><span>{alt}</span></div>
                                    ))}
                                </div>
                                {q.comentario && <div className="ml-2 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800"><p className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1"><Brain className="h-3 w-3 text-primary"/> Comentário e Análise IA</p><p className="text-[10px] text-slate-600 dark:text-slate-300 italic leading-relaxed text-justify">{q.comentario.replace('[ANEXAR_IMAGEM_MANUAL]', '').trim()}</p></div>}
                            </div>
                        );
                    })}
                </div>
             </div>
        ) : (
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[1.5rem] p-4 md:p-8 shadow-sm overflow-hidden animate-in fade-in">
                    {(isProcessing || isUploading) ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <div><h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Extração Sequencial Ativa</h3><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{statusMessage || 'Processando em ordem...'}</p></div>
                            <div className="w-full max-w-xs mx-auto space-y-2"><div className="flex justify-between text-[9px] font-black uppercase text-primary"><span>Progresso</span><span>{progress}%</span></div><div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }} /></div></div>
                            <div className="flex gap-4 mt-4">
                                <button onClick={handleCancelProcess} className="text-red-500 font-black text-[9px] uppercase tracking-widest hover:underline px-4 py-2 border border-red-100 rounded-lg bg-red-50/50">Cancelar</button>
                                {results.length > 0 && <button onClick={() => setForceReviewMode(true)} className="bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-pulse"><Maximize2 className="h-3 w-3" /> Revisar Já ({results.length})</button>}
                            </div>
                        </div>
                    ) : (
                        <>
                          {/* ARQUIVO TAB */}
                          {activeTab === 'file' && (
                            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full space-y-8 py-2 animate-in fade-in overflow-y-auto custom-scrollbar">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 dark:bg-black/20 group shadow-2xl p-8 ${fileError ? 'border-red-400 hover:border-red-500' : 'border-slate-200 dark:border-zinc-800 hover:border-primary hover:bg-primary/[0.02]'}`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".pdf,.docx,.txt"
                                        onChange={(e) => handleFileChange(e.target.files?.[0])}
                                    />
                                    <div className={`p-6 rounded-[2rem] shadow-xl group-hover:scale-110 transition-transform mb-4 ${fileError ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-zinc-900'}`}>
                                        {fileError
                                            ? <AlertTriangle className="h-12 w-12 text-red-500" />
                                            : file
                                                ? <FileText className="h-12 w-12 text-primary" />
                                                : <FileUp className="h-12 w-12 text-slate-300" />
                                        }
                                    </div>
                                    <h4 className={`text-sm font-black uppercase ${fileError ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                        {fileError ? 'Arquivo rejeitado' : file ? file.name : 'Carregar Documento'}
                                    </h4>
                                    {fileError ? (
                                        <p className="text-[9px] font-bold text-red-500 mt-2 text-center max-w-xs">{fileError}</p>
                                    ) : (
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2 text-center">IA mapeará todas as figuras e justificativas automaticamente</p>
                                    )}
                                    {!isAdmin && !fileError && (
                                        <div className="flex items-center gap-1.5 mt-3 bg-slate-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full">
                                            <Lock className="h-2.5 w-2.5 text-slate-400" />
                                            <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Limite: {MAX_PAGES} pág. · {MAX_FILE_MB} MB</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Modo de Extração</label>
                                    <div className="flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl shadow-inner border border-slate-200 dark:border-zinc-800">
                                        <button onClick={() => setFileSourceType('exam')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${fileSourceType === 'exam' ? 'bg-slate-900 dark:bg-zinc-800 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Extrair Prova</button>
                                        <button onClick={() => setFileSourceType('study')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${fileSourceType === 'study' ? 'bg-primary text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Criar Questões</button>
                                    </div>
                                </div>

                                {/* Slider para número de questões - só aparece no modo "Criar Questões" */}
                                {fileSourceType === 'study' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Número de Questões por Página</label>
                                            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl font-black text-lg min-w-[50px] text-center">
                                                {totalQuestionsTarget}
                                            </div>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="30" 
                                            value={totalQuestionsTarget}
                                            onChange={(e) => setTotalQuestionsTarget(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-1.5">
                                        <Sparkles className="h-3 w-3" /> Instruções adicionais para IA
                                    </label>
                                    <textarea 
                                        value={analysisPrompt}
                                        onChange={(e) => setAnalysisPrompt(e.target.value)}
                                        placeholder="Ex: Foque apenas nas questões de neurologia..."
                                        className="w-full bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary shadow-inner min-h-[80px] resize-none"
                                    />
                                </div>

                                <button onClick={handleProcessFile} disabled={!file || isUploading || !!fileError} className="w-full bg-primary hover:bg-emerald-700 text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all">
                                    INICIAR EXTRAÇÃO IA
                                </button>
                            </div>
                          )}

                          {/* NEUROCHAT TAB */}
                          {activeTab === 'neurochat' && (
                            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full py-2 animate-in fade-in overflow-y-auto custom-scrollbar">
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="border-4 border-dashed border-slate-200 dark:border-zinc-800 rounded-[3rem] p-8 mb-8 bg-slate-50 dark:bg-black/20 w-full">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg mb-4">
                                                <Bot className="h-10 w-10 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white">NeuroChat Gerador</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-md">
                                                Descreva o tema e a IA projetará itens inéditos com explicações completas.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full space-y-4">
                                        <textarea 
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Ex: Crie 5 questões sobre neurite óptica e seu diferencial com em..."
                                            className="w-full bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary shadow-inner min-h-[120px] resize-none"
                                        />
                                        <button 
                                            onClick={handleNeuroChatGenerate} 
                                            disabled={!chatInput.trim() || isChatLoading} 
                                            className="w-full bg-primary hover:bg-emerald-700 text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
                                        >
                                            {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                            Gerar Questões Agora
                                        </button>
                                    </div>
                                </div>
                            </div>
                          )}

                          {/* TEXTO BRUTO TAB */}
                          {activeTab === 'rawtext' && (
                            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full py-2 animate-in fade-in overflow-y-auto custom-scrollbar">
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <FileType className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-blue-600">Extração de Texto Bruto</h4>
                                            <p className="text-[10px] text-blue-500 mt-1">Cole o conteúdo de um artigo ou resumo para que a IA o converta em questões.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <textarea 
                                        value={rawText}
                                        onChange={(e) => setRawText(e.target.value)}
                                        placeholder="Cole o texto aqui..."
                                        className="w-full bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary shadow-inner min-h-[200px] resize-none flex-1"
                                    />

                                    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Qtd estimada de questões</span>
                                        <select 
                                            value={rawTextQuestionsTarget}
                                            onChange={(e) => setRawTextQuestionsTarget(Number(e.target.value))}
                                            className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-black"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={15}>15</option>
                                            <option value={20}>20</option>
                                            <option value={30}>30</option>
                                        </select>
                                    </div>

                                    <button 
                                        onClick={handleRawTextGenerate} 
                                        disabled={!rawText.trim() || isRawTextLoading} 
                                        className="w-full bg-primary hover:bg-emerald-700 text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
                                    >
                                        {isRawTextLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                        Iniciar Extração
                                    </button>
                                </div>
                            </div>
                          )}

                          {/* MANUAL TAB */}
                          {activeTab === 'manual' && (
                            <div className="flex-1 flex flex-col animate-in fade-in overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                                    {/* Left Column - Statement and Comment */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Enunciado da Questão</label>
                                            <textarea 
                                                value={manualData.statement} 
                                                onChange={e => setManualData({...manualData, statement: e.target.value})} 
                                                rows={6} 
                                                placeholder="Digite o caso clínico..."
                                                className="w-full bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary shadow-inner" 
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Comentário Técnico</label>
                                            <textarea 
                                                value={manualData.explanation} 
                                                onChange={e => setManualData({...manualData, explanation: e.target.value})} 
                                                rows={3} 
                                                placeholder="Explicação para o gabarito..."
                                                className="w-full bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary shadow-inner" 
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column - Alternatives */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Alternativas</label>
                                        <div className="space-y-3">
                                            {alternatives.map((alt, idx) => (
                                                <div key={alt.id} className="relative flex items-center gap-2">
                                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${alt.is_correct ? 'bg-primary text-white shadow-md' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'}`}>
                                                        {String.fromCharCode(65+idx)}
                                                    </span>
                                                    <input 
                                                        type="text" 
                                                        value={alt.text} 
                                                        onChange={e => { 
                                                            const n = [...alternatives]; 
                                                            n[idx].text = e.target.value; 
                                                            setAlternatives(n); 
                                                        }} 
                                                        className={`flex-1 px-4 py-3 rounded-xl border-2 text-[10px] font-bold ${alt.is_correct ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-zinc-800'}`} 
                                                        placeholder={`Opção ${String.fromCharCode(65+idx)}...`} 
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setAlternatives(alternatives.map((a, i) => ({ ...a, is_correct: i === idx })))} 
                                                        className={`p-2 rounded-full ${alt.is_correct ? 'text-primary bg-primary/10' : 'text-slate-300 hover:text-primary'}`}
                                                    >
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4">
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Justificativas das incorretas (opcional)</label>
                                            <textarea 
                                                value={manualData.wrongExplanations} 
                                                onChange={e => setManualData({...manualData, wrongExplanations: e.target.value})} 
                                                rows={3} 
                                                placeholder="Explicação para as opções falsas..."
                                                className="w-full bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary shadow-inner" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-zinc-900">
                                    <button 
                                        onClick={handleManualSave} 
                                        disabled={isUploading || !manualData.statement.trim()} 
                                        className="w-full bg-slate-900 dark:bg-white dark:text-black text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
                                    >
                                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        Adicionar à Lista de Revisão
                                    </button>
                                </div>
                            </div>
                          )}
                        </>
                    )}
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};
