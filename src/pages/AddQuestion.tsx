
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Plus, Upload, Sparkles, Save, X, Loader2, ImagePlus, 
  Send, Bot, FileText, CheckCircle2, MessageSquare,
  ChevronRight, Brain, Trash2, List, FileUp, Folder,
  Edit3
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { processFileQuestions, generateQuestionsFromPrompt } from '../services/ai';
import { AIImportedQuestion, Difficulty } from '../types';
import { syncEngine } from '../services/syncEngine';
import { storageService } from '../services/storage';
import mammoth from 'mammoth';

const normalizeDifficulty = (d: string): Difficulty => {
  const val = (d || '').toLowerCase();
  if (val.includes('fác') || val.includes('easy')) return 'Fácil';
  if (val.includes('méd') || val.includes('medium') || val.includes('inter')) return 'Médio';
  if (val.includes('dif') || val.includes('hard') || val.includes('difí')) return 'Difícil';
  return 'Médio';
};

export const AddQuestion: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'manual' | 'import' | 'chat'>('manual');
  const [isLoading, setIsLoading] = useState(false);

  // --- MANUAL STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
      bank_name: 'Geral', 
      category: '', 
      subcategory: '', 
      difficulty: 'Médio' as Difficulty, 
      statement: '', 
      explanation: '' 
  });
  
  const [alternatives, setAlternatives] = useState([
    { id: '1', text: '', is_correct: true },
    { id: '2', text: '', is_correct: false },
    { id: '3', text: '', is_correct: false },
    { id: '4', text: '', is_correct: false },
    { id: '5', text: '', is_correct: false },
  ]);
  const [manualImage, setManualImage] = useState<File | null>(null);
  const [manualPreview, setManualPreview] = useState('');
  const manualImageInputRef = useRef<HTMLInputElement>(null);

  // --- IMPORT STATE ---
  const [file, setFile] = useState<File | null>(null);
  const [aiInstructions, setAiInstructions] = useState('');
  const [previewItems, setPreviewItems] = useState<AIImportedQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'bot', text: string }[]>([]);

  // Carregar dados se for edição
  useEffect(() => {
    if (location.state && location.state.question) {
        const q = location.state.question;
        setEditingId(q.id);
        setFormData({
            bank_name: q.bank_name || 'Geral',
            category: q.category || '',
            subcategory: q.subcategory || '',
            difficulty: q.difficulty || 'Médio',
            statement: q.statement || '',
            explanation: q.explanation || ''
        });
        
        if (q.alternatives && q.alternatives.length > 0) {
            // Garante que ids sejam strings para evitar problemas de key no map
            const mappedAlts = q.alternatives.map((alt: any, idx: number) => ({
                id: alt.id || idx.toString(),
                text: alt.text || '',
                is_correct: !!alt.is_correct
            }));
            // Se tiver menos de 5, preenche com vazias
            while (mappedAlts.length < 5) {
                mappedAlts.push({ id: crypto.randomUUID(), text: '', is_correct: false });
            }
            setAlternatives(mappedAlts);
        }

        if (q.statement_image_url) {
            setManualPreview(q.statement_image_url);
        }
    }
  }, [location.state]);

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.statement) return;
    setIsLoading(true);
    try {
      let finalUrl = manualPreview; // Mantém a URL antiga se não houver nova imagem

      // Se o usuário selecionou um arquivo novo, faz upload
      if (manualImage) {
          finalUrl = await storageService.uploadImage(manualImage, 'questions');
      }

      const payload = {
        id: editingId || crypto.randomUUID(), // Usa ID existente se editando
        bank_name: formData.bank_name || 'Geral',
        category: formData.category || 'Geral',
        subcategory: formData.subcategory || '',
        difficulty: normalizeDifficulty(formData.difficulty),
        statement: formData.statement,
        explanation: formData.explanation,
        statement_image_url: finalUrl,
        alternatives: alternatives.map(a => ({ ...a, id: a.id || crypto.randomUUID() })),
        created_by: user.id,
        created_at: editingId ? (location.state.question.created_at || new Date().toISOString()) : new Date().toISOString(),
        tags: []
      };

      // Se editando, a ação é update implícito pelo upsert do syncEngine com mesmo ID
      await syncEngine.enqueue('questions', payload);
      navigate('/questions');
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally { setIsLoading(false); }
  };

  const handleProcessFile = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      let content = "";
      if (file.name.endsWith('.pdf')) {
        content = await new Promise((res) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => res((reader.result as string).split(',')[1]);
        });
      } else if (file.name.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer: buffer });
        content = res.value;
      } else { content = await file.text(); }
      const questions = await processFileQuestions(content, aiInstructions);
      setPreviewItems(questions);
      setShowPreview(true);
    } catch (err) { alert("Falha no processamento inteligente."); } finally { setIsLoading(false); }
  };

  const handleChatGenerate = async () => {
    if (!chatInput.trim() || isLoading) return;
    setIsLoading(true);
    const prompt = chatInput;
    setChatLog(prev => [...prev, { role: 'user', text: prompt }]);
    setChatInput('');
    try {
      const questions = await generateQuestionsFromPrompt(prompt);
      setPreviewItems(questions);
      setShowPreview(true);
    } catch (err) { setChatLog(prev => [...prev, { role: 'bot', text: "Erro ao gerar." }]); } finally { setIsLoading(false); }
  };

  return (
    <Layout title={editingId ? "Editar Questão" : "Adicionar Item"}>
      <div className="h-full flex flex-col space-y-4 overflow-hidden">
        
        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-900 w-fit shrink-0">
          <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}><Edit3 className="h-3.5 w-3.5 mr-2" /> Editor</button>
          <button onClick={() => setActiveTab('import')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center transition-all ${activeTab === 'import' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}><FileUp className="h-3.5 w-3.5 mr-2" /> Importar</button>
          <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center transition-all ${activeTab === 'chat' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}><Sparkles className="h-3.5 w-3.5 mr-2" /> NeuroChat</button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'manual' && (
                <form onSubmit={handleManualSave} className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[1.5rem] shadow-sm p-5 md:p-6 overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-7 space-y-6">
                                <div>
                                    <label className="text-[9px] text-slate-400 uppercase font-black mb-2 block tracking-widest">Enunciado Médico</label>
                                    <textarea value={formData.statement} onChange={e => setFormData({...formData, statement: e.target.value})} rows={6} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-xs font-bold shadow-inner" required placeholder="Caso clínico ou pergunta..." />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 uppercase font-black mb-2 block tracking-widest">Alternativas</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {alternatives.map((alt, idx) => (
                                            <div key={idx} className="relative group">
                                                <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] ${alt.is_correct ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>{String.fromCharCode(65+idx)}</span>
                                                <input type="text" value={alt.text} onChange={e => {
                                                    const n = [...alternatives]; n[idx].text = e.target.value; setAlternatives(n);
                                                }} className={`w-full pl-11 pr-10 py-3 rounded-xl border-2 text-[11px] font-bold ${alt.is_correct ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-zinc-900 bg-white dark:bg-black'}`} required />
                                                <button type="button" onClick={() => setAlternatives(alternatives.map((a, i) => ({ ...a, is_correct: i === idx })))} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 ${alt.is_correct ? 'text-primary' : 'text-slate-200'}`}><CheckCircle2 className="h-5 w-5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-5 space-y-6">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                                    <label className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block mb-2 flex items-center gap-1"><Folder className="h-3 w-3" /> Banco de Questões</label>
                                    <input type="text" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} className="w-full bg-white dark:bg-black border border-indigo-200 dark:border-indigo-800 p-2.5 rounded-lg text-[10px] font-black" placeholder="Ex: Residência 2024" />
                                </div>

                                <div>
                                    <label className="text-[9px] text-slate-400 uppercase font-black mb-2 block tracking-widest">Vincular Mídia</label>
                                    <div 
                                        onClick={() => manualImageInputRef.current?.click()} 
                                        className="border-2 border-dashed border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 rounded-2xl min-h-[160px] flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all relative overflow-hidden group"
                                    >
                                        <input type="file" ref={manualImageInputRef} className="hidden" accept="image/*" onChange={e => {
                                            const f = e.target.files?.[0]; if(f) { setManualImage(f); setManualPreview(URL.createObjectURL(f)); }
                                        }} />
                                        {manualPreview ? (
                                            <>
                                                <img src={manualPreview} className="w-full h-full object-contain absolute inset-0 bg-black/5 dark:bg-black/50" />
                                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[8px] px-2 py-1 rounded">Clique para alterar</div>
                                            </>
                                        ) : (
                                            <div className="text-center opacity-30 p-4">
                                                <ImagePlus className="h-8 w-8 mx-auto mb-1" />
                                                <p className="text-[8px] font-black uppercase">Anexar Exame (Qualquer Formato)</p>
                                            </div>
                                        )}
                                    </div>
                                    {manualPreview && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setManualImage(null); setManualPreview(''); }}
                                            className="mt-2 text-[9px] font-bold text-red-500 hover:underline flex items-center gap-1"
                                        >
                                            <X className="h-3 w-3" /> Remover Imagem
                                        </button>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Especialidade</label><input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-[9px] font-black" /></div>
                                        <div><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dificuldade</label><select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value as any})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-[9px] font-black appearance-none"><option>Fácil</option><option>Médio</option><option>Difícil</option></select></div>
                                    </div>
                                    <div><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Comentário Técnico</label><textarea value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} rows={3} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-[10px] font-bold" /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-zinc-900 flex justify-end shrink-0">
                        <button type="submit" disabled={isLoading} className="bg-primary text-white px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editingId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR ITEM'}
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'import' && (
                <div className="h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[1.5rem] p-8 flex flex-col items-center justify-center animate-in fade-in">
                    <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 rounded-[2rem] p-12 w-full max-w-xl text-center cursor-pointer hover:border-primary transition-all shadow-inner">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} />
                        <FileUp className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white">{file ? file.name : 'Selecionar Documento'}</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-2">Formatos aceitos: PDF, Word e TXT</p>
                        {file && <button onClick={handleProcessFile} disabled={isLoading} className="mt-6 bg-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg mx-auto flex items-center gap-2">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} PROCESSAR AGORA</button>}
                    </div>
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[1.5rem] shadow-sm overflow-hidden animate-in fade-in">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-900 flex items-center gap-3 shrink-0">
                        <Bot className="h-4 w-4 text-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Arquiteto de Itens IA</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        {chatLog.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-30 text-center"><Bot className="h-10 w-10 mb-2" /><p className="text-[9px] font-bold uppercase tracking-widest">"Crie 10 questões sobre antibioticoterapia..."</p></div>}
                        {chatLog.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-xl text-[11px] font-bold leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-zinc-900 border'}`}>{m.text}</div></div>
                        ))}
                        {isLoading && <div className="flex items-center gap-3 text-emerald-500 animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /><span className="text-[8px] font-black uppercase">IA Elaborando...</span></div>}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-900 shrink-0">
                        <div className="relative flex items-center">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatGenerate()} placeholder="O que deseja gerar?" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-3 pr-12 rounded-xl text-[11px] font-bold outline-none" />
                            <button onClick={handleChatGenerate} className="absolute right-2 p-2 bg-primary text-white rounded-lg shadow-md transition-all active:scale-90"><Send className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>

      </div>
    </Layout>
  );
};
