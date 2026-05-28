import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';
import { useFocusStore } from '../store/useFocusStore';
import { FocusSession } from '../types';
import { 
  Play, Pause, RotateCcw, 
  Sparkles, History, Timer, Brain, Coffee, Zap,
  CheckCircle2
} from 'lucide-react';

export const Focus: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    isActive, timeLeft, mode, tick, 
    startTimer, pauseTimer, resetTimer, setMode 
  } = useFocusStore();
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  useEffect(() => { loadSessions(); }, [user?.id]);

  const loadSessions = async () => {
    if (!user) return;
    const data = await localDB.getAll('focus_sessions');
    setSessions(data.filter(s => s.user_id === user.id).reverse());
  };

  useEffect(() => {
    let interval: number;
    if (isActive && timeLeft > 0) interval = window.setInterval(tick, 1000);
    else if (timeLeft === 0 && isActive) handleSessionComplete();
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = async () => {
    if (!user) return;
    if (mode === 'Pomodoro') {
      const s: FocusSession = { id: crypto.randomUUID(), user_id: user.id, subject: 'Geral', duration_minutes: 25, type: 'Pomodoro', date: new Date().toISOString() };
      await syncEngine.enqueue('focus_sessions', s);
      loadSessions();
    }
    resetTimer();
    alert('Sessão concluída!');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'Pomodoro' ? 25*60 : mode === 'Short Break' ? 5*60 : 15*60;
  const percentage = (timeLeft / totalTime) * 100;

  return (
    <Layout title="Foco Clínico" fullWidth>
      <div className="h-full flex flex-col lg:flex-row p-4 md:p-8 gap-8 overflow-y-auto lg:overflow-hidden bg-slate-50 dark:bg-black transition-colors">
        
        {/* LEFT COLUMN: TIMER VISUALIZATION */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-slate-200 dark:border-zinc-900 shadow-sm p-4 md:p-8 relative overflow-hidden shrink-0 min-h-[350px] md:min-h-[400px]">
            <header className="absolute top-4 md:top-8 left-0 w-full text-center z-10">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-block mb-2">Deep Work Protocol</div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Foco Cirúrgico</h1>
            </header>

            <div className="relative flex items-center justify-center group w-full max-w-[280px] md:max-w-md aspect-square mt-8 md:mt-0">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full -rotate-90 transform scale-90">
                    <circle
                        cx="50%" cy="50%" r="45%"
                        className="stroke-slate-100 dark:stroke-zinc-900 fill-none"
                        strokeWidth="4"
                    />
                    <circle
                        cx="50%" cy="50%" r="45%"
                        className="stroke-primary fill-none transition-all duration-1000 ease-linear"
                        strokeWidth="4"
                        strokeDasharray="283%" // Aprox for r=45%
                        strokeDashoffset={`${283 - (283 * percentage) / 100}%`}
                        strokeLinecap="round"
                        style={{ strokeDasharray: '600' }} 
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl mb-4 md:mb-6 shadow-inner scale-100 md:scale-110">
                        {['Pomodoro', 'Short Break'].map(m => (
                            <button key={m} onClick={() => setMode(m as any)} className={`px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>
                                {m === 'Pomodoro' ? 'Foco' : 'Pausa'}
                            </button>
                        ))}
                    </div>
                    <div className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-950 dark:text-white tracking-tighter font-mono tabular-nums leading-none">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="mt-6 md:mt-8 flex items-center gap-4">
                        <button onClick={isActive ? pauseTimer : startTimer} className={`h-14 w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 hover:scale-105 ${isActive ? 'bg-red-50 text-red-500 shadow-red-500/20 border-2 border-red-100' : 'bg-primary text-white shadow-emerald-500/30'}`}>
                            {isActive ? <Pause className="h-5 w-5 md:h-6 md:w-6 fill-current" /> : <Play className="h-6 w-6 md:h-7 md:w-7 fill-current ml-1" />}
                        </button>
                        <button onClick={resetTimer} className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-slate-50 dark:bg-zinc-900 text-slate-400 flex items-center justify-center hover:text-primary transition-all border border-slate-200 dark:border-zinc-800 hover:border-primary hover:shadow-md">
                            <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: STATS & HISTORY */}
        <div className="flex-1 flex flex-col gap-6 lg:h-full lg:overflow-hidden">
            
            {/* STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                {[
                    { icon: Brain, label: 'Sessões Hoje', value: `${sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length}`, sub: 'Ciclos Completos' },
                    { icon: Zap, label: 'Streak Atual', value: '12', sub: 'Dias Seguidos' },
                    { icon: Timer, label: 'Tempo Total', value: `${Math.floor(sessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60)}h`, sub: 'Horas Focadas' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 text-center shadow-sm flex flex-col items-center justify-center">
                        <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-full mb-3 text-primary"><stat.icon className="h-5 w-5" /></div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{stat.value}</p>
                        <p className="text-[9px] font-black uppercase text-slate-900 dark:text-white mt-1">{stat.label}</p>
                        <p className="text-[7px] font-bold uppercase text-slate-400 mt-0.5 tracking-widest">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* HISTORY LIST */}
            <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-900 pb-4 shrink-0">
                    <History className="h-4 w-4 text-primary" /> Histórico de Produtividade
                </h4>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {sessions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Coffee className="h-10 w-10 mb-2" />
                            <p className="text-[9px] text-slate-300 uppercase font-black text-center">Nenhuma sessão registrada</p>
                        </div>
                    ) : sessions.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-primary/30 transition-colors group">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                   <CheckCircle2 className="h-5 w-5" />
                               </div>
                               <div>
                                   <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase block">Ciclo Pomodoro</span>
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.subject || 'Estudo Geral'} • {s.duration_minutes} min</span>
                               </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-black text-slate-900 dark:text-white">{new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(s.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};