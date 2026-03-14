
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Activity, Search, Calculator, CheckCircle2, ChevronRight, Info, Waves, Ruler, Timer, ShieldAlert, Eye, AlertCircle } from 'lucide-react';

const TCD_VELOCITIES = [
    { artery: 'ACM (Arterial Cerebral Média)', depth: '45-65mm', velocity: '55 ± 12 cm/s', window: 'Transtemporal' },
    { artery: 'ACA (Arterial Cerebral Ant)', depth: '60-75mm', velocity: '50 ± 11 cm/s', window: 'Transtemporal' },
    { artery: 'ACP (Arterial Cerebral Post)', depth: '60-70mm', velocity: '39 ± 10 cm/s', window: 'Transtemporal' },
    { artery: 'Basilar (Artéria)', depth: '80-120mm', velocity: '41 ± 10 cm/s', window: 'Suboccipital' },
    { artery: 'Vertebral (Artéria)', depth: '40-80mm', velocity: '38 ± 10 cm/s', window: 'Suboccipital' }
];

export const NeuroSonologiaTool: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tcd' | 'onsd' | 'vasospasm' | 'pi' | 'patterns'>('tcd');
  const [lindegaard, setLindegaard] = useState({ vmc: '', vica: '' });
  const [onsd, setOnsd] = useState({ od: '', oe: '' });
  const [piData, setPiData] = useState({ vs: '', vd: '', vm: '' });

  const lindegaardResult = useMemo(() => {
    if (!lindegaard.vmc || !lindegaard.vica) return null;
    const ratio = Number(lindegaard.vmc) / Number(lindegaard.vica);
    let status = 'Normal';
    let color = 'text-emerald-500';
    if (ratio >= 6) { status = 'Vasoespasmo Grave'; color = 'text-red-600'; }
    else if (ratio >= 3) { status = 'Vasoespasmo Leve/Mod'; color = 'text-orange-500'; }
    return { ratio: ratio.toFixed(2), status, color };
  }, [lindegaard]);

  const onsdResult = useMemo(() => {
    if (!onsd.od || !onsd.oe) return null;
    const mean = (Number(onsd.od) + Number(onsd.oe)) / 2;
    let status = 'PIC Normal (< 20mmHg)';
    let color = 'text-emerald-500';
    let bg = 'bg-emerald-50 dark:bg-emerald-900/20';
    
    if (mean > 5.7) {
        status = 'Sugestivo de HIC (> 20mmHg)';
        color = 'text-red-600';
        bg = 'bg-red-50 dark:bg-red-900/20';
    } else if (mean >= 5.0) {
        status = 'Zona Cinzenta / Monitorar';
        color = 'text-orange-500';
        bg = 'bg-orange-50 dark:bg-orange-900/20';
    }
    return { mean: mean.toFixed(2), status, color, bg };
  }, [onsd]);

  const piResult = useMemo(() => {
      const vs = Number(piData.vs);
      const vd = Number(piData.vd);
      const vmInput = Number(piData.vm);
      
      if (!vs || !vd) return null;
      const vm = vmInput || ((vs + 2 * vd) / 3);
      const pi = (vs - vd) / vm;
      
      let interp = 'Resistência Normal';
      let color = 'text-emerald-500';
      if (pi > 1.2) { interp = 'Resistência Aumentada (Sugerido HIC)'; color = 'text-red-500'; } 
      else if (pi < 0.5) { interp = 'Resistência Baixa (Hiperemia / MAV)'; color = 'text-blue-500'; }
      
      const estIcp = (10.93 * pi) - 1.28;
      return { val: pi.toFixed(2), estIcp: estIcp.toFixed(1), interp, color };
  }, [piData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Neurossonologia (DTC)</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-40">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('tcd')} className={`flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'tcd' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md' : 'text-slate-500'}`}>DTC Ref</button>
            <button onClick={() => setActiveTab('patterns')} className={`flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'patterns' ? 'bg-white dark:bg-zinc-800 text-orange-500 shadow-md' : 'text-slate-500'}`}>Padrões</button>
            <button onClick={() => setActiveTab('onsd')} className={`flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'onsd' ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>ONSD</button>
            <button onClick={() => setActiveTab('pi')} className={`flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'pi' ? 'bg-white dark:bg-zinc-800 text-purple-600 shadow-md' : 'text-slate-500'}`}>Pulsatilidade</button>
            <button onClick={() => setActiveTab('vasospasm')} className={`flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'vasospasm' ? 'bg-white dark:bg-zinc-800 text-red-600 shadow-md' : 'text-slate-500'}`}>Lindegaard</button>
        </div>

        {activeTab === 'tcd' && (
            <div className="space-y-4 animate-in fade-in pb-20">
                <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Waves className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">DTC de Referência</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Valores de Média de Velocidade (MFV)</p></div>
                </div>
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr><th className="p-4 text-[8px] font-black uppercase text-slate-400">Artéria</th><th className="p-4 text-[8px] font-black uppercase text-slate-400">Depth</th><th className="p-4 text-[8px] font-black uppercase text-slate-400">Velocidade</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-zinc-900">
                            {TCD_VELOCITIES.map(v => (
                                <tr key={v.artery} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="p-4"><p className="text-[10px] font-black uppercase text-slate-900 dark:text-white leading-tight">{v.artery}</p><p className="text-[7px] text-slate-400 font-bold uppercase">{v.window}</p></td>
                                    <td className="p-4 text-[10px] font-bold text-slate-500">{v.depth}</td>
                                    <td className="p-4 text-[11px] font-black text-blue-600">{v.velocity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'patterns' && (
            <div className="space-y-6 animate-in fade-in pb-20">
                 <div className="bg-orange-500 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Activity className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Padrões de Fluxo (ATLS)</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Identificação de Patologias Críticas</p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border-2 border-red-100 dark:border-red-900/30">
                        <h4 className="text-xs font-black uppercase text-red-600 mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Parada Circulatória Cerebral</h4>
                        <ul className="space-y-3">
                            <li className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                <span className="block text-slate-400 uppercase text-[8px] mb-1">Estágio 1</span>
                                Fluxo Oscilatório (Reverberating Flow): Fluxo diastólico reverso iguala o sistólico.
                            </li>
                            <li className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                <span className="block text-slate-400 uppercase text-[8px] mb-1">Estágio 2</span>
                                Espículas Sistólicas (Systolic Spikes): Pequenos picos sistólicos (&lt; 50cm/s) sem fluxo diastólico.
                            </li>
                            <li className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                <span className="block text-slate-400 uppercase text-[8px] mb-1">Estágio 3</span>
                                Ausência de Fluxo (Confirmação requer técnica impecável).
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border-2 border-slate-200 dark:border-zinc-900">
                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white mb-3 flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Hipertensão Intracraniana (HIC)</h4>
                        <div className="space-y-3">
                             <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl">
                                 <p className="text-[10px] font-black uppercase text-purple-600 mb-1">Aumento de Pulsatilidade (PI)</p>
                                 <p className="text-[9px] text-slate-500 leading-relaxed">À medida que a PIC sobe, a resistência vascular aumenta. Isso causa <strong>diminuição da velocidade diastólica</strong> e aumento do PI.</p>
                             </div>
                             <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl">
                                 <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Cushings Response</p>
                                 <p className="text-[9px] text-slate-500 leading-relaxed">Em estágios avançados, o aumento da PA sistêmica tenta compensar, gerando fluxo com alta velocidade sistólica.</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'onsd' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-20">
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Eye className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Bainha do Nervo Óptico (ONSD)</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Monitorização Não-Invasiva de PIC</p></div>
                </div>

                <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-900 space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                        <Info className="h-5 w-5 text-blue-500 shrink-0" />
                        <div>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Técnica de Medição</p>
                            <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                Realizar a medição 3mm atrás do globo ocular. Medir perpendicularmente ao eixo do nervo (sombra acústica dura a dura). Média de 3 medidas.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Olho Direito (mm)</label>
                            <input type="number" step="0.1" value={onsd.od} onChange={e => setOnsd({...onsd, od: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black text-xl text-center bg-slate-50 dark:bg-black focus:border-primary outline-none" placeholder="0.0" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Olho Esquerdo (mm)</label>
                            <input type="number" step="0.1" value={onsd.oe} onChange={e => setOnsd({...onsd, oe: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black text-xl text-center bg-slate-50 dark:bg-black focus:border-primary outline-none" placeholder="0.0" />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        {onsdResult ? (
                            <div className={`flex-1 p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center shadow-inner border-2 border-transparent ${onsdResult.bg}`}>
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">Média Binocular</span>
                                <div className={`text-5xl font-black tracking-tighter ${onsdResult.color}`}>{onsdResult.mean} <span className="text-lg text-slate-400">mm</span></div>
                                <div className={`mt-3 px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 border-current opacity-80 ${onsdResult.color}`}>{onsdResult.status}</div>
                            </div>
                        ) : (
                            <div className="flex-1 p-8 border-4 border-dashed border-slate-100 dark:border-zinc-800 rounded-[1.5rem] flex items-center justify-center text-slate-300">
                                <p className="text-[10px] font-black uppercase">Insira os valores</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'pi' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-20">
                <div className="bg-purple-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Activity className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Índice de Pulsatilidade (Gosling)</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Estimativa de PIC e Resistência</p></div>
                </div>

                <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-900 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Vel. Sistólica (Vs)</label><input type="number" value={piData.vs} onChange={e => setPiData({...piData, vs: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black text-center" /></div>
                        <div><label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Vel. Diastólica (Vd)</label><input type="number" value={piData.vd} onChange={e => setPiData({...piData, vd: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black text-center" /></div>
                        <div><label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Vel. Média (Opcional)</label><input type="number" value={piData.vm} onChange={e => setPiData({...piData, vm: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black text-center" placeholder="Auto" /></div>
                    </div>

                    {piResult && (
                         <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl text-center space-y-4">
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pulsatility Index (PI)</p>
                                <p className={`text-4xl font-black ${piResult.color}`}>{piResult.val}</p>
                                <p className={`text-[10px] font-bold uppercase ${piResult.color}`}>{piResult.interp}</p>
                             </div>
                             <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PIC Estimada (Fórmula: 10.93*PI - 1.28)</p>
                                <p className="text-2xl font-black text-slate-700 dark:text-slate-300">~{piResult.estIcp} <span className="text-xs">mmHg</span></p>
                             </div>
                         </div>
                    )}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/40 rounded-2xl flex items-start gap-3">
                        <Info className="h-5 w-5 text-purple-500 shrink-0" />
                        <p className="text-[10px] text-purple-800 dark:text-purple-200 font-medium leading-relaxed">
                            <span className="font-black uppercase block mb-1">Fisiologia</span>
                            O PI reflete a resistência vascular distal. Aumenta com a PIC (compressão vascular) e vasoconstrição (hiperventilação). Diminui com vasodilatação (hipercapnia) ou MAVs.
                        </p>
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'vasospasm' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-20">
                <div className="bg-red-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Calculator className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Índice de Lindegaard</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Diferencial: Espasmo vs Hiperemia</p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-900 space-y-4">
                        <div className="space-y-4">
                            <div><label className="text-[8px] font-black uppercase text-slate-400 mb-1 block tracking-widest">MFV Artéria Cerebral Média (Vmc)</label><input type="number" value={lindegaard.vmc} onChange={e => setLindegaard({...lindegaard, vmc: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black text-xl text-center bg-slate-50 dark:bg-black focus:border-primary outline-none" /></div>
                            <div><label className="text-[8px] font-black uppercase text-slate-400 mb-1 block tracking-widest">MFV Carótida Interna (Vica)</label><input type="number" value={lindegaard.vica} onChange={e => setLindegaard({...lindegaard, vica: e.target.value})} className="w-full p-3 rounded-xl border-2 font-black text-xl text-center bg-slate-50 dark:bg-black focus:border-primary outline-none" /></div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        {lindegaardResult ? (
                            <div className="flex-1 p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col items-center justify-center text-center shadow-xl border-4 border-white/5">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">Razão Calculada</span>
                                <div className="text-6xl font-black tracking-tighter text-blue-400">{lindegaardResult.ratio}</div>
                                <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 border-white/10 ${lindegaardResult.color}`}>{lindegaardResult.status}</div>
                            </div>
                        ) : (
                            <div className="flex-1 border-4 border-dashed border-slate-100 dark:border-zinc-800 rounded-[2rem] flex items-center justify-center text-slate-300"><p className="text-[10px] font-black uppercase">Insira os valores MFV</p></div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
