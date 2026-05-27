
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Search, Info, Zap, Eye, Brain,
  AlertTriangle, ShieldAlert, Activity, FileText,
  Thermometer, Clock, Scaling, Layout, Layers,
  Compass, Microscope, Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const RADIOLOGY_SIGNS = [
  {
    name: 'Sinal do Beija-Flor (Hummingbird)',
    disease: 'Paralisia Supranuclear Progressiva (PSP)',
    description: 'Atrofia marcada do mesencéfalo com preservação da ponte, assemelhando-se ao perfil de um beija-flor no corte sagital T1.',
    pearl: 'Indica atrofia da calota mesencefálica. Complementado pelo sinal de Mickey Mouse (axial) e Morning Glory.'
  },
  {
    name: 'Olho de Tigre (Tiger Eye)',
    disease: 'PKAN (NBIA tipo 1)',
    description: 'Hipersinal central (gliose) cercado por hipossinal (depósito de ferro) no globo pálido em seqüências T2/SWI.',
    pearl: 'Patognomônico para Neurodegeneração associada à Pantotenato Quinase. Ocorre mutação no gene PANK2.'
  },
  {
    name: 'Pão de Gengibre (Hot Cross Bun)',
    disease: 'Atrofia de Múltiplos Sistemas (MSA-C)',
    description: 'Hipersinal em forma de cruz na ponte em T2, devido à degeneração das fibras pontocerebelares transversas.',
    pearl: 'Comum em quadros de ataxia cerebelar progressiva no adulto. Pode surgir antes dos sintomas disautonômicos característicos.'
  },
  {
    name: 'Orelha de Lince (Lynx Ear)',
    disease: 'Paraparesia Espástica Hereditária (SPG11/15)',
    description: 'Hipersinal no "bico" (fórceps menor) do corpo caloso em T2/FLAIR.',
    pearl: 'Sinal clássico em provas de título para SPG11 (forma complexa de HSP com afinamento do corpo caloso e declínio cognitivo).'
  },
  {
    name: 'Sinal do Panda Gigante',
    disease: 'Doença de Wilson',
    description: 'Hipersinal no tegmento mesencefálico com preservação do núcleo rubro (olhos) e substância negra (orelhas).',
    pearl: 'Pode coexistir com o sinal do "Panda Miniatura" no tegmento da ponte. Indicativo de depósito de cobre tóxico.'
  },
  {
    name: 'Ponta de Hóquei (Hockey Stick)',
    disease: 'Doença de Creutzfeldt-Jakob (vCJD)',
    description: 'Hipersinal no pulvinar e núcleos dorsomediais do tálamo em difusão (DWI) ou FLAIR.',
    pearl: 'Sinal do Pulvinar isolado é muito sugestivo de variante da CJD. Restrição à difusão simétrica no córtex (Cortical Ribboning) sugere a forma esporádica.'
  },
  {
    name: 'Garra de Caranguejo (Crab Claw)',
    disease: 'Doença de Fahr (Calcificação Idiopática)',
    description: 'Calcificações extensas e simétricas nos gânglios da base (globo pálido, putâmen) e núcleos denteados cerebelares visíveis na TC sem contraste.',
    pearl: 'Obriga triagem laboratorial de metabolismo do cálcio, paratormônio (PTH) para excluir hipoparatireoidismo.'
  }
];

const PROTOCOLS_DATA = [
  { 
    seq: 'DWI / ADC (Difusão)', 
    use: 'Detecção hiperaguda de AVC isquêmico (<30 min). Restrição= Alto DWI / Baixo ADC. Abscessos cerebrais (centro restringe), CJD (ribboning cortical).',
    pearl: 'Risco de efeito T2 Shine-through (DWI alto com ADC alto = vasogênico).'
  },
  { 
    seq: 'SWI / GRE (Suscetibilidade)', 
    use: 'Sensível a produtos de degradação da hemoglobina e cálcio. Útil para micro-hemorragias (Angiopatia Amiloide), TCE (lesão axonal difusa), Cavernomas.',
    pearl: 'O SWI supera muito o GRE na detecção de veias corticais (Sinal do vaso suscetível no AVC agudo).'
  },
  { 
    seq: 'T1 com Contraste (Gadolínio)', 
    use: 'Avaliação da quebra da barreira hematoencefálica: tumores ativos, meningites, encefalites, esclerose múltipla (lesão ativa).',
    pearl: 'Padrões de realce importam: Anelar incompleto (Demyelinating), Anelar completo espesso (GBM/Abscesso).'
  },
  { 
    seq: 'FLAIR', 
    use: 'Sequência T2 com supressão do líquor. Excelente para avaliar desmielinização periventricular, edema vasogênico, Gliose.',
    pearl: 'HSA aguda subcortical pode aparecer com hipersinal nos sulcos no FLAIR.'
  }
];

const EPIDEMIOLOGY_DATA = [
  {
    category: 'Tumores do SNC (OMS)',
    items: [
      { name: 'Glioblastoma (IDH-selvagem, Grau 4)', epi: 'Primário maligno mais comum (Adultos >55a). Sobrevida média ~15 meses.', pearls: 'Realce anelar espesso irregular, necrose central, borboleta (cruza corpo caloso).' },
      { name: 'Meningioma', epi: 'Benigno mais comum (Mulheres >40a). Múltiplos meningiomas = pensar em NF2 (Cromossomo 22).', pearls: 'Lesão dural com Sinal da Cauda Dural em T1+C. Hiperostose óssea adjacente.' },
      { name: 'Metástases Cerebrais', epi: 'Tumor intracraniano mais comum geral. Fontes: Pulmão, Mama, Melanoma.', pearls: 'Múltiplas lesões na transição branco-cinzenta. Edema vasogênico (dedos de luva) desproporcional ao tamanho da lesão.' },
      { name: 'Meduloblastoma', epi: 'Maligno pediátrico mais comum da fossa posterior.', pearls: 'Preenche quarto ventrículo, hidrocefalia, metástases leptomeníngeas (Spinal Drop).' }
    ]
  },
  {
    category: 'Acidente Vascular Cerebral (AVC)',
    items: [
      { name: 'AVCi de Grandes Vasos (LVO)', epi: 'Origem cardioembólica (FA) ou AteroTrombótica. ACM é o território mais acometido.', pearls: 'DWI restringe precocemente. Sinal da Artéria Cerebral Média hiperdensa na TC.' },
      { name: 'Trombose Venosa Cerebral (TVC)', epi: 'Mulheres jovens com fatores pró-trombóticos, puérperas, ACO.', pearls: 'Sinal do Delta Vazio (CT/RM+C). Envolvimento de tálamos bilaterais = Veia de Galeno.' },
      { name: 'Angiopatia Amiloide Cerebral', epi: 'Adultos idosos sem hipertensão, doença de Alzheimer.', pearls: 'Hemorragias lobares recorrentes. Microbleeds corticais no SWI/GRE e preservação dos gânglios da base.' }
    ]
  }
];

export const NeuroRadiologyTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'signs' | 'epi' | 'protocols'>('signs');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSigns = RADIOLOGY_SIGNS.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.disease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col">
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 p-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Neurorradiologia</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Sinais e Epidemiologia</p>
          </div>
          <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
            <Microscope className="h-5 w-5" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6 pb-20">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-200 dark:bg-zinc-900 p-1 rounded-2xl shadow-inner shrink-0 gap-1 overflow-x-auto no-scrollbar">
            <button 
                onClick={() => setActiveTab('signs')} 
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'signs' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-md' : 'text-slate-500'}`}
            >
                <ImageIcon className="h-4 w-4" /> Sinais Típicos
            </button>
            <button 
                onClick={() => setActiveTab('epi')} 
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'epi' ? 'bg-white dark:bg-zinc-800 text-purple-600 shadow-md' : 'text-slate-500'}`}
            >
                <Activity className="h-4 w-4" /> Epidemiologia
            </button>
            <button 
                onClick={() => setActiveTab('protocols')} 
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'protocols' ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-md' : 'text-slate-500'}`}
            >
                <Layers className="h-4 w-4" /> Protocolos RM
            </button>
        </div>

        {activeTab === 'signs' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por sinal ou doença..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSigns.map((sign, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                      <Zap className="h-12 w-12 text-indigo-500" />
                   </div>
                   <div className="flex items-start gap-4 mb-4 relative z-10">
                      <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                         <ImageIcon className="h-6 w-6" />
                      </div>
                      <div>
                         <h3 className="font-black text-xs uppercase text-indigo-600 tracking-tight leading-none mb-1">{sign.name}</h3>
                         <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{sign.disease}</p>
                      </div>
                   </div>
                   
                   <div className="space-y-3 relative z-10">
                      <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                           {sign.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/20 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                         <Info className="h-3 w-3 shrink-0" />
                         <p className="text-[10px] font-black uppercase tracking-tighter leading-none">{sign.pearl}</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'epi' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {EPIDEMIOLOGY_DATA.map((cat, idx) => (
              <section key={idx}>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 ml-4">{cat.category}</h4>
                <div className="grid grid-cols-1 gap-3">
                   {cat.items.map((item, i) => (
                     <div key={i} className="p-6 bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-[2rem] flex items-center gap-4 group">
                        <div className="h-10 w-10 bg-purple-50 dark:bg-purple-950/30 rounded-xl flex items-center justify-center text-purple-600 font-black text-xs">
                           {i + 1}
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-baseline mb-1">
                              <h5 className="font-black text-[11px] text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</h5>
                              <span className="text-[8px] font-black bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded uppercase">Estatística</span>
                           </div>
                           <p className="text-[10px] text-slate-500 font-bold mb-1 leading-tight uppercase tracking-tight">{item.epi}</p>
                           <p className="text-[10px] font-medium italic text-slate-400">{item.pearls}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                <Layers className="h-10 w-10 opacity-40" />
                <div><h3 className="font-black uppercase tracking-tight text-lg">Técnicas de Ressonância</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Aplicações Clínicas por Sequência</p></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROTOCOLS_DATA.map((p, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-950 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-[2rem] p-6 shadow-sm hover:border-emerald-400 transition-colors group">
                        <h4 className="font-black text-sm text-emerald-700 uppercase mb-2">{p.seq}</h4>
                        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">{p.use}</p>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border-l-4 border-emerald-500">
                            <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Dica Prática</p>
                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 italic">{p.pearl}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
