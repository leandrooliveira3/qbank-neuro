
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
    { id: '4', title: '4. Fala (Speech)', max: 6, options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Sugestiva' }, { v: 2, l: 'Compreensível' }, { v: 3, l: 'Ocasionalmente ininteligível' }, { v: 4, l: 'Ininteligível' }, { v: 5, l: 'Palavras isoladas' }, { v: 6, l: 'Anartria' }]},
    { id: '5', title: '5. Perseguição Dedo (Finger Chase)', max: 4, options: [{ v: 0, l: 'Sem dismetria' }, { v: 1, l: 'Dismetria leve (erro < 5cm)' }, { v: 2, l: 'Dismetria moderada (erro < 10cm)' }, { v: 3, l: 'Dismetria grave (erro > 10cm)' }, { v: 4, l: 'Incapaz' }]},
    { id: '6', title: '6. Index-Nariz (Nose-Finger)', max: 4, options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Tremor leve / Dismetria leve' }, { v: 2, l: 'Tremor moderado / Dismetria moderada' }, { v: 3, l: 'Tremor grave / Dismetria grave' }, { v: 4, l: 'Incapaz' }]},
    { id: '7', title: '7. Mov. Alternados (Hand Movements)', max: 4, options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Leve irregularidade' }, { v: 2, l: 'Irregularidade nítida' }, { v: 3, l: 'Grave irregularidade' }, { v: 4, l: 'Incapaz' }]},
    { id: '8', title: '8. Alvo-Calcâneo (Heel-Shin)', max: 4, options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Leve desvio' }, { v: 2, l: 'Desvios constantes, mas mantém contato' }, { v: 3, l: 'Cai da tíbia várias vezes' }, { v: 4, l: 'Incapaz' }]}
];

const UPDRS_DATA = {
    part1: [
        { id: '1.1', title: 'Cognição', desc: 'Dificuldades cognitivas.' },
        { id: '1.2', title: 'Alucinações', desc: 'Alucinações e psicose.' },
        { id: '1.3', title: 'Depressão', desc: 'Humor deprimido.' },
        { id: '1.4', title: 'Ansiedade', desc: 'Humor ansioso.' },
        { id: '1.5', title: 'Apatia', desc: 'Perda de interesse/iniciativa.' },
        { id: '1.6', title: 'DDS', desc: 'Síndrome de desregulação dopaminérgica.' },
        { id: '1.7', title: 'Sono', desc: 'Problemas de sono (insônia, etc).' },
        { id: '1.8', title: 'Sonolência Diurna', desc: 'Sonolência durante o dia.' },
        { id: '1.9', title: 'Dor', desc: 'Dor e outras sensações.' },
        { id: '1.10', title: 'Problemas Urinários', desc: 'Frequência, urgência, etc.' },
        { id: '1.11', title: 'Constipação', desc: 'Funcionamento intestinal.' },
        { id: '1.12', title: 'Tontura Ortostática', desc: 'Ao levantar-se.' },
        { id: '1.13', title: 'Fadiga', desc: 'Cansaço persistente.' }
    ],
    part2: [
        { id: '2.1', title: 'Fala', desc: 'Dificuldade na comunicação.' },
        { id: '2.2', title: 'Salivação', desc: 'Sialorreia ou excesso de saliva.' },
        { id: '2.3', title: 'Mastigação/Deglutição', desc: 'Dificuldade ao comer.' },
        { id: '2.4', title: 'Utensílios de Comer', desc: 'Uso de talheres, etc.' },
        { id: '2.5', title: 'Vestir-se', desc: 'Botões, sapatos, etc.' },
        { id: '2.6', title: 'Higiene', desc: 'Banho, escovação, etc.' },
        { id: '2.7', title: 'Escrita', desc: 'Micrografia ou dificuldade.' },
        { id: '2.8', title: 'Hobbies/Atividades', desc: 'Lazer e tarefas manuais.' },
        { id: '2.9', title: 'Virar na Cama', desc: 'Dificuldade noturna.' },
        { id: '2.10', title: 'Tremor', desc: 'Percepção de tremor pelo paciente.' },
        { id: '2.11', title: 'Sair da Cama/Carro', desc: 'Mobilidade básica.' },
        { id: '2.12', title: 'Marcha e Equilíbrio', desc: 'Instabilidade percebida.' },
        { id: '2.13', title: 'Freezing', desc: 'Congelamento da marcha.' }
    ],
    part3: [
        { id: '3.1', title: 'Fala (Exame)', side: false },
        { id: '3.2', title: 'Expressão Facial', side: false },
        { id: '3.3', title: 'Rigidez', side: true, labels: ['Pescoço', 'MSD', 'MSE', 'MID', 'MIE'] },
        { id: '3.4', title: 'Finger Tapping', side: true },
        { id: '3.5', title: 'Movimentos de Mão', side: true },
        { id: '3.6', title: 'Pronação/Supinação', side: true },
        { id: '3.7', title: 'Batida de Dedos do Pé', side: true },
        { id: '3.8', title: 'Agilidade de Perna', side: true },
        { id: '3.9', title: 'Levantar da Cadeira', side: false },
        { id: '3.10', title: 'Marcha', side: false },
        { id: '3.11', title: 'Freezing of Gait', side: false },
        { id: '3.12', title: 'Estabilidade Postural', side: false },
        { id: '3.13', title: 'Postura', side: false },
        { id: '3.14', title: 'Bradicinesia Global', side: false },
        { id: '3.15', title: 'Tremor Postural (Mãos)', side: true },
        { id: '3.16', title: 'Tremor Cinético (Mãos)', side: true },
        { id: '3.17', title: 'Tremor de Repouso (Amplitude)', side: true, labels: ['Mandíbula', 'MSD', 'MSE', 'MID', 'MIE'] },
        { id: '3.18', title: 'Constância do Tremor', side: false }
    ]
};

const ATAXIA_DIFFERENTIALS = {
    hereditary: [
        { name: 'Friedreich (FRDA)', genetics: 'AR - Expansão GAA (Frataxina).', age: '< 25a (geralmente).', features: 'Ataxia + Arreflexia + Perda Propriocepção + Escoliose + Miocardiopatia.', pearl: 'Ataxia mais comum na infância.' },
        { name: 'SCA (Ataxias Espinocerebelares)', genetics: 'AD - Expansão CAG.', age: 'Adultos.', features: 'Ataxia progressiva + sinais piramidais/extrapiramidais/oftalmoplegia.', pearl: 'SCA3 (Machado-Joseph) é a mais comum no Brasil (fenótipo variável).' },
        { name: 'Ataxia-Telangiectasia', genetics: 'AR - Mutação ATM.', age: 'Infância.', features: 'Ataxia + Telangiectasias oculares/cutâneas + Imunodeficiência + Alfa-fetoproteína elevada.', pearl: 'Risco aumentado de malignidades.' }
    ],
    acquired: [
        { name: 'Tóxico-Carencial', causes: 'Álcool, Lítio, Fenitoína, Amiodarona.', features: 'Ataxia de marcha proeminente. Atrofia de vermis cerebelar (Álcool).', pearl: 'Deficiência de B12, B1 e Vitamina E devem ser sempre triadas.' },
        { name: 'Autoimune / Paraneoplásica', causes: 'Anti-Yo, Anti-Hu, Anti-Ri (Mama/Ovarios/Pulmão). Ataxia por Glúten.', features: 'Início subagudo, progressão rápida.', pearl: 'Ataxia por Glúten (Anti-gliadina, Anti-transglutaminase) é tratável com dieta.' },
        { name: 'Vascular / Infecciosa', causes: 'AVE de fossa posterior, Cerebelite pós-varicela, Neurolues.', features: 'Início súbito ou agudo.', pearl: 'Cerebelite pós-infecciosa é comum em crianças.' }
    ]
};

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
        { name: 'Levodopa + Carbi/Bense', class: 'Padrão Ouro', desc: 'Melhor eficácia motora. Eventos adversos: Náuseas, sonolência, hipotensão postural e complicações motoras a longo prazo (discinesias).', color: 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
        { name: 'Pramipexol / Rotigotina', class: 'Agonistas Dopaminérgicos', desc: 'Jovens (<65-70a) para poupar L-Dopa. Efeitos: Transtorno de Controle de Impulso (hipersexualidade, jogo, compras), Edema, Sonolência súbita.', color: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
        { name: 'Rasagilina / Selegilina / Safinamida', class: 'Inibidores da MAO-B', desc: 'Útil em fase inicial ou como adjuvante. Safinamida tem efeito antiglutamatérgico adicional.', color: 'border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20' },
        { name: 'Entacapone / Opicapone', class: 'Inibidores da COMT', desc: 'Prolonga efeito L-Dopa. Opicapone (uma vez ao dia) é mais potente e seletivo. Eventos: Escurecimento da urina (Entacapone), Diarreia.', color: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
        { name: 'Amantadina', class: 'Antagonista NMDA', desc: 'Anti-discinético. Eventos: Livedo reticular, edema, confusão mental.', color: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
        { name: 'Biperideno / Triexifenidil', class: 'Anticolinérgicos', desc: 'Úteis apenas para tremor em pacientes JOVENS. Alto risco de prejuízo cognitivo e glaucoma.', color: 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-900/20' }
    ],
    adjuvants: [
        { name: 'Quetiapina / Clozapina', class: 'Antipsicóticos', desc: 'Drogas de escolha para psicose na DP. Não pioram o parkinsonismo (ao contrário de Olanzapina/Risperidona).' },
        { name: 'Rivastigmina', class: 'Anticolinesterásico', desc: 'Tratamento de escolha para Demência na DP.' },
        { name: 'Midodrina / Fludrocortisona', class: 'Autonômicos', desc: 'Manejo da hipotensão ortostática grave.' }
    ],
    complications: [
        { title: 'Wearing-off (Encurtamento)', strategy: 'Fracionar doses de Levodopa (diminuir intervalo). Adicionar Inibidor de COMT ou Safinamida. Agonista dopaminérgico.' },
        { title: 'Discinesias de Pico', strategy: 'Reduzir doses individuais de Levodopa. Adicionar AMANTADINA. Retirar Inibidores de COMT.' },
        { title: 'Freezing of Gait', strategy: 'Marcha em OFF: Otimizar dose de L-Dopa. Marcha em ON: Difícil manejo, estratégias de pistas visuais/auditivas.' },
        { title: 'Disfunção Autonômica', strategy: 'Hipotensão: Sal/Agua/Meias. Constipação: Fibras, laxantes osmóticos. Disfunção Erétil: Inibidores PDE-5.', icon: Gauge }
    ]
};

const TREMOR_DATA = {
    types: [
        { name: 'Tremor de Repouso', freq: '4-6 Hz', feature: 'Aparece com o músculo relaxado, sob gravidade. Ex: "Pill-rolling". Reduz com ação.', causes: 'Doença de Parkinson, Parkinsonismo medicamentoso, Doença de Wilson.' },
        { name: 'Tremor Postural', freq: 'Frequência variável', feature: 'Ao manter postura contra a gravidade (ex: estender os braços).', causes: 'Tremor Essencial (TE), Tremor Fisiológico Exacerbado (ansiedade, hipertireoidismo, beta-agonistas).' },
        { name: 'Tremor Cinético/Intenção', freq: 'Baixa < 5 Hz', feature: 'Piora ao se aproximar do alvo (ex: dedo ao nariz). Pode ter componente ortostático (OT).', causes: 'Doença cerebelar (Esclerose Múltipla, Ataxias espinocerebelares, tóxicos).' },
        { name: 'Tremor Distônico', freq: 'Irregular', feature: 'Tremor em região afetada por distonia. Posição dependente ("null point" - posição em que o tremor cessa).', causes: 'Distonia cervical, Distonia tarefa-específica.' }
    ],
    essentialTremor: {
        criteria: 'Tremor de ação (postural e cinético) bilateral e simétrico de membros superiores. Isolado. Duração > 3 anos.',
        redFlags: 'Início agudo, unilateral estrito, tremor de perna, parkinsonismo associado, marcha anormal.',
        treatment: [
            { tier: '1ª Linha', meds: 'Propranolol (10-40mg 2-3x/dia) e/ou Primidona (12.5-25mg/noite, escalar lento até 250mg 3x/dia).', notes: 'Sinergismo se associados. Cuidado c/ asma (propanolol) e sedação/ataxia (primidona).' },
            { tier: '2ª Linha', meds: 'Topiramato, Gabapentina, Alprazolam, Atenolol.', notes: 'Se falha ou contraindicação à 1ª linha.' },
            { tier: '3ª Linha / Refratário', meds: 'Toxina Botulínica (para tremor focal/cabeça) ou Cirurgia (DBS do núcleo VIM do tálamo).', notes: 'DBS é altamente efetivo para tremor apendicular.' }
        ]
    }
};

export const MovementDisordersTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'parkinson' | 'updrs' | 'management' | 'atypical' | 'ataxia' | 'tremor'>('parkinson');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [updrsScores, setUpdrsScores] = useState<Record<string, number>>({});
  const [ataxiaView, setAtaxiaView] = useState<'sara' | 'diff'>('sara');
  const [expandedUPDRS, setExpandedUPDRS] = useState<string | null>('part1');

  const calculateUPDRS = () => {
    const p1 = UPDRS_DATA.part1.reduce((acc, item) => acc + (updrsScores[item.id] || 0), 0);
    const p2 = UPDRS_DATA.part2.reduce((acc, item) => acc + (updrsScores[item.id] || 0), 0);
    let p3 = 0;
    UPDRS_DATA.part3.forEach(item => {
        if (item.side) {
            const labels = item.labels || ['D', 'E'];
            labels.forEach(l => { p3 += (updrsScores[`${item.id}_${l}`] || 0); });
        } else {
            p3 += (updrsScores[item.id] || 0);
        }
    });
    return { p1, p2, p3, total: p1 + p2 + p3 };
  };

  const copyUPDRS = () => {
    const res = calculateUPDRS();
    const text = `MDS-UPDRS:\nParte 1: ${res.p1}\nParte 2: ${res.p2}\nParte 3: ${res.p3}\nTOTAL: ${res.total}`;
    navigator.clipboard.writeText(text);
  };

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
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar gap-1">
            <button onClick={() => setActiveTab('parkinson')} className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'parkinson' ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>Critérios</button>
            <button onClick={() => setActiveTab('updrs')} className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'updrs' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-md' : 'text-slate-500'}`}>UPDRS</button>
            <button onClick={() => setActiveTab('management')} className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'management' ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-md' : 'text-slate-500'}`}>Conduta</button>
            <button onClick={() => setActiveTab('atypical')} className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'atypical' ? 'bg-white dark:bg-zinc-800 text-orange-600 shadow-md' : 'text-slate-500'}`}>Atípicos</button>
            <button onClick={() => setActiveTab('ataxia')} className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ataxia' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-md' : 'text-slate-500'}`}>Ataxia</button>
            <button onClick={() => setActiveTab('tremor')} className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'tremor' ? 'bg-white dark:bg-zinc-800 text-teal-600 shadow-md' : 'text-slate-500'}`}>Tremor</button>
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

        {activeTab === 'updrs' && (
            <div className="space-y-6 animate-in fade-in pb-20">
                <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between gap-4 sticky top-20 z-40">
                    <div className="flex items-center gap-4">
                        <Calculator className="h-10 w-10 opacity-40" />
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-lg">MDS-UPDRS Calculator</h3>
                            <div className="flex gap-4 mt-1">
                                <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">P1: {calculateUPDRS().p1}</p>
                                <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">P2: {calculateUPDRS().p2}</p>
                                <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">P3: {calculateUPDRS().p3}</p>
                                <p className="text-[10px] font-black text-white uppercase bg-white/20 px-2 rounded">Total: {calculateUPDRS().total}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={copyUPDRS} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                        <ClipboardList className="h-4 w-4" /> Copiar
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Part 1 */}
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] overflow-hidden">
                        <button onClick={() => setExpandedUPDRS(expandedUPDRS === 'part1' ? null : 'part1')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors border-b border-slate-100 dark:border-zinc-900">
                            <h4 className="text-sm font-black uppercase text-indigo-600 tracking-widest">Parte 1: Não-Motor (Vida Diária)</h4>
                            {expandedUPDRS === 'part1' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                        {expandedUPDRS === 'part1' && (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {UPDRS_DATA.part1.map(item => (
                                    <div key={item.id} className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-slate-500">{item.id} {item.title}</p>
                                        <div className="flex gap-1 justify-between">
                                            {[0,1,2,3,4].map(v => (
                                                <button key={v} onClick={() => setUpdrsScores(p => ({...p, [item.id]: v}))} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border ${updrsScores[item.id] === v ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-zinc-900 border-transparent text-slate-400'}`}>{v}</button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Part 2 */}
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] overflow-hidden">
                        <button onClick={() => setExpandedUPDRS(expandedUPDRS === 'part2' ? null : 'part2')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors border-b border-slate-100 dark:border-zinc-900">
                            <h4 className="text-sm font-black uppercase text-indigo-600 tracking-widest">Parte 2: Motor (Vida Diária)</h4>
                            {expandedUPDRS === 'part2' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                        {expandedUPDRS === 'part2' && (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {UPDRS_DATA.part2.map(item => (
                                    <div key={item.id} className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-slate-500">{item.id} {item.title}</p>
                                        <div className="flex gap-1 justify-between">
                                            {[0,1,2,3,4].map(v => (
                                                <button key={v} onClick={() => setUpdrsScores(p => ({...p, [item.id]: v}))} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border ${updrsScores[item.id] === v ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-zinc-900 border-transparent text-slate-400'}`}>{v}</button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Part 3 */}
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] overflow-hidden">
                        <button onClick={() => setExpandedUPDRS(expandedUPDRS === 'part3' ? null : 'part3')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors border-b border-slate-100 dark:border-zinc-900">
                            <h4 className="text-sm font-black uppercase text-indigo-600 tracking-widest">Parte 3: Exame Motor</h4>
                            {expandedUPDRS === 'part3' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                        {expandedUPDRS === 'part3' && (
                            <div className="p-6 space-y-6">
                                {UPDRS_DATA.part3.map(item => (
                                    <div key={item.id} className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl">
                                        <p className="text-[10px] font-black uppercase text-slate-600 mb-3 block border-b border-slate-200 dark:border-zinc-800 pb-1">{item.id} {item.title}</p>
                                        {item.side ? (
                                            <div className="space-y-4">
                                                {(item.labels || ['Direito', 'Esquerdo']).map(sideLabel => (
                                                    <div key={sideLabel} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase min-w-[80px]">{sideLabel}</span>
                                                        <div className="flex gap-1 flex-1 max-w-[300px]">
                                                            {[0,1,2,3,4].map(v => (
                                                                <button key={v} onClick={() => setUpdrsScores(p => ({...p, [`${item.id}_${sideLabel}`]: v}))} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border ${updrsScores[`${item.id}_${sideLabel}`] === v ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400'}`}>{v}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex gap-1">
                                                {[0,1,2,3,4].map(v => (
                                                    <button key={v} onClick={() => setUpdrsScores(p => ({...p, [item.id]: v}))} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border ${updrsScores[item.id] === v ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400'}`}>{v}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'management' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 pb-20">
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4 relative overflow-hidden">
                    <Pill className="h-12 w-12 opacity-30 absolute right-4 top-1/2 -translate-y-1/2" />
                    <div>
                        <h3 className="font-black uppercase tracking-tight text-lg">Manejo Terapêutico (MDS Guideline)</h3>
                        <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest mt-1 max-w-sm">A decisão deve ser individualizada baseada em idade, comprometimento funcional e estilo de vida.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PD_MANAGEMENT.drugs.map(drug => (
                        <div key={drug.name} className={`p-5 rounded-[2rem] border-2 flex flex-col justify-between ${drug.color} shadow-sm group hover:scale-[1.02] transition-transform`}>
                            <div>
                                <h4 className="font-black text-sm uppercase mb-1">{drug.name}</h4>
                                <p className="text-[9px] font-bold uppercase opacity-60 mb-2 tracking-widest">{drug.class}</p>
                                <p className="text-[10px] font-medium leading-relaxed">{drug.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-lg">
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Medicações Adjuvantes e Sintomáticos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PD_MANAGEMENT.adjuvants.map(adj => (
                            <div key={adj.name} className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                <h5 className="text-[10px] font-black uppercase text-slate-800 dark:text-white mb-1">{adj.name}</h5>
                                <p className="text-[8px] font-black text-primary uppercase mb-2">{adj.class}</p>
                                <p className="text-[10px] font-medium text-slate-500 leading-tight">{adj.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-lg">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" /> Manejo de Complicações (Troubleshooting)
                    </h4>
                    <div className="space-y-4">
                        {PD_MANAGEMENT.complications.map((comp, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border-l-4 border-slate-300 dark:border-slate-700 hover:border-emerald-500 transition-colors group text-left w-full">
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
            <div className="space-y-6 animate-in fade-in pb-20">
                <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl w-fit">
                    <button onClick={() => setAtaxiaView('sara')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ataxiaView === 'sara' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Calculadora SARA</button>
                    <button onClick={() => setAtaxiaView('diff')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ataxiaView === 'diff' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Diagnóstico Diferencial</button>
                </div>

                {ataxiaView === 'sara' ? (
                    <div className="space-y-6">
                        <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] flex justify-between items-center shadow-lg border-2 border-indigo-500/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl"><Calculator className="h-6 w-6" /></div>
                                <div><h3 className="font-black uppercase tracking-tight text-lg">Score SARA</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scale for the Assessment and Rating of Ataxia (Máx 40)</p></div>
                            </div>
                            <div className="text-4xl font-black tracking-tighter text-indigo-400">{calculateSaraTotal()}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SARA_DATA.map(item => (
                                <div key={item.id} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-[11px] font-black uppercase text-slate-500 mb-3">{item.title}</h4>
                                    <div className="grid grid-cols-1 gap-1">
                                        {item.options.map(opt => (
                                            <button key={opt.v} onClick={() => setScores(p => ({...p, [item.id]: opt.v}))} className={`text-left p-2.5 rounded-xl border transition-all text-[10px] font-medium ${scores[item.id] === opt.v ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'bg-slate-50 dark:bg-zinc-900 border-transparent text-slate-600'}`}>{opt.v} - {opt.l}</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in">
                        <section className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-widest ml-2">Ataxias Hereditárias</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {ATAXIA_DIFFERENTIALS.hereditary.map(ataxia => (
                                    <div key={ataxia.name} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-5 rounded-[2rem] space-y-3 shadow-sm hover:border-indigo-400 transition-colors">
                                        <h5 className="font-black text-xs uppercase text-indigo-700">{ataxia.name}</h5>
                                        <div className="space-y-2">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Genética/Idade: <span className="text-slate-600 dark:text-slate-300">{ataxia.genetics} {ataxia.age}</span></p>
                                            <p className="text-[9px] font-medium text-slate-500 leading-tight">{ataxia.features}</p>
                                        </div>
                                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                            <p className="text-[8px] font-black text-indigo-600 uppercase">Pérola: <span className="font-bold text-slate-700 dark:text-slate-300">{ataxia.pearl}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase text-emerald-600 tracking-widest ml-2">Ataxias Adquiridas</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {ATAXIA_DIFFERENTIALS.acquired.map(ataxia => (
                                    <div key={ataxia.name} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-5 rounded-[2rem] space-y-3 shadow-sm hover:border-emerald-400 transition-colors">
                                        <h5 className="font-black text-xs uppercase text-emerald-700">{ataxia.name}</h5>
                                        <div className="space-y-2">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Causas: <span className="text-slate-600 dark:text-slate-300">{ataxia.causes}</span></p>
                                            <p className="text-[9px] font-medium text-slate-500 leading-tight">{ataxia.features}</p>
                                        </div>
                                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                            <p className="text-[8px] font-black text-emerald-600 uppercase">Pérola: <span className="font-bold text-slate-700 dark:text-slate-300">{ataxia.pearl}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'tremor' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-20">
                <div className="bg-teal-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Activity className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Classificação de Tremores</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Diferencial e Tremor Essencial</p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TREMOR_DATA.types.map(t => (
                        <div key={t.name} className="bg-white dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-900 p-6 rounded-[2rem] space-y-3 shadow-sm hover:border-teal-500/30 transition-all">
                            <h4 className="font-black text-sm text-teal-700 uppercase">{t.name}</h4>
                            <p className="text-[10px] font-black text-slate-500 uppercase">Freq: <span className="text-slate-800 dark:text-slate-200">{t.freq}</span></p>
                            <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-snug">{t.feature}</p>
                            <div className="p-3 bg-teal-50 dark:bg-teal-900/10 rounded-xl mt-2">
                                <p className="text-[9px] font-black uppercase text-teal-600">Causas comuns:</p>
                                <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 leading-tight">{t.causes}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm mt-6">
                    <h4 className="text-[11px] font-black uppercase text-teal-600 tracking-widest mb-4 flex items-center gap-2"><Target className="h-4 w-4" /> Tremor Essencial (TE)</h4>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Critérios Diagnósticos</p>
                                <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{TREMOR_DATA.essentialTremor.criteria}</p>
                            </div>
                            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border-l-4 border-rose-500">
                                <p className="text-[10px] font-black uppercase text-rose-500 mb-1">Red Flags</p>
                                <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300">{TREMOR_DATA.essentialTremor.redFlags}</p>
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-3 ml-2">Manejo Terapêutico</p>
                            <div className="space-y-3">
                                {TREMOR_DATA.essentialTremor.treatment.map(tx => (
                                    <div key={tx.tier} className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-start gap-3">
                                        <div className="px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-[8px] font-black uppercase rounded">{tx.tier}</div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{tx.meds}</p>
                                            <p className="text-[10px] font-medium text-slate-500 italic mt-0.5">{tx.notes}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
