
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { AlertTriangle, CheckCircle, TrendingUp, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { localDB } from '../services/localDB';

export const Analysis: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [weaknesses, setWeaknesses] = useState<{name: string, acc: number}[]>([]);
  const [strengths, setStrengths] = useState<{name: string, acc: number}[]>([]);
  
  useEffect(() => {
      const analyze = async () => {
          if(!user) return;
          try {
              const answers = await localDB.getAll('user_answers');
              const questions = await localDB.getAll('questions');
              const userAnswers = answers.filter(a => a.user_id === user.id);

              if (userAnswers.length < 5) {
                  setLoading(false);
                  return;
              }

              const catMap: Record<string, { total: number, correct: number }> = {};
              userAnswers.forEach((a: any) => {
                const q = questions.find(item => item.id === a.question_id);
                const cat = q?.category || 'Geral';
                if (!catMap[cat]) catMap[cat] = { total: 0, correct: 0 };
                catMap[cat].total++;
                if (a.is_correct) catMap[cat].correct++;
              });

              const analysis = Object.entries(catMap).map(([name, s]) => ({
                  name,
                  acc: (s.correct / s.total) * 100,
                  total: s.total
              })).filter(c => c.total >= 1);

              setWeaknesses(analysis.filter(c => c.acc < 60).sort((a,b) => a.acc - b.acc));
              setStrengths(analysis.filter(c => c.acc >= 75).sort((a,b) => b.acc - a.acc));
          } finally { setLoading(false); }
      };
      analyze();
  }, [user]);

  return (
    <Layout title="Análise Cognitiva">
        <div className="h-full flex flex-col space-y-4 overflow-hidden">
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Processando Metadados...</span>
                </div>
            ) : weaknesses.length === 0 && strengths.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6">
                    <div className="p-6 bg-yellow-500/10 rounded-full"><Lightbulb className="h-12 w-12 text-yellow-500" /></div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Dados Insuficientes</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">Responda mais questões para mapear seu padrão neurocognitivo de erros.</p>
                    </div>
                    <button onClick={() => navigate('/practice')} className="bg-primary text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">TREINAR AGORA</button>
                </div>
            ) : (
                <>
                    <div className="bg-slate-900 text-white p-5 rounded-[1.5rem] shadow-xl flex items-start space-x-4 shrink-0 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="h-12 w-12" /></div>
                        <div className="p-2.5 bg-yellow-500/20 rounded-xl text-yellow-400 shrink-0"><Lightbulb className="h-5 w-5" /></div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xs font-black uppercase tracking-widest mb-1">Prioridade de Estudo</h2>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed truncate">
                                Foco sugerido: <span className="text-white font-black">{weaknesses[0]?.name || "Consolidação Geral"}</span>. Acurácia abaixo da média esperada.
                            </p>
                        </div>
                        <button onClick={() => navigate('/practice')} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><ArrowRight className="h-4 w-4" /></button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[1.5rem] p-5 flex flex-col overflow-hidden shadow-sm">
                            <h3 className="text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center mb-4 shrink-0">
                                <AlertTriangle className="h-3.5 w-3.5 mr-2" /> Pontos de Atenção
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                                {weaknesses.length > 0 ? weaknesses.map(w => (
                                    <div key={w.name} className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 flex justify-between items-center group hover:border-red-500/30 transition-all">
                                        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 truncate pr-2">{w.name}</span>
                                        <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-black">{w.acc.toFixed(0)}%</span>
                                    </div>
                                )) : <div className="h-full flex items-center justify-center opacity-20 text-[9px] font-black uppercase">Nenhuma falha crítica</div>}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[1.5rem] p-5 flex flex-col overflow-hidden shadow-sm">
                            <h3 className="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center mb-4 shrink-0">
                                <CheckCircle className="h-3.5 w-3.5 mr-2" /> Domínios Masterizados
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                                {strengths.length > 0 ? strengths.map(s => (
                                    <div key={s.name} className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                                        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 truncate pr-2">{s.name}</span>
                                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-black">{s.acc.toFixed(0)}%</span>
                                    </div>
                                )) : <div className="h-full flex items-center justify-center opacity-20 text-[9px] font-black uppercase">Continue praticando</div>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    </Layout>
  );
};
