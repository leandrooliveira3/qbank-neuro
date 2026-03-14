
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ChevronLeft, Check, Database, Loader2, Filter, Play, RotateCw, BookOpen, Sparkles, ChevronDown, ChevronRight, History, Zap, EyeOff, Folder } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';

interface TopicItem {
    name: string; 
    count: number;
}

interface CategoryGroup {
    name: string;
    topics: TopicItem[];
    totalCount: number;
    isOpen: boolean;
}

export const PracticeConfig: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Todas');
  const [questionLimit, setQuestionLimit] = useState<number>(10);
  const [practiceMode, setPracticeMode] = useState<'all' | 'unseen' | 'mistakes'>('all');
  const [immediateFeedback, setImmediateFeedback] = useState(true);
  
  const [availableCount, setAvailableCount] = useState(0);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const sessions = await localDB.getAll('active_practice_sessions');
            const mySession = sessions.find(s => s.user_id === user.id);
            if (mySession) setActiveSession(mySession);

            const allQuestions = await localDB.getAll('questions');
            const userQuestions = allQuestions.filter(q => q.created_by === user.id);

            const banks = Array.from(new Set(userQuestions.map(q => q.bank_name || 'Geral').filter(Boolean))) as string[];
            setAvailableBanks(banks);

            updateGroups(userQuestions, []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [user]);

  const updateGroups = (questions: any[], currentGroups: CategoryGroup[]) => {
      const groupMap: Record<string, Record<string, number>> = {};
      questions.forEach(q => {
          if (!q) return;
          const cat = q.category || q.categoria || 'Geral';
          const sub = q.subcategory || q.category || q.categoria || 'Geral';
          if (!groupMap[cat]) groupMap[cat] = {};
          groupMap[cat][sub] = (groupMap[cat][sub] || 0) + 1;
      });

      const openStates = new Set(currentGroups.filter(g => g.isOpen).map(g => g.name));

      const processedGroups = Object.entries(groupMap).map(([name, subs]) => ({
          name,
          isOpen: openStates.has(name), 
          totalCount: Object.values(subs).reduce((a, b) => a + b, 0),
          topics: Object.entries(subs).map(([subName, count]) => ({ name: subName, count }))
      })).sort((a, b) => b.totalCount - a.totalCount);

      setGroups(processedGroups);
  };

  useEffect(() => {
    const calculateAvailable = async () => {
        if (!user) return;
        setCalculating(true);
        
        const allQuestions = await localDB.getAll('questions');
        let filtered = allQuestions.filter(q => q.created_by === user.id);

        if (selectedBanks.length > 0) {
            filtered = filtered.filter(q => selectedBanks.includes(q.bank_name || 'Geral'));
        }
        
        updateGroups(filtered, groups);

        if (practiceMode === 'mistakes') {
            const history = await localDB.getAll('user_answers');
            const userHistory = history.filter(h => h.user_id === user.id);
            const mistakes = new Set(userHistory.filter(h => !h.is_correct).map(h => h.question_id));
            filtered = filtered.filter(q => mistakes.has(q.id));
        } else if (practiceMode === 'unseen') {
            const history = await localDB.getAll('user_answers');
            const userHistory = history.filter(h => h.user_id === user.id);
            const seenIds = new Set(userHistory.map(h => h.question_id));
            filtered = filtered.filter(q => !seenIds.has(q.id));
        }

        filtered = filtered.filter(q => {
            if (!q) return false;
            const name = q.subcategory || q.category || q.categoria;
            if (selectedTopics.length > 0 && !selectedTopics.includes(name)) return false;
            if (selectedDifficulty !== 'Todas' && q.difficulty !== selectedDifficulty) return false;
            return true;
        });

        setAvailableCount(filtered.length);
        setCalculating(false);
    };
    calculateAvailable();
  }, [selectedBanks, selectedTopics, selectedDifficulty, practiceMode, user]);

  const toggleTopic = (name: string) => {
    setSelectedTopics(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };

  const toggleGroup = (groupName: string) => {
    setGroups(prev => prev.map(g => g.name === groupName ? { ...g, isOpen: !g.isOpen } : g));
  };

  const selectAllInGroup = (group: CategoryGroup) => {
    const topicNames = group.topics.map(t => t.name);
    const allSelected = topicNames.every(name => selectedTopics.includes(name));
    if (allSelected) {
        setSelectedTopics(prev => prev.filter(name => !topicNames.includes(name)));
    } else {
        setSelectedTopics(prev => Array.from(new Set([...prev, ...topicNames])));
    }
  };

  const toggleBank = (bank: string) => {
      setSelectedBanks(prev => prev.includes(bank) ? prev.filter(b => b !== bank) : [...prev, bank]);
  };

  return (
    <Layout title="Treinamento Clínico">
       <div className="flex flex-col space-y-4 w-full">
          <div className="flex items-center space-x-3 shrink-0">
             <button onClick={() => navigate('/')} className="p-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-400">
                <ChevronLeft className="h-4 w-4" />
             </button>
             <div>
                <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Configurar Prática</h1>
                <p className="text-slate-400 text-[7px] font-black uppercase tracking-widest mt-0.5">Filtros de Estudo</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
             <div className={`lg:col-span-8 space-y-4 ${activeSession ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-xl p-4 shadow-sm w-full">
                    <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2"><Folder className="h-3 w-3" /> Bancos de Questões</h3>
                    <div className="flex flex-wrap gap-2">
                        {availableBanks.map(bank => (
                            <button 
                                key={bank} 
                                onClick={() => toggleBank(bank)}
                                className={`px-3 py-1.5 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${selectedBanks.includes(bank) ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-500'}`}
                            >
                                {bank}
                            </button>
                        ))}
                        {availableBanks.length === 0 && <span className="text-[9px] text-slate-400 italic">Nenhum banco encontrado. Importe questões primeiro.</span>}
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center opacity-40">
                        <Loader2 className="animate-spin text-primary h-8 w-8 mb-2" />
                    </div>
                ) : groups.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl opacity-50">
                        <Database className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-[9px] font-black uppercase text-slate-500">Nenhuma questão encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {groups.map(group => (
                            <div key={group.name} className="bg-white dark:bg-zinc-950 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl overflow-hidden shadow-sm w-full transition-all hover:shadow-md">
                                <div className="p-3 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer border-b border-emerald-100 dark:border-emerald-900/30" onClick={() => toggleGroup(group.name)}>
                                    <div className="flex items-center space-x-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); selectAllInGroup(group); }}
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all z-20 ${group.topics.every(t => selectedTopics.includes(t.name)) ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-900'}`}
                                        >
                                            <Check className={`h-3 w-3 ${group.topics.every(t => selectedTopics.includes(t.name)) ? 'text-white' : 'text-emerald-300 dark:text-emerald-800'}`} />
                                        </button>
                                        <div>
                                            <h3 className="font-black text-emerald-900 dark:text-emerald-100 text-[10px] uppercase tracking-widest">{group.name}</h3>
                                            <p className="text-[7px] font-bold text-emerald-600/70 uppercase">{group.totalCount} itens</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/50 dark:bg-black/20 p-1 rounded-lg">
                                        {group.isOpen ? <ChevronDown className="h-4 w-4 text-emerald-600" /> : <ChevronRight className="h-4 w-4 text-emerald-600" />}
                                    </div>
                                </div>
                                
                                {group.isOpen && (
                                    <div className="p-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 bg-white dark:bg-zinc-950">
                                        {group.topics.map(topic => (
                                            <button 
                                                key={topic.name}
                                                onClick={(e) => { e.stopPropagation(); toggleTopic(topic.name); }}
                                                className={`flex items-center justify-between px-3 py-2 rounded-full border transition-all active:scale-95 ${
                                                    selectedTopics.includes(topic.name) 
                                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200 dark:shadow-none' 
                                                    : 'bg-white dark:bg-zinc-900 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                }`}
                                            >
                                                <span className="text-[9px] font-bold truncate pr-1">
                                                    {topic.name}
                                                </span>
                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${
                                                    selectedTopics.includes(topic.name) 
                                                    ? 'bg-white/20 text-white' 
                                                    : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300'
                                                }`}>{topic.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
             </div>

             <div className="lg:col-span-4 space-y-4">
                 <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl p-4 shadow-sm space-y-4 sticky top-4">
                    <h3 className="text-slate-900 dark:text-white font-black text-[9px] uppercase tracking-widest border-b border-slate-100 dark:border-zinc-900 pb-2 flex items-center">
                        <Filter className="h-3 w-3 mr-2 text-emerald-600" /> Parâmetros Técnicos
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-[7px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">Origem</label>
                            <div className="grid grid-cols-3 gap-1">
                                {[
                                    { id: 'all', label: 'Tudo', icon: Database },
                                    { id: 'unseen', label: 'Inéditas', icon: EyeOff },
                                    { id: 'mistakes', label: 'Erros', icon: History }
                                ].map((m) => (
                                    <button 
                                        key={m.id}
                                        onClick={() => setPracticeMode(m.id as any)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${practiceMode === m.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-zinc-900 border-transparent text-slate-500'}`}
                                    >
                                        <m.icon className="h-3 w-3 mb-1" />
                                        <span className="text-[6px] font-black uppercase">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[7px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Complexidade</label>
                                <select 
                                    value={selectedDifficulty} 
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-1.5 rounded-lg text-[8px] font-black focus:border-emerald-600 appearance-none"
                                >
                                    <option>Todas</option><option>Fácil</option><option>Médio</option><option>Difícil</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-[7px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Volume (Qtd)</label>
                                <div className="space-y-2">
                                    <input 
                                        type="number"
                                        min="1"
                                        max="200"
                                        value={questionLimit} 
                                        onChange={(e) => setQuestionLimit(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-1.5 rounded-lg text-[10px] font-black focus:border-emerald-600 outline-none text-center"
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {[10, 20, 30, 50, 100].map(v => (
                                            <button 
                                                key={v} 
                                                onClick={() => setQuestionLimit(v)}
                                                className={`flex-1 px-2 py-1 rounded text-[7px] font-black border transition-all ${
                                                    questionLimit === v 
                                                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                                                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-emerald-400'
                                                }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-zinc-900">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Base Estimada</span>
                            <div className="flex items-center gap-1">
                                {calculating && <Loader2 className="h-2 w-2 animate-spin text-emerald-600" />}
                                <span className="text-lg font-black text-emerald-600 tracking-tighter">{availableCount}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/practice/session', { state: { config: { selectedBanks, selectedTopics, selectedDifficulty, questionLimit, immediateFeedback, practiceMode } } })}
                            disabled={availableCount === 0 || calculating}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-[8px] uppercase tracking-widest shadow-lg disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Zap className="h-3 w-3" /> INICIAR TREINO
                        </button>
                    </div>
                 </div>
             </div>
          </div>
       </div>
    </Layout>
  );
};
