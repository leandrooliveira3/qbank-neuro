
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { Question } from '../types';
import { 
    ChevronRight, Clock, Loader2, ZoomIn, ZoomOut, 
    ChevronLeft, Save, LayoutGrid, X, 
    CheckCircle2, Timer, Activity, ArrowLeft
} from 'lucide-react';
import { syncEngine } from '../services/syncEngine';
import { localDB } from '../services/localDB';
import { SmartImage } from '../components/SmartImage';
import { xpService, XP_VALUES } from '../services/xpService';
import { XPNotification } from '../components/XPNotification';

export const SimulationSession: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const initialConfig = (state as any)?.config || {};
  const stateQuestions = (state as any)?.questions as Question[] | undefined;
  const hasTimeLimitPerQuestion = initialConfig.hasTimeLimit;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [itemSeconds, setItemSeconds] = useState(180);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); 
  const [isFinished, setIsFinished] = useState(false);
  const [showNavGrid, setShowNavGrid] = useState(false);
  const [fontScale, setFontScale] = useState(1); 

  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const init = async () => {
        setLoading(true);
        try {
            if (stateQuestions && stateQuestions.length > 0) {
                setQuestions(stateQuestions);
            } else {
                let all = await localDB.getAll('questions');
                let filtered = all.filter((q: any) => q.created_by === user.id);
                if (initialConfig.selectedBank && initialConfig.selectedBank !== 'Todos') {
                    filtered = filtered.filter((q: any) => (q.bank_name || 'Geral') === initialConfig.selectedBank);
                }
                filtered = filtered.filter((q: any) => {
                     if (!q) return false;
                     const name = q.subcategory || q.category;
                     if (initialConfig.selectedTopics?.length > 0 && !initialConfig.selectedTopics.includes(name)) return false;
                     if (initialConfig.selectedDifficulty !== 'Todas' && q.difficulty !== initialConfig.selectedDifficulty) return false;
                     return true;
                });
                const selected = filtered.sort(() => Math.random() - 0.5).slice(0, initialConfig.questionLimit);
                setQuestions(selected);
            }
        } finally { setLoading(false); }
    };
    init();
  }, [user]);

  useEffect(() => {
      const timer = setInterval(() => {
          if (isFinished || loading) return;
          setElapsedSeconds(p => p + 1);
          if (hasTimeLimitPerQuestion) {
              setItemSeconds(p => {
                  if (p <= 1) {
                      if (currentIndex < questions.length - 1) {
                          setCurrentIndex(c => c + 1);
                          return 180;
                      }
                      return 0;
                  }
                  return p - 1;
              });
          }
      }, 1000);
      return () => clearInterval(timer);
  }, [isFinished, loading, hasTimeLimitPerQuestion, currentIndex, questions.length]);

  useEffect(() => {
      if (hasTimeLimitPerQuestion) setItemSeconds(180);
      if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [currentIndex, hasTimeLimitPerQuestion]);

  const handleSelect = (altId: string) => {
      if (isFinished) return;
      setSelectedAnswers(prev => ({ ...prev, [questions[currentIndex].id]: altId }));
  };

  const finishSimulation = async () => {
      if (!user) return;
      const answeredCount = Object.keys(selectedAnswers).length;
      if (answeredCount < questions.length && !confirm(`Você respondeu apenas ${answeredCount} questões. Entregar a prova?`)) return;
      
      setLoading(true);
      const now = new Date().toISOString();
      const results = questions.map(q => {
          const selected = selectedAnswers[q.id];
          const correctAlt = q.alternatives.find(a => a.is_correct);
          return {
              id: crypto.randomUUID(),
              user_id: user.id,
              question_id: q.id,
              is_correct: correctAlt?.id === selected,
              selected_alternative_id: selected,
              time_spent_seconds: Math.floor(elapsedSeconds / questions.length),
              answered_at: now,
              created_at: now,
              updated_at: now
          };
      });

      const correctCount = results.filter(r => r.is_correct).length;
      const scorePerc = (correctCount / questions.length) * 100;
      
      let xpAward = XP_VALUES.SIMULATION_COMPLETE;
      if (scorePerc >= 90) xpAward += XP_VALUES.PERFECT_SCORE;
      else if (scorePerc >= 70) xpAward += 50;
      
      try {
          await xpService.addXP(xpAward, `Simulado Finalizado (${Math.round(scorePerc)}%)`, 'Simulados');

          const simulationRecord = {
              id: crypto.randomUUID(),
              user_id: user.id,
              title: initialConfig.simulationName || 'Simulado Técnico',
              total_questions: questions.length,
              correct_count: correctCount,
              score_percentage: scorePerc,
              time_taken_seconds: elapsedSeconds,
              bank_name: initialConfig.selectedBank === 'Todos' ? 'Misto' : initialConfig.selectedBank || 'Simulados',
              created_at: now,
              updated_at: now
          };

          await syncEngine.enqueue('simulation_sessions', simulationRecord);
          if (!stateQuestions) {
             await syncEngine.bulkEnqueue('user_answers', results);
          }
          setIsFinished(true);
      } finally { setLoading(false); }
  };

  const stats = useMemo(() => {
      if (!isFinished) return null;
      const corrects = questions.filter(q => {
          const sel = selectedAnswers[q.id];
          return q.alternatives.find(a => a.is_correct)?.id === sel;
      }).length;
      const timeStr = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`;
      return { corrects, total: questions.length, perc: Math.round((corrects / questions.length) * 100), timeStr };
  }, [isFinished, questions, selectedAnswers, elapsedSeconds]);

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-black z-[200]"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  if (isFinished && stats) {
      return (
          <div className="fixed inset-0 bg-slate-50 dark:bg-black flex flex-col items-center justify-center p-6 z-[200] overflow-y-auto text-slate-900 dark:text-white">
              <XPNotification />
              <div className="max-w-4xl w-full text-center space-y-10 animate-in zoom-in-95 duration-500 pb-20">
                  <div className={`w-36 h-36 rounded-full border-[12px] flex flex-col items-center justify-center mx-auto shadow-2xl ${stats.perc >= 70 ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500'}`}>
                      <span className="text-4xl font-black">{stats.perc}%</span>
                      <span className="text-[7px] font-black uppercase tracking-widest mt-1">Acertos</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Resultado do Simulado</h2>
                  {stateQuestions && <p className="text-xs font-bold text-orange-500 uppercase">Modo Rápido (Não Salvo)</p>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xl font-black">{stats.corrects} / {stats.total}</p>
                          <p className="text-[7px] font-black uppercase text-slate-400">Pontuação</p>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
                          <Timer className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                          <p className="text-xl font-black">{stats.timeStr}</p>
                          <p className="text-[7px] font-black uppercase text-slate-400">Tempo Total</p>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
                          <Activity className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                          <p className="text-xl font-black">{Math.round(elapsedSeconds / stats.total)}s</p>
                          <p className="text-[7px] font-black uppercase text-slate-400">Tempo por Item</p>
                      </div>
                  </div>
                  <button onClick={() => navigate(stateQuestions ? '/videos' : '/simulations')} className="bg-primary text-white px-16 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">CONCLUIR E SAIR</button>
              </div>
          </div>
      );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-[150] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
        <XPNotification />
        <header className="h-12 shrink-0 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-5 flex items-center justify-between z-[160] shadow-sm">
            <div className="flex items-center gap-3">
                <button onClick={() => confirm("Abandonar simulado?") && navigate('/')} className="p-1.5 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-4 w-4" /></button>
                <div className="flex flex-col">
                    <h1 className="text-[8px] font-black uppercase tracking-widest text-primary leading-none">{initialConfig.simulationName || 'Sessão de Prova'}</h1>
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Item {currentIndex + 1} de {questions.length}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="bg-slate-950 text-white px-3 py-1.5 rounded-lg text-[11px] font-mono font-black border border-white/5 flex items-center gap-2">
                    <Clock className="h-3 w-3 text-primary animate-pulse" /> 
                    <span>{Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}</span>
                </div>
                <button onClick={() => setShowNavGrid(!showNavGrid)} className={`p-1.5 rounded-lg border transition-all ${showNavGrid ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-zinc-900 text-slate-400 border-slate-200 dark:border-zinc-800'}`}>
                    <LayoutGrid className="h-3.5 w-3.5" />
                </button>
            </div>
        </header>

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20 dark:bg-zinc-950/10">
            <div className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-4" style={{ fontSize: `${fontScale * 100}%` }}>
                
                <div className="flex items-center gap-2 px-1">
                    <span className="bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md text-[0.6em] font-black uppercase text-slate-500 border border-slate-200 dark:border-zinc-800 tracking-widest">{currentQ?.category || 'Geral'}</span>
                    <span className="text-[0.6em] font-bold text-slate-400 uppercase tracking-widest ml-auto">Nível: {currentQ?.difficulty || 'Médio'}</span>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] p-6 md:p-10 border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                    {hasTimeLimitPerQuestion && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-50 dark:bg-black overflow-hidden">
                            <div className="h-full bg-orange-500 transition-all duration-1000 ease-linear" style={{ width: `${(itemSeconds / 180) * 100}%` }} />
                        </div>
                    )}
                    
                    {currentQ?.statement_image_url && (
                        <div className="mb-6 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-black shadow-sm mx-auto max-w-full">
                            <SmartImage url={currentQ.statement_image_url} alt="Referência" className="w-full max-h-[380px] object-contain bg-white dark:bg-black" />
                        </div>
                    )}
                    
                    <h2 className="font-bold leading-tight text-slate-900 dark:text-white tracking-tight text-justify" style={{ fontSize: '1.25em' }}>
                        {currentQ?.statement}
                    </h2>
                </div>

                <div className="space-y-2 pb-40">
                    <p className="font-black uppercase text-slate-400 tracking-widest ml-4 mb-2" style={{ fontSize: '0.65em' }}>Selecione sua resposta:</p>
                    {currentQ?.alternatives?.map((alt, idx) => {
                        const isSelected = selectedAnswers[currentQ.id] === alt.id;
                        return (
                            <button 
                                key={alt.id}
                                onClick={() => handleSelect(alt.id)}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 active:scale-[0.99] group/alt ${
                                    isSelected 
                                    ? 'bg-primary/5 border-primary ring-2 ring-primary/5 shadow-md' 
                                    : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-slate-200'
                                }`}
                            >
                                <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-black flex-shrink-0 transition-all ${
                                    isSelected ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover/alt:bg-slate-200'
                                }`} style={{ fontSize: '0.85em' }}>{String.fromCharCode(65 + idx)}</span>
                                <span className={`font-bold py-1 leading-snug flex-1 ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`} style={{ fontSize: '0.95em' }}>
                                    {alt.text}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </main>

        <footer className="h-16 shrink-0 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900 px-4 md:px-8 flex items-center justify-between z-[160] shadow-lg">
            <div className="flex items-center gap-1">
                <button onClick={() => setShowNavGrid(true)} className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 border border-slate-200 dark:border-zinc-800 rounded-xl mr-2 hover:text-primary transition-all active:scale-90" title="Grade de Itens"><LayoutGrid className="h-4 w-4" /></button>
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(p => p - 1)} className="p-2 text-slate-400 hover:text-primary disabled:opacity-20 transition-all active:scale-90"><ChevronLeft className="h-6 w-6" /></button>
                <div className="flex gap-1 mx-2 border-x border-slate-100 dark:border-zinc-900 px-3 items-center">
                    <button onClick={() => setFontScale(p => Math.max(0.7, p - 0.1))} className="p-2 text-slate-400 hover:text-primary transition-all"><ZoomOut className="h-4.5 w-4.5" /></button>
                    <span className="text-[9px] font-black text-slate-400 w-8 text-center">{Math.round(fontScale * 100)}%</span>
                    <button onClick={() => setFontScale(p => Math.min(1.6, p + 0.1))} className="p-2 text-slate-400 hover:text-primary transition-all"><ZoomIn className="h-4.5 w-4.5" /></button>
                </div>
                <button disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex(p => p + 1)} className="p-2 text-slate-400 hover:text-primary disabled:opacity-20 transition-all active:scale-90"><ChevronRight className="h-6 w-6" /></button>
            </div>
            <div className="flex items-center gap-2">
                 {currentIndex === questions.length - 1 ? (
                    <button onClick={finishSimulation} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> ENTREGAR</button>
                 ) : (
                    <button onClick={() => setCurrentIndex(p => p + 1)} className="bg-primary hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-2">PRÓXIMO <ChevronRight className="h-4 w-4" /></button>
                 )}
            </div>
        </footer>

        {showNavGrid && (
            <div className="fixed inset-0 z-[180] animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowNavGrid(false)} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-5">
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 p-8 shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Navegação da Prova</h3>
                            <button onClick={() => setShowNavGrid(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="grid grid-cols-6 md:grid-cols-8 gap-2.5 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                            {questions.map((q, idx) => (
                                <button key={idx} onClick={() => { setCurrentIndex(idx); setShowNavGrid(false); }} className={`h-11 rounded-xl text-[10px] font-black border-2 transition-all ${currentIndex === idx ? 'bg-primary border-primary text-white shadow-sm scale-110' : selectedAnswers[q.id] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-400 hover:border-slate-300'}`}>{idx + 1}</button>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-zinc-800 flex justify-center">
                            <button onClick={finishSimulation} className="bg-slate-900 dark:bg-zinc-100 text-white dark:text-black px-10 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">FINALIZAR SIMULADO</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
