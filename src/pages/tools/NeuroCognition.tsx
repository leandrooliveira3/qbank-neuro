import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Brain, CheckSquare, Square, 
  Activity, FileText, X,
  Clock, Smile, AlertCircle, Moon, Ruler,
  Calculator, CheckCircle2, Info
} from 'lucide-react';
import { SmartImage } from '../../components/SmartImage';

const CLINICAL_IMAGES = {
  PENTAGONS: "https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/meem/meem.png",
  MTA_SCALE: "https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/mta/mta.png" 
};

const MEEM_DATA = [
  { id: 'ot', text: '1. Orientação Temporal (5 pts)', type: 'checklist', subtext: 'Marque um ponto para cada resposta correta.', options: [{value:1, label:'Ano'}, {value:1, label:'Estação'}, {value:1, label:'Mês'}, {value:1, label:'Dia do Mês'}, {value:1, label:'Dia da Semana'}] },
  { id: 'oe', text: '2. Orientação Espacial (5 pts)', type: 'checklist', subtext: 'Marque um ponto para cada resposta correta.', options: [{value:1, label:'País'}, {value:1, label:'Estado'}, {value:1, label:'Cidade'}, {value:1, label:'Hospital / Local'}, {value:1, label:'Andar / Sala'}] },
  { id: 'mi', text: '3. Registro (3 pts)', type: 'checklist', subtext: 'Diga: CARRO, VASO, TIJOLO. Peça para repetir.', options: [{value:1, label:'Carro'}, {value:1, label:'Vaso'}, {value:1, label:'Tijolo'}] },
  { id: 'ac', text: '4. Atenção e Cálculo (5 pts)', type: 'checklist', subtext: 'Peça para subtrair 7 de 100 sucessivamente (5 vezes).', options: [{value:1, label:'100-7=93'}, {value:1, label:'93-7=86'}, {value:1, label:'86-7=79'}, {value:1, label:'79-7=72'}, {value:1, label:'72-7=65'}] },
  { id: 'ev', text: '5. Evocação (3 pts)', type: 'checklist', subtext: 'Pergunte quais eram os 3 objetos anteriores.', options: [{value:1, label:'Carro'}, {value:1, label:'Vaso'}, {value:1, label:'Tijolo'}] },
  { id: 'nom', text: '6. Nomeação (2 pts)', type: 'checklist', subtext: 'Aponte e pergunte o que é.', options: [{value:1, label:'Relógio'}, {value:1, label:'Caneta'}] },
  { id: 'rep', text: '7. Repetição (1 pt)', type: 'radio', subtext: '"Nem aqui, nem ali, nem lá"', options: [{value:1, label:'Repetiu corretamente'}, {value:0, label:'Erro/Incapaz'}] },
  { id: 'com', text: '8. Comando 3 Estágios (3 pts)', type: 'checklist', subtext: '"Pegue o papel com a mão direita, dobre-o ao meio e coloque-o no chão"', options: [{value:1, label:'Pegou com a mão direita'}, {value:1, label:'Dobrou ao meio'}, {value:1, label:'Colocou no chão'}] },
  { id: 'ler', text: '9. Leitura (1 pt)', type: 'radio', subtext: 'Mostre: FECHE OS OLHOS. Paciente deve ler e EXECUTAR.', options: [{value:1, label:'Executou corretamente'}, {value:0, label:'Erro/Não executou'}] },
  { id: 'esc', text: '10. Escrita (1 pt)', type: 'radio', subtext: 'Escrever uma frase completa com sentido.', options: [{value:1, label:'Frase com sentido'}, {value:0, label:'Erro/Incompleta'}] },
  { id: 'pc', text: '11. Praxia Construtiva (1 pt)', type: 'radio', images: [CLINICAL_IMAGES.PENTAGONS], subtext: 'Copiar o desenho abaixo. Os pentágonos devem se cruzar e ter 5 lados.', options: [{value:1, label:'Cópia correta'}, {value:0, label:'Erro na cópia'}] },
  { id: 'edu', text: 'Escolaridade (Referência)', type: 'select', ignoreInTotal: true, options: [{value:20, label:'Analfabeto (Corte: 20)'}, {value:25, label:'1-4 anos (Corte: 25)'}, {value:26, label:'5-8 anos (Corte: 26)'}, {value:28, label:'9+ anos (Corte: 28)'}] }
];

const NEW_COG_TOOLS = [
    { id: 'moca', name: 'MoCA (Montreal)', icon: Brain, description: 'Rastreio cognitivo (0-30).' },
    { id: 'cdr', name: 'CDR (Estadiamento)', icon: Activity, description: 'Clinical Dementia Rating.' },
    { id: 'fast', name: 'Escala FAST', icon: FileText, description: 'Alzheimer avançado (1-7).' },
    { id: 'pfeffer', name: 'Pfeffer (FAQ)', icon: CheckSquare, description: 'Atividades instrumentais.' },
    { id: 'clock', name: 'Teste do Relógio', icon: Clock, description: 'Escala de 10 pontos.' },
    { id: 'mta', name: 'Escala MTA', icon: Ruler, description: 'Atrofia Temporal Mesial.' },
    { id: 'phq9', name: 'PHQ-9', icon: Smile, description: 'Rastreio de Depressão.' },
    { id: 'gad7', name: 'GAD-7', icon: AlertCircle, description: 'Rastreio de Ansiedade.' },
    { id: 'epworth', name: 'Epworth', icon: Moon, description: 'Sonolência Excessiva.' },
    { id: 'stopbang', name: 'STOP-Bang', icon: Activity, description: 'Apneia do Sono (AOS).' },
    { id: 'gds', name: 'GDS-15', icon: Smile, description: 'Depressão Geriátrica.' }
];

const calculateCDR = (scores: Record<string, any>) => {
    const M = Number(scores['memory'] || 0);
    const others = [
        Number(scores['orient'] || 0),
        Number(scores['judge'] || 0),
        Number(scores['comm'] || 0),
        Number(scores['home'] || 0),
        Number(scores['care'] || 0)
    ];
    
    if (M === 0.5) {
        const greaterOrEqual1 = others.filter((s: number) => s >= 1).length;
        if (greaterOrEqual1 >= 3) return 1;
        const zeroCount = others.filter((s: number) => s === 0).length;
        if (zeroCount >= 3) return 0;
        return 0.5;
    }
    const greater = others.filter((s: number) => s > M).length;
    const smaller = others.filter((s: number) => s < M).length;
    
    if (greater >= 3 && M < 3) return M + 1; 
    if (smaller >= 3 && M > 0) return M === 0.5 ? 0 : (M - (M===1 ? 0.5 : 1));
    return M;
};

export const NeuroCognitionTool: React.FC = () => {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const totalScore = MEEM_DATA.reduce((acc, q) => {
      if (q.ignoreInTotal) return acc;
      const answer = scores[q.id];
      if (Array.isArray(answer)) return acc + answer.reduce((a: number, b: number) => a + b, 0);
      return acc + (Number(answer) || 0);
  }, 0);

  const interpretation = (() => {
      const eduCutoff = Number(scores['edu']) || 28;
      let status = 'Sugerido Normalidade';
      let color = 'text-emerald-500';
      let bg = 'bg-emerald-500/10';
      if (totalScore < eduCutoff) {
          status = 'Sugestivo de Déficit Cognitivo';
          color = 'text-red-600';
          bg = 'bg-red-600/10';
      }
      return { text: `${status} (Ponto de Corte: ${eduCutoff})`, color, bg };
  })();

  const renderMEEM = () => (
      <div className="space-y-6 pb-40 animate-in fade-in">
          <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[2rem] flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-emerald-500/20"><Brain className="h-6 w-6 text-white" /></div>
                  <div><h4 className="font-black text-primary text-base uppercase tracking-tight leading-none">PONTUAÇÃO TOTAL</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status de Rastreio</p></div>
              </div>
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{totalScore}</span>
          </div>
          <div className={`p-4 rounded-xl border-l-4 ${interpretation.bg} ${interpretation.color.replace('text-', 'border-')}`}>
              <p className={`text-sm font-black uppercase ${interpretation.color}`}>{interpretation.text}</p>
          </div>
          {MEEM_DATA.map((q) => (
              <section key={q.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm overflow-hidden">
                  <div className="mb-4"><h4 className="text-lg font-black text-slate-950 dark:text-white leading-tight">{q.text}</h4>{q.subtext && <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{q.subtext}</p>}</div>
                  {q.images?.map((img, i) => (<SmartImage key={i} url={img} alt="Ref" onDoubleClick={() => setFullscreenImage(img)} className="w-full aspect-video md:aspect-[21/9] object-contain bg-black rounded-2xl mb-6 shadow-inner border border-white/5" />))}
                  {q.type === 'checklist' ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{q.options.map((opt) => { const currentValues = scores[q.id] || []; const isSelected = currentValues.includes(opt.value); return (<button key={opt.label} onClick={() => { const next = isSelected ? currentValues.filter((v: any) => v !== opt.value) : [...currentValues, opt.value]; setScores(prev => ({ ...prev, [q.id]: next })); }} className={`text-left p-4 rounded-2xl text-[12px] font-black border-2 transition-all flex items-center justify-between ${isSelected ? 'bg-primary border-primary text-white' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-500'}`}><span>{opt.label}</span>{isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 opacity-30" />}</button>); })}</div>) : q.type === 'select' ? (<select value={scores[q.id] || ''} onChange={e => setScores(prev => ({ ...prev, [q.id]: e.target.value }))} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-800 text-xs font-black outline-none focus:border-primary"><option value="">Selecione...</option>{q.options.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}</select>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{q.options.map((opt) => (<button key={opt.label} onClick={() => setScores(prev => ({ ...prev, [q.id]: opt.value }))} className={`text-left p-4 rounded-2xl text-[12px] font-black border-2 transition-all ${scores[q.id] === opt.value ? 'bg-primary border-primary text-white' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-500'}`}>{opt.label}</button>))}</div>)}
              </section>
          ))}
          <div className="h-20" />
      </div>
  );

  const renderNewTool = () => {
      if (activeTool === 'cdr') {
          const cdrScore = calculateCDR(scores);
          const categories = [
              { id: 'memory', label: 'Memória', opts: [
                  {v:0, t:'0 - Ausência de perda de memória.'}, 
                  {v:0.5, t:'0.5 - Esquecimento leve, consistente; lembrança parcial de eventos; esquecimento "benigno".'}, 
                  {v:1, t:'1 - Perda de memória moderada; mais acentuada para eventos recentes; o déficit interfere nas atividades diárias.'}, 
                  {v:2, t:'2 - Perda de memória grave; retém apenas material muito aprendido; novo material perdido rapidamente.'}, 
                  {v:3, t:'3 - Perda de memória grave; restam apenas fragmentos.'}
              ]},
              { id: 'orient', label: 'Orientação', opts: [
                  {v:0, t:'0 - Plenamente orientado.'}, 
                  {v:0.5, t:'0.5 - Plenamente orientado exceto por leve dificuldade nas relações de tempo.'}, 
                  {v:1, t:'1 - Dificuldade moderada com relações de tempo; orientado no espaço na avaliação, mas pode ter desorientação geográfica.'}, 
                  {v:2, t:'2 - Desorientação grave quanto ao tempo; desorientado no espaço, frequentemente.'}, 
                  {v:3, t:'3 - Orientado apenas para pessoa.'}
              ]},
              { id: 'judge', label: 'Julgamento e Solução de Problemas', opts: [
                  {v:0, t:'0 - Resolve problemas do dia-a-dia bem; julgamento bom em relação ao desempenho passado.'}, 
                  {v:0.5, t:'0.5 - Leve prejuízo na solução de problemas, semelhanças e diferenças.'}, 
                  {v:1, t:'1 - Dificuldade moderada em lidar com problemas, semelhanças e diferenças; julgamento social mantido.'}, 
                  {v:2, t:'2 - Grave prejuízo em lidar com problemas, semelhanças e diferenças; julgamento social usualmente prejudicado.'}, 
                  {v:3, t:'3 - Incapaz de fazer julgamentos ou resolver problemas.'}
              ]},
              { id: 'comm', label: 'Assuntos Comunitários', opts: [
                  {v:0, t:'0 - Independente na função em nível habitual (profissional, etc).'}, 
                  {v:0.5, t:'0.5 - Leve prejuízo nessas atividades.'}, 
                  {v:1, t:'1 - Incapaz de funcionar independentemente nessas atividades embora possa ainda participar de algumas; parece normal à inspeção casual.'}, 
                  {v:2, t:'2 - Sem pretensão de funcionar independentemente fora de casa; parece bem o suficiente para ser levado a funções sociais.'}, 
                  {v:3, t:'3 - Incapaz de funcionar independentemente fora de casa; parece muito doente para ser levado a funções sociais.'}
              ]},
              { id: 'home', label: 'Lar e Hobbies', opts: [
                  {v:0, t:'0 - Vida em casa, hobbies e interesses intelectuais bem mantidos.'}, 
                  {v:0.5, t:'0.5 - Vida em casa, hobbies e interesses intelectuais levemente prejudicados.'}, 
                  {v:1, t:'1 - Comprometimento leve mas definitivo da função no lar; hobbies mais difíceis abandonados; interesses complicados abandonados.'}, 
                  {v:2, t:'2 - Só preservadas as tarefas muito simples; interesses muito restritos, pouco mantidos.'}, 
                  {v:3, t:'3 - Sem função significativa no lar.'}
              ]},
              { id: 'care', label: 'Cuidados Pessoais', opts: [
                  {v:0, t:'0 - Plenamente capaz de cuidar de si próprio.'}, 
                  {v:0.5, t:'0.5 - Necessita de estímulo.'}, 
                  {v:1, t:'1 - Necessita de assistência no vestir, higiene, cuidado com efeitos pessoais.'}, 
                  {v:2, t:'2 - Requer muita ajuda para cuidados pessoais; incontinência frequente.'}, 
                  {v:3, t:'3 - Requer cuidados pessoais totais.'}
              ]}
          ];
          return (
              <div className="space-y-6 animate-in fade-in pb-40">
                  <div className="bg-blue-600 text-white p-6 rounded-[2rem] text-center shadow-lg sticky top-0 z-10 border-4 border-white dark:border-zinc-900">
                      <div className="text-5xl font-black mb-2 tracking-tighter">CDR {cdrScore}</div>
                      <p className="text-[10px] font-black uppercase tracking-widest bg-white/20 inline-block px-3 py-1 rounded-full">
                          {cdrScore === 0 ? 'Normal' : cdrScore === 0.5 ? 'Comprometimento Cognitivo Leve (CCL)' : cdrScore === 1 ? 'Demência Leve' : cdrScore === 2 ? 'Demência Moderada' : 'Demência Grave'}
                      </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                      {categories.map(cat => (
                          <div key={cat.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
                              <h4 className="text-xs font-black uppercase text-slate-500 mb-4 tracking-widest border-b border-slate-100 dark:border-zinc-800 pb-2">{cat.label}</h4>
                              <div className="space-y-2">
                                  {cat.opts.map(opt => (
                                      <button key={opt.v} onClick={() => setScores(p => ({...p, [cat.id]: opt.v}))} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${scores[cat.id] === opt.v ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 font-bold' : 'bg-slate-50 dark:bg-zinc-950 border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-200'}`}>
                                          <span className="text-[10px] uppercase">{opt.t}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          );
      }
      return <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Ferramenta em desenvolvimento...</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => activeTool ? setActiveTool(null) : navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest">Neurocognição</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-40">
        {fullscreenImage && (
            <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setFullscreenImage(null)}>
                <img src={fullscreenImage} className="max-w-full max-h-full object-contain" />
                <button className="absolute top-4 right-4 text-white"><X className="h-8 w-8" /></button>
            </div>
        )}

        {!activeTool ? (
            <div className="space-y-6 animate-in fade-in">
                <button onClick={() => { setActiveTool('meem'); setScores({}); }} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 p-6 rounded-[2.5rem] shadow-lg hover:shadow-xl hover:border-primary transition-all text-left group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Activity className="h-32 w-32" /></div>
                    <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-4 text-primary"><Calculator className="h-8 w-8" /></div>
                    <h3 className="font-black text-2xl mb-1 text-slate-900 dark:text-white tracking-tighter">MEEM (Mini-Mental)</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rastreio Cognitivo Global</p>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {NEW_COG_TOOLS.map(tool => (
                        <button key={tool.id} onClick={() => { setActiveTool(tool.id); setScores({}); }} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-[2rem] shadow-sm hover:border-primary transition-all text-left group">
                            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-fit mb-4 text-slate-500 group-hover:text-primary transition-colors"><tool.icon className="h-6 w-6" /></div>
                            <h3 className="font-black text-lg mb-1">{tool.name}</h3>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{tool.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200 dark:border-zinc-800 relative w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tight">{activeTool === 'meem' ? 'Mini-Exame do Estado Mental' : NEW_COG_TOOLS.find(t => t.id === activeTool)?.name}</h2>
                    <button onClick={() => setActiveTool(null)} className="text-slate-400 hover:text-primary"><X className="h-5 w-5" /></button>
                </div>
                {activeTool === 'meem' ? renderMEEM() : renderNewTool()}
            </div>
        )}
      </main>
    </div>
  );
};