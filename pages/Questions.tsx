
import React, { useEffect, useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { 
  Filter, Check, Loader2, BookOpen, Search, Trash2, 
  CheckSquare, Square, FilterX, XCircle, Folder, GraduationCap, Edit3
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Question } from '../types';
import { syncEngine } from '../services/syncEngine';
import { localDB } from '../services/localDB';
import { SmartImage } from '../components/SmartImage';
import { useNavigate } from 'react-router';

export const Questions: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('Todas');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterSubcategory, setFilterSubcategory] = useState('Todas');
  const [filterBank, setFilterBank] = useState('Todos'); 
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isMasterAdmin = user?.role === 'admin' || user?.email === 'steamleandro@hotmail.com';

  useEffect(() => { 
    if (user) loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    const local = await localDB.getAll('questions');
    const filtered = local.filter(q => q.created_by === user?.id);
    setQuestions(filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setLoading(false);
    
    if (navigator.onLine) {
      await syncEngine.startSync(true);
      const updated = await localDB.getAll('questions');
      setQuestions(updated.filter(q => q.created_by === user?.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }
  };

  const availableBanks = useMemo(() => {
      const banks = new Set(questions.map(q => q.bank_name || 'Geral').filter(Boolean));
      return Array.from(banks).sort();
  }, [questions]);

  const availableCategories = useMemo(() => {
    let relevant = questions;
    if (filterBank !== 'Todos') relevant = relevant.filter(q => (q.bank_name || 'Geral') === filterBank);
    const cats = new Set(relevant.map(q => q?.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [questions, filterBank]);

  const availableSubcategories = useMemo(() => {
    let relevantQuestions = questions;
    if (filterBank !== 'Todos') relevantQuestions = relevantQuestions.filter(q => (q.bank_name || 'Geral') === filterBank);
    if (filterCategory !== 'Todas') relevantQuestions = relevantQuestions.filter(q => q.category === filterCategory);
    
    const subs = new Set(relevantQuestions.map(q => q.subcategory).filter(Boolean));
    return Array.from(subs).sort();
  }, [questions, filterCategory, filterBank]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
        const text = ((q.statement || '') + (q.category || '') + (q.subcategory || '')).toLowerCase();
        const matchesSearch = text.includes(searchTerm.toLowerCase());
        const matchesDiff = filterDifficulty === 'Todas' || q.difficulty === filterDifficulty;
        const matchesCat = filterCategory === 'Todas' || q.category === filterCategory;
        const matchesSub = filterSubcategory === 'Todas' || q.subcategory === filterSubcategory;
        const matchesBank = filterBank === 'Todos' || (q.bank_name || 'Geral') === filterBank;
        return matchesSearch && matchesDiff && matchesCat && matchesSub && matchesBank;
    });
  }, [questions, searchTerm, filterDifficulty, filterCategory, filterSubcategory, filterBank]);

  const clearFilters = () => {
      setSearchTerm('');
      setFilterDifficulty('Todas');
      setFilterCategory('Todas');
      setFilterSubcategory('Todas');
      setFilterBank('Todos');
  };

  const hasActiveFilters = searchTerm !== '' || filterDifficulty !== 'Todas' || filterCategory !== 'Todas' || filterSubcategory !== 'Todas' || filterBank !== 'Todos';

  const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const qToDelete = questions.find(q => q.id === id);
    if (!qToDelete || !confirm("Excluir esta questão permanentemente?")) return;
    
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (expandedId === id) setExpandedId(null);
    
    try {
      await syncEngine.enqueue('questions', qToDelete, 'delete');
    } catch (err) {
      loadData();
    }
  };

  const handleDeleteBatch = async () => {
    const ids: string[] = Array.from(selectedIds);
    if (!ids.length || !confirm(`Excluir ${ids.length} itens selecionados?`)) return;
    
    const itemsToDelete = questions.filter(q => selectedIds.has(q.id));
    const idSet = new Set(ids);
    
    setQuestions(prev => prev.filter(q => !idSet.has(q.id)));
    setSelectedIds(new Set());
    if (expandedId && idSet.has(expandedId)) setExpandedId(null);
    
    try {
      await syncEngine.bulkDelete('questions', itemsToDelete);
    } catch (err) {
      loadData();
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleEdit = (q: Question, e: React.MouseEvent) => {
      e.stopPropagation();
      navigate('/add', { state: { question: q } });
  };

  return (
    <Layout title="Acervo Pessoal">
      <div className="h-full flex flex-col space-y-4 overflow-hidden w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-zinc-900 pb-4 shrink-0">
           <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tighter">Minhas Questões</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center mt-1">
                  {questions.length} Questões Registradas
              </p>
           </div>
           <div className="flex gap-2 w-full md:w-auto flex-wrap">
                {isMasterAdmin && (
                    <button onClick={() => navigate('/residencia')} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95">
                        <GraduationCap className="h-4 w-4 mr-2" /> Qbank Residência
                    </button>
                )}

                <button onClick={() => setSelectedIds(selectedIds.size === filteredQuestions.length ? new Set() : new Set(filteredQuestions.map(q => q.id)))} className="flex-1 md:flex-none px-4 py-2 rounded-xl text-[9px] font-black border-2 bg-white dark:bg-zinc-950 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                  {selectedIds.size > 0 ? <CheckSquare className="h-4 w-4 mr-2 text-emerald-600" /> : <Square className="h-4 w-4 mr-2" />} SELECIONAR
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[9px] font-black border-2 flex items-center justify-center transition-all ${showFilters || hasActiveFilters ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-emerald-500'}`}>
                    <Filter className="h-4 w-4 mr-2" /> FILTROS
                </button>
           </div>
        </div>

        {showFilters && (
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-3xl p-4 shadow-xl animate-in slide-in-from-top-4 shrink-0 w-full">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Busca Avançada</span>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-[9px] font-black uppercase text-red-500 hover:text-red-600 flex items-center">
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Limpar
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Termo..." className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-xl text-xs font-bold" />
                    </div>
                    <select value={filterBank} onChange={e => { setFilterBank(e.target.value); setFilterCategory('Todas'); setFilterSubcategory('Todas'); }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-xl text-xs font-bold">
                        <option value="Todos">Banco (Todos)</option>
                        {availableBanks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-xl text-xs font-bold">
                        <option value="Todas">Complexidade</option>
                        <option value="Fácil">Fácil</option>
                        <option value="Médio">Médio</option>
                        <option value="Difícil">Difícil</option>
                    </select>
                    <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setFilterSubcategory('Todas'); }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-xl text-xs font-bold">
                        <option value="Todas">Categoria</option>
                        {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select value={filterSubcategory} onChange={e => setFilterSubcategory(e.target.value)} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-xl text-xs font-bold" disabled={availableSubcategories.length === 0}>
                        <option value="Todas">Subtema</option>
                        {availableSubcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 min-h-0 w-full">
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center opacity-40">
                    <Loader2 className="animate-spin h-10 w-10 text-primary mb-4" />
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed rounded-[2.5rem] border-slate-200 dark:border-zinc-800 opacity-30">
                    <FilterX className="h-10 w-10 mx-auto mb-4" />
                    <p className="font-black text-xs uppercase tracking-widest">Nenhum item encontrado</p>
                </div>
            ) : (
                filteredQuestions.map(q => (
                    <div 
                        key={q.id} 
                        onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                        className={`bg-white dark:bg-zinc-950 border-2 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 transition-all cursor-pointer shadow-sm flex gap-4 md:gap-6 ${
                            expandedId === q.id ? 'border-primary ring-4 ring-primary/5' : 'border-slate-100 dark:border-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                    >
                        <div onClick={(e) => toggleSelect(q.id, e)} className={`mt-1 h-6 w-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.has(q.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200 dark:border-zinc-800'}`}>
                          {selectedIds.has(q.id) && <Check className="h-4 w-4 text-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                              <div className="flex flex-wrap items-center gap-2">
                                  {q.bank_name && <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full border bg-indigo-50 dark:bg-indigo-950 border-indigo-200 text-indigo-600 flex items-center"><Folder className="h-2 w-2 mr-1" /> {q.bank_name}</span>}
                                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border bg-slate-50 dark:bg-zinc-900">{q.difficulty}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center truncate max-w-[150px]"><BookOpen className="h-3 w-3 mr-1 text-primary" />{q.category}</span>
                              </div>
                              <div className="flex gap-1">
                                  <button onClick={(e) => handleEdit(q, e)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors" title="Editar"><Edit3 className="h-4 w-4" /></button>
                                  <button onClick={(e) => handleDeleteSingle(q.id, e)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                              </div>
                          </div>
                          <p className={`text-slate-900 dark:text-white font-bold leading-tight text-justify ${expandedId === q.id ? 'text-lg' : 'line-clamp-2 text-sm'}`}>{q.statement}</p>
                          
                          {expandedId === q.id && (
                              <div className="mt-8 pt-8 border-t border-slate-50 dark:border-zinc-900 space-y-6 animate-in fade-in">
                                  {q.statement_image_url && (
                                      <div className="rounded-2xl overflow-hidden border-2 bg-black w-full flex items-center justify-center max-h-[600px] shadow-sm">
                                          <SmartImage url={q.statement_image_url} alt="Exame" className="max-w-full max-h-full object-contain" />
                                      </div>
                                  )}
                                  <div className="space-y-2">
                                      {(q.alternatives || []).map((alt, idx) => (
                                          <div key={alt.id} className={`flex items-start p-4 rounded-2xl border ${alt.is_correct ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-50 dark:bg-black border-slate-100 dark:border-zinc-900'}`}>
                                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black mr-4 shrink-0 ${alt.is_correct ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'}`}>{String.fromCharCode(65 + idx)}</span>
                                              <span className="text-[13px] font-bold flex-1 py-1">{alt.text}</span>
                                          </div>
                                      ))}
                                  </div>
                                  {q.explanation && (
                                      <div className="mt-4 p-6 bg-slate-50 dark:bg-zinc-900 rounded-[2rem] border-l-4 border-primary italic text-[13px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-justify">
                                          {q.explanation}
                                      </div>
                                  )}
                              </div>
                          )}
                        </div>
                    </div>
                ))
            )}
        </div>

        {selectedIds.size > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50 animate-in slide-in-from-bottom-8">
            <div className="bg-slate-900 text-white border-2 border-primary/30 rounded-[2rem] p-4 flex items-center justify-between shadow-2xl">
              <p className="font-black text-[10px] uppercase tracking-widest ml-4">{selectedIds.size} selecionados</p>
              <div className="flex gap-2">
                <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 text-slate-400 font-black text-[9px] uppercase">Cancelar</button>
                <button onClick={handleDeleteBatch} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-black text-[9px] uppercase flex items-center gap-2">
                  <Trash2 className="h-3 w-3" /> EXCLUIR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
