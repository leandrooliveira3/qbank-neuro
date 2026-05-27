
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Droplets, Microscope, Activity, 
  CheckCircle2, Info, AlertTriangle, FlaskConical,
  Eye, Beaker, Zap, AlertCircle
} from 'lucide-react';

export const NeuroInfectologiaTool: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'lcr' | 'meningitis' | 'opportunistic'>('lcr');
  
  // LCR Input State
  const [lcrData, setLcrData] = useState({
    aspect: 'limpido',
    cells: '',
    rbcs: '',
    type: 'neutro',
    protein: '',
    glucose: '',
    glucoseSerum: '',
    lactate: ''
  });

  const lcrInterpretation = useMemo(() => {
    const cells = Number(lcrData.cells);
    const rbcs = Number(lcrData.rbcs);
    const protein = Number(lcrData.protein);
    const glucose = Number(lcrData.glucose);
    const lactate = Number(lcrData.lactate);
    const serumG = Number(lcrData.glucoseSerum);
    const ratio = serumG > 0 ? (glucose / serumG) : null;

    if (!cells && !protein && !glucose && !rbcs) return null;

    const results = [];

    // 1. Análise Macroscópica e Hemorrágica
    if (lcrData.aspect === 'xantocromico') {
        results.push({
            t: 'Xantocromia Detectada',
            c: 'text-orange-600',
            d: 'Sugere Hemorragia Subaracnóide (SAH). A coloração surge 2-12h após a entrada de hemácias no espaço subaracnóideo.'
        });
    }

    if (rbcs > 6000 || lcrData.aspect === 'hemorragico') {
        results.push({
            t: 'Líquor Hemorrágico',
            c: 'text-red-700',
            d: 'Acima de 6000 hemácias/mm³ o aspecto é francamente hemorrágico. Diferenciar acidente de punção por queda de contagem entre tubos.'
        });
    }

    // 2. Lógica de Infecção
    // Bacteriana
    if ((cells > 1000 && lcrData.type === 'neutro') || lactate > 6 || (ratio !== null && ratio < 0.4) || glucose < 18) {
        results.push({
            t: 'Padrão Bacteriano Agudo',
            c: 'text-red-600',
            bg: 'bg-red-50',
            d: 'Pleocitose neutrofílica, hipoglicorraquia marcada e lactato elevado (>6 mmol/L). Altamente preditivo de etiologia bacteriana.'
        });
    } 
    // Viral
    else if (cells < 500 && lcrData.type === 'lymph' && (ratio === null || ratio > 0.5) && (lactate === 0 || lactate < 2)) {
        results.push({
            t: 'Padrão Viral / Asséptico',
            c: 'text-blue-600',
            bg: 'bg-blue-50',
            d: 'Pleocitose linfocitária leve, glicose normal (>50% da sérica) e lactato baixo (<2 mmol/L).'
        });
    }
    // TB / Fúngica
    else if (lcrData.type === 'lymph' && ratio !== null && ratio < 0.5 && protein > 100) {
        results.push({
            t: 'Padrão TB ou Fúngico',
            c: 'text-amber-600',
            bg: 'bg-amber-50',
            d: 'Pleocitose linfocitária com hiperproteinorraquia e hipoglicorraquia. Considerar ADA para TB.'
        });
    }

    // 3. Alertas Técnicos
    if (rbcs > 500 && cells > 5) {
        results.push({
            t: 'Ajuste de Punção Traumática',
            c: 'text-slate-500',
            d: 'Em punções traumáticas, considere subtrair 1 leucócito para cada 500-1500 hemácias medidas.'
        });
    }

    return results.length > 0 ? results : [{ t: 'Padrão Inespecífico', c: 'text-slate-400', d: 'Dados insuficientes ou valores limítrofes. Correlacionar com a clínica.' }];
  }, [lcrData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Neuroinfectologia</h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-40">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('lcr')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'lcr' ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-md' : 'text-slate-500'}`}>Analisador LCR</button>
            <button onClick={() => setActiveTab('meningitis')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'meningitis' ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>Meningoencefalites</button>
            <button onClick={() => setActiveTab('opportunistic')} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'opportunistic' ? 'bg-white dark:bg-zinc-800 text-purple-600 shadow-md' : 'text-slate-500'}`}>Oportunistas (HIV)</button>
        </div>

        {activeTab === 'lcr' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <FlaskConical className="h-10 w-10 opacity-40" />
                    <div>
                        <h3 className="font-black uppercase tracking-tight text-lg">Interpretador de Líquor</h3>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Baseado em UpToDate 2024</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 space-y-6">
                        {/* Aspecto Macroscópico */}
                        <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 mb-3 block tracking-[0.2em]">1. Aspecto Macroscópico</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {[
                                    {id: 'limpido', label: 'Límpido', color: 'bg-blue-50 text-blue-600'},
                                    {id: 'turvo', label: 'Turvo/Cloudy', color: 'bg-slate-100 text-slate-600'},
                                    {id: 'hemorragico', label: 'Hemorrágico', color: 'bg-red-50 text-red-600'},
                                    {id: 'xantocromico', label: 'Xantocrômico', color: 'bg-amber-50 text-amber-600'}
                                ].map(opt => (
                                    <button 
                                        key={opt.id}
                                        onClick={() => setLcrData({...lcrData, aspect: opt.id})}
                                        className={`p-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${lcrData.aspect === opt.id ? 'border-emerald-500 shadow-md scale-95' : 'border-transparent bg-slate-50 dark:bg-zinc-900'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Citologia */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Leucócitos (mm³)</label>
                                <input type="number" value={lcrData.cells} onChange={e => setLcrData({...lcrData, cells: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black text-lg" placeholder="Ex: 850" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Hemácias (mm³)</label>
                                <input type="number" value={lcrData.rbcs} onChange={e => setLcrData({...lcrData, rbcs: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black text-lg" placeholder="Ex: 0" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Predomínio Celular</label>
                            <div className="flex gap-2">
                                <button onClick={() => setLcrData({...lcrData, type: 'neutro'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${lcrData.type === 'neutro' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'}`}>POLIMORFONUCLEAR</button>
                                <button onClick={() => setLcrData({...lcrData, type: 'lymph'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${lcrData.type === 'lymph' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'}`}>LINFOMONOCITÁRIO</button>
                            </div>
                        </div>

                        {/* Bioquímica */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Proteína (mg/dL)</label>
                                <input type="number" value={lcrData.protein} onChange={e => setLcrData({...lcrData, protein: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Glicose (mg/dL)</label>
                                <input type="number" value={lcrData.glucose} onChange={e => setLcrData({...lcrData, glucose: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Lactato (mmol/L)</label>
                                <input type="number" value={lcrData.lactate} onChange={e => setLcrData({...lcrData, lactate: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black" placeholder="Ex: 2.1" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Glicemia Sérica Pareada (Opcional)</label>
                            <input type="number" value={lcrData.glucoseSerum} onChange={e => setLcrData({...lcrData, glucoseSerum: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black" placeholder="Cálculo da relação LCR/Soro" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl">
                            <h4 className="text-[10px] font-black uppercase text-emerald-400 mb-4 tracking-[0.2em] flex items-center gap-2"><Zap className="h-4 w-4" /> Resultados Analíticos</h4>
                            <div className="space-y-4">
                                {lcrInterpretation?.map((res, i) => (
                                    <div key={i} className="border-b border-white/10 pb-4 last:border-0">
                                        <p className={`text-sm font-black uppercase tracking-tight ${res.c}`}>{res.t}</p>
                                        <p className="text-[11px] font-medium text-slate-400 mt-1 leading-relaxed">{res.d}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-[2rem] space-y-3">
                            <h5 className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-2"><Info className="h-4 w-4" /> Dica UpToDate</h5>
                            <p className="text-[10px] font-medium text-blue-800 dark:text-blue-300 leading-relaxed italic uppercase">
                                &quot;O lactato é superior à contagem de WBC, glicose e proteína na distinção entre meningite bacteriana e viral aguda.&quot;
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'meningitis' && (
            <div className="space-y-4 animate-in fade-in">
                <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-xl">
                    <h3 className="font-black uppercase tracking-tight text-lg mb-1">Manejo Empírico</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Guidelines IDSA / Consenso Brasileiro</p>
                </div>
                <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] space-y-4 shadow-sm">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border-l-4 border-primary">
                        <p className="text-[10px] font-black text-primary uppercase mb-2 tracking-widest">Esquema Sugerido (Adulto &lt; 50a)</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">Ceftriaxone 2g 12/12h + Vancomicina 15-20mg/kg 12/12h</p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border-l-4 border-amber-500">
                        <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase mb-2 tracking-widest">Risco para Listeria (&gt; 50a ou Imunossuprimido)</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">Adicionar Ampicilina 2g 4/4h</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border-l-4 border-blue-500">
                        <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase mb-1 tracking-widest">Protocolo de Dexametasona</p>
                        <p className="text-[11px] font-medium leading-relaxed italic">0.15mg/kg 6/6h por 4 dias. Iniciar 15-20 min ANTES da primeira dose do antibiótico.</p>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'opportunistic' && (
            <div className="space-y-4 animate-in fade-in">
                <div className="bg-purple-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Microscope className="h-10 w-10 opacity-40" />
                    <div>
                        <h3 className="font-black uppercase tracking-tight text-lg">Oportunistas SNC</h3>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Manejo em Pacientes Imunocomprometidos</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { t: 'Neurotoxoplasmose', d: 'Lesões expansivas com realce anelar, edema perilesional. Tratamento: Sulfadiazina + Pirimetamina.', i: 'AlertCircle' },
                        { t: 'Neurocriptococose', d: 'Abertura > 20cm H2O. LCR com tinta da China (+) ou CrAg (+). Tratamento: Anfo B Lipossomal + Flucitosina.', i: 'Droplets' },
                        { t: 'PML (JC Virus)', d: 'Lesões subcorticais em substância branca, sem realce ou edema. Foco: Reconstituição imune.', i: 'Activity' },
                        { t: 'Linfoma Primário SNC', d: 'Lesão única, realce denso, contato com epêndima. Diagnóstico diferencial principal com Toxoplasmose.', i: 'Search' }
                    ].map((item, i) => (
                        <div key={i} className="p-5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] shadow-sm">
                            <h4 className="text-xs font-black text-purple-600 uppercase mb-2">{item.t}</h4>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase">{item.d}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
