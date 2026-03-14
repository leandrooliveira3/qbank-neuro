
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Activity, List, Layers, Move, ChevronDown, 
  ChevronUp, Info, Calculator, Brain, AlertTriangle, 
  Target, ShieldAlert, Zap, Search, Eye, ClipboardList,
  Pill, Stethoscope, Gauge, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const SARA_DATA = [
    { id: '1', title: '1. Marcha (Gait)', max: 8, options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Dificuldade leve' }, { v: 2, l: 'Anormalidade clara, s/ apoio' }, { v: 3, l: 'Cambaleante, mas não cai' }, { v: 4, l: 'Cambaleante, apoio intermitente' }, { v: 5, l: 'Grave, apoio permanente' }, { v: 6, l: 'Anda >10m c/ apoio forte' }, { v: 7, l: 'Anda <10m c/ apoio forte' }, { v: 8, l: 'Incapaz' }]},
    { id: '2', title: '2. Postura (Stance)', max: 6, options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Tandem < 10s' }, { v: 2, l: 'Pés juntos, oscila' }, { v: 3, l: 'Natural > 10s, Pés juntos < 10s' }, { v: 4, l: 'Natural > 10s c/ apoio interm.' }, { v: 5, l: 'Natural > 10s c/ apoio constante' }, { v: 6, l: 'Incapaz > 10s' }]},
    { id: '3', title: '3. Sentado (Sitting)', max: 4, options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Leve oscilação' }, { v: 2, l: 'Oscilação constante' }, { v: 3, l: 'Apoio intermitente' }, { v: 4, l: 'Apoio constante / Cai' }]},
    { id: '4', title: '4. Fala (Speech)', max: 6, options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Sugestiva' }, { v: 2, l: 'Compreensível' }, { v: 3, l: 'Ocasionalmente ininteligível' }, { v: 4, l: 'Ininteligível' }, { v: 5, l: 'Palavras isoladas' }, { v: 6, l: 'Anartria' }]}
];

const ATYPICAL_PARKINSONISM = [
    {
        name: 'Doença de Parkinson (DP)',
        onset: 'Assimétrico e Gradual.',
        tremor: 'Tremor de repouso (Pill-rolling) clássico.',
        instability: 'Tardia (após anos de doença).',
        autonomic: 'Leve/Tardia (Constipação, Hiposmia).',
        response: 'Excelente resposta à Levodopa.',
        mri: 'Normal ou redução do "Swallow tail sign" (Nigrossomo-1).',
        pearl: 'A resposta sustentada à Levodopa é o melhor divisor de águas.'
    },
    {
        name: 'PSP (Paralisia Supranuclear Progressiva)',
        onset: 'Simétrico. Quedas PRECOCES ( < 1 ano).',
        tremor: 'Geralmente ausente.',
        instability: 'Precoce, quedas para trás (Retropropulsão).',
        autonomic: 'Mínima.',
        response: 'Pobre ou nula à Levodopa.',
        mri: 'Sinal do Beija-flor (Atrofia de Mesencéfalo). Atrofia do Tegmento.',
        pearl: 'Sinal do Procerus (olhar fixo/franzido) e Paralisia do Olhar Vertical.'
    },
    {
        name: 'AMS (Atrofia de Múltiplos Sistemas)',
        onset: 'Simétrico. Disautonomia GRAVE e PRECOCE.',
        tremor: 'Raro ou tremor de ação/postural.',
        instability: 'Precoce.',
        autonomic: 'Grave: Hipotensão ortostática (>30/15 mmHg), Incontinência, DE.',
        response: 'Pobre à Levodopa (lua de mel curta).',
        mri: 'Sinal do Pão em Cruz (Hot Cross Bun sign) na Ponte. Fenda putaminal.',
        pearl: 'Sinal de Pisa (inclinação lateral do tronco) e Estridor inspiratório.'
    }
];

const PD_MANAGEMENT = {
    drugs: [
        { name: 'Pramipexol / Rotigotina', class: 'Agonistas Dopaminérgicos', desc: 'Jovens (<65-70a) para poupar L-Dopa. Cuidado: Transtorno de Controle de Impulso e Sonolência.', color: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
        { name: 'Rasagilina / Selegilina', class: 'Inibidores da MAO-B', desc: 'Efeito sintomático leve. Útil em fase inicial ou como adjuvante para reduzir tempo OFF.', color: 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
        { name: 'Entacapone / Opicapone', class: 'Inibidores da COMT', desc: 'Sempre associado à Levodopa. Aumenta a meia-vida e área sob a curva. Útil no Wearing-off.', color: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
        { name: 'Amantadina', class: 'Antagonista NMDA', desc: 'Única droga com efeito robusto antidiscinético. Cuidado: Livedo reticular, edema e alucinações em idosos.', color: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20' }
    ],
    complications: [
        { title: 'Wearing-off (Encurtamento)', strategy: 'Fracionar doses de Levodopa (diminuir intervalo). Adicionar Entacapone, Rasagilina ou Agonista. Considerar formulações de liberação prolongada.' },
        { title: 'Discinesias de Pico', strategy: 'Reduzir a dose individual de Levodopa (e aumentar frequência se piorar motor). Adicionar AMANTADINA. Reduzir adjuvantes.' },
        { title: 'Freezing of Gait', strategy: 'Pistas visuais/auditivas (Metrônomo). Fisioterapia com marcha. Avaliar se ocorre em OFF (otimizar L-Dopa) ou ON (raro).', icon: AlertTriangle },
        { title: 'Distonia Matinal (OFF)', strategy: 'Sinal de nível baixo de dopa. Adicionar dose noturna de liberação prolongada ou agonista de longa duração (Adesivo).', icon: Activity },
        { title: 'Hipotensão Postural', strategy: 'Medidas não-farmacológicas (Sal, Água, Cabeceira elevada, Meias elásticas). Farmacológico: FLUDROCORTISONA ou Midodrina. Retirar anti-hipertensivos.', icon: Gauge }
    ]
};

export const MovementDisordersTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'parkinson' | 'management' | 'atypical' | 'ataxia'>('parkinson');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [expandedSaraItem, setExpandedSaraItem] = useState<string | null>(null);

  const calculateSaraTotal = () => {
      return (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Distúrbios do Movimento</h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-40">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('parkinson')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'parkinson' ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>Critérios DP</button>
            <button onClick={() => setActiveTab('management')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'management' ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-md' : 'text-slate-500'}`}>Tratamento DP</button>
            <button onClick={() => setActiveTab('atypical')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'atypical' ? 'bg-white dark:bg-zinc-800 text-orange-600 shadow-md' : 'text-slate-500'}`}>Atípicos</button>
            <button onClick={() => setActiveTab('ataxia')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ataxia' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-md' : 'text-slate-500'}`}>Ataxia (SARA)</button>
        </div>

        {activeTab === 'parkinson' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <ClipboardList className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">MDS Parkinson Criteria</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Protocolo Diagnóstico</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Ponto de Partida OBRIGATÓRIO</h4>
                        <div className="p-4 bg-primary/5 rounded-2xl border-l-4 border-primary">
                            <p className="text-sm font-black text-primary uppercase">Bradicinesia</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase">Lentificação do movimento + redução da amplitude/cadência (decremento).</p>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">+ AO MENOS UM DESTES:</p>
                        <ul className="space-y-2">
                            {['Tremor de Repouso (4-6 Hz)', 'Rigidez em Roda Dentada'].map(t => <li key={t} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> {t}</li>)}
                        </ul>
                    </div>
                    <div className="bg-slate-900 text-white rounded-[2rem] p-6 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Critérios de Exclusão Absoluta</h4>
                        <div className="space-y-2">
                            {['Paresia do olhar vertical (PSP)', 'Disautonomia grave (AMS)', 'Uso de neurolepticos (Drug-induced)', 'Déficit cerebelar proeminente'].map(e => <div key={e} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-bold uppercase tracking-tight text-slate-400">{e}</div>)}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'management' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 pb-20">
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4 relative overflow-hidden">
                    <Pill className="h-12 w-12 opacity-30 absolute right-4 top-1/2 -translate-y-1/2" />
                    <div>
                        <h3 className="font-black uppercase tracking-tight text-lg">Levodopa (Prolopa/Sinemet)</h3>
                        <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest mt-1 max-w-sm">Padrão Ouro. Sempre iniciar com dose baixa e aumentar gradualmente. Tomar longe de refeições proteicas para melhor absorção.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PD_MANAGEMENT.drugs.map(drug => (
                        <div key={drug.name} className={`p-5 rounded-[2rem] border-2 ${drug.color} shadow-sm`}>
                            <h4 className="font-black text-sm uppercase mb-1">{drug.name}</h4>
                            <p className="text-[9px] font-bold uppercase opacity-60 mb-2 tracking-widest">{drug.class}</p>
                            <p className="text-[10px] font-medium leading-relaxed">{drug.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-lg">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" /> Manejo de Complicações (Troubleshooting)
                    </h4>
                    <div className="space-y-4">
                        {PD_MANAGEMENT.complications.map((comp, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border-l-4 border-slate-300 dark:border-slate-700 hover:border-emerald-500 transition-colors group">
                                <div className="flex items-center gap-2 mb-2">
                                    {comp.icon ? <comp.icon className="h-4 w-4 text-red-500" /> : <Activity className="h-4 w-4 text-emerald-500" />}
                                    <h5 className="text-xs font-black uppercase text-slate-800 dark:text-white">{comp.title}</h5>
                                </div>
                                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed pl-6">{comp.strategy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'atypical' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <div className="bg-orange-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Brain className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Diferencial de Parkinsonismo</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">DP vs PSP vs AMS</p></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {ATYPICAL_PARKINSONISM.map(p => (
                        <div key={p.name} className="bg-white dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-900 rounded-[2rem] p-6 flex flex-col space-y-4 hover:border-orange-500/30 transition-all shadow-sm group">
                            <h4 className="font-black text-sm text-orange-600 uppercase border-b-2 border-slate-50 dark:border-zinc-900 pb-3 mb-2">{p.name}</h4>
                            <div className="space-y-3 flex-1">
                                <div><p className="text-[7px] font-black uppercase text-slate-400">Início e Tremor</p><p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase leading-tight">{p.onset} {p.tremor}</p></div>
                                <div><p className="text-[7px] font-black uppercase text-slate-400">Instabilidade Postural</p><p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase leading-tight">{p.instability}</p></div>
                                <div><p className="text-[7px] font-black uppercase text-slate-400">Resposta L-Dopa</p><p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase leading-tight">{p.response}</p></div>
                                <div><p className="text-[7px] font-black uppercase text-slate-400">Imagem (MRI)</p><p className="text-[10px] font-medium text-slate-500 italic uppercase leading-tight">{p.mri}</p></div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                                <p className="text-[9px] font-black text-orange-600 uppercase flex items-center gap-1"><Search className="h-3 w-3" /> Pérola</p>
                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{p.pearl}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="h-20" />
            </div>
        )}

        {activeTab === 'ataxia' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] flex justify-between items-center shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl"><Calculator className="h-6 w-6" /></div>
                        <div><h3 className="font-black uppercase tracking-tight text-lg">SARA Total</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escala de Ataxia (Máx 40)</p></div>
                    </div>
                    <div className="text-4xl font-black tracking-tighter text-indigo-400">{calculateSaraTotal()}</div>
                </div>
                <div className="space-y-3">
                    {SARA_DATA.map(item => (
                        <div key={item.id} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
                            <h4 className="text-[11px] font-black uppercase text-slate-500 mb-3">{item.title}</h4>
                            <div className="grid grid-cols-1 gap-1">
                                {item.options.map(opt => (
                                    <button key={opt.v} onClick={() => setScores(p => ({...p, [item.id]: opt.v}))} className={`text-left p-3 rounded-xl border transition-all text-[10px] font-medium ${scores[item.id] === opt.v ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'bg-slate-50 dark:bg-zinc-900 border-transparent text-slate-600'}`}>{opt.v} - {opt.l}</button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
