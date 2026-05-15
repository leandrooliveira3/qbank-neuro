
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';
import { Task, Goal, TaskStatus } from '../types';
import { 
  Plus, CheckCircle2, Circle, AlertCircle, 
  Trash2, Edit2, Loader2, Calendar, Target,
  Filter, ChevronRight, CheckSquare, Clock,
  Layout as LayoutIcon, List
} from 'lucide-react';

export const Tasks: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'Todas' | TaskStatus>('Todas');

  useEffect(() => {
    loadData();
    window.addEventListener('neuro_sync_completed', loadData);
    return () => window.removeEventListener('neuro_sync_completed', loadData);
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tData, gData] = await Promise.all([
        localDB.getAll('tasks'),
        localDB.getAll('goals')
      ]);
      setTasks(tData.filter(t => t.user_id === user.id));
      setGoals(gData.filter(g => g.user_id === user.id));
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!user) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: 'Nova Atividade Acadêmica',
      category: 'Geral',
      deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: 'Média',
      status: 'Pendente',
      created_at: new Date().toISOString()
    };
    await syncEngine.enqueue('tasks', newTask);
    setTasks([newTask, ...tasks]);
  };

  const toggleStatus = async (task: Task) => {
    const statusMap: Record<TaskStatus, TaskStatus> = {
      'Pendente': 'Em Progresso',
      'Em Progresso': 'Concluída',
      'Concluída': 'Pendente'
    };
    const updated = { ...task, status: statusMap[task.status] };
    await syncEngine.enqueue('tasks', updated);
    setTasks(tasks.map(t => t.id === task.id ? updated : t));
  };

  const deleteTask = async (id: string) => {
    if (confirm('Excluir tarefa?')) {
      await syncEngine.enqueue('tasks', { id }, 'delete');
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const filteredTasks = tasks.filter(t => activeFilter === 'Todas' || t.status === activeFilter);

  return (
    <Layout title="Plano de Trabalho" fullWidth>
      <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
        
        {/* HEADER AREA */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 flex-wrap">
          <div className="flex items-center gap-3">
             <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                 <LayoutIcon className="h-5 w-5 text-primary" />
             </div>
             <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Gerenciamento de Tarefas</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Productivity System</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
              <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
                {['Todas', 'Pendente', 'Em Progresso', 'Concluída'].map(f => (
                    <button
                    key={f}
                    onClick={() => setActiveFilter(f as any)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        activeFilter === f 
                        ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    >
                    {f} <span className="ml-1 opacity-40">({f === 'Todas' ? tasks.length : tasks.filter(t => t.status === f).length})</span>
                    </button>
                ))}
              </div>
              <button 
                onClick={addTask}
                className="bg-primary hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all shrink-0 w-full md:w-auto justify-center"
              >
                <Plus className="h-4 w-4 mr-2" /> NOVA TAREFA
              </button>
          </div>
        </header>

        {/* MAIN CONTENT GRID */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* TASKS LIST */}
            <div className="lg:col-span-2 flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><List className="h-4 w-4 text-primary" /> Lista de Atividades</h3>
                    <span className="text-[9px] font-bold text-slate-400">{filteredTasks.length} Itens</span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                            <CheckSquare className="h-16 w-16 mb-4 text-slate-300" />
                            <p className="font-black text-xs uppercase tracking-widest">Nenhuma atividade encontrada</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                        <div key={task.id} className="group bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-all shadow-sm">
                            <button onClick={() => toggleStatus(task)} className="shrink-0 transition-transform active:scale-90">
                            {task.status === 'Concluída' ? (
                                <div className="h-6 w-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20"><CheckCircle2 className="h-4 w-4 text-white" /></div>
                            ) : task.status === 'Em Progresso' ? (
                                <div className="h-6 w-6 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse"><Clock className="h-4 w-4 text-white" /></div>
                            ) : (
                                <div className="h-6 w-6 border-2 border-slate-200 dark:border-zinc-700 rounded-lg" />
                            )}
                            </button>
                            <div className="flex-1 min-w-0">
                            <h3 className={`font-black text-xs md:text-sm uppercase tracking-tight truncate ${task.status === 'Concluída' ? 'text-slate-300 line-through' : 'text-slate-900 dark:text-white'}`}>
                                {task.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-[8px] font-bold uppercase tracking-widest text-slate-400">
                                <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-primary/80">{task.category}</span>
                                <span className="flex items-center"><Calendar className="h-2.5 w-2.5 mr-1" /> {task.deadline}</span>
                            </div>
                            </div>
                            <div className="flex items-center gap-3">
                            <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                task.priority === 'Alta' ? 'bg-red-50 text-red-600 border border-red-100' :
                                task.priority === 'Média' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                                {task.priority}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-slate-400"><Edit2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => deleteTask(task.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </div>

            {/* SIDEBAR: GOALS & STATS */}
            <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-1">
                <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden group shrink-0">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Target className="h-24 w-24" /></div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2"><Target className="h-4 w-4 text-emerald-400" /> Metas Estratégicas</h4>
                    <div className="space-y-4 relative z-10">
                        {(goals.length === 0 ? [
                            { title: 'Dominar Neurovascular', progress: 65, category: 'Vascular', deadline: '2024-06-30' },
                            { title: 'Simulados de Residência', progress: 25, category: 'Geral', deadline: '2024-11-15' }
                        ] : goals).map((g, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 shadow-inner hover:bg-white/10 transition-colors cursor-default">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <h4 className="font-black text-[10px] uppercase text-white truncate">{g.title}</h4>
                                        <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{g.category} • {g.deadline}</p>
                                    </div>
                                    <span className="text-sm font-black text-emerald-400 tracking-tighter">{g.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-1000" style={{ width: `${g.progress}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 flex flex-col gap-4 shadow-sm flex-1">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-zinc-900 pb-3">Eficiência Semanal</h4>
                    <div className="flex-1 flex items-end justify-between gap-2 h-32">
                        {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end group">
                                <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-t-lg group-hover:bg-primary/20 transition-colors relative overflow-hidden" style={{ height: `${h}%` }}>
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-300">
                        <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </Layout>
  );
};
