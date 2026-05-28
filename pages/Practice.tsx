import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import {
  Check, Database, Loader2, Filter, Play, RotateCw, Zap, EyeOff, Folder,
  History, ChevronDown, ChevronRight, Plus, Clock, Award, Calendar,
  Target, Trash2, ClipboardList, SlidersHorizontal, X
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';

interface TopicItem { name: string; count: number; }
interface CategoryGroup { name: string; topics: TopicItem[]; totalCount: number; isOpen: boolean; }
interface SimSession {
  id: string; title: string; total_questions: number; correct_count: number;
  score_percentage: number; created_at: string; time_taken_seconds: number;
}

type Tab = 'treino' | 'simulados';

export const Practice: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('treino');

  // ─── Treino state ───────────────────────────────────────────
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('Todas');
  const [questionLimit, setQuestionLimit] = useState(10);
  const [practiceMode, setPracticeMode] = useState<'all' | 'unseen' | 'mistakes'>('all');
  const [immediateFeedback] = useState(true);
  const [availableCount, setAvailableCount] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [showParams, setShowParams] = useState(false);

  // ─── Simulados state ────────────────────────────────────────
  const [sessions, setSessions] = useState<SimSession[]>([]);
  const [simLoading, setSimLoading] = useState(true);

  // ─── Load Treino data ───────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const activeSessions = await localDB.getAll('active_practice_sessions');
        const mySession = activeSessions.find((s: any) => s.user_id === user.id);
        if (mySession) setActiveSession(mySession);
        const allQ = await localDB.getAll('questions');
        const userQ = allQ;
        const banks = Array.from(new Set(userQ.map((q: any) => q.bank_name || 'Geral').filter(Boolean))) as string[];
        setAvailableBanks(banks);
        updateGroups(userQ, []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

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
    const processed = Object.entries(groupMap).map(([name, subs]) => ({
      name, isOpen: openStates.has(name),
      totalCount: Object.values(subs).reduce((a, b) => a + b, 0),
      topics: Object.entries(subs).map(([subName, count]) => ({ name: subName, count }))
    })).sort((a, b) => b.totalCount - a.totalCount);
    setGroups(processed);
  };

  useEffect(() => {
    const calc = async () => {
      if (!user) return;
      setCalculating(true);
      const allQ = await localDB.getAll('questions');
      let filtered = allQ; // Use all available questions (including globals)
      if (selectedBanks.length > 0) filtered = filtered.filter((q: any) => selectedBanks.includes(q.bank_name || 'Geral'));
      updateGroups(filtered, groups);
      if (practiceMode === 'mistakes') {
        const history = await localDB.getAll('user_answers');
        // Group by question_id to get the latest answer
        const latestAnswers: Record<string, any> = {};
        history.filter((h: any) => h.user_id === user.id).forEach((h: any) => {
           if (!latestAnswers[h.question_id] || new Date(h.answered_at || h.created_at || 0) > new Date(latestAnswers[h.question_id].answered_at || latestAnswers[h.question_id].created_at || 0)) {
               latestAnswers[h.question_id] = h;
           }
        });
        const mistakes = new Set(Object.values(latestAnswers).filter(h => !h.is_correct).map(h => h.question_id));
        filtered = filtered.filter((q: any) => mistakes.has(q.id));
      } else if (practiceMode === 'unseen') {
        const history = await localDB.getAll('user_answers');
        const seen = new Set(history.filter((h: any) => h.user_id === user.id).map((h: any) => h.question_id));
        filtered = filtered.filter((q: any) => !seen.has(q.id));
      }
      filtered = filtered.filter((q: any) => {
        if (!q) return false;
        const name = q.subcategory || q.category || q.categoria;
        if (selectedTopics.length > 0 && !selectedTopics.includes(name)) return false;
        if (selectedDifficulty !== 'Todas' && q.difficulty !== selectedDifficulty) return false;
        return true;
      });
      setAvailableCount(filtered.length);
      setCalculating(false);
    };
    calc();
  }, [selectedBanks, selectedTopics, selectedDifficulty, practiceMode, user?.id]);

  const toggleTopic = (name: string) =>
    setSelectedTopics(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);

  const toggleGroup = (groupName: string) =>
    setGroups(prev => prev.map(g => g.name === groupName ? { ...g, isOpen: !g.isOpen } : g));

  const selectAllInGroup = (group: CategoryGroup) => {
    const names = group.topics.map(t => t.name);
    const allSel = names.every(n => selectedTopics.includes(n));
    setSelectedTopics(prev => allSel ? prev.filter(n => !names.includes(n)) : Array.from(new Set([...prev, ...names])));
  };

  const toggleBank = (bank: string) =>
    setSelectedBanks(prev => prev.includes(bank) ? prev.filter(b => b !== bank) : [...prev, bank]);

  // ─── Load Simulados data ────────────────────────────────────
  useEffect(() => {
    const fetchSim = async () => {
      if (!user) return;
      setSimLoading(true);
      const all = await localDB.getAll('simulation_sessions');
      setSessions(all.filter((s: any) => s.user_id === user.id).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setSimLoading(false);
    };
    fetchSim();
  }, [user?.id]);

  const handleDeleteSim = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir registro permanentemente?')) return;
    await syncEngine.enqueue('simulation_sessions', { id }, 'delete');
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-emerald-500' : s >= 60 ? 'text-blue-500' : 'text-red-500';

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + Number(s.score_percentage), 0) / sessions.length) : 0;
  const totalTime = Math.floor(sessions.reduce((a, s) => a + s.time_taken_seconds, 0) / 60);

  // ─── Params panel (shared between mobile/desktop) ──────────
  const renderParams = () => (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl p-4 shadow-sm space-y-4">
      <h3 className="text-slate-900 dark:text-white font-black text-[9px] uppercase tracking-widest border-b border-slate-100 dark:border-zinc-900 pb-2 flex items-center gap-2">
        <Filter className="h-3 w-3 text-emerald-600" /> Praticar
      </h3>

      <div>
        <label className="text-[7px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">Origem</label>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'all', label: 'Tudo', icon: Database },
            { id: 'unseen', label: 'Inéditas', icon: EyeOff },
            { id: 'mistakes', label: 'Erros', icon: History },
          ].map(m => (
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[7px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Complexidade</label>
          <select
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-1.5 rounded-lg text-[8px] font-black focus:border-emerald-600 appearance-none outline-none"
          >
            <option>Todas</option><option>Fácil</option><option>Médio</option><option>Difícil</option>
          </select>
        </div>
        <div>
          <label className="text-[7px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Volume (Qtd)</label>
          <input
            type="number" min="1" max="200" value={questionLimit}
            onChange={e => setQuestionLimit(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-1.5 rounded-lg text-[10px] font-black focus:border-emerald-600 outline-none text-center"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {[10, 20, 30, 50, 100].map(v => (
          <button
            key={v} onClick={() => setQuestionLimit(v)}
            className={`flex-1 px-2 py-1 rounded text-[7px] font-black border transition-all ${questionLimit === v ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-emerald-400'}`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-zinc-900">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Base Estimada</span>
          <div className="flex items-center gap-1">
            {calculating && <Loader2 className="h-2 w-2 animate-spin text-emerald-600" />}
            <span className="text-lg font-black text-emerald-600">{availableCount}</span>
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
  );

  return (
    <Layout title="Prática">
      <div className="flex flex-col h-full space-y-4 overflow-hidden">

        {/* Tab bar */}
        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-900 w-full md:w-fit shrink-0 gap-1">
          {([
            { id: 'treino', label: 'Treino', icon: Zap },
            { id: 'simulados', label: 'Simulados', icon: ClipboardList },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.id ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── TREINO TAB ── */}
        {activeTab === 'treino' && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {/* Active session banner */}
            {activeSession && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4 text-amber-500 animate-spin" />
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Sessão em andamento</span>
                </div>
                <button
                  onClick={() => navigate('/practice/session', { state: { resume: true } })}
                  className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-md active:scale-95"
                >
                  <Play className="h-3 w-3" /> Retomar
                </button>
              </div>
            )}

            {/* Mobile: params toggle button */}
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Selecione os tópicos</span>
              <button
                onClick={() => setShowParams(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase shadow-md"
              >
                <SlidersHorizontal className="h-3 w-3" /> Praticar
                {availableCount > 0 && <span className="bg-white/20 px-1.5 rounded-full">{availableCount}</span>}
              </button>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${activeSession ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
              {/* Main: banks + topics */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-xl p-4 shadow-sm">
                  <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                    <Folder className="h-3 w-3" /> Bancos de Questões
                  </h3>
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
                    {availableBanks.length === 0 && (
                      <span className="text-[9px] text-slate-400 italic">Nenhum banco encontrado. Importe questões primeiro.</span>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center opacity-40">
                    <Loader2 className="animate-spin text-primary h-8 w-8" />
                  </div>
                ) : groups.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl opacity-50">
                    <Database className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-[9px] font-black uppercase text-slate-500">Nenhuma questão encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groups.map(group => (
                      <div key={group.name} className="bg-white dark:bg-zinc-950 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                        <div
                          className="p-3 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer border-b border-emerald-100 dark:border-emerald-900/30"
                          onClick={() => toggleGroup(group.name)}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={e => { e.stopPropagation(); selectAllInGroup(group); }}
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
                          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 bg-white dark:bg-zinc-950">
                            {group.topics.map(topic => (
                              <button
                                key={topic.name}
                                onClick={e => { e.stopPropagation(); toggleTopic(topic.name); }}
                                className={`flex items-center justify-between px-3 py-2 rounded-full border transition-all active:scale-95 ${selectedTopics.includes(topic.name) ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white dark:bg-zinc-900 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                              >
                                <span className="text-[9px] font-bold truncate pr-1">{topic.name}</span>
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${selectedTopics.includes(topic.name) ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300'}`}>{topic.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop: sticky params panel */}
              <div className="hidden lg:block lg:col-span-4">
                <div className="sticky top-4">
                  {renderParams()}
                </div>
              </div>
            </div>

            {/* Mobile: bottom spacer for FAB */}
            <div className="h-20 lg:hidden" />
          </div>
        )}

        {/* ── SIMULADOS TAB ── */}
        {activeTab === 'simulados' && (
          <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-900 shrink-0 shadow-sm gap-3">
              <div>
                <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Histórico de Performance</h1>
                <p className="text-[8px] font-black text-primary uppercase tracking-widest">{sessions.length} simulados registrados</p>
              </div>
              <button
                onClick={() => navigate('/simulations/create')}
                className="w-full sm:w-auto bg-primary hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> NOVO SIMULADO
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-3 md:p-4 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[7px] font-black uppercase text-slate-400">Total</p>
                  <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{sessions.length}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><Target className="h-4 w-4 md:h-5 md:w-5" /></div>
              </div>
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-3 md:p-4 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[7px] font-black uppercase text-slate-400">Acurácia</p>
                  <p className="text-lg md:text-xl font-black text-emerald-500">{avgScore}%</p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Award className="h-4 w-4 md:h-5 md:w-5" /></div>
              </div>
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-3 md:p-4 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[7px] font-black uppercase text-slate-400">Tempo</p>
                  <p className="text-lg md:text-xl font-black text-blue-500">{totalTime}m</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Clock className="h-4 w-4 md:h-5 md:w-5" /></div>
              </div>
            </div>

            {/* Sessions list */}
            <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-0">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-900 shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registros de Avaliação</h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {simLoading ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : sessions.length === 0 ? (
                  <div className="p-16 text-center opacity-30">
                    <Award className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase">Nenhum simulado finalizado</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-zinc-900">
                    {sessions.map(session => (
                      <div key={session.id} className="p-3 md:p-4 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-xl flex flex-col items-center justify-center font-black text-[10px] border-2 bg-white dark:bg-zinc-900 ${scoreColor(session.score_percentage)} border-current shadow-sm`}>
                            {Math.round(session.score_percentage)}%
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{session.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="flex items-center text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest"><Calendar className="h-2 w-2 mr-0.5" /> {new Date(session.created_at).toLocaleDateString()}</span>
                              <span className="flex items-center text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest"><Clock className="h-2 w-2 mr-0.5" /> {Math.floor(session.time_taken_seconds / 60)}m</span>
                              <span className="text-[7px] md:text-[8px] font-black text-primary uppercase">{session.correct_count}/{session.total_questions}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <div className="hidden sm:block w-16 md:w-24 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${session.score_percentage >= 70 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${session.score_percentage}%` }} />
                          </div>
                          <button onClick={e => handleDeleteSim(session.id, e)} className="p-1.5 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile params drawer overlay */}
      {showParams && activeTab === 'treino' && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowParams(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase text-slate-700 dark:text-white tracking-widest">Parâmetros de Treino</span>
              <button onClick={() => setShowParams(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            {renderParams()}
          </div>
        </div>
      )}
    </Layout>
  );
};
