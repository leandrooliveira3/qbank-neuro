
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Brain, CheckSquare, Square, 
  Activity, FileText, Copy, X,
  Clock, Smile, Download, AlertCircle, Moon, Ruler,
  Calculator, CheckCircle2,
  // Added missing Info import
  Info
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
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
  const { user } = useAuthStore();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const totalScore = MEEM_DATA.reduce((acc, q) => {
      if (q.ignoreInTotal) return acc;
      const answer = scores[q.id];
      if (Array.isArray(answer)) return acc + answer.reduce((a, b) => a + b, 0);
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
          {MEEM_DATA.map((q) => (
              <section key={q.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm overflow-hidden">
                  <div className="mb-4"><h4 className="text-lg font-black text-slate-950 dark:text-white leading-tight">{q.text}</h4>{q.subtext && <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{q.subtext}</p>}</div>
                  {q.images?.map((img, i) => (<SmartImage key={i} url={img} alt="Ref" onDoubleClick={() => setFullscreenImage(img)} className="w-full aspect-video md:aspect-[21/9] object-contain bg-black rounded-2xl mb-6 shadow-inner border border-white/5" />))}
                  {q.type === 'checklist' ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{q.options.map((opt) => { const currentValues = scores[q.id] || []; const isSelected = currentValues.includes(opt.value); return (<button key={opt.label} onClick={() => { const next = isSelected ? currentValues.filter((v: any) => v !== opt.value) : [...currentValues, opt.value]; setScores(prev => ({ ...prev, [q.id]: next })); }} className={`text-left p-4 rounded-2xl text-[12px] font-black border-2 transition-all flex items-center justify-between ${isSelected ? 'bg-primary border-primary text-white' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-500'}`}><span>{opt.label}</span>{isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 opacity-30" />}</button>); })}</div>) : q.type === 'select' ? (<select value={scores[q.id] || ''} onChange={e => setScores(prev => ({ ...prev, [q.id]: e.target.value }))} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-800 text-xs font-black outline-none focus:border-primary"><option value="">Selecione...</option>{q.options.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}</select>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{q.options.map((opt) => (<button key={opt.label} onClick={() => setScores(prev => ({ ...prev, [q.id]: opt.value }))} className={`text-left p-4 rounded-2xl text-[12px] font-black border-2 transition-all ${scores[q.id] === opt.value ? 'bg-primary border-primary text-white' : 'bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-500'}`}>{opt.label}</button>))}</div>)}
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
                  <div className="bg-blue-600 text-white p-6 rounded-2xl text-center shadow-lg sticky top-0 z-10 border-4 border-white dark:border-zinc-900">
                      <div className="text-5xl font-black mb-2 tracking-tighter">CDR {cdrScore}</div>
                      <p className="text-[10px] font-black uppercase tracking-widest bg-white/20 inline-block px-3 py-1 rounded-full">
                          {cdrScore === 0 ? 'Normal' : cdrScore === 0.5 ? 'Comprometimento Cognitivo Leve (CCL)' : cdrScore === 1 ? 'Demência Leve' : cdrScore === 2 ? 'Demência Moderada' : 'Demência Grave'}
                      </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                      {categories.map(cat => (
                          <div key={cat.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                              <h4 className="text-xs font-black uppercase text-slate-500 mb-3">{cat.label}</h4>
                              <div className="grid grid-cols-1 gap-1">
                                  {cat.opts.map(opt => (
                                      <button key={opt.v} onClick={() => setScores(p => ({...p, [cat.id]: opt.v}))} className={`text-left p-2.5 rounded-lg font-medium text-[10px] border transition-all ${scores[cat.id] === opt.v ? 'bg-blue-500 text-white border-blue-500 font-bold shadow-sm' : 'bg-slate-50 dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 hover:border-blue-300'}`}>
                                          {opt.t}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="h-20" />
              </div>
          );
      }

      if (activeTool === 'pfeffer') {
          const totalPfeffer = Object.values(scores).reduce<number>((a, b) => a + (typeof b === 'number' ? (b as number) : 0), 0);
          const items = ["Escreve cheques, paga contas, mantém registros financeiros?", "Reúne papéis (taxas, negócios) e documentos?", "Vai às compras sozinho para roupas, casa ou comida?", "Joga jogos de habilidade, passatempos, tricô?", "Prepara água para café/chá e apaga o fogo?", "Prepara refeição balanceada?", "Mantém-se a par dos acontecimentos atuais?", "Presta atenção, entende e discute programas de TV, livros?", "Lembra compromissos, festas familiares, feriados?", "Viaja para fora da vizinhança, dirige, pega ônibus?"];
          const opts = [
              {v:0, l:'Sim, é capaz (ou nunca fez mas conseguiria sem dificuldades)'}, 
              {v:1, l:'Com alguma dificuldade, mas faz'}, 
              {v:2, l:'Precisa de ajuda'}, 
              {v:3, l:'Não é capaz / Dependente'}
          ];
          return (
              <div className="space-y-6 animate-in fade-in pb-40">
                  <div className={`p-6 rounded-2xl text-center border-2 sticky top-0 z-10 shadow-lg ${totalPfeffer > 5 ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}>
                      <div className="text-4xl font-black">{totalPfeffer}/30</div>
                      <p className="text-[9px] font-black uppercase tracking-widest">{totalPfeffer > 5 ? 'Dependência Funcional (>5)' : 'Independência Preservada'}</p>
                  </div>
                  {items.map((q, i) => (
                      <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                          <p className="text-xs font-bold mb-3">{q}</p>
                          <div className="grid grid-cols-1 gap-1">
                              {opts.map(opt => (
                                  <button key={opt.v} onClick={() => setScores(p => ({...p, [i]: opt.v}))} className={`py-2 px-3 rounded-lg text-[10px] font-bold text-left border ${scores[i] === opt.v ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-zinc-800 border-slate-100 dark:border-zinc-700'}`}>{opt.l}</button>
                              ))}
                          </div>
                      </div>
                  ))}
                  <div className="h-20" />
              </div>
          );
      }

      if (activeTool === 'clock') {
          const clockItems = [
              {v: 10, l: 'Tudo está correto', g: '6-10'},
              {v: 9, l: 'Leve desordem nos ponteiros (p. ex.: ponteiro das horas sobre o 2)', g: '6-10'},
              {v: 8, l: 'Desordem nos ponteiros mais acentuada (p. ex: apontando 2h20)', g: '6-10'},
              {v: 7, l: 'Ponteiros completamente errados', g: '6-10'},
              {v: 6, l: 'Uso inapropriado (p ex: marcação digital ou círculos envolvendo números)', g: '6-10'},
              {v: 5, l: 'Números em ordem inversa, ou concentrados em alguma parte do relógio', g: '1-5'},
              {v: 4, l: 'Números faltando ou situados fora dos limites do relógio', g: '1-5'},
              {v: 3, l: 'Números e relógio não conectados; ausência de ponteiros', g: '1-5'},
              {v: 2, l: 'Alguma evidência de ter entendido as instruções, mas pouca semelhança com relógio', g: '1-5'},
              {v: 1, l: 'Não tentou ou não conseguiu representar um relógio', g: '1-5'}
          ];
          const selectedScore = scores['clock_res'] || 0;
          return (
              <div className="space-y-6 animate-in fade-in pb-40">
                  <div className={`p-6 rounded-[2.5rem] text-center border-2 sticky top-0 z-10 shadow-lg ${selectedScore >= 6 ? 'bg-emerald-500 text-white border-emerald-600' : selectedScore > 0 ? 'bg-red-500 text-white border-red-600' : 'bg-slate-900 text-white'}`}>
                      <div className="text-5xl font-black tracking-tighter">{selectedScore || '--'}<span className="text-xl opacity-60 ml-1">/10</span></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                        {selectedScore >= 6 ? 'Relógio e números estão corretos' : selectedScore > 0 ? 'Relógio e números incorretos' : 'Selecione um achado clínico'}
                      </p>
                  </div>
                  <div className="space-y-2">
                      <div className="p-4 bg-blue-50 dark:bg-zinc-800 rounded-2xl mb-4 border-l-4 border-blue-500 flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-500 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Instrução de Exame</p>
                            <p className="text-xs font-bold leading-relaxed">Peça ao paciente para desenhar um relógio circular com todos os números e marcar a hora exata: <span className="text-blue-600">"10 para as 11" (11:10)</span>.</p>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {clockItems.map((item) => (
                            <button 
                              key={item.v} 
                              onClick={() => setScores({clock_res: item.v})} 
                              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${scores['clock_res'] === item.v ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm' : 'bg-white dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-600'}`}
                            >
                                <span className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm ${scores['clock_res'] === item.v ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}>{item.v}</span>
                                <div className="flex-1">
                                  <span className="text-[11px] leading-tight uppercase font-black block">{item.l}</span>
                                  <span className={`text-[8px] font-bold uppercase tracking-widest ${item.g === '6-10' ? 'text-emerald-500' : 'text-red-400'}`}>{item.g} Pontos</span>
                                </div>
                            </button>
                        ))}
                      </div>
                  </div>
                  <div className="h-20" />
              </div>
          );
      }

      const otherListTools = {
          fast: { 
              title: 'FAST (Alzheimer)', 
              items: [
                  '1. Normal (Sem déficit funcional objetivo ou subjetivo).', 
                  '2. Queixa subjetiva de memória (esquece nomes, locais).', 
                  '3. Déficit no trabalho ou em situações novas e complexas.', 
                  '4. Requer assistência em tarefas complexas (finanças, planejamento).', 
                  '5. Requer assistência para escolher roupas adequadas.', 
                  '6a. Requer assistência para vestir-se adequadamente.', 
                  '6b. Requer assistência para banho.', 
                  '6c. Requer assistência para higiene pessoal no toalete.', 
                  '6d. Incontinência Urinária.', 
                  '6e. Incontinência Fecal.', 
                  '7a. Fala limitada a aproximadamente 6 palavras inteligíveis.', 
                  '7b. Fala limitada a uma única palavra inteligível.', 
                  '7c. Perda da capacidade de deambular sozinho.', 
                  '7d. Perda da capacidade de sentar-se sem apoio.', 
                  '7e. Perda da capacidade de sorrir.', 
                  '7f. Perda da capacidade de sustentar a cabeça.'
              ] 
          },
          stopbang: { title: 'STOP-Bang (Apneia do Sono)', items: ['Snoring: Você ronca alto (mais alto que falar)?', 'Tired: Sente-se cansado/sonolento durante o dia?', 'Observed: Alguém observou você parar de respirar?', 'Pressure: Você tem ou trata Hipertensão?', 'BMI: Seu IMC é maior que 35 kg/m²?', 'Age: Idade maior que 50 anos?', 'Neck: Circunferência do pescoço > 40cm?', 'Gender: Gênero Masculino?'] },
          phq9: { title: 'PHQ-9 (Depressão)', options: ['Nenhuma vez', 'Vários dias', 'Mais da metade', 'Quase todos os dias'], items: ['Pouco interesse ou prazer em fazer as coisas', 'Sentir-se triste, deprimido ou sem esperança', 'Dificuldade para adormecer, permanecer dormindo ou dormir demais', 'Sentir-se cansado ou com pouca energia', 'Sem apetite ou comendo demais', 'Sentir-se mal consigo mesmo, falha ou decepção', 'Dificuldade para se concentrar nas coisas', 'Mover-se/falar tão devagar ou tão agitado que outros notaram', 'Pensamentos de que seria melhor estar morto ou se ferir'] },
          gad7: { title: 'GAD-7 (Ansiedade)', options: ['Nenhuma vez', 'Vários dias', 'Mais da metade', 'Quase todos os dias'], items: ['Sentir-se nervoso, ansioso ou muito tenso', 'Não ser capaz de impedir ou de controlar as preocupações', 'Preocupar-se muito com diversas coisas', 'Dificuldade para relaxar', 'Ficar tão agitado que se torna difícil permanecer sentado', 'Ficar facilmente aborrecido ou irritado', 'Sentir medo como se algo terrível fosse acontecer'] },
          epworth: { title: 'Epworth (Sonolência Diurna)', options: ['Nenhuma chance de cochilar', 'Pequena chance de cochilar', 'Moderada chance de cochilar', 'Alta chance de cochilar'], items: ['Sentado lendo', 'Assistindo TV', 'Sentado em lugar público (teatro, reunião)', 'Como passageiro em um carro por 1 hora sem parar', 'Deitado à tarde para descansar (se possível)', 'Sentado conversando com alguém', 'Sentado calmamente após o almoço (sem álcool)', 'Em um carro, enquanto parado no trânsito'] },
      };

      if (activeTool && activeTool in otherListTools) {
          const t = otherListTools[activeTool as keyof typeof otherListTools] as { title: string; items: string[]; options?: string[] };
          const score = Object.values(scores).reduce((a: number, b: any) => a + (Number(b)||0), 0);
          
          return (
              <div className="space-y-4 animate-in fade-in pb-40">
                  <div className="bg-slate-900 text-white p-4 rounded-xl text-center mb-4 shadow-lg sticky top-0 z-10 border-4 border-white dark:border-zinc-900">
                      <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.title}</h3>
                      <div className="text-3xl font-black">{score}</div>
                  </div>
                  {t.items.map((item, i) => (
                      <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                          <p className="text-xs font-bold mb-2">{item}</p>
                          {t.options ? (
                              <div className="grid grid-cols-4 gap-1">
                                  {t.options.map((opt, val) => (
                                      <button key={val} onClick={() => setScores(p => ({...p, [i]: val}))} className={`py-2 px-1 rounded text-[7px] font-black uppercase border transition-all ${scores[i] === val ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-50 dark:bg-zinc-800'}`}>{val}<br/>{opt.split(' ')[0]}</button>
                                  ))}
                              </div>
                          ) : (
                              <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black text-slate-400 uppercase">Pontuar:</span>
                                  {activeTool === 'fast' ? (
                                      <button onClick={() => setScores({res: i+1})} className={`px-4 py-1.5 rounded-lg border font-black text-[10px] uppercase ${scores.res === i+1 ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-100 dark:bg-zinc-800'}`}>Selecionar</button>
                                  ) : activeTool === 'stopbang' ? (
                                      <button onClick={() => setScores(p => ({...p, [i]: p[i] ? 0 : 1}))} className={`w-10 h-6 rounded-full transition-all ${scores[i] ? 'bg-primary' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full mt-1 ml-1 transition-all ${scores[i] ? 'translate-x-4' : ''}`} /></button>
                                  ) : (
                                      <input type="number" className="w-16 p-1 border rounded-lg text-center font-bold" onChange={e => setScores(p => ({...p, [i]: Number(e.target.value)}))} />
                                  )}
                              </div>
                          )}
                      </div>
                  ))}
                  <div className="h-20" />
              </div>
          );
      }

      if (activeTool === 'mta') {
          return (
              <div className="space-y-6 animate-in fade-in pb-40">
                  <div className="rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-zinc-800 bg-black shadow-xl">
                      <SmartImage url={CLINICAL_IMAGES.MTA_SCALE} alt="Escala MTA" className="w-full object-contain" />
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border shadow-sm">
                      <h4 className="text-sm font-black uppercase mb-4 flex items-center gap-2"><Ruler className="h-4 w-4" /> Classificação Visual (Média L/R)</h4>
                      <div className="flex gap-2">
                          {[0, 1, 2, 3, 4].map(v => (
                              <button key={v} onClick={() => setScores({val: v})} className={`flex-1 py-3 rounded-xl font-black border-2 transition-all ${scores.val === v ? 'bg-primary border-primary text-white shadow-md' : 'border-slate-100 dark:border-zinc-800 bg-slate-50'}`}>{v}</button>
                          ))}
                      </div>
                      {scores.val !== undefined && (
                          <div className="mt-4 p-4 bg-slate-50 dark:bg-zinc-800 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-zinc-700 animate-in fade-in">
                              {scores.val === 0 ? 'Grau 0: Sem atrofia. Hipocampo normal.' : scores.val === 1 ? 'Grau 1: Alargamento leve da fissura coroideia.' : scores.val === 2 ? 'Grau 2: Alargamento moderado da fissura, altura hipocampal levemente reduzida.' : scores.val === 3 ? 'Grau 3: Perda moderada de volume hipocampal.' : 'Grau 4: Atrofia hipocampal grave.'}
                          </div>
                      )}
                  </div>
                  <div className="h-20" />
              </div>
          );
      }

      if (activeTool === 'gds') {
          const gdsScore = Object.values(scores).filter(v => v === 1).length;
          return (
              <div className="space-y-6 animate-in fade-in pb-40">
                  <div className="bg-slate-100 dark:bg-zinc-900 p-6 rounded-2xl text-center border-2 border-slate-200 dark:border-zinc-800 sticky top-0 z-10 shadow-lg">
                      <div className="text-4xl font-black mb-2">{gdsScore}/15</div>
                      <p className="text-[10px] uppercase font-black tracking-widest">{gdsScore > 5 ? 'Sugestivo de Depressão' : 'Normal'}</p>
                  </div>
                  {["Está satisfeito com sua vida? (Não=1)", "Interrompeu atividades? (Sim=1)", "Sente que a vida está vazia? (Sim=1)", "Aborrece-se com frequência? (Sim=1)", "Bom humor na maior parte do tempo? (Não=1)", "Medo que algo ruim aconteça? (Sim=1)", "Sente-se feliz na maior parte? (Não=1)", "Sente-se desamparado? (Sim=1)", "Prefere ficar em casa? (Sim=1)", "Problemas de memória? (Sim=1)", "Acha maravilhoso estar vivo? (Não=1)", "Sente-se inútil? (Sim=1)", "Cheio de energia? (Não=1)", "Sem esperança? (Sim=1)", "Acha que os outros estão melhor? (Sim=1)"].map((q, i) => (
                      <button key={i} onClick={() => setScores(p => ({...p, [i]: p[i] === 1 ? 0 : 1}))} className={`w-full p-4 rounded-xl border text-left flex justify-between transition-all ${scores[i] === 1 ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500'}`}>{q} {scores[i] === 1 && <CheckCircle2 className="h-4 w-4" />}</button>
                  ))}
                  <div className="h-20" />
              </div>
          );
      }

      if (activeTool === 'moca') {
          const mocaScore = Object.values(scores).reduce<number>((a, b) => (typeof b === 'number' ? a + b : a), 0);
          return (
              <div className="space-y-6 animate-in fade-in pb-40">
                  <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white dark:bg-black rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                              <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Folha de Aplicação</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Versão Brasileira (PDF/IMG)</p>
                          </div>
                      </div>
                      <a href="https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/moca/MoCA-Test-Portuguese_Brazil_page-0001.jpg" target="_blank" rel="noopener noreferrer" className="bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-transform active:scale-95"><Download className="h-3.5 w-3.5" /> Baixar</a>
                  </div>
                  {[
                      {id: 'visuo', label: 'Visuoespacial/Executiva', max: 5}, {id: 'nom', label: 'Nomeação', max: 3}, {id: 'atn', label: 'Atenção', max: 6},
                      {id: 'ling', label: 'Linguagem', max: 3}, {id: 'abs', label: 'Abstração', max: 2}, {id: 'evoc', label: 'Evocação Tardia', max: 5}, {id: 'ori', label: 'Orientação', max: 6}
                  ].map(d => (
                      <div key={d.id} className="flex justify-between items-center p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                          <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">{d.label} <span className="text-slate-400 ml-1">(Max {d.max})</span></span>
                          <input type="number" max={d.max} min={0} className="w-16 p-2 rounded-xl border-2 border-slate-100 dark:border-zinc-800 text-center font-black bg-slate-50 dark:bg-black focus:border-primary outline-none text-sm" onChange={e => setScores(p => ({...p, [d.id]: Math.min(d.max, Math.max(0, Number(e.target.value)))}))} />
                      </div>
                  ))}
                  <div className="bg-primary text-white p-6 rounded-[2rem] text-center shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Brain className="h-24 w-24" /></div>
                      <p className="text-[9px] font-black uppercase text-emerald-200 tracking-widest mb-1">Resultado Final</p>
                      <div className="text-5xl font-black tracking-tighter mb-2">{mocaScore}<span className="text-xl text-emerald-200 ml-1">/30</span></div>
                      <p className="text-[9px] font-bold uppercase text-white/80 tracking-widest bg-white/10 inline-block px-3 py-1 rounded-full">{mocaScore >= 26 ? 'Normal (≥26)' : 'Sugestivo de Déficit (<26)'}</p>
                  </div>
                  <div className="h-20" />
              </div>
          );
      }

      return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => activeTool ? setActiveTool(null) : navigate('/login')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Neurocognição</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-40">
        {fullscreenImage && (<div className="fixed inset-0 z-[999] bg-black flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setFullscreenImage(null)}><button className="absolute top-6 right-6 text-white/50 hover:text-white p-2"><X className="h-10 w-10" /></button><img src={fullscreenImage} className="max-w-full max-h-full object-contain" /></div>)}

        {!activeTool ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => { setActiveTool('meem'); setScores({}); }} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group">
                    <div className="p-3 bg-purple-500/10 rounded-2xl w-fit mb-4 text-purple-500 group-hover:scale-110 transition-transform"><Brain className="h-6 w-6" /></div>
                    <h3 className="font-black text-lg mb-1">MEEM (Minimental)</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Rastreio Padrão • 30 Pontos</p>
                </button>
                {NEW_COG_TOOLS.map(tool => (
                    <button key={tool.id} onClick={() => { setActiveTool(tool.id); setScores({}); }} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group">
                        <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-fit mb-4 text-slate-400 group-hover:text-primary transition-colors"><tool.icon className="h-6 w-6" /></div>
                        <h3 className="font-black text-lg mb-1">{tool.name}</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{tool.description}</p>
                    </button>
                ))}
            </div>
        ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200 dark:border-zinc-800 relative min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tight">{activeTool === 'meem' ? 'Mini Exame do Estado Mental' : NEW_COG_TOOLS.find(t => t.id === activeTool)?.name}</h2>
                    <button onClick={() => setActiveTool(null)} className="text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
                </div>
                {activeTool === 'meem' ? renderMEEM() : renderNewTool()}
                {activeTool === 'meem' && (
                    <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between z-[170] shadow-2xl">
                        <div className="flex items-center gap-4"><div className="hidden sm:block"><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Resultado</p><p className="text-3xl font-black text-primary tracking-tighter">{totalScore}</p></div><div className={`px-4 py-2 rounded-xl border-2 ${interpretation.bg} ${interpretation.color} text-[9px] font-black uppercase tracking-widest shadow-sm`}>{interpretation.text}</div></div>
                        <div className="flex gap-2"><button onClick={() => navigator.clipboard.writeText(`MEEM: ${totalScore}/30 (${interpretation.text})`)} className="px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest bg-slate-100 dark:bg-zinc-900 text-slate-500 flex items-center transition-colors hover:text-primary transition-all"><Copy className="h-4 w-4 mr-2" /> Copiar</button><button onClick={() => setActiveTool(null)} className="bg-slate-950 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/30 flex items-center active:scale-95 transition-all">Encerrar</button></div>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};
