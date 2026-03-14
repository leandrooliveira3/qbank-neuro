
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

const MS_REGIONS = [
    { id: 'pv', name: 'Periventricular', desc: '≥ 1 lesão adjacente ao ventrículo (S: 100% E: 43%).' },
    { id: 'cj', name: 'Cortical ou Justacortical', desc: '≥ 1 lesão tocando o córtex.' },
    { id: 'it', name: 'Infratentorial', desc: 'Tronco cerebral ou Cerebelo.' },
    { id: 'sc', name: 'Medula Espinhal', desc: 'Qualquer lesão intramedular.' },
    { id: 'on', name: 'Nervo Óptico (McDonald 2024)', desc: 'Confirmado por RM, OCT ou VEP.' }
];

export const NeuroImmunologyTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [msTab, setMsTab] = useState<'diag' | 'tx'>('diag');
  const [edssScores, setEdssScores] = useState<Record<string, number>>({});
  const [msSites, setMsSites] = useState<Set<string>>(new Set());
  const [msMarkers, setMsMarkers] = useState<Set<string>>(new Set());

  const [nmoAqp4, setNmoAqp4] = useState<'pos' | 'neg' | 'unk'>('unk');
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
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Incapacidade Funcional (Kurtzke)</p>
                </button>
                <button onClick={() => { setActiveTool('mcdonald'); setMsTab('diag'); }} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group">
                    <div className="p-3 bg-blue-500/10 rounded-2xl w-fit mb-4 text-blue-600 group-hover:scale-110 transition-transform"><ShieldCheck className="h-6 w-6" /></div>
                    <h3 className="font-black text-lg mb-1">Esclerose Múltipla</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">McDonald 2024 & Tratamento DMT</p>
                </button>
                <button onClick={() => setActiveTool('nmosd')} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl w-fit mb-4 text-indigo-600 group-hover:scale-110 transition-transform"><AlertOctagon className="h-6 w-6" /></div>
                    <h3 className="font-black text-lg mb-1">NMOSD (IPND 2015)</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Critérios Internacionais AQP4 +/-</p>
                </button>
            </div>
        ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-200 dark:border-zinc-800 space-y-8 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black uppercase tracking-tight">
                        {activeTool === 'edss' ? 'Calculadora EDSS' : activeTool === 'mcdonald' ? 'Esclerose Múltipla' : 'NMOSD IPND 2015'}
                    </h2>
                    <button onClick={() => setActiveTool(null)} className="p-2 text-slate-400 hover:text-primary"><X className="h-5 w-5" /></button>
                </div>

                {activeTool === 'mcdonald' && (
                    <div className="space-y-6">
                        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl w-fit mb-4">
                            <button onClick={() => setMsTab('diag')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${msTab === 'diag' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>Diagnóstico</button>
                            <button onClick={() => setMsTab('tx')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${msTab === 'tx' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>Tratamento (DMT)</button>
                        </div>

                        {msTab === 'diag' ? (
                            <div className="space-y-6 animate-in fade-in">
                                <div className={`p-8 rounded-[2rem] text-white text-center shadow-xl transition-all ${msDiagnosis.c}`}>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{msDiagnosis.t}</h2>
                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-2">{msDiagnosis.m}</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><Target className="h-3.5 w-3.5" /> Disseminação em Espaço (DIS)</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {MS_REGIONS.map(r => (
                                            <button key={r.id} onClick={() => toggleSet(msSites, setMsSites, r.id)} className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${msSites.has(r.id) ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'bg-white dark:bg-zinc-950 border-slate-100'}`}>
                                                <div><span className="text-[11px] uppercase font-black block">{r.name}</span><span className="text-[8px] font-medium opacity-60 uppercase">{r.desc}</span></div>
                                                {msSites.has(r.id) && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><FlaskConical className="h-3.5 w-3.5" /> Marcadores Complementares</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            {id:'dit', label:'DIT (Novas Lesões)'}, {id:'ocb', label:'Bandas OCB (LCR)'},
                                            {id:'kflc', label:'Kappa FLC Index'}, {id:'cvs', label:'CVS (Sinal Veia Central)'},
                                            {id:'prl', label:'PRL (Rim Lesion)'}
                                        ].map(m => (
                                            <button key={m.id} onClick={() => toggleSet(msMarkers, setMsMarkers, m.id)} className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${msMarkers.has(m.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 text-slate-400'}`}>{m.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in">
                                <section className="p-6 bg-red-50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900 rounded-[2rem]">
                                    <h4 className="text-red-600 font-black text-xs uppercase mb-4 flex items-center gap-2"><Zap className="h-4 w-4" /> Fase Aguda (UpToDate)</h4>
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm space-y-2">
                                        <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white">Pulsoterapia: Metilprednisolona 1g/dia IV (3-5 dias).</p>
                                        <p className="text-[10px] font-medium text-slate-500 italic leading-tight">Considere PLEX precoce se déficit motor grave (EDSS &gt; 4.5) e resposta parcial inicial.</p>
                                    </div>
                                </section>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Manutenção (Terapia Modificadora - DMT)</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="p-5 border-2 border-slate-100 dark:border-zinc-800 rounded-3xl space-y-4">
                                            <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Shield className="h-4 w-4" /> Baixa/Moderada Eficácia</h5>
                                            <p className="text-[10px] text-slate-400 uppercase">Indicado para formas leves, sem fatores de prognóstico ruim.</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Teriflunomida', 'Glatirâmer', 'Interferon-Beta', 'Dimetilfumarato'].map(d => (
                                                    <div key={d} className="bg-slate-50 dark:bg-zinc-800 p-3 rounded-xl text-[9px] font-black text-center uppercase border border-slate-100 dark:border-zinc-700">{d}</div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-5 border-2 border-indigo-500/30 rounded-3xl space-y-4 bg-indigo-50/10">
                                            <h5 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Zap className="h-4 w-4" /> Alta Eficácia</h5>
                                            <p className="text-[10px] text-indigo-400 uppercase">Formas ativas (NEDA 3 não atingido) ou prognóstico reservado.</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Fingolimode', 'Natalizumabe', 'Cladribina', 'Ocrelizumabe', 'Ofatumumabe'].map(d => (
                                                    <div key={d} className="bg-white dark:bg-zinc-800 p-3 rounded-xl text-[9px] font-black text-center uppercase border-2 border-indigo-500/20">{d}</div>
                                                ))}
                                            </div>
                                            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-100 dark:border-red-900/40 flex items-start gap-2">
                                                <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-[8px] font-bold text-red-600 leading-tight uppercase">Atenção: Natalizumabe (Risco PML - anti-JCV). Ocrelizumabe (TB/Hepatite Screening).</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="h-20" />
                    </div>
                )}

                {activeTool === 'edss' && (
                    <div className="space-y-6 animate-in fade-in pb-20">
                        <div className="p-6 bg-slate-900 text-white rounded-[2rem] text-center shadow-xl mb-4 border-2 border-primary/20">
                            <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Kurtzke Expanded Disability Status Scale</p>
                            <div className="text-6xl font-black tracking-tighter">{calculateEDSS()}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(EDSS_DATA).map(([key, data]) => (
                                <div key={key} className="bg-slate-50 dark:bg-black p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                    <h4 className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-widest">{data.name}</h4>
                                    <select className="w-full p-3 rounded-xl border bg-white dark:bg-zinc-900 text-[10px] font-bold outline-none focus:border-primary" value={edssScores[key] || 0} onChange={e => setEdssScores(p => ({...p, [key]: Number(e.target.value)}))}>
                                        {data.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="h-20" />
                    </div>
                )}

                {activeTool === 'nmosd' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-5 pb-20">
                        <div className={`p-8 rounded-[2rem] text-white text-center shadow-xl ${nmoDiagnosis.c}`}>
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{nmoDiagnosis.t}</h2>
                            <p className="text-[9px] font-black opacity-70 mt-1 uppercase tracking-widest">{nmoDiagnosis.m}</p>
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">1. Sorologia AQP4</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {['pos', 'neg', 'unk'].map(s => (
                                    <button key={s} onClick={() => setNmoAqp4(s as any)} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${nmoAqp4 === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-zinc-950 border-slate-100 text-slate-400'}`}>{s === 'pos' ? 'Positivo' : s === 'neg' ? 'Negativo' : 'Desconhecido'}</button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><Activity className="h-4 w-4" /> 2. Sintomas Core (IPND 2015)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {['Neurite Óptica', 'Mielite Aguda (LETM)', 'Síndrome Área Postrema', 'Tronco Cerebral Aguda', 'Diencefálica Aguda', 'Cerebral Aguda'].map(item => (
                                    <button key={item} onClick={() => toggleSet(nmoCore, setNmoCore, item)} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${nmoCore.has(item) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-white dark:bg-zinc-950 border-slate-100'}`}>
                                        <span className="text-[10px] font-black uppercase">{item}</span>
                                        {nmoCore.has(item) && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-900 text-white rounded-[2rem] space-y-4 border border-indigo-500/20 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Microscope className="h-10 w-10 text-indigo-400" /></div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-indigo-400">Pérolas Terapêuticas NMOSD</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-[9px] font-black uppercase text-indigo-300">Prevenção de Recidivas</p>
                                    <p className="text-[11px] font-medium mt-1 leading-relaxed">Drogas de escolha (UpToDate): Rituximabe, Azatioprina, Micofenolato. Novos anticorpos: Eculizumabe (C5), Satralizumabe (IL-6R), Inebilizumabe (CD19).</p>
                                </div>
                                <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl">
                                    <p className="text-[8px] font-black text-red-400 uppercase flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Contraindicação Absoluta</p>
                                    <p className="text-[10px] font-bold text-red-300 mt-1 uppercase">EVITAR BLOQUEADORES DE CANAL DE SÓDIO (CBZ/PHT) E INTERFERON-BETA. PODEM EXACERBAR A DOENÇA.</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-20" />
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};
