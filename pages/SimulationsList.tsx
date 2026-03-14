
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Clock, Award, Calendar, ChevronRight, Loader2, Play, Target, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { localDB } from '../services/localDB';
import { useAuthStore } from '../store/useAuthStore';
import { syncEngine } from '../services/syncEngine';

interface SimulationSession {
    id: string;
    title: string;
    total_questions: number;
    correct_count: number;
    score_percentage: number;
    created_at: string;
    time_taken_seconds: number;
}

export const SimulationsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
        if (!user) return;
        const all = await localDB.getAll('simulation_sessions');
        setSessions(all.filter(s => s.user_id === user.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setLoading(false);
    };
    fetchSessions();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Excluir registro permanentemente?")) return;
      await syncEngine.enqueue('simulation_sessions', { id }, 'delete');
      setSessions(prev => prev.filter(s => s.id !== id));
  };

  const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-emerald-500';
      if (score >= 60) return 'text-blue-500';
      return 'text-red-500';
  };

  return (
    <Layout title="Meus Simulados">
      <div className="h-full flex flex-col space-y-4 overflow-hidden">
         
         <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-900 shrink-0 shadow-sm">
             <div>
                 <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Histórico de Performance</h1>
                 <p className="text-[8px] font-black text-primary uppercase tracking-widest">{sessions.length} simulados registrados</p>
             </div>
             <button onClick={() => navigate('/simulations/create')} className="bg-primary hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2">
                 <Plus className="h-4 w-4" /> NOVO SIMULADO
             </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
             <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-4 rounded-xl shadow-sm flex items-center justify-between">
                 <div><p className="text-[7px] font-black uppercase text-slate-400">Total Provas</p><p className="text-xl font-black text-slate-900 dark:text-white">{sessions.length}</p></div>
                 <div className="p-2 bg-primary/10 rounded-lg text-primary"><Target className="h-5 w-5" /></div>
             </div>
             <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-4 rounded-xl shadow-sm flex items-center justify-between">
                 <div><p className="text-[7px] font-black uppercase text-slate-400">Acurácia Média</p><p className="text-xl font-black text-emerald-500">{sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + Number(s.score_percentage), 0) / sessions.length) : 0}%</p></div>
                 <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Award className="h-5 w-5" /></div>
             </div>
             <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-4 rounded-xl shadow-sm flex items-center justify-between">
                 <div><p className="text-[7px] font-black uppercase text-slate-400">Tempo de Prova</p><p className="text-xl font-black text-blue-500">{Math.floor(sessions.reduce((acc, s) => acc + s.time_taken_seconds, 0) / 60)}m</p></div>
                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Clock className="h-5 w-5" /></div>
             </div>
         </div>

         <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl overflow-hidden flex flex-col shadow-sm">
             <div className="p-4 border-b border-slate-100 dark:border-zinc-900 shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registros de Avaliação</h3>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : sessions.length === 0 ? (
                    <div className="p-20 text-center opacity-30"><Award className="h-10 w-10 mx-auto mb-3" /><p className="text-[10px] font-black uppercase">Nenhum simulado finalizado</p></div>
                ) : (
                    <div className="divide-y divide-slate-50 dark:divide-zinc-900">
                        {sessions.map((session) => (
                            <div key={session.id} className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-xl flex flex-col items-center justify-center font-black text-xs border-2 bg-white dark:bg-zinc-900 ${getScoreColor(session.score_percentage)} border-current shadow-sm`}>
                                        {Math.round(session.score_percentage)}%
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{session.title}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest"><Calendar className="h-2 w-2 mr-1" /> {new Date(session.created_at).toLocaleDateString()}</span>
                                            <span className="flex items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest"><Clock className="h-2 w-2 mr-1" /> {Math.floor(session.time_taken_seconds / 60)} min</span>
                                            <span className="text-[8px] font-black text-primary uppercase">{session.correct_count}/{session.total_questions} ACERTOS</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden md:block w-24 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${session.score_percentage >= 70 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${session.score_percentage}%` }} />
                                    </div>
                                    <button onClick={(e) => handleDelete(session.id, e)} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
         </div>

      </div>
    </Layout>
  );
};
