
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Activity, ShieldAlert, Zap, Brain, CheckCircle2, ChevronRight, Info, Baby, FileText, AlertCircle, Scan, Bone, Target } from 'lucide-react';

const CANADIAN_CT_RULE = [
  { id: 'c1', text: 'GCS < 15 após 2 horas do trauma' },
  { id: 'c2', text: 'Suspeita de fratura de base de crânio (Guaxinim, Battle, Hemotímpano)' },
  { id: 'c3', text: 'Suspeita de fratura exposta ou afundamento' },
  { id: 'c4', text: 'Vômitos (>= 2 episódios)' },
  { id: 'c5', text: 'Idade >= 65 anos' },
  { id: 'c6', text: 'Amnésia retrógrada significativa (> 30 min)' },
  { id: 'c7', text: 'Mecanismo perigoso (Atropelamento, queda > 1m ou 5 degraus)' }
];

const NEXUS_CRITERIA = [
    { id: 'n1', text: 'Sensibilidade na linha média posterior cervical' },
    { id: 'n2', text: 'Evidência de intoxicação (álcool/drogas)' },
    { id: 'n3', text: 'Nível de alerta alterado (GCS < 15)' },
    { id: 'n4', text: 'Déficit neurológico focal' },
    { id: 'n5', text: 'Lesão dolorosa distrativa (ex: fratura de fêmur)' }
];

const ATLS_TARGETS = [
    { param: 'Pressão Sistólica (PAS)', target: '≥ 100 mmHg (50-69 anos) ou ≥ 110 mmHg (15-49 ou >70)', obs: 'Evitar hipotensão a todo custo.' },
    { param: 'Oximetria (SpO2)', target: '≥ 98%', obs: 'Evitar hipóxia.' },
    { param: 'PaCO2', target: '35 - 45 mmHg', obs: 'Evitar hiperventilação profilática (risco de isquemia).' },
    { param: 'Glicose', target: '80 - 180 mg/dL', obs: 'Evitar hipo e hiperglicemia.' },
    { param: 'Sódio Sérico', target: '135 - 145 mEq/L', obs: 'Evitar hiponatremia (risco de edema).' },
    { param: 'INR', target: '≤ 1.4', obs: 'Reverter anticoagulação imediatamente.' },
    { param: 'Plaquetas', target: '≥ 75.000', obs: 'Transfundir se necessário para procedimentos.' },
    { param: 'Temperatura', target: '36 - 38°C', obs: 'Normotermia é essencial.' }
];

const MYOTOMES = [
    { level: 'C5', func: 'Abdução do Ombro (Deltoide)' },
    { level: 'C6', func: 'Flexão do Cotovelo / Extensão Punho' },
    { level: 'C7', func: 'Extensão do Cotovelo (Tríceps)' },
    { level: 'C8', func: 'Flexão dos Dedos (Preensão)' },
    { level: 'T1', func: 'Abdução do Dedo Mínimo' },
    { level: 'L2', func: 'Flexão do Quadril (Iliopsoas)' },
    { level: 'L3', func: 'Extensão do Joelho (Quadríceps)' },
    { level: 'L4', func: 'Dorsiflexão do Tornozelo' },
    { level: 'L5', func: 'Extensão do Hálux' },
    { level: 'S1', func: 'Flexão Plantar' }
];

const ROTTERDAM_DATA = [
    { 
        id: 'cisterns', 
        title: 'Cisternas Basais', 
        options: [
            { v: 0, l: 'Normais' },
            { v: 1, l: 'Comprimidas' },
            { v: 2, l: 'Ausentes' }
        ]
    },
    { 
        id: 'shift', 
        title: 'Desvio de Linha Média', 
        options: [
            { v: 0, l: '≤ 5 mm' },
            { v: 1, l: '> 5 mm' }
        ]
    },
    { 
        id: 'mass', 
        title: 'Massa Epidural', 
        options: [
            { v: 0, l: 'Presente' },
            { v: 1, l: 'Ausente' }
        ]
    },
    { 
        id: 'hemorrhage', 
        title: 'Sangue Intraventricular / HSA', 
        options: [
            { v: 0, l: 'Ausente' },
            { v: 1, l: 'Presente' }
        ]
    }
];

export const NeuroTraumaTool: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'scales' | 'spinal' | 'targets' | 'rotterdam'>('scales');
  const [canadianChecks, setCanadianChecks] = useState<Set<string>>(new Set());
  const [nexusChecks, setNexusChecks] = useState<Set<string>>(new Set());
  const [rotterdamScores, setRotterdamScores] = useState<Record<string, number>>({});

  const toggleCheck = (id: string, set: Set<string>, setter: any) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const rotterdamTotal = useMemo(() => {
      // Base score = 1 (somar valores)
      const sum = (Object.values(rotterdamScores) as number[]).reduce((a, b) => a + b, 0);
      return sum + 1;
  }, [rotterdamScores]);

  const rotterdamMortality = useMemo(() => {
      if (rotterdamTotal <= 1) return '0%';
      if (rotterdamTotal === 2) return '7%';
      if (rotterdamTotal === 3) return '16%';
      if (rotterdamTotal === 4) return '26%';
      if (rotterdamTotal === 5) return '53%';
      return '61%';
  }, [rotterdamTotal]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Neurotraumatologia (ATLS 11)</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-40">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('scales')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'scales' ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>Clearance Cervical</button>
            <button onClick={() => setActiveTab('spinal')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'spinal' ? 'bg-white dark:bg-zinc-800 text-indigo-500 shadow-md' : 'text-slate-500'}`}>Medula (ASIA)</button>
            <button onClick={() => setActiveTab('targets')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'targets' ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-md' : 'text-slate-500'}`}>Metas ATLS</button>
            <button onClick={() => setActiveTab('rotterdam')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'rotterdam' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-md' : 'text-slate-500'}`}>Rotterdam</button>
        </div>

        {activeTab === 'scales' && (
            <div className="space-y-8 animate-in fade-in pb-20">
                <section>
                    <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-xl mb-4">
                        <h3 className="font-black uppercase tracking-tight text-lg mb-1">Canadian CT Head Rule</h3>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Indicação de TC no TCE Leve (GCS 13-15)</p>
                    </div>
                    <div className="space-y-2">
                        {CANADIAN_CT_RULE.map(item => (
                            <button key={item.id} onClick={() => toggleCheck(item.id, canadianChecks, setCanadianChecks)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${canadianChecks.has(item.id) ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950'}`}>
                                <span className="text-xs font-bold leading-tight pr-4">{item.text}</span>
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${canadianChecks.has(item.id) ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                    {canadianChecks.has(item.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                                </div>
                            </button>
                        ))}
                    </div>
                    {canadianChecks.size > 0 && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-2xl">
                            <p className="text-red-700 dark:text-red-400 font-black text-xs uppercase tracking-widest">Conduta: TC de Crânio Obrigatória</p>
                        </div>
                    )}
                </section>

                <section>
                    <div className="bg-orange-500 text-white p-6 rounded-[2.5rem] shadow-xl mb-4">
                        <h3 className="font-black uppercase tracking-tight text-lg mb-1">Critérios NEXUS</h3>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Clearance Cervical sem Imagem</p>
                    </div>
                    <div className="space-y-2">
                        {NEXUS_CRITERIA.map(item => (
                            <button key={item.id} onClick={() => toggleCheck(item.id, nexusChecks, setNexusChecks)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${nexusChecks.has(item.id) ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950'}`}>
                                <span className="text-xs font-bold leading-tight pr-4">{item.text}</span>
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${nexusChecks.has(item.id) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                                    {nexusChecks.has(item.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className={`mt-4 p-4 rounded-2xl border-l-4 transition-all ${nexusChecks.size === 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500' : 'bg-red-50 dark:bg-red-950/20 border-red-500'}`}>
                        <p className={`font-black text-xs uppercase tracking-widest ${nexusChecks.size === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                            {nexusChecks.size === 0 ? 'Baixo Risco: Colar pode ser removido (se rotação 45º indolor)' : 'Alto Risco: Manter Imobilização + TC Coluna'}
                        </p>
                    </div>
                </section>
            </div>
        )}

        {activeTab === 'rotterdam' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-rose-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-black uppercase tracking-tight text-lg mb-1">Escore de Rotterdam</h3>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Prognóstico em TCE (Mortalidade 6 meses)</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-2xl text-center backdrop-blur-sm">
                        <div className="text-3xl font-black">{rotterdamTotal}</div>
                        <div className="text-[7px] font-black uppercase">Pontos</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ROTTERDAM_DATA.map(cat => (
                        <div key={cat.id} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[1.5rem] p-5">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">{cat.title}</h4>
                            <div className="space-y-2">
                                {cat.options.map(opt => (
                                    <button 
                                        key={opt.v} 
                                        onClick={() => setRotterdamScores(prev => ({...prev, [cat.id]: opt.v}))}
                                        className={`w-full text-left p-3 rounded-xl text-[11px] font-bold border-2 transition-all ${rotterdamScores[cat.id] === opt.v ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-700 dark:text-rose-300' : 'bg-slate-50 dark:bg-zinc-900 border-transparent text-slate-600'}`}
                                    >
                                        {opt.l} <span className="float-right opacity-50">+{opt.v}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-slate-900 rounded-[2rem] text-white text-center">
                    <p className="text-[9px] font-black uppercase text-rose-400 tracking-widest mb-2">Estimativa de Mortalidade (6 meses)</p>
                    <p className="text-5xl font-black tracking-tighter">{rotterdamMortality}</p>
                </div>
            </div>
        )}

        {activeTab === 'spinal' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Bone className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Níveis Medulares (ASIA)</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Pontos Motores Chave</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MYOTOMES.map(m => (
                        <div key={m.level} className="flex items-center bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl p-4 shadow-sm">
                            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg shrink-0 mr-4">
                                {m.level}
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{m.func}</span>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-slate-50 dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Referências Sensoriais (Dermátomos)</h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        <p>C4 - Ombros</p>
                        <p>T4 - Mamilos</p>
                        <p>T10 - Umbigo</p>
                        <p>L4 - Joelho Medial</p>
                        <p>S1 - Lateral do Pé</p>
                        <p>S4-5 - Perianal</p>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'targets' && (
            <div className="space-y-6 animate-in fade-in pb-20">
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Target className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Metas de Ressuscitação</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Prevenção de Lesão Secundária</p></div>
                </div>
                <div className="space-y-3">
                    {ATLS_TARGETS.map((t, idx) => (
                        <div key={idx} className="bg-white dark:bg-zinc-950 border-l-4 border-emerald-500 rounded-r-2xl p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">{t.param}</h4>
                                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black px-2 py-1 rounded-lg uppercase">{t.target}</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic">{t.obs}</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                        <span className="font-black uppercase block mb-1">Doutrina de Monro-Kellie</span>
                        O volume intracraniano é fixo. Edema ou hematomas exigem redução compensatória de LCR ou sangue venoso. Se esgotado, a PIC sobe exponencialmente. Evite hipotensão e hipóxia a todo custo.
                    </p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
