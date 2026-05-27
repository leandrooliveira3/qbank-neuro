
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Shield, Activity, Brain, Eye, 
  CheckCircle2, AlertOctagon, Info, Ruler, 
  Search, Calculator, Droplets, Microscope,
  ChevronRight, Target, ShieldCheck, AlertCircle,
  FileText, Zap, Ban, FlaskConical, X, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { syncEngine } from '../../services/syncEngine';

const EDSS_DATA = {
    visual: { name: 'Visual', options: [{v:0,l:'0 - Normal'},{v:1,l:'1 - Escotoma/Palidez'},{v:2,l:'2 - Escotoma grande/AV < 20/30'},{v:3,l:'3 - Campo mod. reduzido'},{v:4,l:'4 - Campo marcado/AV < 20/100'},{v:5,l:'5 - AV < 20/200'},{v:6,l:'6 - Grau 5 + AV melhor < 20/60'}] },
    brainstem: { name: 'Tronco', options: [{v:0,l:'0 - Normal'},{v:1,l:'1 - Sinais apenas'},{v:2,l:'2 - Nistagmo mod.'},{v:3,l:'3 - Nistagmo grave/EOM'},{v:4,l:'4 - Disartria marcada'},{v:5,l:'5 - Incapaz engolir/falar'}] },
    pyramidal: { name: 'Piramidal', options: [{v:0,l:'0 - Normal'},{v:1,l:'1 - Sinais anormais'},{v:2,l:'2 - Incapacidade mínima'},{v:3,l:'3 - Paraparesia leve (F 3-4)'},{v:4,l:'4 - Paraparesia marcada (F 2)'},{v:5,l:'5 - Paraplegia'},{v:6,l:'6 - Tetraplegia'}] },
    cerebellar: { name: 'Cerebelar', options: [{v:0,l:'0 - Normal'},{v:1,l:'1 - Sinais anormais'},{v:2,l:'2 - Ataxia leve'},{v:3,l:'3 - Ataxia moderada'},{v:4,l:'4 - Ataxia grave'},{v:5,l:'5 - Incapaz coordenação'}] },
    sensory: { name: 'Sensitivo', options: [{v:0,l:'0 - Normal'},{v:1,l:'1 - Diminuição leve'},{v:2,l:'2 - Diminuição leve/mod'},{v:3,l:'3 - Diminuição moderada'},{v:4,l:'4 - Diminuição marcada'},{v:5,l:'5 - Perda total 1-2 membros'},{v:6,l:'6 - Perda total abaixo cabeça'}] },
    bowel: { name: 'Esfíncter', options: [{v:0,l:'0 - Normal'},{v:1,l:'1 - Hesitação leve'},{v:2,l:'2 - Urgência mod/Retenção'},{v:3,l:'3 - Incontinência freq.'},{v:4,l:'4 - Cateterismo constante'},{v:5,l:'5 - Perda função'},{v:6,l:'6 - Perda total'}] },
    cerebral: { name: 'Cerebral', options: [{v:0,l:'0 - Normal'},{v:1,l:'1 - Humor/Fadiga'},{v:2,l:'2 - Mentação leve'},{v:3,l:'3 - Mentação mod'},{v:4,l:'4 - Mentação marcada'},{v:5,l:'5 - Demência'}] },
    ambulation: { name: 'Deambulação', options: [{v:0,l:'Irrestrita'},{v:1,l:'Totalmente ambulante (>500m)'},{v:2,l:'>300m e <500m'},{v:3,l:'>200m e <300m'},{v:4,l:'>100m e <200m'},{v:5,l:'<100m sem ajuda (apoio unilateral)'},{v:6,l:'Apoio unilateral constante >50m'},{v:7,l:'Apoio bilateral constante >120m'}] }
};

const DEMYELINATING_DIFFERENTIALS = {
    epidemiology: [
        { disease: 'Esclerose Múltipla', age: '20-40 anos', sex: 'Mulheres (3:1)', ethnicity: 'Caucasiano (Hemisfério Norte)', onset: 'Surtos/Remissões (Relapsing)', mri: 'Lesões ovoides (Dawson fingers), Periventriculares, Justacorticais.' },
        { disease: 'NMOSD', age: 'Todas as idades', sex: 'Mulheres (9:1)', ethnicity: 'Não-Caucasianos (Asiáticos/Afros)', onset: 'Surto Grave (unilateral ou bilateral)', mri: 'Mielite Extensa (LETM ≥3 corpos vert.), Nervo Óptico Posterior/Quiasma.' },
        { disease: 'MOGAD', age: 'Crianças e Adultos', sex: 'Feminino = Masculino (1:1)', ethnicity: 'Todas', onset: 'ADEM, Neurite Óptica Bilateral', mri: 'Lesões medulares curtas ou extensas (conus), Nervo Óptico Anterior.' },
        { disease: 'ADEM', age: 'Crianças (>90%)', sex: 'F = M', ethnicity: 'Todas', onset: 'Monofásico, pós-vacinal ou infeccioso', mri: 'Lesões grandes e mal definidas, bilaterais, sem realce persistente.' }
    ],
    encephalitis: {
        surface: [
            { antibody: 'Anti-NMDAR', clinical: 'Psicose, alterações de memória, discinesias orofaciais, instabilidade autonômica, hipoventilação.', associations: 'Teratoma de Ovário (comum em mulheres jovens).', response: 'Boa', pearls: 'Mais comum. Fases: viral-like -> psiquiátrica -> discinética/coma.' },
            { antibody: 'Anti-LGI1', clinical: 'Amnésia, crises distônicas faciobraquiais (FBDS), hiponatremia severa.', associations: 'Raro (Timoma). Idosos (homens).', response: 'Excelente', pearls: 'FBDS patognomônica, muito responsivo a corticoides.' },
            { antibody: 'Anti-CASPR2', clinical: 'Encefalopatia, neuromiotonia, insônia severa, Síndrome de Morvan.', associations: 'Timoma (até 20%). Homens idosos.', response: 'Boa', pearls: 'Associado a disautonomia e dor neuropática.' },
            { antibody: 'Anti-GABA-B-R', clinical: 'Crises focais refratárias precoces, encefalite límbica.', associations: 'Câncer de Pulmão Pequenas Células (CPPC) (até 50%).', response: 'Boa, mas o câncer dita prognóstico', pearls: 'Manifestação primária é geralmente estado de mal epiléptico.' },
            { antibody: 'Anti-DPPX', clinical: 'Diarreia prodrômica e perda de peso, seguida de hiperexcitabilidade de SNC (tremores, mioclonia).', associations: 'Linfoma B associado (raro).', response: 'Boa', pearls: 'Quadro gastrointestinal precede os sintomas neurológicos em meses.' }
        ],
        intracellular: [
            { antibody: 'Anti-Hu (ANNA-1)', clinical: 'Polirradiculoneuropatia, encefalomielite, pseudo-obstrução intestinal.', associations: 'CPPC (Small Cell Lung Cancer).', response: 'Pobre (Mediadas por Células T)', pearls: 'Apresentação mais comum: neuropatia sensitiva pura.' },
            { antibody: 'Anti-Ma2', clinical: 'Encefalite límbica, diencefálica e tronco. Parkinsonismo atípico, oftalmoplegia.', associations: 'Câncer de Testículo (homens jovens).', response: 'Moderada, se o tumor for tratado', pearls: 'Pode cursar com narcolepsia-like e cataplexia.' },
            { antibody: 'Anti-Yo (PCA-1)', clinical: 'Degeneração Cerebelar Paraneoplásica (ataxia grave aguda/subaguda).', associations: 'Câncer de Mama, Câncer de Ovário.', response: 'Pobre', pearls: 'Destruição irreversível das células de Purkinje.' },
            { antibody: 'Anti-Ri (ANNA-2)', clinical: 'Síndrome de Opsoclonus-Mioclonus, encefalite de tronco.', associations: 'Câncer de Mama e Câncer de Pulmão.', response: 'Pobre', pearls: 'Clássico achado de movimentos oculares sacádicos multidirecionais.' },
            { antibody: 'Anti-Amfifisina', clinical: 'Síndrome da Pessoa Rígida (Stiff-person syndrome), espasmos severos.', associations: 'Câncer de Mama, CPPC.', response: 'Pobre/Parcial', pearls: 'Diferencia do anti-GAD por ser de início paraneoplásico agudo.' }
        ]
    },
    treatments: [
        { tier: 'Primeira Linha (Agudo)', steps: 'Pulsoterapia (Metilprednisolona 1g/dia por 3-5d) + IGIV (2g/kg sobre 2-5d) OU Plasmaférese (5-7 sessões).', note: 'Não esperar resultado de painel autoimune para iniciar. Tratamento empírico é mandatório se alta suspeita.' },
        { tier: 'Segunda Linha (Se refratário em 10-14 dias)', steps: 'Rituximabe (Anti-CD20) OU Ciclofosfamida.', note: 'Inibidores de células B e T. Pode-se combinar Ritux + Ciclofosfamida em casos gravíssimos.' },
        { tier: 'Manejo Oncológico', steps: 'Rastreio tumoral completo (TC tórax/abdome/pelve, USG transvaginal/testículos).', note: 'Ressecção do tumor associado (ex: teratoma ovariano no NMDAR) é imperativa para a cura.' }
    ]
};

const MS_TREATMENT_FLOW = [
    { tier: 'Alta Eficácia (Primeira Escolha no Prognóstico Ruim)', drugs: ['Natalizumabe (Anti-VLA4)', 'Ocrelizumabe (Anti-CD20)', 'Ofatumumabe (Anti-CD20)', 'Cladribina'], mechanism: 'Sequestro linfocitário ou depleção profunda.', sideEffects: 'Risco de PML (JCV+), Infecções respiratórias, Hipogamaglobulinemia.' },
    { tier: 'Moderada Eficácia', drugs: ['Fingolimode', 'Dimetilfumarato', 'Teriflunomida'], mechanism: 'Modulação de receptores S1P ou vias metabólicas.', sideEffects: 'Bradiarritmias (Fingolimode), Flushing (DMF), Alopecia/Teratogenia (Teriflunomida).' },
    { tier: 'Injetáveis (Segurança a longo prazo)', drugs: ['Glatirâmer', 'Interferon-Beta'], mechanism: 'Imunomodulação Th2.', sideEffects: 'Reações no local de aplicação, sintomas gripais, lipoatrofia.' }
];

export const NeuroImmunologyTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [msTab, setMsTab] = useState<'diag' | 'tx' | 'diff'>('diag');
  const [edssScores, setEdssScores] = useState<Record<string, number>>({});
  const [msSites, setMsSites] = useState<Set<string>>(new Set());
  const [msMarkers, setMsMarkers] = useState<Set<string>>(new Set());

  const [nmoAqp4, setNmoAqp4] = useState<'pos' | 'neg' | 'unk'>('unk');
  const [mogIgG, setMogIgG] = useState<'pos' | 'neg' | 'unk'>('unk');
  const [nmoCore, setNmoCore] = useState<Set<string>>(new Set());

  const toggleSet = (set: Set<string>, setter: any, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const calculateEDSS = () => {
      const amb = Number(edssScores['ambulation'] || 0);
      const ambMap: Record<number, number> = { 0:0, 1:0, 2:4.5, 3:5.0, 4:5.5, 5:6.0, 6:6.0, 7:6.5 };
      let step = ambMap[amb] || 0;
      if (amb <= 1) {
          const fsValues = Object.keys(EDSS_DATA).filter(k => k !== 'ambulation').map(k => edssScores[k] || 0);
          const maxFS = Math.max(...fsValues);
          if (maxFS >= 5) step = 5.0;
          else if (maxFS === 4) step = 4.0;
          else if (maxFS === 3) step = 3.0;
          else if (maxFS === 2) step = 2.0;
          else if (maxFS === 1) step = 1.0;
          else step = 0;
      }
      return step.toFixed(1);
  };

  const msDiagnosis = useMemo(() => {
      const dis = msSites.size;
      const hasDit = msMarkers.has('dit');
      const hasLiquor = msMarkers.has('ocb') || msMarkers.has('kflc');
      if (dis >= 2 && (hasDit || hasLiquor)) return { t: 'EM Definida (McDonald)', c: 'bg-emerald-600', m: 'DIS (≥2/5) + DIT ou Bandas OCB/LCR.' };
      return { t: 'Aguardando Critérios', c: 'bg-slate-500', m: 'Requer DIS e DIT (ou LCR positivo).' };
  }, [msSites, msMarkers]);

  const nmoDiagnosis = useMemo(() => {
      const coreCount = nmoCore.size;
      if (nmoAqp4 === 'pos' && coreCount >= 1) return { t: 'NMOSD Definida (AQP4+)', c: 'bg-emerald-600', m: '≥ 1 sintoma core + Sorologia positiva.' };
      if (nmoAqp4 === 'neg' && coreCount >= 2) {
          const requiredSymptom = nmoCore.has('Neurite Óptica') || nmoCore.has('Mielite Aguda (LETM)') || nmoCore.has('Síndrome Área Postrema');
          if (requiredSymptom) return { t: 'NMOSD Definida (AQP4-)', c: 'bg-emerald-600', m: '≥ 2 cores (NO, Mielite ou Postrema) + RM sugestiva.' };
      }
      return { t: 'Inconclusivo', c: 'bg-slate-500', m: 'NMOSD AQP4- exige rigorosos critérios de RM.' };
  }, [nmoAqp4, nmoCore]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => activeTool ? setActiveTool(null) : navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Neuroimunologia</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-40">
        {!activeTool ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setActiveTool('edss')} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl w-fit mb-4 text-cyan-600 group-hover:scale-110 transition-transform"><Ruler className="h-6 w-6" /></div>
                    <h3 className="font-black text-lg mb-1">Calculadora EDSS</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-[9px]">Nova Interface - Kurtzke</p>
                </button>
                <button onClick={() => { setActiveTool('mcdonald'); setMsTab('diag'); }} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group">
                    <div className="p-3 bg-blue-500/10 rounded-2xl w-fit mb-4 text-blue-600 group-hover:scale-110 transition-transform"><ShieldCheck className="h-6 w-6" /></div>
                    <h3 className="font-black text-lg mb-1">Esclerose Múltipla</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">McDonald 2024 & Tratamentos</p>
                </button>
                <button onClick={() => setActiveTool('nmosd')} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl w-fit mb-4 text-indigo-600 group-hover:scale-110 transition-transform"><AlertOctagon className="h-6 w-6" /></div>
                    <h3 className="font-black text-lg mb-1">NMOSD & MOGAD</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Critérios Internacionais</p>
                </button>
                <button onClick={() => setActiveTool('encephalitis')} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group">
                    <div className="p-3 bg-purple-500/10 rounded-2xl w-fit mb-4 text-purple-600 group-hover:scale-110 transition-transform"><Brain className="h-6 w-6" /></div>
                    <h3 className="font-black text-lg mb-1">Encefalites Autoimunes</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Anticorpos e Conduta</p>
                </button>
            </div>
        ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200 dark:border-zinc-800 space-y-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-tight">
                        {activeTool === 'edss' ? 'Calculadora EDSS' : activeTool === 'mcdonald' ? 'Esclerose Múltipla' : activeTool === 'nmosd' ? 'NMOSD & MOGAD' : 'Encefalites Autoimunes'}
                    </h2>
                    <button onClick={() => setActiveTool(null)} className="p-2 text-slate-400 hover:text-primary"><X className="h-5 w-5" /></button>
                </div>

                        {activeTool === 'mcdonald' && (
                    <div className="space-y-6">
                        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl w-fit mb-4">
                            <button onClick={() => setMsTab('diff')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${msTab === 'diff' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>Diferenciais</button>
                            <button onClick={() => setMsTab('diag')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${msTab === 'diag' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>Diagnóstico</button>
                            <button onClick={() => setMsTab('tx')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${msTab === 'tx' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>Tratamento (DMT)</button>
                        </div>

                        {msTab === 'diff' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {DEMYELINATING_DIFFERENTIALS.epidemiology.map(d => (
                                        <div key={d.disease} className="p-5 border-2 border-slate-100 dark:border-zinc-800 rounded-[2rem] space-y-3">
                                            <h4 className="text-sm font-black uppercase text-blue-600">{d.disease}</h4>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Epidemio: <span className="text-slate-800 dark:text-slate-200">{d.age} | {d.sex} | {d.ethnicity}</span></p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Apresentação: <span className="text-slate-800 dark:text-slate-200">{d.onset}</span></p>
                                                <p className="text-[9px] font-medium text-slate-500 leading-tight border-t border-slate-100 dark:border-zinc-800 pt-2 selection:bg-blue-100">{d.mri}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msTab === 'diag' ? (
                            <div className="space-y-6 animate-in fade-in">
                                <div className={`p-8 rounded-[2rem] text-white text-center shadow-xl transition-all ${msDiagnosis.c}`}>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{msDiagnosis.t}</h2>
                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-2">{msDiagnosis.m}</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><Target className="h-3.5 w-3.5" /> Disseminação em Espaço (McDonald 2024)</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'pv', name: 'Periventricular', desc: '≥ 1 lesão adjacente ao ventrículo.' },
                                            { id: 'cj', name: 'Cortical / Justacortical', desc: '≥ 1 lesão tocando o córtex.' },
                                            { id: 'it', name: 'Infratentorial', desc: 'Tronco cerebral ou Cerebelo.' },
                                            { id: 'sc', name: 'Medula Espinhal', desc: 'Qualquer lesão intramedular.' },
                                            { id: 'on', name: 'Nervo Óptico (McDonald 2024)', desc: 'Confirmado por RM, OCT ou VEP.' }
                                        ].map(r => (
                                            <button key={r.id} onClick={() => toggleSet(msSites, setMsSites, r.id)} className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${msSites.has(r.id) ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white dark:bg-zinc-950 border-slate-100'}`}>
                                                <div><span className="text-[11px] uppercase font-black block">{r.name}</span><span className="text-[8px] font-medium opacity-60 uppercase">{r.desc}</span></div>
                                                {msSites.has(r.id) && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><FlaskConical className="h-3.5 w-3.5" /> Marcadores (DIT e LCR)</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            {id:'dit', label:'DIT (Novas Lesões)'}, {id:'ocb', label:'Bandas OCB (LCR)'},
                                            {id:'kflc', label:'Kappa FLC Index'}, {id:'cvs', label:'CVS (Veia Central)'}
                                        ].map(m => (
                                            <button key={m.id} onClick={() => toggleSet(msMarkers, setMsMarkers, m.id)} className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${msMarkers.has(m.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 text-slate-400'}`}>{m.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : msTab === 'tx' ? (
                            <div className="space-y-8 animate-in fade-in">
                                <section className="p-6 bg-red-50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900 rounded-[2rem]">
                                    <h4 className="text-red-600 font-black text-xs uppercase mb-4 flex items-center gap-2"><Zap className="h-4 w-4" /> Manejo do Surto Agudo</h4>
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm space-y-2">
                                        <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white">Pulsoterapia: Metilprednisolona 1g/dia IV (3-5 dias).</p>
                                        <p className="text-[10px] font-medium text-slate-500 italic leading-tight">Grave ou Refratário: Plasmaférese (PLEX) precoce é o próximo passo.</p>
                                    </div>
                                </section>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Manutenção e Progressão (DMT)</h4>
                                    {MS_TREATMENT_FLOW.map((t, idx) => (
                                        <div key={idx} className={`p-6 border-2 rounded-[2rem] space-y-4 ${idx === 0 ? 'bg-indigo-50/10 border-indigo-500/30' : 'border-slate-100 dark:border-zinc-800'}`}>
                                            <h5 className={`text-[11px] font-black uppercase tracking-widest ${idx === 0 ? 'text-indigo-600' : 'text-slate-500'}`}>{t.tier}</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {t.drugs.map(d => (
                                                    <div key={d} className="bg-white dark:bg-zinc-800 px-3 py-2 rounded-xl text-[10px] font-bold uppercase border border-slate-200 dark:border-zinc-700">{d}</div>
                                                ))}
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Mecanismo: <span className="font-medium lowercase normal-case">{t.mechanism}</span></p>
                                                <p className="text-[10px] font-bold text-red-500 uppercase">Atenção: <span className="font-medium lowercase normal-case">{t.sideEffects}</span></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {activeTool === 'edss' && (
                    <div className="space-y-6 animate-in fade-in pb-20 px-2">
                        <div className="p-6 bg-slate-900 text-white rounded-[2rem] text-center shadow-xl border-2 border-primary/20 sticky top-0 z-40">
                            <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">MDS - Expanded Disability Status Scale</p>
                            <div className="text-6xl font-black tracking-tighter leading-none">{calculateEDSS()}</div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 pt-4">
                            {Object.entries(EDSS_DATA).map(([key, data]) => (
                                <div key={key} className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-2">{data.name}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {data.options.map(o => (
                                            <button key={o.v} onClick={() => setEdssScores(p => ({...p, [key]: o.v}))} className={`p-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${edssScores[key] === o.v ? 'bg-primary border-primary text-white shadow-lg scale-105' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 text-slate-400'}`}>
                                                {o.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTool === 'nmosd' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-5 pb-20">
                        <div className={`p-8 rounded-[2rem] text-white text-center shadow-xl ${nmoDiagnosis.c}`}>
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{nmoDiagnosis.t}</h2>
                            <p className="text-[9px] font-black opacity-70 mt-1 uppercase tracking-widest">{nmoDiagnosis.m}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4 p-5 bg-slate-50 dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-800">
                                <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] ml-2">Sorologia AQP4-IgG</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {['pos', 'neg', 'unk'].map(s => (
                                        <button key={s} onClick={() => setNmoAqp4(s as any)} className={`py-4 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${nmoAqp4 === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-zinc-900 border-slate-100 text-slate-400'}`}>{s === 'pos' ? 'Pos' : s === 'neg' ? 'Neg' : '?'}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4 p-5 bg-slate-50 dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-800">
                                <h3 className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] ml-2">Sorologia MOG-IgG</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {['pos', 'neg', 'unk'].map(s => (
                                        <button key={s} onClick={() => setMogIgG(s as any)} className={`py-4 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${mogIgG === s ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-zinc-900 border-slate-100 text-slate-400'}`}>{s === 'pos' ? 'Pos' : s === 'neg' ? 'Neg' : '?'}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><Activity className="h-4 w-4" /> Manifestações Clínicas Core</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {['Neurite Óptica (LETM nervo)', 'Mielite Aguda (Transversa)', 'Síndrome Área Postrema (Soluço/Vômito)', 'Síndrome Tronco Cerebral', 'Diencefálica Aguda', 'ADEM (MOGAD)'].map(item => (
                                    <button key={item} onClick={() => toggleSet(nmoCore, setNmoCore, item)} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${nmoCore.has(item) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-white dark:bg-zinc-950 border-slate-100'}`}>
                                        <span className="text-[11px] font-black uppercase">{item}</span>
                                        {nmoCore.has(item) && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'encephalitis' && (
                    <div className="space-y-8 animate-in fade-in pb-20">
                        <div className="bg-purple-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                            <Brain className="h-10 w-10 opacity-40" />
                            <div><h3 className="font-black uppercase tracking-tight text-lg">Critérios de Graus et al. (2016)</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Diagnóstico de Encefalite Autoimune</p></div>
                        </div>

                        <div className="space-y-6">
                            <section>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4 mb-4">Anticorpos de Superfície (Boa Resposta)</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {DEMYELINATING_DIFFERENTIALS.encephalitis.surface.map(e => (
                                        <div key={e.antibody} className="p-5 bg-indigo-50/50 dark:bg-indigo-950/10 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] space-y-3 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity className="h-10 w-10 text-indigo-500" /></div>
                                            <h4 className="font-black text-sm text-indigo-700 uppercase relative z-10">{e.antibody}</h4>
                                            <div className="space-y-1 relative z-10">
                                                <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase leading-snug">{e.clinical}</p>
                                                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">Tumor Assoc: {e.associations}</p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl relative z-10">
                                                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold italic leading-tight">{e.pearls}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4 mb-4">Anticorpos Intracelulares / Onconeuronais (Paraneoplásicos)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {DEMYELINATING_DIFFERENTIALS.encephalitis.intracellular.map(e => (
                                        <div key={e.antibody} className="p-5 bg-rose-50/50 dark:bg-rose-950/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-[2rem] space-y-3 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><AlertTriangle className="h-8 w-8 text-rose-500" /></div>
                                            <h4 className="font-black text-xs text-rose-700 uppercase relative z-10">{e.antibody}</h4>
                                            <div className="space-y-1 relative z-10">
                                                <p className="text-[9px] font-bold text-slate-800 dark:text-slate-200 uppercase leading-snug">{e.clinical}</p>
                                                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">Câncer Assoc: <span className="font-black text-rose-600">{e.associations}</span></p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl relative z-10">
                                                <p className="text-[9px] text-slate-600 dark:text-slate-400 font-bold italic leading-tight">{e.pearls}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4 mb-4">Conduta e Tratamento</h4>
                                <div className="space-y-3">
                                    {DEMYELINATING_DIFFERENTIALS.treatments.map((t, idx) => (
                                        <div key={idx} className="p-6 bg-slate-900 text-white rounded-[2.5rem] flex flex-col md:flex-row md:items-center gap-4">
                                            <div className="h-10 w-10 shrink-0 bg-white/10 rounded-2xl flex items-center justify-center text-white"><Zap className="h-5 w-5" /></div>
                                            <div className="flex-1">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-primary mb-1">{t.tier}</h5>
                                                <p className="text-[11px] font-bold mb-1 leading-snug">{t.steps}</p>
                                                <p className="text-[9px] font-medium opacity-70 italic">{t.note}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};
