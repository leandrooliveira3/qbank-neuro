
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { 
  Settings, Clock, Play, ChevronLeft, Check, 
  Loader2, Filter, Target, Database, EyeOff, 
  History, BookOpen, ChevronDown, ChevronRight,
  ListFilter, CheckSquare, Square, Folder
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { localDB } from '../services/localDB';
import { useAuthStore } from '../store/useAuthStore';

interface TopicItem {
    name: string; 
    count: number;
}

interface CategoryGroup {
    name: string;
    topics: TopicItem[];
    total: number;
    isOpen: boolean;
}

export const CreateSimulation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  
  // Configs
  const [simName, setSimName] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState('Todas');
  const [mode, setMode] = useState<'all' | 'unseen' | 'mistakes'>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  
  // Bank Config
  const [selectedBank, setSelectedBank] = useState<string>('Todos');
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const questions = await localDB.getAll('questions');
        // ISOLAMENTO DE DADOS: Filtrar questões do usuário
        const userQuestions = questions.filter(q => q.created_by === user.id);

        // Extract Banks
        const banks = Array.from(new Set(userQuestions.map(q => q.bank_name || 'Geral').filter(Boolean))).sort();
        setAvailableBanks(banks);

        // Filter by selected Bank
        let filteredQuestions = userQuestions;
        if (selectedBank !== 'Todos') {
            filteredQuestions = userQuestions.filter(q => (q.bank_name || 'Geral') === selectedBank);
        }

        const map: Record<string, Record<string, number>> = {};
        
        filteredQuestions.forEach(q => {
          const cat = q.category || 'Geral';
          const sub = q.subcategory || cat;
          if (!map[cat]) map[cat] = {};
          map[cat][sub] = (map[cat][sub] || 0) + 1;
        });

        const processed = Object.entries(map).map(([name, subs]) => ({
          name,
          isOpen: false, // Default closed
          total: Object.values(subs).reduce((a, b) => a + b, 0),
          topics: Object.entries(subs).map(([n, c]) => ({ name: n, count: c }))
        })).sort((a, b) => b.total - a.total);

        setGroups(processed);
        // Limpar tópicos selecionados que não existem mais no novo banco
        setSelectedTopics([]); 
      } finally { setLoading(false); }
    };
    loadMetadata();
  }, [user?.id, selectedBank]);

  const availableCount = useMemo(() => {
    return groups
      .filter(g => selectedTopics.length === 0 || g.topics.some(t => selectedTopics.includes(t.name)))
      .reduce((acc, g) => acc + g.total, 0);
  }, [groups, selectedTopics]);

  const toggleTopic = (name: string) => {
    setSelectedTopics(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const toggleGroup = (group: CategoryGroup) => {
    const topicNames = group.topics.map(t => t.name);
    const allSelected = topicNames.every(name => selectedTopics.includes(name));
    if (allSelected) {
        setSelectedTopics(prev => prev.filter(name => !topicNames.includes(name)));
    } else {
        setSelectedTopics(prev => Array.from(new Set([...prev, ...topicNames])));
    }
  };

  const handleStart = () => {
    if (!simName.trim()) return alert("Dê um nome ao simulado.");
    if (availableCount === 0) return alert("Nenhuma questão encontrada com esses filtros.");
    
    navigate('/simulations/session', { 
      state: { 
        config: {
          selectedBank,
          selectedTopics,
          selectedDifficulty: difficulty,
          questionLimit: questionCount,
          practiceMode: mode,
          immediateFeedback: false, 
          isSimulation: true,
          simulationName: simName,
          hasTimeLimit
        }
      } 
    });
  };

  return (
    <Layout title="Criar Simulado Profissional">
      <div className="h-full flex flex-col space-y-4 overflow-hidden max-w-7xl mx-auto">
        
        {/* Header de Ação */}
        <header className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-900 shrink-0 gap-4 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg text-slate-400"><ChevronLeft className="h-5 w-5" /></button>
            <div className="flex-1">
              <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Novo Simulado</h1>
              <p className="text-[8px] font-black text-primary uppercase tracking-widest">Setup de Avaliação Técnica</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <input 
                    type="text" 
                    placeholder="Nome da Prova... (ex: Simulado AVC)" 
                    value={simName}
                    onChange={e => setSimName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary shadow-inner"
                />
             </div>
             <button 
                onClick={handleStart}
                disabled={loading || !simName}
                className="bg-primary hover:bg-emerald-600 text-white px-8 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all disabled:opacity-30 flex items-center gap-2"
             >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />} GERAR PROVA
             </button>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
            
            {/* Coluna 1: Temas (Scrollable) */}
            <div className="lg:col-span-8 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
                    <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 text-primary" /> Especialidades e Temas</h2>
                    <div className="flex gap-4">
                        <button onClick={() => setSelectedTopics([])} className="text-[8px] font-black text-primary hover:underline uppercase">Limpar Tudo</button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <span className="text-[9px] font-black uppercase">Carregando Banco...</span>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                            <Database className="h-10 w-10 mb-2" />
                            <p className="text-[9px] font-black uppercase">Nenhum item neste banco</p>
                        </div>
                    ) : (
                        groups.map(group => (
                            <div key={group.name} className="border border-slate-100 dark:border-zinc-900 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                                <div className="flex items-center p-3 bg-emerald-50/50 dark:bg-emerald-900/20">
                                    <button 
                                        onClick={() => toggleGroup(group)}
                                        className={`mr-3 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                                            group.topics.every(t => selectedTopics.includes(t.name)) 
                                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                                            : 'bg-white dark:bg-black border-emerald-200 dark:border-emerald-800'
                                        }`}
                                    >
                                        <Check className="h-3 w-3" />
                                    </button>
                                    <div className="flex-1 cursor-pointer" onClick={() => setGroups(prev => prev.map(g => g.name === group.name ? {...g, isOpen: !g.isOpen} : g))}>
                                        <span className="text-[10px] font-black uppercase text-emerald-900 dark:text-emerald-100">{group.name}</span>
                                        <span className="ml-2 text-[8px] font-black text-emerald-600/70">{group.total} Itens</span>
                                    </div>
                                    <button onClick={() => setGroups(prev => prev.map(g => g.name === group.name ? {...g, isOpen: !g.isOpen} : g))}>
                                        {group.isOpen ? <ChevronDown className="h-4 w-4 text-emerald-600" /> : <ChevronRight className="h-4 w-4 text-emerald-600" />}
                                    </button>
                                </div>
                                
                                {group.isOpen && (
                                    <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1.5 border-t border-slate-50 dark:border-zinc-900">
                                        {group.topics.map(topic => (
                                            <button 
                                                key={topic.name}
                                                onClick={() => toggleTopic(topic.name)}
                                                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                                    selectedTopics.includes(topic.name) 
                                                    ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                                                    : 'bg-white dark:bg-zinc-900 border-slate-50 dark:border-zinc-900 hover:border-emerald-200'
                                                }`}
                                            >
                                                <span className={`text-[9px] font-bold text-left ${selectedTopics.includes(topic.name) ? 'text-emerald-700' : 'text-slate-500'}`}>{topic.name}</span>
                                                <span className="text-[7px] font-black bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-500">{topic.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Coluna 2: Parâmetros Técnicos */}
            <div className="lg:col-span-4 space-y-4 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-1">
                
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 border-b border-slate-50 dark:border-zinc-900 pb-3"><Filter className="h-3.5 w-3.5 text-primary" /> Parâmetros de Prova</h3>
                    
                    {/* Bank Selection */}
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1"><Folder className="h-3 w-3" /> Banco de Origem</label>
                        <select 
                            value={selectedBank} 
                            onChange={(e) => setSelectedBank(e.target.value)} 
                            className="w-full bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 p-2.5 rounded-xl text-[10px] font-black focus:border-indigo-500 text-indigo-700 dark:text-indigo-300 appearance-none"
                        >
                            <option value="Todos">Todos os Bancos</option>
                            {availableBanks.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Modo de Seleção</label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'all', label: 'Aleatório (Tudo)', icon: Database },
                                { id: 'unseen', label: 'Apenas Inéditas', icon: EyeOff },
                                { id: 'mistakes', label: 'Focar em Erros', icon: History }
                            ].map(m => (
                                <button key={m.id} onClick={() => setMode(m.id as any)} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${mode === m.id ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-slate-50 dark:bg-zinc-900 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                                    <m.icon className="h-3.5 w-3.5" />
                                    <span className="text-[9px] font-black uppercase">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Qtd. Questões</label>
                            <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-xl text-[10px] font-black focus:border-primary appearance-none">
                                {[10, 20, 30, 40, 50, 60, 80, 100].map(v => <option key={v} value={v}>{v} Questões</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Dificuldade</label>
                            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-2.5 rounded-xl text-[10px] font-black focus:border-primary appearance-none">
                                <option>Todas</option><option>Fácil</option><option>Médio</option><option>Difícil</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 dark:border-zinc-900">
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${hasTimeLimit ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 block">Cronômetro</span>
                                    <span className="text-[7px] font-bold text-slate-400 uppercase">3 min/questão</span>
                                </div>
                            </div>
                            
                            {/* Checkbox Verde Simples */}
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={hasTimeLimit} onChange={e => setHasTimeLimit(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden shrink-0 group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700"><Target className="h-20 w-20" /></div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base de Prova</p>
                                <p className="text-[7px] font-bold text-slate-500 uppercase">Filtros Ativos</p>
                            </div>
                            <span className="text-4xl font-black text-emerald-400 leading-none tracking-tighter">{availableCount}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: availableCount > 0 ? '100%' : '0%' }}></div>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic">
                            {availableCount < questionCount 
                                ? `Atenção: Existem menos questões (${availableCount}) do que o solicitado (${questionCount}).` 
                                : `Serão sorteadas ${questionCount} questões deste universo.`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};
