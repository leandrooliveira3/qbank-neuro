
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { 
  Upload, FileText, Loader2, Play, CheckCircle2, 
  X, BookOpen, GraduationCap, RefreshCw,
  ChevronRight, Brain, Filter, Download,
  Search, List, ChevronDown, FolderOpen, Layers,
  FileUp, Trash2, AlertCircle, Check, ImagePlus, Edit3
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { localDB } from '../services/localDB';
import { Question } from '../types';
import { xpService, XP_VALUES } from '../services/xpService';
import JSON5 from 'json5';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
    const version = '5.4.530';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

interface ProcessingFile {
    id: string;
    name: string;
    status: 'pending' | 'extracting' | 'processing' | 'done' | 'error';
    questionCount: number;
    error?: string;
    modelUsed?: string;
    fileObject?: File;
    currentChunk?: number;
    totalChunks?: number;
}

const AI_MODELS = [
    'gemini-3-flash-preview', 
    'gemini-3-flash-preview',
    'gemini-3-flash-preview'
];

export const ResidenciaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'practice' | 'browse' | 'import'>('practice');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState({ total: 0, categories: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingQueue, setProcessingQueue] = useState<ProcessingFile[]>([]);
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoryBrowse, setFilterCategoryBrowse] = useState('Todas');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const [practiceState, setPracticeState] = useState<'setup' | 'active' | 'finished'>('setup');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    fetchLocalData();
  }, []);

  const fetchLocalData = async () => {
    setLoading(true);
    if (navigator.onLine) {
        try {
            const { data } = await supabase.from('qresidencia').select('*');
            if (data && data.length > 0) {
                await localDB.clear('residencia_questions');
                await localDB.bulkPut('residencia_questions', data);
            }
        } catch (e) { console.error("Sync error residência", e); }
    }
    
    const localData = await localDB.getAll('residencia_questions');
    setQuestions(localData);
    
    const cats = new Set(localData.map(q => q.category));
    setStats({ total: localData.length, categories: cats.size });
    setLoading(false);
  };

  const uniqueCategories = useMemo(() => {
      const cats = new Set(questions.map(q => q.category));
      return Array.from(cats).sort();
  }, [questions]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files: File[] = Array.from(e.target.files || []);
      if (files.length === 0) return;
      if (files.length > 5) {
          alert("Por favor, selecione no máximo 5 arquivos por vez.");
          return;
      }
      const newQueue: ProcessingFile[] = files.map(f => ({
          id: crypto.randomUUID(),
          name: f.name,
          status: 'pending',
          questionCount: 0,
          fileObject: f,
          currentChunk: 0,
          totalChunks: 0
      } as ProcessingFile));
      setProcessingQueue(newQueue);
      setExtractedQuestions([]);
      setTotalProgress(0);
      processBatch(newQueue, files);
      e.target.value = ''; 
  };

  const extractTextChunks = async (file: File): Promise<string[]> => {
      const chunks: string[] = [];
      const PAGES_PER_CHUNK = 4;
      const CHARS_PER_CHUNK = 15000;

      if (file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const maxPages = Math.min(pdf.numPages, 100);
          let currentChunkText = "";
          for (let i = 1; i <= maxPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              currentChunkText += `\n--- Pág ${i} ---\n` + pageText;
              if (i % PAGES_PER_CHUNK === 0 || i === maxPages) {
                  chunks.push(currentChunkText);
                  currentChunkText = "";
              }
          }
      } else if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          const fullText = result.value;
          for (let i = 0; i < fullText.length; i += CHARS_PER_CHUNK) {
              chunks.push(fullText.substring(i, i + CHARS_PER_CHUNK));
          }
      } else {
          const fullText = await file.text();
          for (let i = 0; i < fullText.length; i += CHARS_PER_CHUNK) {
              chunks.push(fullText.substring(i, i + CHARS_PER_CHUNK));
          }
      }
      return chunks;
  };

  const processBatch = async (queue: ProcessingFile[], files: File[]) => {
      setIsProcessing(true);
      for (let i = 0; i < queue.length; i++) {
          const item = queue[i];
          const file = files[i];
          const modelIndex = i % AI_MODELS.length;
          const assignedModel = AI_MODELS[modelIndex];
          setProcessingQueue(prev => prev.map(p => p.id === item.id ? { ...p, status: 'extracting', modelUsed: assignedModel } : p));
          try {
              const textChunks = await extractTextChunks(file);
              setProcessingQueue(prev => prev.map(p => p.id === item.id ? { ...p, totalChunks: textChunks.length, currentChunk: 0 } : p));
              let fileTotalQuestions = 0;
              for (let j = 0; j < textChunks.length; j++) {
                  const chunk = textChunks[j];
                  setProcessingQueue(prev => prev.map(p => p.id === item.id ? { ...p, status: 'processing', currentChunk: j + 1 } : p));
                  if (j > 0) await new Promise(r => setTimeout(r, 1500));
                  const { data, error } = await supabase.functions.invoke('import-residencia-json', {
                      body: { content: chunk, modelChoice: assignedModel }
                  });
                  if (error) continue;
                  let aiQuestions = Array.isArray(data) ? data : (data.questions || Object.values(data).find(v => Array.isArray(v)) || []);
                  if (aiQuestions.length > 0) {
                      const formatted = aiQuestions.map((q: any) => ({
                          category: q.categoria || 'Geral',
                          subcategory: q.subcategoria || 'Geral',
                          statement: q.enunciado,
                          alternatives: (q.alternativas || []).map((alt: string, idx: number) => ({
                              id: crypto.randomUUID(), text: alt, is_correct: String.fromCharCode(65 + idx) === (q.gabarito || 'A').toUpperCase()
                          })),
                          explanation: q.comentario || '',
                          difficulty: q.dificuldade || 'Médio',
                          tags: q.tags || [],
                          reference: q.instituicao || item.name,
                          created_at: new Date().toISOString()
                      }));
                      setExtractedQuestions(prev => [...prev, ...formatted]);
                      fileTotalQuestions += formatted.length;
                  }
                  const baseProgress = (i / queue.length) * 100;
                  const chunkProgress = ((j + 1) / textChunks.length) * (100 / queue.length);
                  setTotalProgress(Math.round(baseProgress + chunkProgress));
              }
              setProcessingQueue(prev => prev.map(p => p.id === item.id ? { ...p, status: 'done', questionCount: fileTotalQuestions } : p));
          } catch (err: any) {
              setProcessingQueue(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error', error: err.message } : p));
          }
      }
      setTotalProgress(100);
      setIsProcessing(false);
  };

  const saveToDatabase = async () => {
      if (extractedQuestions.length === 0) return;
      setLoading(true);
      try {
          const batchSize = 50;
          for (let i = 0; i < extractedQuestions.length; i += batchSize) {
              const batch = extractedQuestions.slice(i, i + batchSize);
              const { error } = await supabase.from('qresidencia').insert(batch);
              if (error) throw error;
          }
          alert(`${extractedQuestions.length} questões salvas!`);
          setExtractedQuestions([]);
          setProcessingQueue([]);
          fetchLocalData();
          setActiveTab('browse');
      } catch (e: any) {
          alert("Erro ao salvar: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const removeExtractedQuestion = (idx: number) => {
      setExtractedQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleManualImageUpload = (idx: number) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                  const base64 = ev.target?.result as string;
                  setExtractedQuestions(prev => prev.map((q, i) => i === idx ? { ...q, image: base64 } : q));
              };
              reader.readAsDataURL(file);
          }
      };
      input.click();
  };

  const groupedQuestions = useMemo(() => {
      const filtered = questions.filter(q => {
          const matchesSearch = (q.statement || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (q.explanation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (q.subcategory || '').toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCat = filterCategoryBrowse === 'Todas' || q.category === filterCategoryBrowse;
          return matchesSearch && matchesCat;
      });
      const groups: Record<string, Record<string, Question[]>> = {};
      filtered.forEach(q => {
          const cat = q.category || 'Sem Categoria';
          const sub = q.subcategory || 'Geral';
          if (!groups[cat]) groups[cat] = {};
          if (!groups[cat][sub]) groups[cat][sub] = [];
          groups[cat][sub].push(q);
      });
      return Object.keys(groups).sort().map(cat => ({
          category: cat,
          total: Object.values(groups[cat]).reduce((acc, arr) => acc + arr.length, 0),
          subcategories: Object.keys(groups[cat]).sort().map(sub => ({ name: sub, questions: groups[cat][sub] }))
      }));
  }, [questions, searchTerm, filterCategoryBrowse]);

  const toggleCategory = (cat: string) => {
      setExpandedCategories(prev => {
          const next = new Set(prev);
          if (next.has(cat)) next.delete(cat); else next.add(cat);
          return next;
      });
  };

  const startPractice = () => {
      let filtered = questions;
      if (selectedCategory !== 'Todas') filtered = questions.filter(q => q.category === selectedCategory);
      if (filtered.length === 0) return alert("Sem questões disponíveis.");
      const sessionSet = [...filtered].sort(() => Math.random() - 0.5).slice(0, 20);
      setSessionQuestions(sessionSet);
      setCurrentQIndex(0);
      setSessionScore(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setPracticeState('active');
  };

  const handleAnswer = (altId: string) => {
      if (showExplanation) return;
      setSelectedAnswer(altId);
      setShowExplanation(true);
      if (sessionQuestions[currentQIndex].alternatives.find(a => a.id === altId)?.is_correct) {
          setSessionScore(prev => prev + 1);
          xpService.addXP(XP_VALUES.QUESTION_CORRECT, 'Questão Correta (Residência)');
      }
  };

  const nextQuestion = () => {
      if (currentQIndex < sessionQuestions.length - 1) {
          setCurrentQIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setShowExplanation(false);
      } else {
          setPracticeState('finished');
          xpService.addXP(XP_VALUES.SIMULATION_COMPLETE, `Treino Finalizado`);
      }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'pending': return <div className="w-4 h-4 rounded-full border-2 border-slate-300" />;
          case 'extracting': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
          case 'processing': return <Brain className="w-4 h-4 text-purple-500 animate-pulse" />;
          case 'done': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
          case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
          default: return <div className="w-4 h-4" />;
      }
  };

  return (
    <Layout title="Qbank Residência">
      <div className="h-full flex flex-col space-y-4 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-900 shrink-0 shadow-sm gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30"><GraduationCap className="h-6 w-6" /></div>
                <div>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Banco Residência Médica</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stats.total} Questões • {stats.categories} Áreas</p>
                </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('practice')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'practice' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Prática</button>
                <button onClick={() => setActiveTab('browse')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'browse' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Questões</button>
                <button onClick={() => setActiveTab('import')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'import' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Importar IA</button>
            </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'import' && (
                <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] shadow-sm animate-in fade-in overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {!isProcessing && extractedQuestions.length === 0 && (
                            <div className="text-center space-y-6 max-w-xl mx-auto mt-10">
                                <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-200 dark:border-zinc-800 rounded-[3rem] p-12 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
                                    <FileUp className="h-16 w-16 mx-auto mb-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Processamento Inteligente</h3>
                                    <p className="text-xs font-medium text-slate-500">Selecione até 5 arquivos para extração automática via chunking.</p>
                                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt,.json" multiple onChange={handleFileSelect} />
                                </div>
                            </div>
                        )}
                        {(isProcessing || processingQueue.length > 0) && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="flex justify-between items-end">
                                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">{isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />} Fila</h3>
                                    <span className="text-[10px] font-bold text-slate-400">{Math.round(totalProgress)}%</span>
                                </div>
                                {isProcessing && <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${totalProgress}%` }} /></div>}
                                <div className="space-y-3">
                                    {processingQueue.map(file => (
                                        <div key={file.id} className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">{getStatusIcon(file.status)}<div><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{file.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{file.status === 'processing' ? `Parte ${file.currentChunk}/${file.totalChunks}` : file.status}</p></div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {extractedQuestions.length > 0 && !isProcessing && (
                            <div className="mt-8 border-t border-slate-100 dark:border-zinc-900 pt-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Revisão Final ({extractedQuestions.length})</h3>
                                    <button onClick={saveToDatabase} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} SALVAR NO BANCO</button>
                                </div>
                                <div className="space-y-4">
                                    {extractedQuestions.map((q, idx) => (
                                        <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm group flex flex-col md:flex-row gap-6">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex justify-between items-start"><div className="flex items-center gap-2 flex-wrap"><span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">{q.category}</span></div><button onClick={() => removeExtractedQuestion(idx)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 className="h-4 w-4" /></button></div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 text-justify">{q.statement}</p>
                                                <div className="space-y-1 pl-2 border-l-2 border-slate-100 dark:border-zinc-800">{q.alternatives.map((alt: any, i: number) => (<p key={i} className={`text-[10px] ${alt.is_correct ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>{String.fromCharCode(65+i)}) {alt.text}</p>))}</div>
                                            </div>
                                            <div className="w-full md:w-1/3 shrink-0"><div className="aspect-square bg-slate-100 dark:bg-black rounded-2xl border-2 border-dashed flex items-center justify-center relative overflow-hidden group/img">{q.image ? <img src={q.image} className="w-full h-full object-contain" /> : <div className="text-center opacity-40"><ImagePlus className="h-8 w-8 mb-2" /><p className="text-[8px] font-black uppercase">Sem Imagem</p></div>}<button onClick={() => handleManualImageUpload(idx)} className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"><Edit3 className="h-6 w-6 mb-1" /><span className="text-[8px] font-black uppercase">Alterar</span></button></div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'browse' && (
                <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] shadow-sm animate-in fade-in overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row gap-4 shrink-0">
                        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" placeholder="Pesquisar questões..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-blue-500" /></div>
                        <div className="w-full md:w-64"><div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><select value={filterCategoryBrowse} onChange={e => setFilterCategoryBrowse(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-8 py-3 text-xs font-bold outline-none focus:border-blue-500 appearance-none"><option value="Todas">Todas Áreas</option>{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /></div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
                        {loading ? <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div> : groupedQuestions.length === 0 ? <div className="p-20 text-center opacity-30"><BookOpen className="h-12 w-12 mx-auto mb-3" /><p className="font-black text-xs uppercase">Nada encontrado</p></div> : (
                            groupedQuestions.map((group) => (
                                <div key={group.category} className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-black">
                                    <div onClick={() => toggleCategory(group.category)} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900 cursor-pointer hover:bg-slate-100 transition-colors"><div className="flex items-center gap-3"><FolderOpen className="h-5 w-5 text-blue-500" /><h3 className="font-black text-sm text-slate-800 dark:text-slate-200 uppercase">{group.category}</h3><span className="text-[9px] font-bold bg-slate-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full text-slate-500">{group.total}</span></div>{expandedCategories.has(group.category) ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}</div>
                                    {expandedCategories.has(group.category) && (
                                        <div className="p-2 bg-slate-50/30 dark:bg-zinc-900/30">{group.subcategories.map((sub) => (
                                                <div key={sub.name} className="mb-4 last:mb-0"><div className="px-4 py-2 flex items-center gap-2"><Layers className="h-3 w-3 text-slate-400" /><h4 className="text-[10px] font-black uppercase text-slate-500">{sub.name} ({sub.questions.length})</h4></div><div className="space-y-2 px-2">{sub.questions.map((q) => {
                                                            const isExpanded = expandedQuestionId === q.id;
                                                            return (<div key={q.id} className={`bg-white dark:bg-zinc-950 border border-slate-100 rounded-xl overflow-hidden ${isExpanded ? 'shadow-md border-blue-200' : 'hover:border-blue-200'}`}><div onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)} className="p-4 cursor-pointer flex gap-4"><div className={`mt-1 h-6 w-6 rounded-lg flex items-center justify-center font-black text-[9px] shrink-0 ${q.difficulty === 'Fácil' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{q.difficulty?.[0] || 'M'}</div><div className="flex-1"><p className={`text-xs font-bold leading-relaxed text-slate-700 dark:text-slate-200 text-justify ${isExpanded ? '' : 'line-clamp-2'}`}>{q.statement}</p></div></div>{isExpanded && (<div className="px-4 pb-4 pt-0 bg-slate-50/50 dark:bg-black/20"><div className="mt-4 space-y-2 border-t pt-4">{q.alternatives.map((alt, idx) => (<div key={alt.id} className={`p-3 rounded-lg text-[11px] font-medium border flex items-start gap-3 ${alt.is_correct ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-500'}`}><span className={`w-5 h-5 rounded flex items-center justify-center font-black text-[9px] shrink-0 ${alt.is_correct ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{String.fromCharCode(65+idx)}</span><span>{alt.text}</span></div>))}</div>{q.explanation && <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl"><p className="text-[9px] font-black uppercase text-blue-600 mb-1">Comentário</p><p className="text-[10px] text-slate-600 leading-relaxed italic text-justify">{q.explanation}</p></div>}</div>)}</div>);
                                                        })}</div></div>
                                            ))}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'practice' && (
                <div className="h-full flex flex-col">
                    {practiceState === 'setup' && (
                        <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-8 shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in">
                            <div className="bg-blue-100 dark:bg-blue-900/20 p-8 rounded-full mb-6 text-blue-600"><BookOpen className="h-16 w-16" /></div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Simulado Residência</h2>
                            <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed font-medium">Ciclo rápido de 20 questões de alto nível.</p>
                            <div className="w-full max-w-sm space-y-4">
                                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-black border-2 text-sm font-bold outline-none focus:border-blue-500"><option value="Todas">Mix Geral (Todas)</option>{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                <button onClick={startPractice} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-2"><Play className="h-4 w-4" /> INICIAR TREINO</button>
                            </div>
                        </div>
                    )}
                    {practiceState === 'active' && sessionQuestions.length > 0 && (
                        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] overflow-hidden shadow-sm animate-in zoom-in-95">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50"><span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border">{sessionQuestions[currentQIndex].category}</span><span className="text-xs font-black text-slate-400">Questão {currentQIndex + 1} de {sessionQuestions.length}</span></div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-8"><p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed text-justify">{sessionQuestions[currentQIndex].statement}</p>
                                <div className="space-y-3">{sessionQuestions[currentQIndex].alternatives.map((alt, idx) => {
                                        const isSelected = selectedAnswer === alt.id;
                                        const isCorrect = alt.is_correct;
                                        let style = "border-slate-200 hover:border-blue-300 bg-white dark:bg-zinc-900";
                                        if (showExplanation) {
                                            if (isCorrect) style = "bg-emerald-100 border-emerald-500 text-emerald-800";
                                            else if (isSelected) style = "bg-red-100 border-red-500 text-red-800";
                                            else style = "opacity-50 border-slate-200";
                                        } else if (isSelected) style = "bg-blue-50 border-blue-500 text-blue-800";
                                        return (<button key={alt.id} onClick={() => handleAnswer(alt.id)} disabled={showExplanation} className={`w-full text-left p-5 rounded-2xl border-2 text-sm font-medium transition-all flex items-start gap-4 ${style}`}><span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${showExplanation && isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{String.fromCharCode(65+idx)}</span>{alt.text}</button>);
                                    })}</div>
                                {showExplanation && (<div className="bg-slate-50 dark:bg-black p-6 rounded-3xl border-l-4 border-blue-500 animate-in fade-in"><h4 className="text-[10px] font-black uppercase text-blue-600 mb-3 flex items-center gap-2"><Brain className="h-4 w-4" /> Comentário</h4><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-justify">{sessionQuestions[currentQIndex].explanation}</p></div>)}
                            </div>
                            <div className="p-6 border-t flex justify-end bg-white/50 dark:bg-zinc-950/50"><button onClick={nextQuestion} disabled={!showExplanation} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl disabled:opacity-50 flex items-center gap-2">Próxima <ChevronRight className="h-4 w-4" /></button></div>
                        </div>
                    )}
                    {practiceState === 'finished' && (
                        <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-8 shadow-sm flex flex-col items-center justify-center text-center animate-in zoom-in-95"><div className="bg-emerald-100 p-8 rounded-full mb-6 text-emerald-600 shadow-lg"><CheckCircle2 className="h-16 w-16" /></div><h2 className="text-3xl font-black mb-2">Simulado Concluído</h2><div className="flex items-baseline gap-2 my-6"><span className="text-7xl font-black text-blue-600">{Math.round((sessionScore / sessionQuestions.length) * 100)}%</span><span className="text-sm font-bold text-slate-400 uppercase">Acurácia</span></div><div className="flex gap-4"><button onClick={() => setPracticeState('setup')} className="px-8 py-4 rounded-2xl border-2 font-black text-[10px] uppercase">Voltar</button><button onClick={startPractice} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl"><RefreshCw className="h-4 w-4" /> Novo Treino</button></div></div>
                    )}
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
};
