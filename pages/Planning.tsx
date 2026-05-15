
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';
import { 
  Calendar, Clock, Target, Plus, ChevronRight, 
  CheckCircle2, Flame, Trophy, BookOpen, GraduationCap,
  Loader2, Map
} from 'lucide-react';

interface PlanEvent {
    id: string;
    title: string;
    date: string;
    type: 'study' | 'exam' | 'review';
    completed: boolean;
}

export const Planning: React.FC = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<PlanEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
      loadPlanning(); 
      window.addEventListener('neuro_sync_completed', loadPlanning);
      return () => window.removeEventListener('neuro_sync_completed', loadPlanning);
  }, [user]);

  const loadPlanning = async () => {
    if (!user) return;
    setLoading(true);
    const data = await localDB.getAll('planning');
    setEvents(data.filter(e => e.user_id === user.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setLoading(false);
  };

  const addQuickStudy = async () => {
      if (!user) return;
      const newEvent: any = {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: 'Sessão de Estudo Focada',
          date: new Date().toISOString().split('T')[0],
          type: 'study',
          completed: false
      };
      await syncEngine.enqueue('planning', newEvent);
      setEvents([...events, newEvent]);
  };

  const toggleEvent = async (event: PlanEvent) => {
      const updated = { ...event, completed: !event.completed };
      await syncEngine.enqueue('planning', updated);
      setEvents(events.map(e => e.id === event.id ? updated : e));
  };

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();

  return (
    <Layout title="Cronograma" fullWidth>
      <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden space-y-6">
        
        {/* HEADER */}
        <header className="flex justify-between items-center bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-900 shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-2xl text-purple-600 hidden md:block">
                    <Map className="h-6 w-6" />
                </div>
                <div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-block mb-1">Academic Roadmap</div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Plano de Especialista</h1>
                </div>
            </div>
            <button onClick={addQuickStudy} className="bg-primary hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center transition-all active:scale-95">
                <Plus className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">NOVO EVENTO</span><span className="sm:hidden">NOVO</span>
            </button>
        </header>

        {/* CALENDAR STRIP */}
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[1.5rem] p-4 shrink-0 shadow-sm overflow-x-auto no-scrollbar">
            <div className="flex gap-3 justify-between min-w-[600px] md:min-w-0">
                {[...Array(7)].map((_, i) => {
                    const day = new Date();
                    day.setDate(today.getDate() + i);
                    const isToday = i === 0;
                    return (
                        <div key={i} className={`flex-1 flex flex-col items-center p-4 rounded-2xl border-2 transition-all cursor-default group hover:border-primary/30 ${isToday ? 'bg-primary border-primary text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 dark:bg-zinc-900 border-transparent text-slate-400'}`}>
                            <span className={`text-[8px] font-black uppercase mb-1 tracking-widest ${isToday ? 'text-white/70' : 'text-slate-400'}`}>{days[day.getDay()]}</span>
                            <span className={`text-xl font-black ${isToday ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{day.getDate()}</span>
                            {isToday && <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* MAIN GRID */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            
            {/* EVENTS LIST */}
            <div className="lg:col-span-2 flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-sm h-full">
                <div className="p-6 border-b border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Prioridades do Mês</h3>
                    <span className="text-[9px] font-black bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300">{events.length} Eventos</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                    {loading ? (
                        <div className="h-full flex items-center justify-center opacity-30"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : events.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                            <BookOpen className="h-16 w-16 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest">Agenda Vazia</p>
                        </div>
                    ) : (
                        events.map(event => (
                            <div key={event.id} className="p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => toggleEvent(event)} className="shrink-0 transition-all active:scale-90">
                                        {event.completed ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <div className="h-6 w-6 rounded-full border-2 border-slate-200 dark:border-zinc-700 hover:border-primary" />}
                                    </button>
                                    <div className="min-w-0">
                                        <h4 className={`text-xs font-black uppercase tracking-tight truncate max-w-[200px] sm:max-w-[400px] ${event.completed ? 'text-slate-300 line-through' : 'text-slate-900 dark:text-white'}`}>{event.title}</h4>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-2 mt-1">
                                            <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {new Date(event.date).toLocaleDateString()}</span>
                                            <span className={`px-1.5 py-0.5 rounded ${event.type === 'exam' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>{event.type}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="p-2 rounded-xl text-slate-300 group-hover:text-primary group-hover:bg-white dark:group-hover:bg-zinc-800 transition-all">
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* SIDEBAR STATS */}
            <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-1">
                <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group shrink-0">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><Flame className="h-24 w-24 text-orange-500" /></div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center"><Trophy className="h-4 w-4 mr-2 text-yellow-500" /> Streak de Estudo</h4>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-6xl font-black tracking-tighter leading-none">12</span>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">dias</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">consecutivos</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2.5rem] p-8 shadow-sm space-y-6 flex-1">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Meta Diária</span>
                            <span className="text-2xl font-black text-primary tracking-tighter">85%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: '85%' }} />
                        </div>
                    </div>
                    
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-3xl relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-3 relative z-10">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600"><GraduationCap className="h-5 w-5" /></div>
                            <h4 className="text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-widest">Título de Especialista</h4>
                        </div>
                        <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter leading-none relative z-10">42 <span className="text-[10px] uppercase font-bold text-emerald-600/60 ml-1">dias restantes</span></p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};
