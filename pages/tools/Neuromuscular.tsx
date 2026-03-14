
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Activity, List, Calculator, CheckCircle2, 
  ChevronRight, X, Info, Dumbbell, Eye, 
  Wind, MessageSquare, Brain, Droplets, AlertTriangle, ShieldAlert,
  Zap, Beaker, FileText, Stethoscope, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { syncEngine } from '../../services/syncEngine';

const MG_ADL_DATA = [
  { id: 'talking', label: '1. Fala', options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Gagueira intermitente ou fala nasal' }, { v: 2, l: 'Gagueira constante ou nasal, mas compreensível' }, { v: 3, l: 'Dificuldade no entendimento da fala' }]},
  { id: 'chewing', label: '2. Mastigação', options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Fadiga com alimentos sólidos' }, { v: 2, l: 'Fadiga com alimentos moles' }, { v: 3, l: 'Tubo gástrico' }]},
  { id: 'swallowing', label: '3. Deglutição', options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Raros episódios de engasgo ou dificuldade' }, { v: 2, l: 'Dificuldade frequente (exige alteração na dieta)' }, { v: 3, l: 'Tubo gástrico' }]},
  { id: 'breathing', label: '4. Respiração', options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Falta de ar com esforço' }, { v: 2, l: 'Falta de ar em repouso' }, { v: 3, l: 'Suporte Ventilador (ex: BiPAP)' }]},
  { id: 'brushing', label: '5. Escovar dentes ou pentear cabelo', options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Dificuldade moderada mas termina a tarefa' }, { v: 2, l: 'Dificuldade grave ou necessita de descanso' }, { v: 3, l: 'Incapaz de realizar a tarefa' }]},
  { id: 'rising', label: '6. Levantar da cadeira', options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Dificuldade moderada mas termina a tarefa' }, { v: 2, l: 'Dificuldade grave ou necessita de descanso' }, { v: 3, l: 'Incapaz de realizar a tarefa' }]},
  { id: 'diplopia', label: '7. Visão Dupla', options: [{ v: 0, l: 'Nenhuma' }, { v: 1, l: 'Ocorre, mas não diariamente' }, { v: 2, l: 'Diária, mas não o dia inteiro' }, { v: 3, l: 'Constante o dia inteiro' }]},
  { id: 'eyelid', label: '8. Ptose (Pálpebra caída)', options: [{ v: 0, l: 'Nenhuma' }, { v: 1, l: 'Ocorre, mas não diariamente' }, { v: 2, l: 'Diária, mas não o dia inteiro' }, { v: 3, l: 'Constante o dia inteiro' }]}
];

export const NeuromuscularTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'mg' | 'gbs' | 'emergency'>('mg');
  const [activeMgTool, setActiveMgTool] = useState<'mgadl' | 'mgcomposite' | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((a: number, b: number) => a + b, 0);
  }, [scores]);

  const renderMG = () => (
      <div className="space-y-6 animate-in fade-in">
          {!activeMgTool ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setActiveMgTool('mgadl')} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-emerald-500 transition-all text-left">
                      <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit mb-4 text-emerald-600"><List className="h-6 w-6" /></div>
                      <h3 className="font-black text-lg mb-1">MG-ADL</h3>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Escala de Atividades Diárias</p>
                  </button>
                  <button onClick={() => setActiveMgTool('mgcomposite')} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-blue-500 transition-all text-left">
                      <div className="p-3 bg-blue-500/10 rounded-2xl w-fit mb-4 text-blue-600"><Dumbbell className="h-6 w-6" /></div>
                      <h3 className="font-black text-lg mb-1">MG-Composite</h3>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Avaliação Mista (Médico + Paciente)</p>
                  </button>
              </div>
          ) : (
              <div className="space-y-6">
                  <button onClick={() => setActiveMgTool(null)} className="flex items-center text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar para ferramentas MG</button>
                  <div className="p-6 bg-slate-900 text-white rounded-[2rem] flex justify-between items-center shadow-xl">
                      <h3 className="font-black uppercase tracking-tight">{activeMgTool === 'mgadl' ? 'MG-ADL Score' : 'MG-Composite'}</h3>
                      <div className="text-4xl font-black">{totalScore}</div>
                  </div>
                  <div className="space-y-3">
                      {MG_ADL_DATA.map(q => (
                          <div key={q.id} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
                              <h4 className="text-[11px] font-black uppercase text-slate-500 mb-3">{q.label}</h4>
                              <div className="grid grid-cols-1 gap-1">
                                  {q.options.map(opt => (
                                      <button key={opt.v} onClick={() => setScores(p => ({...p, [q.id]: opt.v}))} className={`text-left p-3 rounded-xl border transition-all text-[10px] font-medium ${scores[q.id] === opt.v ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-slate-50 dark:bg-zinc-900 border-transparent text-slate-600'}`}>{opt.v} - {opt.l}</button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
  );

  const renderGBS = () => (
      <div className="space-y-6 animate-in fade-in pb-10">
          <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
              <Activity className="h-10 w-10 opacity-40" />
              <div><h3 className="font-black uppercase tracking-tight text-lg">Síndrome de Guillain-Barré</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Critérios de Brighton & Variantes</p></div>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Critérios Obrigatórios</h4>
              <ul className="space-y-2">
                  {['Fraqueza bilateral e progressiva de membros.', 'Arreflexia ou hiporreflexia distal nos membros afetados.'].map(c => (
                      <li key={c} className="text-[11px] font-bold flex items-center gap-3 text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">{c}</li>
                  ))}
              </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-4">Apoio Diagnóstico</h4>
                  <div className="space-y-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border-l-4 border-blue-500">
                          <p className="text-[10px] font-black text-blue-700 uppercase">Dissociação Albuminocitológica</p>
                          <p className="text-[9px] font-medium leading-tight mt-1">Proteína elevada com celularidade normal (&lt; 50 células). Pode estar ausente na 1ª semana (em até 30-50%).</p>
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border-l-4 border-indigo-500">
                          <p className="text-[10px] font-black text-indigo-700 uppercase">ENMG (Nerve Conduction)</p>
                          <p className="text-[9px] font-medium leading-tight mt-1">Padrão desmielinizante (AIDP) ou axonal (AMAN/AMSAN). Latência distal prolongada e ausência de onda F.</p>
                      </div>
                  </div>
              </div>
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase text-orange-600 tracking-widest mb-4">Variante Miller-Fisher</h4>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border-2 border-orange-100 space-y-2">
                      <p className="text-[9px] font-black text-orange-700 uppercase">Tríade Clássica:</p>
                      <ul className="space-y-1">
                          {['1. Ataxia de marcha', '2. Oftalmoplegia', '3. Arreflexia'].map(t => <li key={t} className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase flex items-center gap-2"><Zap className="h-3 w-3 text-orange-500" /> {t}</li>)}
                      </ul>
                      <p className="text-[8px] font-bold text-orange-600/60 uppercase mt-2 italic">Associação forte com anticorpo Anti-GQ1b.</p>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderEmergency = () => (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-20">
          <div className="bg-rose-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
              <ShieldAlert className="h-10 w-10 opacity-40" />
              <div><h3 className="font-black uppercase tracking-tight text-lg">Crise Miastênica</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Manejo de Emergência e Riscos</p></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-950 border-2 border-rose-100 dark:border-rose-900 rounded-[2rem] p-6">
                  <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-widest mb-4 flex items-center gap-2"><Wind className="h-4 w-4" /> Critérios para IOT</h4>
                  <ul className="space-y-3">
                      {['Capacidade Vital < 15-20 mL/kg', 'Pressão Inspiratória Máxima < -30 cmH2O', 'Pressão Expiratória Máxima < 40 cmH2O', 'Dificuldade em deglutir secreções / Risco de Broncoaspiração'].map(c => (
                          <li key={c} className="text-[10px] font-bold flex items-start gap-3 text-slate-700 dark:text-slate-300 uppercase leading-tight"><AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" /> {c}</li>
                      ))}
                  </ul>
              </div>
              <div className="bg-slate-900 text-white rounded-[2rem] p-6 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2"><Beaker className="h-4 w-4" /> Medicações a Evitar (Neuromuscular)</h4>
                  <div className="grid grid-cols-2 gap-2">
                      {['Aminoglicosídeos', 'Quinolonas', 'Betabloqueadores', 'Bloq. Canais Cálcio', 'Magnésio', 'Quinoina', 'Estatinas'].map(m => (
                          <div key={m} className="p-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-center uppercase tracking-widest text-slate-400">{m}</div>
                      ))}
                  </div>
                  <p className="text-[8px] font-medium text-slate-500 leading-tight italic uppercase">*Sempre monitorar agravamento após introdução de novas drogas.</p>
              </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
              <h4 className="text-xs font-black uppercase text-primary tracking-widest mb-4 flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Tratamento na Crise</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase mb-2">Imunoglobulina Humana (IVIg)</p>
                      <p className="text-[11px] font-medium text-slate-500 uppercase">2g/kg divididos em 2 a 5 dias. Início de ação em 3-5 dias.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase mb-2">Plasmaférese (PLEX)</p>
                      <p className="text-[11px] font-medium text-slate-500 uppercase">5-7 trocas em dias alternados. Geralmente mais rápida que IVIg na crise grave.</p>
                  </div>
              </div>
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-r-2xl">
                  <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5" /> Atenção Piridostigmina (Mestinon)</p>
                  <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">Na crise miastênica grave/paciente intubado, considerar suspender temporariamente a piridostigmina para reduzir secreções brônquicas excessivas.</p>
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Doenças Neuromusculares</h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-40">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('mg')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'mg' ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>Miastenia (MG)</button>
            <button onClick={() => setActiveTab('gbs')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'gbs' ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-md' : 'text-slate-500'}`}>Guillain-Barré (GBS)</button>
            <button onClick={() => setActiveTab('emergency')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'emergency' ? 'bg-white dark:bg-zinc-800 text-rose-600 shadow-md' : 'text-slate-500'}`}>Urgência / Crise</button>
        </div>

        {activeTab === 'mg' && renderMG()}
        {activeTab === 'gbs' && renderGBS()}
        {activeTab === 'emergency' && renderEmergency()}
      </main>
    </div>
  );
};
