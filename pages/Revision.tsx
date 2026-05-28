
import React, { useEffect, useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { 
  CalendarClock, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Play, 
  ChevronRight, 
  Loader2, 
  Activity,
  History,
  Zap,
  CheckCircle2,
  Layers,
  Brain
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router';
import { localDB } from '../services/localDB';
// Import Flashcard type
import { Flashcard } from '../types';

interface CategoryStats {
    name: string;
    total: number;
    accuracy: number;
    lastDate: string;
}

export const Revision: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [dueCardsCount, setDueCardsCount] = useState(0);
  // Add cards state to fix "Cannot find name 'cards'" error
  const [cards, setCards] = useState<Flashcard[]>([]);

  useEffect(() => { 
      loadData(); 
      // window.addEventListener('neuro_sync_completed', loadData);
      // return () => window.removeEventListener('neuro_sync_completed', loadData);
  }, [user?.id]);

  const loadData = async () => {
    if(!user) return;
    setLoading(true);
    try {
        // Analisar Questões via LocalDB (mais imediato e consistente com sync)
        const questions = await localDB.getAll('questions');
        const userAnswers = await localDB.getAll('user_answers');
        const allCards = await localDB.getAll('flashcards');

        const filteredAnswers = userAnswers.filter(a => a.user_id === user.id);
        const userCards = allCards.filter(c => c.user_id === user.id);

        const map: Record<string, { t: number, c: number, date: string }> = {};
        filteredAnswers.forEach((a: any) => {
            const questionId = a.question_id;
            const question = questions.find(q => q.id === questionId);
            const cat = question?.category || 'Geral';
            if(!map[cat]) map[cat] = { t: 0, c: 0, date: a.answered_at };
            map[cat].t++;
            if(a.is_correct) map[cat].c++;
            if(new Date(a.answered_at) > new Date(map[cat].date)) map[cat].date = a.answered_at;
        });

        const processed = Object.entries(map).map(([name, s]) => ({
            name, total: s.t, accuracy: (s.c / s.t) * 100, lastDate: s.date
        })).sort((a,b) => a.accuracy - b.accuracy);
        
        setStats(processed);
        setCards(userCards);

        const now = new Date();
        const due = userCards.filter(c => c.status !== 'inactive' && new Date(c.next_review) <= now).length;
        setDueCardsCount(due);

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const weakPoints = useMemo(() => stats.filter(s => s.accuracy < 70).slice(0, 3), [stats]);

  return (
    <Layout title="Centro de Revisão">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-5xl font-black text-slate-950 dark:text-white tracking-tighter">Plano de Retenção</h1>
                <p className="text-slate-700 dark:text-slate-500 text-xs font-black uppercase tracking-[0.3em] mt-2">Foco total em converter memória de curto prazo</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-zinc-950 p-1.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-900">
                <div className="px-6 py-3 rounded-xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 flex items-center shadow-sm">
                    <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">Eficiência Geral: 84%</span>
                </div>
            </div>
        </header>

        {loading ? (
             <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Weekly Plan Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Widget Flashcards */}
                    <div className="bg-emerald-600 p-8 rounded-[3rem] shadow-xl text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <Layers className="h-32 w-32" />
                        </div>
                        <div className="flex-1 z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-lg"><Brain className="h-5 w-5" /></div>
                                <h3 className="font-black text-xs uppercase tracking-widest">Revisão Espaçada (SRS)</h3>
                            </div>
                            <h4 className="text-3xl font-black tracking-tighter mb-2">{dueCardsCount} Flashcards Vencidos</h4>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Complete suas revisões diárias para máxima retenção.</p>
                        </div>
                        <button 
                            onClick={() => navigate('/flashcards/study')}
                            className="w-full md:w-auto bg-white text-emerald-700 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-slate-100 transition-all active:scale-95 z-10"
                        >
                            INICIAR CARDS
                        </button>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 border-2 border-slate-200 dark:border-zinc-900 p-8 rounded-[3rem] shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-xl text-slate-950 dark:text-white tracking-tight uppercase">Plano de Reforço em Questões</h3>
                            <span className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary/20">Prioridade 1</span>
                        </div>
                        <div className="space-y-4">
                            {weakPoints.length > 0 ? weakPoints.map(p => (
                                <div key={p.name} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-slate-100 dark:border-zinc-900 group hover:border-primary/40 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-red-500/10 p-3 rounded-xl"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
                                        <div>
                                            <h4 className="font-black text-slate-950 dark:text-white text-sm uppercase tracking-tight">{p.name}</h4>
                                            <p className="text-[9px] font-black text-slate-500 uppercase">Domínio: {p.accuracy.toFixed(0)}%</p>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/practice', { state: { config: { selectedTopics: [p.name], immediateFeedback: true, questionLimit: 15 } } })} className="bg-primary text-white p-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all"><Play className="h-4 w-4" /></button>
                                </div>
                            )) : (
                                <div className="p-10 text-center border-4 border-dashed border-slate-100 dark:border-zinc-900 rounded-[2rem]">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma fraqueza crítica detectada ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Column */}
                <div className="space-y-6">
                    <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl">
                        <h4 className="font-black text-xs uppercase text-slate-500 tracking-[0.2em] mb-8 flex items-center"><Target className="h-4 w-4 mr-2 text-primary" /> Metas de Conversão</h4>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cards Novos</span>
                                <span className="text-xl font-black">{cards.filter(c => c.status === 'new').length}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Em Aprendizado</span>
                                <span className="text-xl font-black text-primary">{cards.filter(c => c.status === 'learning').length}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Masterizados</span>
                                <span className="text-xl font-black text-emerald-500">{cards.filter(c => c.status === 'mastered').length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border-2 border-slate-200 dark:border-zinc-800 shadow-sm">
                         <div className="flex items-center gap-4 mb-6">
                            <Activity className="h-6 w-6 text-primary" />
                            <h4 className="font-black text-slate-950 dark:text-white uppercase text-xs tracking-widest">Saúde da Memória</h4>
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vencimento Hoje</span>
                                <span className={`text-[10px] font-black ${dueCardsCount > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{dueCardsCount} CARDS</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Frequência Semanal</span>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5,6,7].map(d => <div key={d} className={`h-1.5 w-1.5 rounded-full ${d < 5 ? 'bg-primary' : 'bg-slate-200'}`}></div>)}
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};
