
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Thermometer, AlertTriangle, CheckCircle2, 
  Search, ShieldAlert, Activity, FileText, Zap, Brain, Clock,
  ChevronDown, ChevronUp
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

const ICHD3_DATA = [
    {
        id: 'migraine',
        name: 'Migrânea (1.1 & 1.2)',
        icon: Zap,
        criteria: [
            'Sem Aura: ≥5 crises, 4-72h, Unilateral, Pulsátil, Mod/Grave, Agrava c/ esforço (2/4) + Náusea/Vômito ou Foto/Fonofobia (1/2).',
            'Com Aura: ≥2 crises, sintomas reversíveis (Visual, Sensitivo, Fala) que se difundem gradualmente (>5 min) e duram 5-60 min.',
            'Diferencial: Cefaleia Tensional, Hemiplegia Alternante, AIT.'
        ],
        treatment: {
            acute: 'Triptanos (Sumatriptano, Rizatriptano) - Tomar no início da dor (não na aura). AINES (Naproxeno). Gepantos (Rimegepanto).',
            preventive: 'Propranolol (20-160mg), Topiramato (25-100mg), Amitriptilina (10-75mg), CGRP mAbs (Erenumabe, Galcanezumabe - alta eficácia e poucos efeitos colaterais).',
            pearls: 'Evitar uso de analgésicos >10-15 dias/mês (Cefaleia por abuso). Topiramato causa parestesias e redução de peso.'
        }
    },
    {
        id: 'tth',
        name: 'Cefaleia Tensional (2.x)',
        icon: Brain,
        criteria: [
            '≥10 crises, 30 min a 7 dias, Bilateral, Aperto/Pressão (não pulsátil), Intensidade Leve/Moderada, Não agrava c/ esforço.',
            'Sem náuseas. No máximo UM de fotofobia ou fonofobia.',
            'Diferencial: Cefaleia Cervicogênica, Disfunção de ATM.'
        ],
        treatment: {
            acute: 'Aspirina, Paracetamol, AINES. Evitar cafeína em excesso.',
            preventive: 'Amitriptilina (escolha), Venlafaxina. Manejo de estresse e ergonomia.',
            pearls: 'Amitriptilina é melhor tolerada se iniciada em doses baixas (substituir se boca seca/sedação intolerável).'
        }
    },
    {
        id: 'cluster',
        name: 'Cefaleia em Salvas (3.1)',
        icon: Clock,
        criteria: [
            '≥5 crises, unilateral GRAVE (orbitária/temporal), 15-180 min.',
            'Sinais autonômicos ipsilaterais: Injeção conjuntival, lacrimejamento, miose, ptose, sudorese, agitação.',
            'Frequência: 1 a 8 vezes ao dia.'
        ],
        treatment: {
            acute: 'Oxigênio 100% (12-15L/min) por máscara reservatório por 15 min. Sumatriptano 6mg SC.',
            preventive: 'Verapamil (240-960mg/dia) - monitorar ECG (PR). Prednisona (60mg) para transição. Galcanezumabe.',
            pearls: 'O diagnóstico é clínico. Lítio é opção para formas crônicas.'
        }
    },
    {
        id: 'secondary',
        name: 'Cefaleias Secundárias',
        icon: AlertTriangle,
        criteria: [
            'Arterite de Células Gigantes: Idosos, dor temporal, claudicação de mandíbula, VHS/PCR elevados.',
            'Hipertensão Intracraniana: Papiledema, piora ao decúbito, zumbido pulsátil.',
            'Diferencial: Trombose Venosa Cerebral, Dissecação Arterial, RCVS.'
        ],
        treatment: {
            acute: 'ACG: Corticosteroides imediato para evitar cegueira. HIC: Acetazolamida, perda de peso.',
            preventive: 'RCVS: Verapamil e evitar gatilhos (serotoninérgicos).',
            pearls: 'A dor sibilante/trovão (Thunderclap) exige RM/AngioRM para afastar HSA e RCVS.'
        }
    }
];

export const HeadacheTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'snoop' | 'ichd' | 'treatment'>('snoop');
  const [selectedHeader, setSelectedHeader] = useState<string | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Cefaleias & Algias</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-40">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar gap-1">
            <button onClick={() => setActiveTab('snoop')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'snoop' ? 'bg-white dark:bg-zinc-800 text-red-600 shadow-md' : 'text-slate-500'}`}>SNOOP10</button>
            <button onClick={() => setActiveTab('ichd')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ichd' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md' : 'text-slate-500'}`}>Critérios ICHD-3</button>
            <button onClick={() => setActiveTab('treatment')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'treatment' ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-md' : 'text-slate-500'}`}>Tratamento</button>
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
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Classificação ICHD-3</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Diagnóstico e Diferenciais</p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ICHD3_DATA.map((c) => (
                        <div key={c.id} onClick={() => setSelectedHeader(selectedHeader === c.id ? null : c.id)} className={`bg-white dark:bg-zinc-950 border-2 rounded-[2rem] p-6 cursor-pointer transition-all ${selectedHeader === c.id ? 'border-blue-500 shadow-xl' : 'border-slate-100 dark:border-zinc-900 hover:border-blue-200'}`}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-2xl ${selectedHeader === c.id ? 'bg-blue-500 text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}><c.icon className="h-6 w-6" /></div>
                                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white">{c.name}</h4>
                            </div>
                            
                            {selectedHeader === c.id ? (
                                <ul className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    {c.criteria.map((crit, i) => (
                                        <li key={i} className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 leading-relaxed">
                                            {crit}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clique para ver detalhes</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'treatment' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 pb-20">
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Activity className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Estratégias Terapêuticas</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Prática Clínica Baseada em Evidência</p></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {ICHD3_DATA.map((c) => (
                        <div key={`tx-${c.id}`} onClick={() => setSelectedTreatment(selectedTreatment === c.id ? null : c.id)} className={`bg-white dark:bg-zinc-950 border-2 rounded-[2rem] p-6 cursor-pointer transition-all ${selectedTreatment === c.id ? 'border-emerald-500 shadow-xl' : 'border-slate-100 dark:border-zinc-900 hover:border-emerald-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${selectedTreatment === c.id ? 'bg-emerald-500 text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'}`}><c.icon className="h-6 w-6" /></div>
                                    <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white">Tratamento: {c.name}</h4>
                                </div>
                                {selectedTreatment === c.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </div>

                            {selectedTreatment === c.id && (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl">
                                            <p className="text-[9px] font-black uppercase text-emerald-600 mb-2">Crise Aguda</p>
                                            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{c.treatment.acute}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl">
                                            <p className="text-[9px] font-black uppercase text-blue-600 mb-2">Profilaxia</p>
                                            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{c.treatment.preventive}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 rounded-r-2xl">
                                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2 mb-1"><Zap className="h-3.5 w-3.5" /> Dicas Práticas & Efeitos Colaterais</p>
                                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">{c.treatment.pearls}</p>
                                    </div>
                                </div>
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
