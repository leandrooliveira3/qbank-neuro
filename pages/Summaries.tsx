import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';
import { Summary, DidacticMaterial, Question } from '../types';
import { supabase } from '../services/supabase';
import { summarizeContent, generateQuestionsFromPrompt } from '../services/ai';
import { useNavigate } from 'react-router';
import { 
  Plus, Search, Edit2, Trash2, Save, X, Loader2, 
  FileText, BookOpen, Filter, Download,
  Terminal, RefreshCw, Sparkles, FolderOpen,
  Calendar, Brain, ChevronRight, ChevronDown,
  Folder, File as FileIcon
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configuração do Worker do PDF.js
if (typeof window !== 'undefined') {
    const version = '5.4.530';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

// --- TREE STRUCTURE TYPES ---
interface FileNode {
  type: 'file';
  data: DidacticMaterial;
  id: string;
  name: string;
}

interface FolderNode {
  type: 'folder';
  id: string;
  name: string;
  children: (FolderNode | FileNode)[];
  isOpen: boolean;
}

export const Summaries: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my_summaries' | 'materials'>('my_summaries');
  
  // State for Summaries
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSummary, setEditingSummary] = useState<Summary | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ title: '', category: '', content: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingQuizId, setGeneratingQuizId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Materials (Tree)
  const [folderStructure, setFolderStructure] = useState<(FolderNode | FileNode)[]>([]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const isMasterAdmin = user?.role === 'admin' || user?.email === 'steamleandro@hotmail.com';

  useEffect(() => {
    loadData();
    window.addEventListener('neuro_sync_completed', loadData);
    return () => window.removeEventListener('neuro_sync_completed', loadData);
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
        if (activeTab === 'my_summaries') {
            const data = await localDB.getAll('summaries');
            setSummaries(data.filter(s => s.user_id === user.id).sort((a,b) => new Date(b.last_edited).getTime() - new Date(a.last_edited).getTime()));
        } else {
            // Materials Sync & Tree Build
            let mats: DidacticMaterial[] = [];
            if (navigator.onLine) {
                 const { data: remote } = await supabase.from('didactic_materials').select('*');
                 if (remote) {
                     await localDB.bulkPut('didactic_materials', remote);
                     mats = remote;
                 }
            } else {
                mats = await localDB.getAll('didactic_materials');
            }
            const structure = buildStructure(mats);
            setFolderStructure(structure);
        }
    } finally {
        setLoading(false);
    }
  };

  // --- TREE LOGIC ---

  const buildStructure = (items: DidacticMaterial[]) => {
      const root: (FolderNode | FileNode)[] = [];
      
      const findOrCreateFolder = (parentList: (FolderNode | FileNode)[], name: string, idPath: string): FolderNode => {
          let folder = parentList.find(n => n.type === 'folder' && n.name === name) as FolderNode;
          if (!folder) {
              folder = { type: 'folder', name, children: [], isOpen: false, id: idPath };
              parentList.push(folder);
          }
          return folder;
      };

      items.forEach(item => {
          const rawPath = item.drive_path || 'Geral';
          const pathParts = rawPath.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
          let currentLevel = root;
          let currentPath = '';

          pathParts.forEach((part) => {
              currentPath += (currentPath ? '/' : '') + part;
              const folder = findOrCreateFolder(currentLevel, part, currentPath);
              currentLevel = folder.children;
          });

          currentLevel.push({ type: 'file', name: item.title, data: item, id: item.id });
      });

      // Sort: Folders first, then files, alphabetical
      const sortNodes = (nodes: (FolderNode | FileNode)[]) => {
          nodes.sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name, undefined, { numeric: true });
              return a.type === 'folder' ? -1 : 1;
          });
          nodes.forEach(node => { if (node.type === 'folder') sortNodes(node.children); });
      };

      sortNodes(root);
      
      // Open root folder by default if exists
      if (root.length > 0 && root[0].type === 'folder') {
          setOpenFolders(new Set([root[0].id]));
      }
      
      return root;
  };

  const toggleFolder = (folderId: string) => {
      setOpenFolders(prev => {
          const next = new Set(prev);
          if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
          return next;
      });
  };

  const renderTree = (nodes: (FolderNode | FileNode)[]) => {
      const filteredNodes = nodes; 

      return filteredNodes.map(node => {
          if (node.type === 'file') {
              return (
                  <div key={node.id} className="flex items-center justify-between p-3 ml-2 mb-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-zinc-800">
                      <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-500">
                              <FileIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{node.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">{(node.data.size_bytes / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <a 
                              href={node.data.download_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                              title="Baixar Arquivo"
                          >
                              <Download className="h-4 w-4" />
                          </a>
                      </div>
                  </div>
              );
          } else {
              const isOpen = openFolders.has(node.id);
              return (
                  <div key={node.id} className="mb-1">
                      <div 
                          onClick={() => toggleFolder(node.id)} 
                          className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors select-none ${isOpen ? 'bg-slate-50 dark:bg-zinc-900/50' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/30'}`}
                      >
                          {isOpen ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                          <div className={`p-1.5 rounded-lg ${isOpen ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                              {isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{node.name}</span>
                      </div>
                      
                      {isOpen && (
                          <div className="ml-4 pl-2 border-l border-slate-200 dark:border-zinc-800 mt-1">
                              {renderTree(node.children)}
                          </div>
                      )}
                  </div>
              );
          }
      });
  };

  // --- CRUD SUMMARIES ---

  const handleOpenEditor = (summary?: Summary) => {
      if (summary) {
          setEditingSummary(summary);
          setFormData({ title: summary.title, category: summary.category, content: summary.content });
      } else {
          setEditingSummary(null);
          setFormData({ title: '', category: '', content: '' });
      }
      setIsEditing(true);
  };

  const handleSaveSummary = async () => {
      if (!user || !formData.title || !formData.content) return;
      const now = new Date().toISOString();
      const s: Summary = editingSummary ? { ...editingSummary, ...formData, last_edited: now, updated_at: now } : {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: formData.title,
          category: formData.category || 'Geral',
          content: formData.content,
          last_edited: now,
          updated_at: now
      };
      await syncEngine.enqueue('summaries', s);
      setSummaries(prev => editingSummary ? prev.map(item => item.id === s.id ? s : item) : [s, ...prev]);
      setIsEditing(false);
  };

  const handleDeleteSummary = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Excluir este resumo?")) {
          await syncEngine.enqueue('summaries', { id }, 'delete');
          setSummaries(prev => prev.filter(s => s.id !== id));
          if (editingSummary?.id === id) setIsEditing(false);
      }
  };

  // --- AI GENERATION LOGIC ---

  const extractTextFromFile = async (file: File): Promise<string> => {
      if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          const maxPages = Math.min(pdf.numPages, 20); // Limit pages for summary/quiz
          
          for (let i = 1; i <= maxPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
          }
          return fullText;
      } else if (file.name.endsWith('.docx') || file.type.includes('word')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          return result.value;
      } else {
          return await file.text();
      }
  };

  const handleFileSelectForAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsGenerating(true);
      try {
          const text = await extractTextFromFile(file);
          if (!text.trim()) throw new Error("Não foi possível ler o texto do arquivo.");
          if (!formData.title) setFormData(prev => ({...prev, title: file.name.split('.')[0]}));
          const summaryText = await summarizeContent(text);
          setFormData(prev => ({ 
              ...prev, 
              content: prev.content ? prev.content + "\n\n---\n\n" + summaryText : summaryText 
          }));
      } catch (err: any) {
          alert("Erro ao gerar resumo: " + err.message);
      } finally {
          setIsGenerating(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  // Used only for summary-based generation, not file-based
  const generateAndNavigateQuiz = async (text: string, title: string) => {
      if (!user) return;
      const prompt = `Crie 10 questões de múltipla escolha sobre o seguinte texto. Nível Residência Médica. Retorne JSON.\n\nTEXTO: ${text.substring(0, 15000)}`;
      const aiQuestions = await generateQuestionsFromPrompt(prompt);
      
      const dbItems: Question[] = aiQuestions.map((q, idx) => {
          const gabaritoText = String(q.gabarito || 'A').trim();
          let finalChar = 'A';
          const exactMatch = gabaritoText.match(/^([A-E])$/i);
          if (exactMatch) {
              finalChar = exactMatch[1].toUpperCase();
          } else {
              const fallbackMatch = gabaritoText.match(/\b([A-E])\b/i) || gabaritoText.match(/([A-E])/i);
              finalChar = fallbackMatch ? fallbackMatch[1].toUpperCase() : 'A';
          }
          const correctChar = finalChar;
          
          return {
              id: crypto.randomUUID(), bank_name: 'Quiz Automático', category: q.categoria || 'Geral',
              subcategory: title, difficulty: 'Médio', statement: q.enunciado, explanation: q.comentario || '',
              alternatives: (q.alternativas || []).map((t, aidx) => ({ id: crypto.randomUUID(), text: t, is_correct: String.fromCharCode(65 + aidx) === correctChar })),
              created_by: user.id, created_at: new Date().toISOString(), tags: []
          };
      });

      const config = { 
          simulationName: `Quiz: ${title}`, 
          questionLimit: dbItems.length, 
          selectedBank: 'Quiz Automático', 
          practiceMode: 'all',
          isSimulation: true 
      };
      
      navigate('/practice/session', { state: { questions: dbItems, config } });
  };

  const handleGenerateFromSummary = async (summary: Summary, e: React.MouseEvent) => {
      e.stopPropagation();
      if (generatingQuizId) return;
      setGeneratingQuizId(summary.id);
      try {
          await generateAndNavigateQuiz(summary.content, summary.title);
      } catch (e: any) {
          alert("Erro ao gerar quiz: " + e.message);
      } finally {
          setGeneratingQuizId(null);
      }
  };

  // --- DRIVE SYNC LOGIC ---

  const handleSyncMaterials = async () => {
      if (!isMasterAdmin || syncingDrive) return;
      setSyncingDrive(true);
      setShowLogs(true);
      setSyncLogs(["🚀 Iniciando Sincronização de Materiais..."]);

      let pageToken = null;
      let keepSyncing = true;
      let batch = 1;

      try {
          while(keepSyncing) {
              setSyncLogs(prev => [...prev, `\n--- Lote ${batch} ---`]);
              const { data, error } = await supabase.functions.invoke('sync-drive-videos', {
                  body: { pageToken, mode: 'materials' }
              });

              if (error) throw error;

              if (data?.logs) setSyncLogs(prev => [...prev, ...data.logs]);
              pageToken = data?.nextPageToken;
              
              if (!pageToken) keepSyncing = false;
              else batch++;
          }
          setSyncLogs(prev => [...prev, "🏁 Sincronização Finalizada."]);
          loadData();
      } catch (e: any) {
          setSyncLogs(prev => [...prev, `❌ Erro: ${e.message}`]);
      } finally {
          setSyncingDrive(false);
      }
  };

  const filteredSummaries = useMemo(() => {
      return summaries.filter(s => 
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          s.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [summaries, searchTerm]);

  return (
    <Layout title="Biblioteca de Estudos" fullWidth>
        <div className="h-full flex flex-col space-y-6 p-6 overflow-hidden">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-900 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-2xl text-purple-600">
                        <BookOpen className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Central de Conhecimento</h1>
                        <div className="flex gap-4 mt-2">
                            <button onClick={() => setActiveTab('my_summaries')} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all ${activeTab === 'my_summaries' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900'}`}>Meus Resumos</button>
                            <button onClick={() => setActiveTab('materials')} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all ${activeTab === 'materials' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900'}`}>Materiais Drive</button>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            placeholder="Pesquisar..." 
                            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-primary transition-all" 
                        />
                    </div>
                    
                    {activeTab === 'my_summaries' ? (
                        <button onClick={() => handleOpenEditor()} className="bg-primary hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
                            <Plus className="h-4 w-4" /> Novo Resumo
                        </button>
                    ) : (
                        isMasterAdmin && (
                            <button onClick={handleSyncMaterials} disabled={syncingDrive} className="bg-purple-600 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
                                {syncingDrive ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync Drive
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1">
                
                {/* --- TAB: MEUS RESUMOS (WIDGETS) --- */}
                {activeTab === 'my_summaries' && (
                    <>
                        {loading ? (
                            <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                        ) : filteredSummaries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                <FileText className="h-16 w-16 mb-4 text-slate-300" />
                                <p className="font-black text-sm uppercase tracking-widest text-slate-400">Nenhum resumo encontrado</p>
                                <button onClick={() => handleOpenEditor()} className="mt-4 text-[10px] font-bold text-primary hover:underline uppercase">Criar o primeiro</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredSummaries.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => handleOpenEditor(s)} 
                                        className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[1.5rem] p-5 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col h-64 relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-3 relative z-10">
                                            <div className="p-2 bg-slate-100 dark:bg-zinc-900 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={(e) => handleGenerateFromSummary(s, e)} disabled={generatingQuizId === s.id} className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="Gerar Quiz">
                                                    {generatingQuizId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                                                </button>
                                                <button onClick={(e) => handleDeleteSummary(s.id, e)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <h3 className="font-black text-sm text-slate-900 dark:text-white mb-1 line-clamp-2 leading-tight">{s.title}</h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[8px] font-bold bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-slate-500 uppercase">{s.category}</span>
                                            <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {new Date(s.last_edited).toLocaleDateString()}</span>
                                        </div>
                                        
                                        <div className="flex-1 overflow-hidden relative">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-5 font-medium">
                                                {s.content}
                                            </p>
                                            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* --- TAB: MATERIAIS (TREE) --- */}
                {activeTab === 'materials' && (
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm min-h-[400px]">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" /> Estrutura do Drive
                        </h3>
                        
                        {loading ? (
                            <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-purple-600" /></div>
                        ) : folderStructure.length === 0 ? (
                            <div className="p-20 text-center opacity-40">
                                <FolderOpen className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                <p className="font-black text-xs uppercase">Nenhum material encontrado</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {renderTree(folderStructure)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- MODAL CREATE/EDIT SUMMARY --- */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl h-[85vh] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-zinc-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary"><Edit2 className="h-5 w-5" /></div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{editingSummary ? 'Editar Resumo' : 'Novo Resumo'}</h2>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 flex flex-col p-6 overflow-hidden">
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest ml-1">Título do Resumo</label>
                                    <input 
                                        value={formData.title} 
                                        onChange={e => setFormData({...formData, title: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all" 
                                        placeholder="Ex: Fisiopatologia da Enxaqueca"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest ml-1">Categoria</label>
                                    <input 
                                        value={formData.category} 
                                        onChange={e => setFormData({...formData, category: e.target.value})} 
                                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all" 
                                        placeholder="Geral"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 relative flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Conteúdo (Markdown Suportado)</label>
                                    
                                    {/* AI BUTTON */}
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => fileInputRef.current?.click()} 
                                            disabled={isGenerating}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} 
                                            {isGenerating ? 'Gerando...' : 'Resumir PDF (IA)'}
                                        </button>
                                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileSelectForAI} />
                                    </div>
                                </div>
                                
                                <textarea 
                                    value={formData.content} 
                                    onChange={e => setFormData({...formData, content: e.target.value})} 
                                    className="flex-1 w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-xs font-medium leading-relaxed outline-none focus:border-primary transition-all resize-none custom-scrollbar" 
                                    placeholder="Comece a escrever ou use a IA para importar de um arquivo..."
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all">Cancelar</button>
                            <button onClick={handleSaveSummary} className="bg-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2">
                                <Save className="h-4 w-4" /> Salvar Resumo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync Logs Overlay */}
            {showLogs && (
                <div className="absolute inset-0 bg-black/90 z-[150] flex flex-col animate-in fade-in">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                        <div className="flex items-center gap-3">
                            <Terminal className="h-5 w-5 text-emerald-500" />
                            <h3 className="text-xs font-mono font-bold text-emerald-500">SYNC_LOGS (Materials)</h3>
                        </div>
                        {!syncingDrive && (
                            <button onClick={() => setShowLogs(false)} className="p-1 text-slate-500 hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1 text-slate-300 custom-scrollbar">
                        {(syncLogs || []).map((log, i) => (
                            <div key={i} className={`break-all ${log.includes('ERRO') || log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : ''}`}>
                                {log}
                            </div>
                        ))}
                        {syncingDrive && (
                            <div className="text-emerald-500 animate-pulse">_processando... (não feche esta janela)</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </Layout>
  );
};