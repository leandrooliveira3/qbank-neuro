
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Eye, EyeOff, Search, Info, 
  CheckCircle2, AlertTriangle, Activity, 
  Zap, Droplets, Ruler, Thermometer, 
  ChevronRight, Brain, AlertCircle, ShieldAlert
} from 'lucide-react';

const VISION_LOSS_DIFF = [
  {
    id: 'noia_a',
    name: 'NOIA Arterítica (GCA)',
    severity: 'Emergência Médica',
    color: 'text-red-600',
    criteria: [
      'Idade > 50 anos',
      'BAV súbita e grave',
      'Claudicação de mandíbula',
      'Cefaleia temporal / Sensibilidade no escalpo',
      'VHS elevado (>50mm) / PCR elevada',
      'Edema de disco "pálido"'
    ],
    management: 'Corticoide IV imediato (prevenir cegueira contralateral) + Biopsia de A. Temporal.'
  },
  {
    id: 'noia_na',
    name: 'NOIA Não-Arterítica',
    severity: 'Frequente (Sênior)',
    color: 'text-orange-600',
    criteria: [
      'Fatores de risco vasculares (HAS, DM, Apneia)',
      'BAV súbita ao acordar',
      'Defeito de campo altitudinal (mais comum)',
      'Disco óptico em risco (Small Cup-to-Disc)',
      'Edema de disco hiperêmico'
    ],
    management: 'Controle de fatores de risco, evitar hipotensão noturna.'
  },
  {
    id: 'neuritis',
    name: 'Neurite Óptica (DMT)',
    severity: 'Perfil Jovem',
    color: 'text-blue-600',
    criteria: [
      'Dor à movimentação ocular (90%)',
      'Defeito Pupilar Aferente Relativo (Marcus-Gunn)',
      'Discromatopsia (perda de cores)',
      'Disco óptico normal em 2/3 dos casos (Retrobulbar)',
      'Fenômeno de Uhthoff (piora com calor)'
    ],
    management: 'Investigar EM/NMOSD. Pulsoterapia se BAV grave.'
  },
  {
    id: 'oacr',
    name: 'Oclusão de Artéria Central (OACR)',
    severity: 'Emergência Vascular',
    color: 'text-rose-600',
    criteria: [
      'BAV súbita e profunda (amaurose)',
      'Indolor',
      'Mancha "Vermelho-Cereja" na mácula',
      'Retina pálida / Edema de camadas internas'
    ],
    management: 'Protocolo de AVC isquêmico agudo. Massagem ocular (tentativa).'
  }
];

const DIPLOPIA_MAP = [
  {
    nerve: 'III Par (Oculomotor)',
    findings: 'Ptose + Olho "Down and Out"',
    pearl: 'REGRA DA PUPILA: Se pupila dilatada (midríase) -> Suspeitar de Aneurisma de AcoP (Compressivo). Se pupila poupada -> Isquemia (vasonervorum).',
    causes: 'Aneurisma AcoP, Diabetes (Isquêmico), Hérnia Uncal.'
  },
  {
    nerve: 'IV Par (Troclear)',
    findings: 'Diplopia Vertical (piora ao olhar para baixo/ler)',
    pearl: 'Sinal de Bielschowsky: Melhora com inclinação da cabeça para o lado oposto à lesão.',
    causes: 'Trauma (nervo mais longo), Congênito, Isquemia.'
  },
  {
    nerve: 'VI Par (Abducente)',
    findings: 'Diplopia Horizontal (deficit de abdução)',
    pearl: 'Falso sinal localizatório: Pode ser apenas sinal de Hipertensão Intracraniana (compressão no clivus).',
    causes: 'HIC, Diabetes, Isquemia, Neoplasia de base de crânio.'
  }
];

export const NeuroOphthalmologyTool: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bav' | 'diplopia' | 'hii'>('bav');
  const [selectedDiag, setSelectedDiag] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Neuroftalmologia</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-32">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('bav')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'bav' ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>Baixa Acuidade</button>
            <button onClick={() => setActiveTab('diplopia')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'diplopia' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-md' : 'text-slate-500'}`}>Diplopia / Paresias</button>
            <button onClick={() => setActiveTab('hii')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'hii' ? 'bg-white dark:bg-zinc-800 text-purple-600 shadow-md' : 'text-slate-500'}`}>HII (Pseudotumor)</button>
        </div>

        {activeTab === 'bav' && (
            <div className="space-y-4 animate-in fade-in">
                <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Search className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Diferencial de Perda Visual</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Abordagem Clínica e Urgências</p></div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {VISION_LOSS_DIFF.map(diag => (
                        <div key={diag.id} onClick={() => setSelectedDiag(selectedDiag === diag.id ? null : diag.id)} className={`bg-white dark:bg-zinc-950 border-2 rounded-[2rem] transition-all cursor-pointer overflow-hidden ${selectedDiag === diag.id ? 'border-primary shadow-xl scale-[1.01]' : 'border-slate-100 dark:border-zinc-900 hover:border-emerald-200'}`}>
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedDiag === diag.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}><EyeOff className="h-5 w-5" /></div>
                                    <div><h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{diag.name}</h4><span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-50 dark:bg-zinc-800 ${diag.color}`}>{diag.severity}</span></div>
                                </div>
                                <ChevronRight className={`h-4 w-4 transition-transform ${selectedDiag === diag.id ? 'rotate-90 text-primary' : 'text-slate-300'}`} />
                            </div>
                            {selectedDiag === diag.id && (
                                <div className="px-5 pb-6 space-y-4 animate-in slide-in-from-top-2">
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Critérios Diagnósticos</p>
                                        <ul className="space-y-2">
                                            {diag.criteria.map((c, i) => <li key={i} className="text-[10px] font-bold flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-primary" /> {c}</li>)}
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                                        <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Conduta Imediata</p>
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed uppercase">{diag.management}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'diplopia' && (
            <div className="space-y-4 animate-in fade-in">
                <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl">
                    <h3 className="font-black uppercase tracking-tight text-lg mb-1">Mapeamento de Diplopia Binocular</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Pares Cranianos e Regras Locais</p>
                </div>
                {DIPLOPIA_MAP.map(item => (
                    <div key={item.nerve} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-xl">III</div>
                            <div>
                                <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white">{item.nerve}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.findings}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border-l-4 border-amber-500">
                            <div className="flex items-center gap-2 mb-1 text-amber-700 dark:text-amber-400 font-black text-[9px] uppercase tracking-widest"><ShieldAlert className="h-3 w-3" /> Pérola Diagnóstica</div>
                            <p className="text-[11px] font-medium leading-relaxed italic">{item.pearl}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {item.causes.split(', ').map(c => <span key={c} className="px-3 py-1 bg-slate-100 dark:bg-zinc-800 rounded-lg text-[8px] font-black uppercase text-slate-500">{c}</span>)}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'hii' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-purple-600 text-white p-8 rounded-[2.5rem] shadow-xl text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter">HII / Pseudotumor Cerebri</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Critérios de Dandy Modificados</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-white dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-900 rounded-[2rem] shadow-sm">
                        <h4 className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-4 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Diagnóstico Obrigatório</h4>
                        <div className="space-y-3">
                            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl"><p className="text-[10px] font-bold uppercase">1. Papiledema Presente</p></div>
                            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl"><p className="text-[10px] font-bold uppercase">2. Exame Neurológico Normal (Exceto VI Par)</p></div>
                            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl"><p className="text-[10px] font-bold uppercase">3. Pressão de Abertura &gt; 250 mmH2O</p></div>
                            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl"><p className="text-[10px] font-bold uppercase">4. Líquor Quimicamente Normal</p></div>
                            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl"><p className="text-[10px] font-bold uppercase">5. Neuroimagem s/ Lesão Expansiva ou TVC</p></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="p-6 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-[2rem]">
                            <h4 className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-400 mb-3 tracking-widest">Sinais Indiretos na RM</h4>
                            <ul className="space-y-2">
                                {['Sela vazia (Empty Sella)', 'Distensão bainha N. Óptico', 'Achatamento posterior do globo', 'Estenose de Seio Transverso'].map(s => <li key={s} className="text-[10px] font-bold flex items-center gap-2 text-slate-600 dark:text-slate-300 uppercase"><Activity className="h-3 w-3 text-purple-400" /> {s}</li>)}
                            </ul>
                        </div>
                        <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-lg">
                            <h4 className="text-[9px] font-black uppercase text-emerald-400 mb-2">Pilar Terapêutico</h4>
                            <p className="text-[11px] leading-relaxed font-medium">Acetazolamida (500mg a 2g/dia) + Perda de peso agressiva. Considerar fenestração de bainha ou DVP se risco iminente de perda visual definitiva.</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
