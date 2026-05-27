
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Activity, Eye, Zap, CheckSquare, Thermometer, Siren, FileSignature, Calculator, AlertCircle, Droplets, FlaskConical, Stethoscope, FileText, CheckCircle2, Clock, X, HeartPulse, ShieldAlert, Wine } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface EmergencyTool { id: string; name: string; description: string; icon: any; type: 'checklist' | 'calc' | 'flow' | 'custom'; questions?: any[]; interpretation?: (score: number) => any; }

const TOOLS: EmergencyTool[] = [
  {
    id: 'brain_death',
    name: 'Protocolo de Morte Encefálica',
    description: 'Resolução CFM 2.173/2017 (Brasil).',
    icon: FileSignature,
    type: 'custom'
  },
  {
    id: 'four_score',
    name: 'Escala FOUR',
    description: 'Full Outline of UnResponsiveness (Coma com/sem IOT).',
    icon: Activity,
    type: 'calc',
    questions: [
        { 
            id: 'eye', 
            text: 'Resposta Ocular', 
            options: [
                {value:4, label:'4 - Pálpebras abertas, rastreamento ou pisca ao comando'}, 
                {value:3, label:'3 - Pálpebras abertas mas não pisca ao comando'}, 
                {value:2, label:'2 - Pálpebras fechadas mas abre ao comando de voz'}, 
                {value:1, label:'1 - Pálpebras fechadas mas abre ao estímulo doloroso'},
                {value:0, label:'0 - Pálpebras fechadas mesmo com estímulo doloroso'}
            ] 
        },
        { 
            id: 'motor', 
            text: 'Resposta Motora', 
            options: [
                {value:4, label:'4 - Polegar para cima, punho fechado ou sinal de paz'}, 
                {value:3, label:'3 - Localiza a dor'}, 
                {value:2, label:'2 - Flexão em resposta à dor'}, 
                {value:1, label:'1 - Extensão em resposta à dor'},
                {value:0, label:'0 - Não responde à dor ou status mioclônico generalizado'}
            ] 
        },
        { 
            id: 'brainstem', 
            text: 'Reflexo de Tronco', 
            options: [
                {value:4, label:'4 - Reflexos pupilar e corneano presentes'}, 
                {value:3, label:'3 - Uma pupila dilatada e fixa'}, 
                {value:2, label:'2 - Reflexo pupilar ou da córnea ausente'}, 
                {value:1, label:'1 - Reflexo pupilar e da córnea ausentes'},
                {value:0, label:'0 - Ausência de reflexo pupilar, córnea e tosse'}
            ] 
        },
        { 
            id: 'respiration', 
            text: 'Respiração', 
            options: [
                {value:4, label:'4 - Não intubado, padrão regular'}, 
                {value:3, label:'3 - Não intubado, padrão Cheyne-Stokes'}, 
                {value:2, label:'2 - Não intubado, respiração irregular'}, 
                {value:1, label:'1 - Respira acima da frequência do ventilador'},
                {value:0, label:'0 - Respira na frequência do ventilador ou apneia'}
            ] 
        }
    ],
    interpretation: (score) => {
        // FOUR Score vai de 0 a 16
        if (score <= 8) return { text: 'Coma Profundo / Prognóstico Reservado', color: 'text-red-600', bg: 'bg-red-50' };
        if (score <= 12) return { text: 'Comprometimento Significativo', color: 'text-orange-500', bg: 'bg-orange-50' };
        return { text: 'Consciência Preservada / Leve', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'gcs_p',
    name: 'Glasgow Modificado (GCS-P)',
    description: 'Glasgow + Reatividade Pupilar (Padrão ATLS).',
    icon: Eye,
    type: 'calc',
    questions: [
        { id: 'eye', text: 'Abertura Ocular', options: [{value:4, label:'4 - Espontânea'}, {value:3, label:'3 - Ao som'}, {value:2, label:'2 - À pressão'}, {value:1, label:'1 - Ausente'}] },
        { id: 'verbal', text: 'Resposta Verbal', options: [{value:5, label:'5 - Orientada'}, {value:4, label:'4 - Confusa'}, {value:3, label:'3 - Palavras soltas'}, {value:2, label:'2 - Sons inteligíveis'}, {value:1, label:'1 - Ausente'}] },
        { id: 'motor', text: 'Resposta Motora', options: [{value:6, label:'6 - Obedece comandos'}, {value:5, label:'5 - Localiza pressão'}, {value:4, label:'4 - Flexão normal'}, {value:3, label:'3 - Flexão anormal'}, {value:2, label:'2 - Extensão anormal'}, {value:1, label:'1 - Ausente'}] },
        { id: 'pupil', text: 'Reatividade Pupilar (Subtração)', options: [{value:0, label:'0 - Ambas reativas'}, {value:1, label:'-1 - Uma pupila não reativa'}, {value:2, label:'-2 - Nenhuma reativa'}] }
    ],
    interpretation: (score) => {
        if (score <= 8) return { text: 'TCE Grave / Coma (Indicação IOT)', color: 'text-red-600', bg: 'bg-red-50' };
        if (score <= 12) return { text: 'TCE Moderado', color: 'text-orange-500', bg: 'bg-orange-50' };
        return { text: 'TCE Leve', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'ciwa',
    name: 'CIWA-Ar (Abstinência Alcoólica)',
    description: 'Avaliação de gravidade e necessidade de medicação.',
    icon: Wine,
    type: 'calc',
    questions: [
        { id: 'nausea', text: 'Náusea e Vômito', options: [{value:0, label:'0 - Nenhuma'}, {value:1, label:'1 - Leve náusea'}, {value:4, label:'4 - Náusea intermitente/Vômitos secos'}, {value:7, label:'7 - Náusea constante, vômitos frequentes'}] },
        { id: 'tremor', text: 'Tremor', options: [{value:0, label:'0 - Nenhum'}, {value:1, label:'1 - Não visível, mas pode ser sentido'}, {value:4, label:'4 - Moderado (braços estendidos)'}, {value:7, label:'7 - Grave (mesmo em repouso)'}] },
        { id: 'sweat', text: 'Sudorese Paroxística', options: [{value:0, label:'0 - Nenhuma'}, {value:1, label:'1 - Palma das mãos úmida'}, {value:4, label:'4 - Gotas na testa'}, {value:7, label:'7 - Encharcado'}] },
        { id: 'anxiety', text: 'Ansiedade', options: [{value:0, label:'0 - Nenhuma'}, {value:1, label:'1 - Levemente ansioso'}, {value:4, label:'4 - Moderadamente ansioso'}, {value:7, label:'7 - Pânico agudo (Delirium)'}] },
        { id: 'agitation', text: 'Agitação', options: [{value:0, label:'0 - Normal'}, {value:1, label:'1 - Leve'}, {value:4, label:'4 - Moderadamente inquieto'}, {value:7, label:'7 - Atira-se na cama, precisa de contenção'}] },
        { id: 'tactile', text: 'Distúrbios Táteis', options: [{value:0, label:'0 - Nenhum'}, {value:1, label:'1 - Prurido leve, formigamento'}, {value:4, label:'4 - Alucinações moderadas'}, {value:7, label:'7 - Alucinações contínuas'}] },
        { id: 'auditory', text: 'Distúrbios Auditivos', options: [{value:0, label:'0 - Nenhum'}, {value:1, label:'1 - Som áspero/assustador leve'}, {value:4, label:'4 - Alucinações moderadas'}, {value:7, label:'7 - Alucinações contínuas'}] },
        { id: 'visual', text: 'Distúrbios Visuais', options: [{value:0, label:'0 - Nenhum'}, {value:1, label:'1 - Sensibilidade à luz'}, {value:4, label:'4 - Alucinações moderadas'}, {value:7, label:'7 - Alucinações contínuas'}] },
        { id: 'headache', text: 'Cefaleia / Plenitude', options: [{value:0, label:'0 - Nenhuma'}, {value:1, label:'1 - Muito leve'}, {value:4, label:'4 - Moderada'}, {value:7, label:'7 - Muito grave'}] },
        { id: 'orientation', text: 'Orientação e Nublação Sensor.', options: [{value:0, label:'0 - Orientado'}, {value:1, label:'1 - Desorientado p/ data + 2 dias'}, {value:2, label:'2 - Desorientado data > 2 dias'}, {value:3, label:'3 - Desorientado p/ local/pessoa'}, {value:4, label:'4 - Desorientado tempo/espaço/pessoa'}] }
    ],
    interpretation: (score) => {
        if (score >= 16) return { text: 'Abstinência Grave (Alto risco convulsão/DT)', color: 'text-red-600', bg: 'bg-red-50' };
        if (score >= 9) return { text: 'Abstinência Moderada (Indicação Benzodiazepínico)', color: 'text-orange-500', bg: 'bg-orange-50' };
        return { text: 'Abstinência Leve (Suporte)', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'osmo',
    name: 'Osmoterapia no TCE',
    description: 'Cálculo de Manitol e Salina Hipertônica.',
    icon: FlaskConical,
    type: 'custom'
  },
  {
    id: 'cvt',
    name: 'CVT-Risk Score (Ferro et al.)',
    description: 'Prognóstico na Trombose Venosa Cerebral.',
    icon: Droplets,
    type: 'calc',
    questions: [
        { id: 'malignancy', text: 'Neoplasia Maligna', options: [{value:2, label:'Sim (+2)'}, {value:0, label:'Não'}] },
        { id: 'coma', text: 'Coma (GCS < 9)', options: [{value:2, label:'Sim (+2)'}, {value:0, label:'Não'}] },
        { id: 'deep_vein', text: 'Trombose de Sistema Venoso Profundo', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'mental', text: 'Alteração do Estado Mental', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'male', text: 'Gênero Masculino', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'ich', text: 'Hemorragia Intracraniana', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] }
    ],
    interpretation: (score) => {
        if (score >= 3) return { text: 'Alto Risco de Morte ou Dependência (Rankin 3-6)', color: 'text-red-600', bg: 'bg-red-50' };
        if (score >= 1) return { text: 'Risco Moderado', color: 'text-orange-500', bg: 'bg-orange-50' };
        return { text: 'Baixo Risco (Bom Prognóstico)', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'shock',
    name: 'Choque: Neurogênico vs Espinhal',
    description: 'Diferenciação Clínica e Fisiopatológica.',
    icon: Zap,
    type: 'custom'
  }
];

export const NeuroEmergencyTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [weight, setWeight] = useState<string>('');
  
  // State específico para o protocolo de ME
  const [mePhase, setMePhase] = useState(0);
  const [meChecks, setMeChecks] = useState<Set<string>>(new Set());

  const activeTool = activeToolId ? TOOLS.find(t => t.id === activeToolId) : null;

  const calculateScore = (): number => {
      if (!activeTool) return 0;
      if (activeToolId === 'gcs_p') {
          const gcs = (Number(scores['eye']) || 0) + (Number(scores['verbal']) || 0) + (Number(scores['motor']) || 0);
          const pupil = Number(scores['pupil']) || 0;
          return Math.max(1, gcs - pupil);
      }
      return Object.values(scores).reduce<number>((acc, val: any) => acc + (Number(val) || 0), 0);
  };

  const currentInterpretation = activeTool?.interpretation ? activeTool.interpretation(calculateScore()) : null;

  const getOsmoDose = () => {
      const w = parseFloat(weight);
      if (!w) return null;
      return {
          mannitol: { dose: '1 g/kg', vol: (w * 5).toFixed(0) + ' ml (20%)' },
          hypertonic: { dose: '2.5 ml/kg', vol: (w * 2.5).toFixed(0) + ' ml (5%)' },
          hypertonic3: { dose: '3-5 ml/kg', vol: (w * 4).toFixed(0) + ' ml (3%)' }
      }
  };

  const ME_STEPS = [
      {
          title: "1. Pré-Requisitos",
          icon: ShieldAlert,
          checks: [
              { id: 'me1_1', label: 'Coma Aperceptivo (GCS 3) com Causa Conhecida e Irreversível' },
              { id: 'me1_2', label: 'Ausência de Fatores de Confundimento (Sedação, Hipotermia <35ºC, Distúrbios Metabólicos)' },
              { id: 'me1_3', label: 'Estabilidade Hemodinâmica (PAS ≥ 100 mmHg ou PAM adequada para idade)' },
              { id: 'me1_4', label: 'Saturação O2 > 94%' },
              { id: 'me1_5', label: 'Tempo de observação hospitalar mínimo (6h ou 24h se hipóxia/isquemia)' }
          ]
      },
      {
          title: "2. Exame Clínico (1º e 2º)",
          icon: Activity,
          info: "Devem ser realizados por 2 médicos diferentes, capacitados, com intervalo mínimo de 1 hora (>2 anos idade).",
          checks: [
              { id: 'me2_1', label: 'Coma aperceptivo (sem resposta supraespinhal)' },
              { id: 'me2_2', label: 'Pupilas fixas e arreativas (mesencéfalo)' },
              { id: 'me2_3', label: 'Ausência de reflexo córneo-palpebral (ponte)' },
              { id: 'me2_4', label: 'Ausência de reflexo oculocefálico (ponte)' },
              { id: 'me2_5', label: 'Ausência de reflexo vestíbulo-calórico (ponte/bulbo)' },
              { id: 'me2_6', label: 'Ausência de reflexo de tosse (bulbo)' }
          ]
      },
      {
          title: "3. Teste de Apneia",
          icon: Clock,
          info: "Confirma a ausência de drive respiratório bulbar.",
          checks: [
              { id: 'me3_1', label: 'Pré-oxigenação (FiO2 100% por 10 min) alcançada' },
              { id: 'me3_2', label: 'Desconexão do ventilador (com O2 suplementar via cateter traqueal)' },
              { id: 'me3_3', label: 'Ausência de movimentos respiratórios por 10 minutos' },
              { id: 'me3_4', label: 'Gasometria Final: PaCO2 > 55 mmHg E aumento > 20 mmHg sobre basal' }
          ]
      },
      {
          title: "4. Exame Complementar",
          icon: FileText,
          info: "Obrigatório no Brasil (Lei 9.434/97). Demonstra ausência de atividade elétrica ou fluxo sanguíneo.",
          checks: [
              { id: 'me4_1', label: 'Realizado (Doppler, EEG, Angiografia ou Cintilografia)' },
              { id: 'me4_2', label: 'Laudo compatível com Morte Encefálica (ausência de fluxo ou silêncio elétrico)' }
          ]
      }
  ];

  const toggleMeCheck = (id: string) => {
      const next = new Set(meChecks);
      if(next.has(id)) next.delete(id); else next.add(id);
      setMeChecks(next);
  };

  const isStepComplete = (stepIdx: number) => {
      return ME_STEPS[stepIdx].checks.every(c => meChecks.has(c.id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => activeToolId ? setActiveToolId(null) : navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Neurointensivismo</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 pb-24">
        {!activeToolId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TOOLS.map(tool => (
                    <button key={tool.id} onClick={() => { setActiveToolId(tool.id); setScores({}); setMePhase(0); setMeChecks(new Set()); }} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group">
                        <div className="p-3 bg-amber-500/10 rounded-2xl w-fit mb-4 text-amber-600 group-hover:scale-110 transition-transform"><tool.icon className="h-6 w-6" /></div>
                        <h3 className="font-black text-lg mb-1">{tool.name}</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{tool.description}</p>
                    </button>
                ))}
            </div>
        ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200 dark:border-zinc-800 relative animate-in fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tight">{activeTool?.name}</h2>
                    <button onClick={() => setActiveToolId(null)} className="text-slate-400 hover:text-primary transition-all"><X className="h-5 w-5" /></button>
                </div>
                
                {activeToolId === 'brain_death' ? (
                    <div className="space-y-6">
                        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl mb-4 overflow-x-auto no-scrollbar">
                            {ME_STEPS.map((step, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setMePhase(i)} 
                                    className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mePhase === i ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'} ${isStepComplete(i) ? 'text-emerald-600' : ''}`}
                                >
                                    {isStepComplete(i) && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
                                    Fase {i+1}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-black rounded-[2rem] border border-slate-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3 mb-4">
                                {React.createElement(ME_STEPS[mePhase].icon, { className: "h-6 w-6 text-primary" })}
                                <h3 className="text-lg font-black uppercase tracking-tight">{ME_STEPS[mePhase].title}</h3>
                            </div>
                            
                            {ME_STEPS[mePhase].info && (
                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-xl">
                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed uppercase">{ME_STEPS[mePhase].info}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                {ME_STEPS[mePhase].checks.map(check => (
                                    <button 
                                        key={check.id} 
                                        onClick={() => toggleMeCheck(check.id)} 
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${meChecks.has(check.id) ? 'bg-primary/5 border-primary' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${meChecks.has(check.id) ? 'bg-primary border-primary' : 'border-slate-300 dark:border-zinc-700'}`}>
                                            {meChecks.has(check.id) && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{check.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-zinc-800">
                            <button onClick={() => setMePhase(p => Math.max(0, p-1))} disabled={mePhase === 0} className="px-6 py-3 rounded-xl font-black text-[9px] uppercase bg-slate-100 dark:bg-zinc-900 text-slate-500 disabled:opacity-50">Anterior</button>
                            {mePhase < 3 ? (
                                <button onClick={() => setMePhase(p => p+1)} disabled={!isStepComplete(mePhase)} className="bg-primary text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase shadow-lg disabled:opacity-50 transition-all flex items-center gap-2">
                                    Próxima Fase <ArrowLeft className="h-3 w-3 rotate-180" />
                                </button>
                            ) : (
                                <div className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase flex items-center gap-2 ${isStepComplete(3) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                    {isStepComplete(3) ? <><CheckCircle2 className="h-4 w-4" /> Protocolo Concluído</> : 'Finalizar Checklist'}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeTool?.questions?.map(q => (
                            <div key={q.id} className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                <h4 className="text-xs font-black uppercase text-slate-400 mb-3">{q.text}</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {q.options?.map((opt: any) => (
                                        <button key={opt.label} onClick={() => setScores(p => ({...p, [q.id]: opt.value}))} className={`text-left p-3 rounded-xl text-[10px] font-black border transition-all ${scores[q.id] === opt.value ? 'bg-primary text-white border-primary shadow-md' : 'bg-white dark:bg-black border-slate-200'}`}>{opt.label}</button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {activeToolId === 'shock' && (
                            <div className="space-y-4">
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                                         <h3 className="text-red-700 dark:text-red-400 font-black uppercase text-xs mb-2">Choque Neurogênico</h3>
                                         <ul className="text-[10px] font-bold text-slate-600 dark:text-slate-300 space-y-1">
                                             <li>• Definição: Hemodinâmica (Perda de tônus simpático)</li>
                                             <li>• Sinais: Hipotensão + Bradicardia (Pele quente/seca)</li>
                                             <li>• Causa: Lesão acima de T6</li>
                                             <li>• Tratamento: Vasopressores + Fluidos (cuidado)</li>
                                         </ul>
                                     </div>
                                     <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                                         <h3 className="text-blue-700 dark:text-blue-400 font-black uppercase text-xs mb-2">Choque Espinhal</h3>
                                         <ul className="text-[10px] font-bold text-slate-600 dark:text-slate-300 space-y-1">
                                             <li>• Definição: Neurológica (Perda de função medular)</li>
                                             <li>• Sinais: Paralisia flácida + Arreflexia abaixo da lesão</li>
                                             <li>• Causa: Concussão medular aguda</li>
                                             <li>• Resolução: Retorno do reflexo bulbocavernoso</li>
                                         </ul>
                                     </div>
                                 </div>
                                 <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                     <p className="text-[9px] font-medium text-slate-500 italic uppercase">Nota: O termo "Choque Espinhal" refere-se à supressão temporária de toda a atividade reflexa abaixo do nível da lesão. O "Choque Neurogênico" é o colapso circulatório.</p>
                                 </div>
                            </div>
                        )}

                        {activeToolId === 'osmo' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Peso do Paciente (kg)</label>
                                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-2xl font-black text-center" placeholder="00" />
                                </div>
                                {getOsmoDose() && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border-l-4 border-indigo-500">
                                            <h4 className="text-indigo-700 dark:text-indigo-400 font-black uppercase text-xs mb-1">Manitol 20%</h4>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white">{getOsmoDose()?.mannitol.vol}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dose: {getOsmoDose()?.mannitol.dose}</p>
                                        </div>
                                        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border-l-4 border-emerald-500">
                                            <h4 className="text-emerald-700 dark:text-emerald-400 font-black uppercase text-xs mb-1">Salina Hipertônica 5%</h4>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white">{getOsmoDose()?.hypertonic.vol}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dose: {getOsmoDose()?.hypertonic.dose}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                                    <div className="text-[10px] text-amber-800 dark:text-amber-200 font-medium">
                                        <p>• Manitol: Evitar se hipotensão (diurese osmótica).</p>
                                        <p>• Salina: Preferível em instabilidade hemodinâmica.</p>
                                        <p>• Alvo: Manter Na &lt; 160 mEq/L e Osm &lt; 320 mOsm.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentInterpretation && (
                            <div className={`p-6 rounded-[2rem] text-center border-4 border-white dark:border-zinc-800 shadow-xl ${currentInterpretation.bg} ${currentInterpretation.color}`}>
                                <div className="text-4xl font-black mb-1">{calculateScore()}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest">{currentInterpretation.text}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};
