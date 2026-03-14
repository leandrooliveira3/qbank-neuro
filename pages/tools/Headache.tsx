
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Thermometer, AlertTriangle, CheckCircle2, 
  Search, ShieldAlert, Activity, FileText, Zap, Brain, Clock
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const SNOOP10_DATA = [
    { acronym: 'S', title: 'Systemic Symptoms', desc: 'Febre, perda de peso, calafrios, mialgia.' },
    { acronym: 'N', title: 'Neoplasm History', desc: 'História de câncer prévio.' },
    { acronym: 'O', title: 'Neurologic Deficit (Old/New)', desc: 'Déficit neurológico focal (motor, sensitivo, visual, cognitivo).' },
    { acronym: 'O', title: 'Onset (Sudden)', desc: 'Início súbito/abrupto (Thunderclap). Pico < 1 min.' },
    { acronym: 'P', title: 'Papilledema', desc: 'Sinais de hipertensão intracraniana.' },
    { acronym: 'P', title: 'Positional', desc: 'Piora ao deitar ou levantar (Hipotensão/Hipertensão liquórica).' },
    { acronym: 'P', title: 'Precipitated by Valsalva', desc: 'Tosse, espirro, esforço físico.' },
    { acronym: 'P', title: 'Progressive', desc: 'Mudança no padrão habitual ou dor contínua crescente.' },
    { acronym: 'P', title: 'Pregnancy / Puerperium', desc: 'Gestação ou pós-parto.' },
    { acronym: 'P', title: 'Painkiller Overuse', desc: 'Abuso de analgésicos.' },
    { acronym: 'P', title: 'Post-traumatic', desc: 'História de trauma craniano recente.' },
    { acronym: 'P', title: 'Pathology of Immune System', desc: 'HIV, Imunossupressão.' },
];

const ICHD3_CRITERIA = [
    {
        id: 'migraine',
        name: 'Migrânea sem Aura (1.1)',
        icon: Zap,
        criteria: [
            'A. Pelo menos 5 crises preenchendo critérios B-D',
            'B. Duração: 4 a 72 horas (sem tratamento ou tratada sem sucesso)',
            'C. Pelo menos 2 das 4 características: Unilateral, Pulsátil, Intensidade moderada/forte, Agravada por atividade física',
            'D. Pelo menos 1 dos seguintes durante a crise: Náusea/Vômitos, Fotofobia e Fonofobia',
            'E. Não melhor explicada por outro diagnóstico ICHD-3'
        ]
    },
    {
        id: 'aura',
        name: 'Migrânea com Aura (1.2)',
        icon: Activity,
        criteria: [
            'A. Pelo menos 2 crises preenchendo critérios B e C',
            'B. Um ou mais sintomas de aura totalmente reversíveis: Visual, Sensitiva, Fala/Linguagem, Motora, Tronco cerebral, Retiniana',
            'C. Pelo menos 3 das 6 características: Disseminação gradual ≥5 min, 2+ sintomas sucessivos, Cada sintoma dura 5-60 min, Pelo menos 1 sintoma unilateral, Pelo menos 1 sintoma positivo, Cefaleia acompanha ou segue a aura dentro de 60 min',
            'D. Não melhor explicada por outro diagnóstico (ex: AIT)'
        ]
    },
    {
        id: 'tth',
        name: 'Cefaleia Tensional (2.x)',
        icon: Brain,
        criteria: [
            'A. Pelo menos 10 episódios (infrequente <1/mês, frequente 1-14/mês)',
            'B. Duração: 30 min a 7 dias',
            'C. Pelo menos 2 características: Bilateral, Pressão/Aperto (não pulsátil), Intensidade leve/moderada, Não agravada por esforço',
            'D. Ambos: Sem náusea ou vômitos (pode ter anorexia), Apenas um de fotofobia ou fonofobia (não ambos)',
            'E. Não melhor explicada por outro diagnóstico'
        ]
    },
    {
        id: 'cluster',
        name: 'Cefaleia em Salvas (3.1)',
        icon: Clock,
        criteria: [
            'A. Pelo menos 5 crises',
            'B. Dor unilateral grave/muito grave, orbitária/supraorbitária/temporal, durando 15-180 min',
            'C. Pelo menos 1 sinal autonômico ipsilateral: Injeção conjuntival/Lacrimejamento, Congestão nasal/Rinorreia, Edema palpebral, Sudorese frontal, Miose/Ptose OU Agitação/Inquietação',
            'D. Frequência: 1 a 8 vezes por dia',
            'E. Não melhor explicada por outro diagnóstico'
        ]
    }
];

export const HeadacheTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'snoop' | 'ichd'>('snoop');
  const [selectedCriteria, setSelectedCriteria] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Cefaleias</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-40">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('snoop')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'snoop' ? 'bg-white dark:bg-zinc-800 text-red-600 shadow-md' : 'text-slate-500'}`}>SNOOP10 (Red Flags)</button>
            <button onClick={() => setActiveTab('ichd')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ichd' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md' : 'text-slate-500'}`}>Critérios ICHD-3</button>
        </div>

        {activeTab === 'snoop' && (
            <div className="space-y-6 animate-in fade-in pb-20">
                <div className="bg-red-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <ShieldAlert className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">SNOOP10</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Sinais de Alerta para Cefaleia Secundária</p></div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {SNOOP10_DATA.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-4 rounded-2xl flex items-start gap-4 shadow-sm hover:border-red-500/50 transition-colors group">
                            <div className="h-10 w-10 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl flex items-center justify-center font-black text-lg shrink-0 border border-red-100 dark:border-red-900/50 group-hover:scale-110 transition-transform">{item.acronym}</div>
                            <div>
                                <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase mb-1">{item.title}</h4>
                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'ichd' && (
            <div className="space-y-6 animate-in fade-in pb-20">
                <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <FileText className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">ICHD-3 Beta</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Classificação Internacional</p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ICHD3_CRITERIA.map((c) => (
                        <div key={c.id} onClick={() => setSelectedCriteria(selectedCriteria === c.id ? null : c.id)} className={`bg-white dark:bg-zinc-950 border-2 rounded-[2rem] p-6 cursor-pointer transition-all ${selectedCriteria === c.id ? 'border-blue-500 shadow-xl scale-[1.02]' : 'border-slate-100 dark:border-zinc-900 hover:border-blue-200'}`}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-2xl ${selectedCriteria === c.id ? 'bg-blue-500 text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}><c.icon className="h-6 w-6" /></div>
                                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white">{c.name}</h4>
                            </div>
                            
                            {selectedCriteria === c.id ? (
                                <ul className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    {c.criteria.map((crit, i) => (
                                        <li key={i} className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 leading-relaxed">
                                            {crit}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clique para ver critérios</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
