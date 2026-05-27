
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Zap, FileText, AlertTriangle, Activity, 
  Brain, CheckCircle2, Info, Clock, Thermometer,
  ZapOff, MessageSquare, Gauge, Waves,
  ChevronRight, FlaskConical, AlertCircle, ShieldAlert,
  ShieldCheck, Beaker, ClipboardList, Stethoscope, Shield,
  Search
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const ASM_DATABASE = [
    {
        name: 'Carbamazepina',
        type: 'Focal (1ª Linha)',
        dose: '400-1200mg/dia (2-3x)',
        sideEffects: 'Leucopenia, Hiponatremia, Ataxia, Rash (SJS), Diplopia.',
        interactions: 'Indutor potente (CYP3A4). Auto-indução metabólica inicial.',
        notes: 'Padrão-ouro em crises focais. Risco de SJS em pacientes HLA-B*15:02 (descendência asiática). Pode agravar Mioclonias.'
    },
    {
        name: 'Oxcarbazepina',
        type: 'Focal',
        dose: '600-2400mg/dia (2x)',
        sideEffects: 'Hiponatremia grave (mais freq. que CBZ), Tontura.',
        interactions: 'Indutor enzimático fraco. Reduz eficácia de ACO.',
        notes: 'Melhor tolerabilidade que CBZ. Não sofre auto-indução. Monitorar sódio sérico.'
    },
    {
        name: 'Valproato de Sódio',
        type: 'Amplo Espectro / Generalizada',
        dose: '500-2000mg/dia (2x)',
        sideEffects: 'Ganho de peso, Tremor, Alopécia, SOP, Hepatotoxicidade.',
        interactions: 'Inibidor enzimático. Eleva níveis de Lamotrigina e Fenobarbital.',
        notes: 'Droga mais eficaz para epilepsias generalizadas genéticas. Contraindicado em mulheres em idade fértil (Teratogenia).'
    },
    {
        name: 'Lamotrigina',
        type: 'Amplo Espectro',
        dose: '100-400mg/dia (2x)',
        sideEffects: 'Rash cutâneo grave (Stevens-Johnson), Insônia.',
        interactions: 'Metabolismo reduzido pelo Valproato. Aumentado por Carbamazepina/Fenitoína.',
        notes: 'Titulação lenta (start 25mg). Seguro na gravidez. Útil em depressão associada.'
    },
    {
        name: 'Levetiracetam',
        type: 'Amplo Espectro',
        dose: '1000-3000mg/dia (2x)',
        sideEffects: 'Irritabilidade, Mudança de humor, Agressividade, Fadiga.',
        interactions: 'Mínima. Sem metabolismo hepático (P450).',
        notes: 'Início rápido. Droga de escolha para idosos, polifarmácia e gestantes. Ajustar se ClCr < 80.'
    },
    {
        name: 'Topiramato',
        type: 'Amplo Espectro',
        dose: '100-400mg/dia (2x)',
        sideEffects: 'Lentificação cognitiva ("Dopamax"), Perda de peso, Parestesias, Litíase renal.',
        interactions: 'Indutor fraco de CYP3A4 em doses > 200mg.',
        notes: 'Excelente para migrânea comórbida. Risco de glaucoma agudo de ângulo fechado.'
    },
    {
        name: 'Fenitoína',
        type: 'Focal (Principalmente Agudo)',
        dose: '300-400mg/dia (1-2x)',
        sideEffects: 'Hiperplasia gengival, Ataxia, Nistagmo, Osteopenia.',
        interactions: 'Indutor potente. Cinética não-linear (pequenos aumentos de dose geram toxicidade).',
        notes: 'Nível sérico alvo: 10-20 mcg/mL. Cinética de Michaelis-Menten saturável.'
    },
    {
        name: 'Fenobarbital',
        type: 'Amplo Espectro',
        dose: '50-200mg/dia (1x)',
        sideEffects: 'Sedação, Depressão, Hiperatividade (crianças), Déficit cognitivo.',
        interactions: 'Indutor enzimático universal potente.',
        notes: 'Meia-vida ultra-longa (96h). Baixo custo. Eficaz mas limitado pelos efeitos colaterais.'
    },
    {
        name: 'Lacosamida',
        type: 'Focal / Adjuvante',
        dose: '200-400mg/dia (2x)',
        sideEffects: 'Prolongamento PR (ECG), Tontura, Náusea.',
        interactions: 'Mínimas.',
        notes: 'Mecanismo de inativação lenta de canais de Sódio. Excelente perfil de interação.'
    }
];

const ILAE_DIAGNOSTIC_FLOW = [
    { 
      level: '1. Tipo de Crise (Início)', 
      color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
      items: [
        { name: 'Focal', desc: 'Consciência Preservada vs Comprometida. Início Motor vs Não-Motor.' },
        { name: 'Generalizada', desc: 'Motor (Tônico-clônica, Mioclônica) vs Não-Motor (Ausência).' },
        { name: 'Desconhecido', desc: 'Não classificável inicialmente. Motor vs Não-Motor.' }
      ]
    },
    { 
        level: '2. Tipo de Epilepsia', 
        color: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10',
        items: [
          { name: 'Focal', desc: 'Redes neurais limitadas a um hemisfério. Pode ter lesão estrutural.' },
          { name: 'Generalizada', desc: 'Redes neurais distribuídas bilateralmente. EEG com ponta-onda generalizada.' },
          { name: 'Combinada', desc: 'Ambos os tipos (Ex: Síndrome de Dravet, Lennox-Gastaut).' },
          { name: 'Desconhecida', desc: 'Paciente tem epilepsia, mas o tipo não é claro.' }
        ]
    },
    { 
        level: '3. Síndrome Epiléptica', 
        color: 'border-purple-500 bg-purple-50 dark:bg-purple-900/10',
        items: [
          { name: 'Neonatal / Infantil', desc: 'Ex: West, Dravet, Espasmos Infantis.' },
          { name: 'Infância', desc: 'Ex: Ausência Infantil, Panayiotopoulos.' },
          { name: 'Adolescência / Adulto', desc: 'Ex: Mioclônica Juvenil, Ausência Juvenil.' },
          { name: 'Idoso', desc: 'Frequente etiologia estrutural/vascular.' }
        ]
    }
];

const ETIOLOGIES = [
    { id: 'structural', name: 'Estrutural', ex: 'AVC, Tumor, Esclerose Hipocampal, Displasia Cortical.' },
    { id: 'genetic', name: 'Genética', ex: 'Canalopatias (SCN1A), Ausência, JME.' },
    { id: 'infectious', name: 'Infecciosa', ex: 'Neurocisticercose, Zika, CMV, Malária Cerebral.' },
    { id: 'metabolic', name: 'Metabólica', ex: 'Porfiria, Deficiência de Piridoxina, Doenças Mitocondriais.' },
    { id: 'immune', name: 'Imune', ex: 'Encefalite Anti-NMDA, Anti-LGI1 (Límbica).' },
    { id: 'unknown', name: 'Desconhecida', ex: 'Causa ainda não identificada.' }
];

const EEG_PATTERNS = [
    { name: 'Ponta-Onda 3Hz', desc: 'Clássico da Epilepsia Ausência Infantil. Hiperventilação é gatilho.', type: 'Generalizado' },
    { name: 'Hipsarritmia', desc: 'Caótico, alta voltagem, multifocal. Síndrome de West (Espasmos).', type: 'Encefalopatia' },
    { name: 'Poliponta-Onda', desc: 'Complexos rápidos (4-6Hz). Comum na Epilepsia Mioclônica Juvenil (JME).', type: 'Generalizado' },
    { name: 'PLEDs / LPDs', desc: 'Descargas Periódicas Lateralizadas. Lesão aguda (AVC, Herpes, Tumor).', type: 'Focal / Agudo' },
    { name: 'Ondas Trifásicas', desc: 'Lentificação com morfologia trifásica. Encefalopatia Metabólica (Hepática/Renal).', type: 'Metabólico' },
    { name: 'Burst-Suppression', desc: 'Surtos de atividade seguidos de aplanamento. Prognóstico reservado ou sedação profunda.', type: 'Grave' },
    { name: 'Ponta Centro-Temporal', desc: 'Ondas agudas na região rolândica. Epilepsia Benigna da Infância (BECTS).', type: 'Focal' },
    { name: 'Lentificação Focal', desc: 'Ondas Theta/Delta em uma região. Sugere lesão estrutural subjacente.', type: 'Focal' }
];

export const EpilepsyTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'class' | 'eeg' | 'status' | 'asm'>('class');
  const [selectedAsm, setSelectedAsm] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Epileptologia</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-40">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('class')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'class' ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>Classif. ILAE</button>
            <button onClick={() => setActiveTab('eeg')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'eeg' ? 'bg-white dark:bg-zinc-800 text-purple-500 shadow-md' : 'text-slate-500'}`}>Padrões EEG</button>
            <button onClick={() => setActiveTab('asm')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'asm' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-md' : 'text-slate-500'}`}>Drogas (ASMs)</button>
            <button onClick={() => setActiveTab('status')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'status' ? 'bg-white dark:bg-zinc-800 text-red-600 shadow-md' : 'text-slate-500'}`}>Status Epil.</button>
        </div>

        {activeTab === 'class' && (
            <div className="space-y-6 animate-in fade-in pb-20">
                <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <ClipboardList className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Classificação ILAE 2017+</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Framework Diagnóstico Vigente (2025)</p></div>
                </div>

                {ILAE_DIAGNOSTIC_FLOW.map((group, idx) => (
                    <div key={idx} className={`p-6 rounded-[2rem] border-2 shadow-sm ${group.color}`}>
                        <h3 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-300 tracking-[0.2em] mb-4 bg-white/50 dark:bg-black/20 p-2 rounded-lg w-fit">{group.level}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.items.map(t => (
                                <div key={t.name} className="p-4 bg-white dark:bg-zinc-950/80 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase mb-1">{t.name}</h4>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">{t.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                    <h4 className="text-[10px] font-black uppercase text-emerald-400 mb-4 flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Etiologia (Investigação Obrigatória)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ETIOLOGIES.map(e => (
                            <div key={e.id} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                <span className="text-[9px] font-black text-emerald-300 uppercase block">{e.name}</span>
                                <span className="text-[9px] text-slate-400 leading-tight">{e.ex}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'eeg' && (
             <div className="space-y-6 animate-in fade-in pb-20">
                <div className="bg-purple-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Activity className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Eletroencefalograma</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Padrões Clínicos Essenciais</p></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {EEG_PATTERNS.map((pt, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-5 rounded-[2rem] shadow-sm hover:border-purple-500/50 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white">{pt.name}</h4>
                                <span className="text-[7px] font-black uppercase bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-0.5 rounded-full">{pt.type}</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{pt.desc}</p>
                        </div>
                    ))}
                </div>
             </div>
        )}

        {activeTab === 'asm' && (
            <div className="space-y-4 animate-in fade-in pb-20">
                <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Beaker className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Arsenal Terapêutico</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Manejo Clínico e Segurança</p></div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {ASM_DATABASE.map(asm => (
                        <div key={asm.name} onClick={() => setSelectedAsm(selectedAsm === asm.name ? null : asm.name)} className={`bg-white dark:bg-zinc-950 border-2 rounded-[2rem] transition-all cursor-pointer overflow-hidden ${selectedAsm === asm.name ? 'border-indigo-500 shadow-xl scale-[1.01]' : 'border-slate-100 dark:border-zinc-900 hover:border-indigo-200'}`}>
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedAsm === asm.name ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500'}`}><Waves className="h-5 w-5" /></div>
                                    <div><h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{asm.name}</h4><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{asm.type}</p></div>
                                </div>
                                <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${selectedAsm === asm.name ? 'rotate-90 text-indigo-500' : 'text-slate-300'}`} />
                            </div>
                            
                            {selectedAsm === asm.name && (
                                <div className="px-5 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                            <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest block mb-1">Dose e Frequência</span>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{asm.dose}</p>
                                        </div>
                                        <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/40">
                                            <span className="text-[8px] font-black uppercase text-red-500 tracking-widest block mb-1">Toxicidade / Efeitos</span>
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">{asm.sideEffects}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/40">
                                        <span className="text-[8px] font-black uppercase text-orange-600 tracking-widest block mb-1 flex items-center gap-1"><AlertTriangle className="h-2 w-2" /> Interações & Metabolismo</span>
                                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{asm.interactions}</p>
                                    </div>
                                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                                        <span className="text-[8px] font-black uppercase text-indigo-600 tracking-widest block mb-1">Clinical Pearls (Pérolas)</span>
                                        <p className="text-[10px] font-bold italic text-slate-500 dark:text-slate-400 leading-relaxed">★ {asm.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'status' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 pb-20">
                <div className="bg-rose-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <AlertTriangle className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Status Epilepticus</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Protocolo Tempo-Dependente (UpToDate)</p></div>
                </div>

                {[
                    { time: '0-5 min', stage: 'Fase de Estabilização', actions: ['A-B-C, O2, Acesso Venoso', 'Glicemia Capilar (Tratar se <60)', 'Monitorização Cardiorrespiratória'], drugs: ['Lorazepam 4mg IV (repetir 1x)', 'OU Diazepam 10mg IV', 'OU Midazolam 10mg IM (se s/ acesso)'] },
                    { time: '5-20 min', stage: 'Fase Terapêutica Inicial', actions: ['Solicitar Labs: Eletrólitos, DAEs séricos', 'Considerar Tiamina 100mg IV', 'Monitor ECG contínuo'], drugs: ['Fenitoína: 20mg/kg IV (50mg/min)', 'Valproato: 40mg/kg IV (10 min)', 'Levetiracetam: 60mg/kg IV (15 min)'] },
                    { time: '20-40 min', stage: 'Fase de Status Refratário', actions: ['Intubação Orotraqueal (IOT)', 'Instalação de EEG Contínuo', 'Monitorização de PA Invasiva'], drugs: ['Midazolam (Ataque + Infusão)', 'Propofol (Ataque + Infusão)', 'Pentobarbital / Tiopental'] }
                ].map((step, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner">{step.time}</div>
                            <div><h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{step.stage}</h4></div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Prioridades de Conduta</span><ul className="space-y-1">{step.actions.map(a => <li key={a} className="text-[10px] font-bold flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {a}</li>)}</ul></div>
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/40"><span className="text-[8px] font-black text-red-600 uppercase tracking-widest mb-2 block">Drogas e Doses</span><ul className="space-y-1">{step.drugs.map(d => <li key={d} className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">{d}</li>)}</ul></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};
