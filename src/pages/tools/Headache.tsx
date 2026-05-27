
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Thermometer, AlertTriangle, CheckCircle2, 
  Search, ShieldAlert, Activity, FileText, Zap, Brain, Clock,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const SNOOP10_DATA = [
    { acronym: 'S', title: 'Systemic Symptoms', desc: 'Febre, perda de peso, calafrios, mialgia.' },
    { acronym: 'N', title: 'Neoplasm History', desc: 'História de câncer prévio.' },
    { acronym: 'O', title: 'Neurologic Deficit (Old/New)', desc: 'Déficit neurológico focal (motor, sensitivo, visual, cognitivo).' },
    { acronym: 'O', title: 'Onset (Sudden)', desc: 'Início súbito/abrupto (Thunderclap). Pico < 1 min.' },
    { acronym: 'P', title: 'Papilledema', desc: 'Sinais de hipertensão intracraniana.' },
    { acronym: 'P', title: 'Positional', desc: 'Piora ao deitar ou levantar (Hipotensão/Hipertensão liquórica).' },
    { acronym: 'P', title: 'Precipitated by Valsalva', desc: 'Tosse, espirro, esforço físico.' },
    { acronym: 'P', title: 'Progressive', desc: 'Mudança no padrão habitual ou dor contínua crescente.' },
    { acronym: 'P', title: 'Pregnancy / Puerperium', desc: 'Gestação ou pós-parto.' },
    { acronym: 'P', title: 'Painkiller Overuse', desc: 'Abuso de analgésicos.' },
    { acronym: 'P', title: 'Post-traumatic', desc: 'História de trauma craniano recente.' },
    { acronym: 'P', title: 'Pathology of Immune System', desc: 'HIV, Imunossupressão.' },
];

const ICHD3_DATA = [
    {
        id: 'migraine',
        name: 'Migrânea (1.1 & 1.2)',
        icon: Zap,
        criteria: [
            'Sem Aura (1.1): ≥5 crises; duração 4-72h. Características (≥2): Unilateral, Pulsátil, Moderada/Grave, Piora com rotina física. Sintomas associados (≥1): Náusea/Vômitos, Fotofobia + Fonofobia.',
            'Com Aura (1.2): ≥2 crises. Aura reversível (Visual, Sensitiva, Fala/Linguagem, Motora). Propagação gradual >5 min, duração 5-60 min por sintoma. Cefaleia inicia em até 60 min após.',
            'Crônica (1.3): Cefaleia em ≥15 dias/mês por >3 meses, com características de migrânea em ≥8 dias/mês.'
        ],
        treatment: {
            acute: 'Triptanos (Sumatriptano, Naratriptano) precocemente (AINEs como adjuvante). Gepantos (Rimegepanto 75mg, Ubrogepanto) e Ditana (Lasmiditana 50-200mg - age em 5HT1F, sem vasoconstrição, útil em cardiopatas).',
            preventive: 'Alta eficácia: Anticorpos monoclonais Anti-CGRP (Galcanezumabe, Fremanezumabe, Erenumabe). Orais Clássicos: Topiramato (50-100mg/d), Propranolol (40-120mg/d), Amitriptilina, Candesartana.',
            pearls: 'Efeitos adversos: Topiramato (parestesias, lentificação cognitiva, nefrolitíase, perda de peso). Propranolol (astenia, bradicardia, broncoespasmo). Lasmiditana (sintomas limitantes de SNC: tontura, sonolência - PROIBIDO dirigir por 8h). Erenumabe (constipação grave). Evite triptanos na aura hemiplégica ou com doença coronariana.'
        }
    },
    {
        id: 'tth',
        name: 'Cefaleia do Tipo Tensional (2.1 & 2.2)',
        icon: Brain,
        criteria: [
            'Episódica: ≥10 crises durando 30 min a 7 dias.',
            'Características (≥2): Bilateral, Qualidade não pulsátil (pressão/aperto), Intensidade Leve a Moderada, Não piora c/ rotina física.',
            'Sintomas associados: Sem náusea/vômito. Fotofobia ou Fonofobia ausentes, ou apenas um dos dois. Diferencial: Cefaleia Cervicogênica (dor referida do pescoço).'
        ],
        treatment: {
            acute: 'Aspirina 500-1000mg, Ibuprofeno 400-800mg, Naproxeno. Evitar combinação precoce com cafeína em excesso pelo risco de rebote.',
            preventive: 'Tricíclicos: Amitriptilina (10-75mg/noite) é Nível A. Nortriptilina (se intolerância a efeitos anticolinérgicos). IRSN: Venlafaxina (150mg) ou Mirtazapina.',
            pearls: 'Efeitos Anticolinérgicos (Amitriptilina): Boca seca, constipação, retenção urinária, ganho de peso, sonolência diurna. Cefaleia por uso excessivo de analgésicos é uma complicação comum na Tensional crônica (>15 dias/mês sentindo dor).'
        }
    },
    {
        id: 'cluster',
        name: 'Cefaleia em Salvas (3.1)',
        icon: Clock,
        criteria: [
            'Ataques Severos: Unilaterais, orbitários, supraorbitários ou temporais intensos ou muito intensos, durando 15-180 minutos (sem tratamento). Frequência: 1 a 8 vezes/dia.',
            'Sintomas Autonômicos (≥1 ipsilateral): Injeção conjuntival/lacrimejamento, congestão nasal/rinorreia, edema palpebral, sudorese na testa, agitação e inquietação motora (paciente andando repetitivamente, diferindo do repouso na migrânea).',
            'Surtos (Salvas): Períodos ativos durando semanas/meses, seguidos de remissão (>3 meses).'
        ],
        treatment: {
            acute: 'Oxigênio 100% sob máscara sem reinalação (10-15 L/min) por 15 min. Sumatriptano subcutâneo (3-6mg) ou spray nasal.',
            preventive: 'Verapamil (240-960mg/dia; realizar ECG basal e a cada aumento de dose visando Bloqueio AV e PR prolongado). Bloqueio de Nervo Occipital (com corticoide). Galcanezumabe (300mg SC via mensal) em episódicos.',
            pearls: 'Oxigênio é abortivo Nível A e sem contraindicações sistêmicas (excelente em cardiopatas que não podem usar triptano subcutâneo). Verapamil pode causar constipação e edema maleolar.'
        }
    },
    {
        id: 'pseudotumor',
        name: 'HIC Idiopática (Pseudotumor)',
        icon: Search,
        criteria: [
            'Cefaleia diária, opressiva ou pulsátil, piora com manobras de Valsalva, decúbito. Tinnus pulsátil (som de "vento no ouvido").',
            'Exame Físico: Papiledema (perda visual é a principal complicação). Pode haver paresia do VI nervo abducente (estrabismo convergente).',
            'Diagnóstico (Critérios Dandy): Pressão de Abertura do LCR >250 mmH2O (>280 em obesos), LCR normal, imagem normal (exceto sinais de HIC: sela turca vazia, distensão bainha do nervo óptico, estenose de seio transverso).'
        ],
        treatment: {
            acute: 'Punção lombar de alívio (medida temporária). Perda de peso é mandatório.',
            preventive: 'Acetazolamida (até 2-4g/dia). Diuréticos como Furosemida. Topiramato auxilia a perda de peso. Casos iminentes de cegueira: Fenestração da bainha do n. óptico ou DVP/DVL.',
            pearls: 'Acetazolamida causa parestesias distais formigantes, fadiga severa, alteração de paladar (bebidas gasosas com gosto metálico), risco de cálculo renal e acidose metabólica.'
        }
    },
    {
        id: 'secondary',
        name: 'Urgent Systemic & Vasculares',
        icon: AlertTriangle,
        criteria: [
            'Arterite de Células Gigantes (ACG): Novos déficits em idosos (>50a), dor temporal referida, sensibilidade do couro cabeludo, amaurose fugaz/claudicação mandibular. VHS e PCR explodidos. Risco extremo de cegueira irreversível.',
            'RCVS (Síndrome de Vasoconstrição Cerebral Reversível): Thunderclap headache recorrente em poucos dias, desencadeada por vasoativos, sexo (cefaleia do orgasmo), banho. Angio com padrão em "colar de contas" ("sausage on a string").',
            'Dissecação Arterial Cervical (Carótida/Vertebral): Dor cervical lateral + Cefaleia unilateral. Sd. de Horner ipsilateral (Ptose e Miose) = Carótida. AIT/AVC na circulação posterior = Vertebral.'
        ],
        treatment: {
            acute: 'ACG: Metilprednisolona IV 1g 3-5d se amaurose, se não, Prednisona 1mg/kg IMEDIATA (antes mesmo da biópsia). Biópsia da artéria temporal (+/USG Doppler em sinal do halo).',
            preventive: 'RCVS: Nimodipino ou Verapamil, cessar triptanos e agentes simpatomiméticos.',
            pearls: 'A dor em trovoada (Thunderclap) atinge pico máximo (<1 min). O primeiro passo é a TC de crânio s/ contraste em janela adequada + Punção Lombar se TC normal para descartar Hemorragia Subaracnoide (HSA). RCVS deve ser diagnosticada pela Angio-TC ou RM para visualização da constrição segmentar e dilatação.'
        }
    }
];

export const HeadacheTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'snoop' | 'ichd' | 'treatment'>('snoop');
  const [selectedHeader, setSelectedHeader] = useState<string | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Cefaleias & Algias</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-40">
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl mb-6 shadow-inner shrink-0 overflow-x-auto no-scrollbar gap-1">
            <button onClick={() => setActiveTab('snoop')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'snoop' ? 'bg-white dark:bg-zinc-800 text-red-600 shadow-md' : 'text-slate-500'}`}>SNOOP10</button>
            <button onClick={() => setActiveTab('ichd')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ichd' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md' : 'text-slate-500'}`}>Critérios ICHD-3</button>
            <button onClick={() => setActiveTab('treatment')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'treatment' ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-md' : 'text-slate-500'}`}>Tratamento</button>
        </div>

        {activeTab === 'snoop' && (
            <div className="space-y-6 animate-in fade-in pb-20">
                <div className="bg-red-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <ShieldAlert className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">SNOOP10</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Sinais de Alerta para Cefaleia Secundária</p></div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {SNOOP10_DATA.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-4 rounded-2xl flex items-start gap-4 shadow-sm hover:border-red-500/50 transition-colors group">
                            <div className="h-10 w-10 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl flex items-center justify-center font-black text-lg shrink-0 border border-red-100 dark:border-red-900/50 group-hover:scale-110 transition-transform">{item.acronym}</div>
                            <div>
                                <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase mb-1">{item.title}</h4>
                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'ichd' && (
            <div className="space-y-6 animate-in fade-in pb-20">
                <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <FileText className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Classificação ICHD-3</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Diagnóstico e Diferenciais</p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ICHD3_DATA.map((c) => (
                        <div key={c.id} onClick={() => setSelectedHeader(selectedHeader === c.id ? null : c.id)} className={`bg-white dark:bg-zinc-950 border-2 rounded-[2rem] p-6 cursor-pointer transition-all ${selectedHeader === c.id ? 'border-blue-500 shadow-xl' : 'border-slate-100 dark:border-zinc-900 hover:border-blue-200'}`}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-2xl ${selectedHeader === c.id ? 'bg-blue-500 text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}><c.icon className="h-6 w-6" /></div>
                                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white">{c.name}</h4>
                            </div>
                            
                            {selectedHeader === c.id ? (
                                <ul className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    {c.criteria.map((crit, i) => (
                                        <li key={i} className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 leading-relaxed">
                                            {crit}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clique para ver detalhes</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'treatment' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 pb-20">
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Activity className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Estratégias Terapêuticas</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Prática Clínica Baseada em Evidência</p></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {ICHD3_DATA.map((c) => (
                        <div key={`tx-${c.id}`} onClick={() => setSelectedTreatment(selectedTreatment === c.id ? null : c.id)} className={`bg-white dark:bg-zinc-950 border-2 rounded-[2rem] p-6 cursor-pointer transition-all ${selectedTreatment === c.id ? 'border-emerald-500 shadow-xl' : 'border-slate-100 dark:border-zinc-900 hover:border-emerald-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${selectedTreatment === c.id ? 'bg-emerald-500 text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'}`}><c.icon className="h-6 w-6" /></div>
                                    <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white">Tratamento: {c.name}</h4>
                                </div>
                                {selectedTreatment === c.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </div>

                            {selectedTreatment === c.id && (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl">
                                            <p className="text-[9px] font-black uppercase text-emerald-600 mb-2">Crise Aguda</p>
                                            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{c.treatment.acute}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl">
                                            <p className="text-[9px] font-black uppercase text-blue-600 mb-2">Profilaxia</p>
                                            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{c.treatment.preventive}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 rounded-r-2xl">
                                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2 mb-1"><Zap className="h-3.5 w-3.5" /> Dicas Práticas & Efeitos Colaterais</p>
                                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">{c.treatment.pearls}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
