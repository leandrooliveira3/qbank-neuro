
import React, { useEffect, useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router';
import { 
  BarChart2, TrendingUp, Target, Clock,
  Loader2, Zap, Brain, ChevronRight, Award, Activity,
  Info, PieChart, Star, ChevronDown, ChevronUp, X,
  Shield, Crown, Medal, Calendar, Scroll
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';
import { xpService, XP_LEGEND, MEDICAL_RANKS } from '../services/xpService';

interface SubjectStat {
    name: string;
    total: number;
    correct: number;
    perc: number;
    color: string;
}

interface XPBreakdown {
    category: string;
    total: number;
    percentage: number;
}

export const Stats: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [weakConcepts, setWeakConcepts] = useState<any[]>([]);
  const [strongConcepts, setStrongConcepts] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [globalAccuracy, setGlobalAccuracy] = useState(0);
  
  // XP States
  const [xpHistory, setXpHistory] = useState<any[]>([]);
  const [xpBreakdown, setXpBreakdown] = useState<XPBreakdown[]>([]);
  const [showXpDetails, setShowXpDetails] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleStartTargetedPractice = (topicName: string) => {
      navigate('/practice/session', { 
          state: { 
              config: { 
                  selectedBanks: [], 
                  selectedTopics: [topicName], 
                  selectedDifficulty: 'Todas', 
                  questionLimit: 10, 
                  immediateFeedback: true, 
                  practiceMode: 'all' 
              } 
          } 
      });
  };

  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'];

  useEffect(() => {
    const calculateStats = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [answers, questions, history] = await Promise.all([
                localDB.getAll('user_answers'),
                localDB.getAll('questions'),
                xpService.getHistory()
            ]);

            // --- ANSWER STATS ---
            const userAnswers = answers.filter(a => a.user_id === user.id);
            setTotalQuestions(userAnswers.length);
            
            const corrects = userAnswers.filter(a => a.is_correct).length;
            setGlobalAccuracy(userAnswers.length > 0 ? Math.round((corrects / userAnswers.length) * 100) : 0);

            const catMap: Record<string, { total: number; correct: number }> = {};
            const conceptMap: Record<string, { total: number; correct: number; category: string; mistakes: number }> = {};
            
            userAnswers.forEach(ans => {
                const q = questions.find(item => item.id === ans.question_id);
                const cat = q?.category || 'Geral';
                if (!catMap[cat]) catMap[cat] = { total: 0, correct: 0 };
                catMap[cat].total++;
                if (ans.is_correct) catMap[cat].correct++;

                // Granular concepts (uses subcategory, falls back to category)
                const concept = q?.subcategory || q?.category || 'Geral';
                if (!conceptMap[concept]) {
                    conceptMap[concept] = { total: 0, correct: 0, category: cat, mistakes: 0 };
                }
                conceptMap[concept].total++;
                if (ans.is_correct) {
                    conceptMap[concept].correct++;
                } else {
                    conceptMap[concept].mistakes++;
                }
            });

            const processed = Object.entries(catMap).map(([name, data], idx) => ({
                name,
                total: data.total,
                correct: data.correct,
                perc: Math.round((data.correct / data.total) * 100),
                color: colors[idx % colors.length]
            })).sort((a, b) => b.total - a.total);

            setSubjectStats(processed);

            const processedConcepts = Object.entries(conceptMap).map(([name, data]) => {
                const parsedPerc = Math.min(100, Math.round((data.correct / data.total) * 100));
                return {
                    name,
                    category: data.category,
                    total: data.total,
                    correct: data.correct,
                    mistakes: data.mistakes,
                    perc: parsedPerc
                };
            });

            // Weakest: accuracy < 75% and has at least 1 mistake, sorted by lower accuracy.
            setWeakConcepts(
                processedConcepts
                    .filter(c => c.perc < 75 && c.mistakes > 0)
                    .sort((a, b) => {
                        if (a.perc !== b.perc) return a.perc - b.perc;
                        return b.mistakes - a.mistakes; // more mistakes first
                    })
                    .slice(0, 5)
            );

            // Strongest: accuracy >= 75%, sorted by highest accuracy and volume.
            setStrongConcepts(
                processedConcepts
                    .filter(c => c.perc >= 75 && c.total >= 1)
                    .sort((a, b) => {
                        if (b.perc !== a.perc) return b.perc - a.perc;
                        return b.total - a.total; // higher volume first
                    })
                    .slice(0, 5)
            );

            // --- XP STATS ---
            const userXpHistory = history.filter(h => h.user_id === user.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setXpHistory(userXpHistory);
            
            const xpMap: Record<string, number> = {};
            let totalXpRecorded = 0;
            
            userXpHistory.forEach(h => {
                const cat = h.category || 'Geral';
                xpMap[cat] = (xpMap[cat] || 0) + h.amount;
                totalXpRecorded += h.amount;
            });

            const breakdown = Object.entries(xpMap).map(([category, total]) => ({
                category,
                total,
                percentage: totalXpRecorded > 0 ? Math.round((total / totalXpRecorded) * 100) : 0
            })).sort((a, b) => b.total - a.total);
            
            setXpBreakdown(breakdown);

        } finally { setLoading(false); }
    };
    calculateStats();
  }, [user?.id]);

  // Level Calculations
  const currentLevelData = useMemo(() => {
      const lvl = user?.level || 1;
      const current = MEDICAL_RANKS.find(r => r.level === lvl) || MEDICAL_RANKS[0];
      const next = MEDICAL_RANKS.find(r => r.level === lvl + 1);
      
      const currentXP = user?.xp || 0;
      const xpInLevel = currentXP - current.minXp;
      const xpNeeded = next ? next.minXp - current.minXp : 1;
      const progress = next ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;
      
      return { current, next, progress, xpInLevel, xpNeeded };
  }, [user?.id]);

  // Helper para renderizar a medalha visualmente
  const RenderMedal = ({ level }: { level: number }) => {
      let icon = <Shield className="h-4 w-4" />;
      let style = "bg-amber-700 text-amber-100 border-amber-600"; // Bronze (1-5)

      if (level >= 6 && level <= 10) {
          icon = <Award className="h-4 w-4" />;
          style = "bg-slate-400 text-slate-100 border-slate-300"; // Silver
      } else if (level >= 11 && level <= 15) {
          icon = <Medal className="h-4 w-4" />;
          style = "bg-yellow-400 text-yellow-900 border-yellow-300 shadow-yellow-500/20"; // Gold
      } else if (level >= 16 && level <= 19) {
          icon = <Crown className="h-4 w-4" />;
          style = "bg-cyan-400 text-cyan-900 border-cyan-300 shadow-cyan-500/30"; // Platinum
      } else if (level === 20) {
          icon = <Zap className="h-4 w-4 fill-current animate-pulse" />;
          style = "bg-purple-600 text-white border-purple-400 shadow-purple-500/50 shadow-lg"; // God
      }

      return (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 shadow-sm ${style}`}>
              {icon}
          </div>
      );
  };

  return (
    <Layout title="Insights e Analytics">
      <div className="w-full space-y-6 animate-in fade-in duration-500 pb-16">
        
        <header className="flex justify-between items-center w-full">
            <div>
                <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest inline-block mb-1">Performance Metrics</div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Visão Geral</h1>
            </div>
            <button onClick={() => setShowLegend(true)} className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors shadow-sm">
                <Info className="h-3.5 w-3.5" /> Tabela de Pontos
            </button>
        </header>

        {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
        ) : (
            <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {[
                        { icon: Target, label: 'Respondidas', value: totalQuestions, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { icon: TrendingUp, label: 'Acurácia', value: `${globalAccuracy}%`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { icon: Brain, label: 'Temas', value: subjectStats.length, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                        { icon: Star, label: 'XP Total', value: user?.xp || 0, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-900 shadow-sm w-full">
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} w-fit mb-3`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</span>
                            <p className="text-[8px] font-black uppercase text-slate-400 mt-0.5 tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* XP BREAKDOWN WIDGET (CLICKABLE) */}
                <div 
                    onClick={() => setShowHistoryModal(true)}
                    className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden cursor-pointer group w-full transition-transform active:scale-[0.99]"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><Activity className="h-32 w-32" /></div>
                    
                    <div className="flex justify-between items-center relative z-10 mb-4">
                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-400" /> Detalhamento de Experiência</h3>
                        <div className="bg-white/10 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors flex items-center gap-1">
                            Ver Histórico <ChevronRight className="h-3 w-3" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div>
                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Nível Atual</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tighter">{user?.level || 1}</span>
                                <div>
                                    <span className="text-sm font-bold opacity-90 block leading-none">{currentLevelData.current.title}</span>
                                    {currentLevelData.next && (
                                        <span className="text-[8px] opacity-60">Próximo: {currentLevelData.next.title}</span>
                                    )}
                                </div>
                            </div>
                            {/* Mini Progress Bar inside Widget */}
                            <div className="mt-3 w-full max-w-xs">
                                <div className="flex justify-between text-[7px] font-bold uppercase opacity-60 mb-1">
                                    <span>Progresso</span>
                                    <span>{Math.round(currentLevelData.progress)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${currentLevelData.progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Compact Breakdown Preview */}
                        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 hidden md:block">
                            <h4 className="text-[9px] font-black uppercase tracking-widest mb-3 opacity-80 border-b border-white/20 pb-2">Origem do XP (Top 3)</h4>
                            <div className="space-y-2">
                                {xpBreakdown.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold">{item.category}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1 bg-black/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-400" style={{ width: `${item.percentage}%` }}></div>
                                            </div>
                                            <span className="font-black text-yellow-400">{item.total}</span>
                                        </div>
                                    </div>
                                ))}
                                {xpBreakdown.length === 0 && <p className="text-[9px] italic opacity-50">Sem histórico recente.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ADVANCED DIAGNOSTIC PANEL (AMBOSS/UWORLD STYLE) */}
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-900 shadow-sm w-full space-y-6">
                    <div className="border-b border-slate-100 dark:border-zinc-900 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <span className="bg-rose-500/10 text-rose-500 dark:text-rose-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-block mb-1">
                                Análise de Gaps Ativos
                            </span>
                            <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
                                <Activity className="h-5 w-5 text-rose-500" /> Diagnóstico de Conceitos Críticos
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                Identifique seus maiores pontos de atrito clínico e corrija instantaneamente.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                Meta Fellowship:
                            </span>
                            <span className="bg-emerald-500/10 text-emerald-500 text-xs font-black px-3 py-1 rounded-lg">
                                ≥75% de Acurácia
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* WEAKEST CONCEPTS (LACUNAS DE APRENDIZADO) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/20 pb-2">
                                <h4 className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4 rotate-180 text-rose-500" /> Lacunas de Desempenho (Treino Corretivo)
                                </h4>
                                <span className="text-[9px] text-slate-400 font-black uppercase">Foco Máximo</span>
                            </div>

                            {weakConcepts.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                                    <Brain className="h-8 w-8 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-normal">
                                        Nenhuma Lacuna Crítica Detectada!
                                    </p>
                                    <p className="text-[9px] text-slate-400 mt-1 max-w-xs mx-auto">
                                        Continue realizando simulados e respondendo a mais questões para calcular seus dados específicos de neurologia.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {weakConcepts.map((item, index) => (
                                        <div 
                                            key={index} 
                                            className="p-3.5 bg-rose-50/30 dark:bg-rose-950/5 rounded-2xl border border-rose-100/50 dark:border-rose-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-rose-200 dark:hover:border-rose-900/30 transition-all shadow-sm"
                                        >
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 leading-none">
                                                    #{index + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight truncate">
                                                        {item.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-black bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded uppercase">
                                                            {item.mistakes} Erros
                                                        </span>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">
                                                            Subgrupo de {item.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-rose-100/50 pt-2 sm:pt-0">
                                                <div className="text-left sm:text-right">
                                                    <span className="text-sm font-black text-rose-600 dark:text-rose-400 block leading-tight">
                                                        {item.perc}%
                                                    </span>
                                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">
                                                        Acurácia
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => handleStartTargetedPractice(item.name)}
                                                    className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                                                >
                                                    Praticar <ChevronRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* STRONGEST CONCEPTS (PONTOS FORTES) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/20 pb-2">
                                <h4 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                                    <Award className="h-4 w-4 text-emerald-500" /> Domínios Clínicos (Seus Pontos Fortes)
                                </h4>
                                <span className="text-[9px] text-slate-400 font-black uppercase">Consolidado</span>
                            </div>

                            {strongConcepts.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                                    <Award className="h-8 w-8 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-normal">
                                        Nenhum Tema Consolidado Ainda
                                    </p>
                                    <p className="text-[9px] text-slate-400 mt-1 max-w-xs mx-auto">
                                        Continue respondendo a mais questões corretamente em simulados e práticas para visualizar seus maiores domínios.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {strongConcepts.map((item, index) => (
                                        <div 
                                            key={index} 
                                            className="p-3.5 bg-emerald-50/30 dark:bg-emerald-950/5 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/10 flex items-center justify-between gap-3 hover:border-emerald-200 dark:hover:border-emerald-900/30 transition-all shadow-sm"
                                        >
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 leading-none">
                                                    #{index + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight truncate font-bold">
                                                        {item.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded uppercase">
                                                            {item.total} Vistos
                                                        </span>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">
                                                            {item.correct} Acertos
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
                                                    {item.perc}%
                                                </span>
                                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">
                                                    Acurácia
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                    {/* ACCURACY CHART */}
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-6 rounded-[1.5rem] shadow-sm flex flex-col h-[400px]">
                        <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2 border-b border-slate-50 dark:border-zinc-900 pb-3"><BarChart2 className="h-3.5 w-3.5 text-primary" /> Acurácia por Tema</h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {subjectStats.length === 0 ? (
                                <p className="text-center text-slate-400 py-10 text-[9px] font-bold uppercase">Dados Insuficientes</p>
                            ) : subjectStats.map(s => (
                                <div key={s.name} className="space-y-1">
                                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500 truncate max-w-[150px]">{s.name}</span>
                                        <span className="text-slate-900 dark:text-white">{s.perc}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-50 dark:bg-zinc-900 rounded-full overflow-hidden border border-slate-100 dark:border-zinc-800">
                                        <div 
                                            className={`h-full ${s.color} transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]`} 
                                            style={{ width: `${s.perc}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-6 rounded-[1.5rem] shadow-sm flex flex-col h-[400px]">
                        <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2 border-b border-slate-50 dark:border-zinc-900 pb-3"><Award className="h-3.5 w-3.5 text-emerald-500" /> Detalhamento de Volume</h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                            {subjectStats.length === 0 ? (
                                <p className="text-center text-slate-400 py-10 text-[9px] font-bold uppercase">Sem registros</p>
                            ) : subjectStats.map(s => (
                                <div key={s.name} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2.5 w-2.5 rounded-full ${s.color}`}></div>
                                        <h4 className="font-black text-slate-900 dark:text-white text-[10px] uppercase truncate max-w-[120px]">{s.name}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 dark:text-white text-[11px] leading-none">{s.total}</p>
                                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Q. Totais</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        )}

        {/* Legend Modal */}
        {showLegend && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 relative max-h-[90vh] overflow-hidden flex flex-col">
                    <button onClick={() => setShowLegend(false)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-zinc-900 rounded-full hover:text-red-500"><X className="h-4 w-4" /></button>
                    <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> Sistema de Progressão</h3>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8 pr-2">
                        {/* XP VALUES */}
                        <div>
                            <h4 className="text-xs font-black uppercase text-purple-600 mb-3 tracking-widest border-b border-purple-100 dark:border-purple-900/30 pb-2">Pontuação (XP)</h4>
                            <div className="space-y-2">
                                {XP_LEGEND.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                                        <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{item.label}</span>
                                        <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-slate-400 mt-4 uppercase font-bold tracking-widest text-center">Bônus Diário e Streaks aplicados automaticamente.</p>
                        </div>

                        {/* RANKS TABLE */}
                        <div>
                            <h4 className="text-xs font-black uppercase text-orange-500 mb-3 tracking-widest border-b border-orange-100 dark:border-orange-900/30 pb-2">Patentes & Medalhas</h4>
                            <div className="space-y-1">
                                {MEDICAL_RANKS.map((rank) => (
                                    <div key={rank.level} className={`flex justify-between items-center p-2.5 rounded-xl border transition-all ${user?.level === rank.level ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500/50 shadow-md transform scale-[1.02]' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900'}`}>
                                        <div className="flex items-center gap-3">
                                            <RenderMedal level={rank.level} />
                                            <div>
                                                <span className={`text-[10px] font-black uppercase block leading-tight ${user?.level === rank.level ? 'text-orange-700 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {rank.title} {user?.level === rank.level && '(Atual)'}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Nível {rank.level}</span>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md">{rank.minXp.toLocaleString()} XP</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* DETAILED XP HISTORY MODAL */}
        {showHistoryModal && (
            <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
                <div className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden">
                    
                    {/* Header with Progress */}
                    <div className="p-8 bg-slate-900 text-white shrink-0 relative overflow-hidden">
                        <button onClick={() => setShowHistoryModal(false)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-20"><X className="h-5 w-5" /></button>
                        <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp className="h-32 w-32 text-white" /></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-end gap-4 mb-4">
                                <div className="bg-gradient-to-br from-yellow-400 to-orange-600 h-20 w-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg shadow-orange-500/30 text-white border-4 border-white/20">
                                    {user?.level}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{currentLevelData.current.title}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Total: {user?.xp} XP
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-300">
                                    <span>Progresso do Nível</span>
                                    <span>{Math.round(currentLevelData.xpInLevel)} / {currentLevelData.xpNeeded} XP</span>
                                </div>
                                <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-400 to-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                                        style={{ width: `${currentLevelData.progress}%` }} 
                                    />
                                </div>
                                {currentLevelData.next && (
                                    <p className="text-[9px] text-center font-medium text-slate-500 uppercase mt-1">Próxima Patente: <span className="text-white font-bold">{currentLevelData.next.title}</span></p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-black p-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 ml-2 flex items-center gap-2 sticky top-0 bg-slate-50 dark:bg-black py-2 z-10">
                            <Scroll className="h-3.5 w-3.5" /> Histórico de Atividades
                        </h4>
                        
                        <div className="space-y-3">
                            {xpHistory.length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <Award className="h-12 w-12 mx-auto mb-2" />
                                    <p className="text-xs font-black uppercase">Nenhum registro encontrado</p>
                                </div>
                            ) : xpHistory.map((item) => (
                                <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            item.category === 'Questões' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                                            item.category === 'Simulados' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' :
                                            item.category === 'Flashcards' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' :
                                            'bg-orange-50 dark:bg-orange-900/20 text-orange-500'
                                        }`}>
                                            {item.category === 'Questões' ? <Brain className="h-5 w-5" /> : 
                                             item.category === 'Simulados' ? <Target className="h-5 w-5" /> :
                                             item.category === 'Flashcards' ? <Zap className="h-5 w-5" /> :
                                             <Star className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-tight">{item.label}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                    <Calendar className="h-2.5 w-2.5" /> {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                    <Clock className="h-2.5 w-2.5" /> {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">+{item.amount}</span>
                                        <span className="text-[8px] font-black uppercase text-slate-400 block">XP</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};
