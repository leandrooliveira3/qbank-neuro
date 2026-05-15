import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { Question } from '../types';
import { 
    ChevronRight, ChevronLeft, Loader2, ZoomIn, ZoomOut, 
    ArrowLeft, CheckCircle2, Timer, Activity,
    MessageCircle, Sparkles, Check, AlertTriangle, 
    ZapOff, Brain
} from 'lucide-react';
import { syncEngine } from '../services/syncEngine';
import { localDB } from '../services/localDB';
import { SmartImage } from '../components/SmartImage';
import { generateFlashcardFromQuestion, explainWrongAlternatives } from '../services/ai';
import { xpService, XP_VALUES } from '../services/xpService';

export const PracticeSession: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const isResume = (state as any)?.resume;
  const config = (state as any)?.config || {};
  const stateQuestions = (state as any)?.questions as Question[] | undefined;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [fontScale, setFontScale] = useState(1);
  const [generatingFlashcard, setGeneratingFlashcard] = useState(false);
  const [flashcardGenerated, setFlashcardGenerated] = useState(false);
  const [explainingWrong, setExplainingWrong] = useState(false);
  const [wrongExplanations, setWrongExplanations] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const init = async () => {
        setLoading(true);
        try {
            if (stateQuestions && stateQuestions.length > 0) {
                setQuestions(stateQuestions);
                await localDB.put('active_practice_sessions', {
                    id: user.id, user_id: user.id, questions_data: stateQuestions, current_index: 0, answers_data: [], last_updated: new Date().toISOString()
                });
            } else if (isResume) {
                const session = await localDB.get('active_practice_sessions', user.id);
                if (session) {
                    setQuestions(session.questions_data);
                    setCurrentIndex(session.current_index);
                    const initialAnswers: Record<string, string> = {};
                    let hits = 0;
                    (session.answers_data || []).forEach((a: any) => {
                        initialAnswers[a.question_id] = a.selected_alternative_id;
                        if (a.is_correct) hits++;
                    });
                    setSelectedAnswers(initialAnswers);
                    setCorrectHits(hits);
                }
            } else {
                let all = await localDB.getAll('questions');
                let filtered = all.filter(q => q.created_by === user.id);
                if (config.selectedBanks?.length > 0) filtered = filtered.filter(q => config.selectedBanks.includes(q.bank_name || 'Geral'));
                filtered = filtered.filter((q: any) => {
                    if (!q) return false;
                    const name = q.subcategory || q.category;
                    if (config.selectedTopics?.length > 0 && !config.selectedTopics.includes(name)) return false;
                    if (config.selectedDifficulty !== 'Todas' && q.difficulty !== config.selectedDifficulty) return false;
                    return true;
                });
                if (config.practiceMode === 'mistakes') {
                    const history = await localDB.getAll('user_answers');
                    const mistakes = new Set(history.filter(h => h.user_id === user.id && !h.is_correct).map(h => h.question_id));
                    filtered = filtered.filter(q => mistakes.has(q.id));
                } else if (config.practiceMode === 'unseen') {
                    const history = await localDB.getAll('user_answers');
                    const seenIds = new Set(history.filter(h => h.user_id === user.id).map(h => h.question_id));
                    filtered = filtered.filter(q => !seenIds.has(q.id));
                }
                const selected = filtered.sort(() => Math.random() - 0.5).slice(0, config.questionLimit);
                setQuestions(selected);
                await localDB.put('active_practice_sessions', {
                    id: user.id, user_id: user.id, questions_data: selected, current_index: 0, answers_data: [], last_updated: new Date().toISOString()
                });
            }
        } finally { setLoading(false); }
    };
    init();
  }, [user?.id]);

  useEffect(() => {
      const timer = setInterval(() => { if (!isFinished && !loading) setElapsedSeconds(p => p + 1); }, 1000);
      return () => clearInterval(timer);
  }, [isFinished, loading]);

  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
    setFlashcardGenerated(false);
  }, [currentIndex]);

  const currentQ = questions[currentIndex];
  const isAnswered = currentQ ? !!selectedAnswers[currentQ.id] : false;

  const handleSelect = async (altId: string) => {
      if (isAnswered) return;
      const isCorrect = currentQ.alternatives.find(a => a.id === altId)?.is_correct;
      setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: altId }));
      if (isCorrect) setCorrectHits(prev => prev + 1);

      if (!stateQuestions) {
          const now = new Date().toISOString();
          await syncEngine.enqueue('user_answers', {
              id: crypto.randomUUID(), 
              user_id: user?.id, 
              question_id: currentQ.id, 
              is_correct: isCorrect, 
              selected_alternative_id: altId, 
              answered_at: now,
              created_at: now,
              updated_at: now
          });
          const session = await localDB.get('active_practice_sessions', user?.id!);
          if (session) {
              const answers = [...(session.answers_data || []), { question_id: currentQ.id, selected_alternative_id: altId, is_correct: isCorrect }];
              await localDB.put('active_practice_sessions', { ...session, answers_data: answers, current_index: currentIndex });
          }
      }
  };

  const handleExplainWrong = async () => {
      if (!currentQ || explainingWrong || wrongExplanations[currentQ.id]) return;
      setExplainingWrong(true);
      try {
          const exp = await explainWrongAlternatives(currentQ);
          setWrongExplanations(prev => ({ ...prev, [currentQ.id]: exp }));
      } catch (e) {
          alert("Erro ao conectar com a IA de reforço.");
      } finally {
          setExplainingWrong(false);
      }
  };

  const handleGenerateFlashcard = async () => {
    if (!user || generatingFlashcard || flashcardGenerated) return;
    setGeneratingFlashcard(true);
    try {
      const data = await generateFlashcardFromQuestion(currentQ.statement, currentQ.explanation);
      await syncEngine.enqueue('flashcards', {
        id: crypto.randomUUID(), user_id: user.id, front: data.front, back: data.back, front_image_url: currentQ.statement_image_url, category: currentQ.category, bank_name: 'IA Reforço', status: 'new', interval: 0, ease_factor: 2.5, repetitions: 0, next_review: new Date().toISOString(), created_at: new Date().toISOString()
      });
      setFlashcardGenerated(true);
    } catch (e) { console.error(e); } finally { setGeneratingFlashcard(false); }
  };

  const nextQuestion = () => {
      if (currentIndex < questions.length - 1) {
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          localDB.get('active_practice_sessions', user?.id!).then(s => {
              if (s) localDB.put('active_practice_sessions', { ...s, current_index: nextIdx });
          });
      } else { finishSession(); }
  };

  const prevQuestion = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const finishSession = async () => {
      if (!user) return;
      setLoading(true);
      try {
          const baseXP = correctHits * XP_VALUES.QUESTION_CORRECT;
          const totalXP = baseXP + Math.round(baseXP * XP_VALUES.BONUS_COMPLETE);
          if (totalXP > 0) await xpService.addXP(totalXP, `Treino Completo (${correctHits} acertos)`, 'Questões');
          await localDB.delete('active_practice_sessions', user.id);
          setIsFinished(true);
      } finally { setLoading(false); }
  };

  const stats = useMemo(() => {
      if (!isFinished) return null;
      const total = questions.length;
      return { 
          corrects: correctHits, total, perc: Math.round((correctHits / total) * 100),
          timeStr: `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`,
          finalXP: Math.round((correctHits * XP_VALUES.QUESTION_CORRECT) * (1 + XP_VALUES.BONUS_COMPLETE))
      };
  }, [isFinished, questions.length, correctHits, elapsedSeconds]);

  if (loading && !isFinished) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;
  if (questions.length === 0 && !loading) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-black"><p className="mb-4 font-bold">Nenhum item disponível.</p><button onClick={() => navigate('/practice')} className="bg-primary text-white px-6 py-2 rounded-xl font-black">VOLTAR</button></div>;

  if (isFinished && stats) {
      return (
          <div className="fixed inset-0 bg-slate-50 dark:bg-black flex flex-col items-center justify-center p-4 z-[200] overflow-y-auto animate-in fade-in duration-500">
              <div className="max-w-xl w-full text-center space-y-6">
                  <div className={`w-32 h-32 rounded-full border-[10px] flex flex-col items-center justify-center mx-auto shadow-2xl ${stats.perc >= 70 ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500'}`}>
                      <span className="text-3xl font-black">{stats.perc}%</span>
                      <span className="text-[8px] font-black uppercase mt-1">Score</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Sessão Finalizada</h2>
                  <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm"><CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" /><p className="text-lg font-black">{stats.corrects}/{stats.total}</p><p className="text-[7px] font-black uppercase text-slate-400">Acertos</p></div>
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm"><Timer className="h-5 w-5 text-blue-500 mx-auto mb-1" /><p className="text-lg font-black">{stats.timeStr}</p><p className="text-[7px] font-black uppercase text-slate-400">Tempo</p></div>
                      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm"><Activity className="h-5 w-5 text-orange-500 mx-auto mb-1" /><p className="text-lg font-black">+{stats.finalXP}</p><p className="text-[7px] font-black uppercase text-slate-400">XP</p></div>
                  </div>
                  <button onClick={() => navigate(stateQuestions ? '/videos' : '/')} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95">RETORNAR AO INÍCIO</button>
              </div>
          </div>
      );
  }

  const isImageMissing = currentQ.explanation?.includes('[ANEXAR_IMAGEM_MANUAL]');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden">
        <header className="h-14 shrink-0 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-4 md:px-6 flex items-center justify-between z-50">
            <div className="flex items-center gap-3">
                <button onClick={() => confirm("Sair do treino?") && navigate('/')} className="p-2 text-slate-400 hover:text-primary transition-all"><ArrowLeft className="h-5 w-5" /></button>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-primary uppercase">{currentIndex + 1} de {questions.length}</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Treinamento Clínico</span>
                </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
                <button onClick={() => setFontScale(p => Math.max(0.7, p - 0.1))} className="p-1.5 text-slate-500 hover:bg-white dark:hover:bg-zinc-800 rounded-lg"><ZoomOut className="h-4 w-4" /></button>
                <span className="text-[9px] font-black w-8 text-center text-slate-500">{Math.round(fontScale * 100)}%</span>
                <button onClick={() => setFontScale(p => Math.min(1.4, p + 0.1))} className="p-1.5 text-slate-500 hover:bg-white dark:hover:bg-zinc-800 rounded-lg"><ZoomIn className="h-4 w-4" /></button>
            </div>
        </header>

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center pb-32">
            <div className="max-w-3xl w-full p-4 md:p-6 space-y-4 transition-all duration-300" style={{ fontSize: `${fontScale}rem` }}>
                
                {isImageMissing && (
                    <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                        <p className="text-[0.6em] font-black uppercase text-red-700 dark:text-red-400 leading-tight">Análise visual necessária. Verifique o comentário técnico.</p>
                    </div>
                )}

                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[0.5em] font-black uppercase tracking-widest">{currentQ.category}</span>
                        <span className="text-[0.5em] font-bold text-slate-400 uppercase tracking-widest">{currentQ.difficulty}</span>
                    </div>

                    {currentQ.statement_image_url && (
                        <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-black flex justify-center max-h-[400px]">
                             <SmartImage url={currentQ.statement_image_url} alt="Caso" className="max-w-full max-h-[400px] object-contain" />
                        </div>
                    )}

                    <h2 className="text-[1.1em] font-bold leading-tight mb-8 text-justify text-slate-900 dark:text-slate-100">
                        {currentQ.statement}
                    </h2>

                    <div className="space-y-2">
                        {currentQ.alternatives.map((alt, idx) => {
                            const isSelected = selectedAnswers[currentQ.id] === alt.id;
                            const isCorrect = alt.is_correct;
                            let style = "bg-white dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 hover:border-primary/40";
                            if (isAnswered) {
                                if (isCorrect) style = "bg-emerald-50 border-emerald-500 dark:bg-emerald-950/20";
                                else if (isSelected) style = "bg-red-50 border-red-500 dark:bg-red-950/20";
                                else style = "opacity-50 grayscale border-slate-50";
                            } else if (isSelected) style = "border-primary bg-primary/5 ring-2 ring-primary/10";
                            
                            return (
                                <button key={alt.id} onClick={() => handleSelect(alt.id)} disabled={isAnswered} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${style}`}>
                                    <span className={`h-7 w-7 rounded-lg flex items-center justify-center font-black text-[0.6em] shrink-0 ${isAnswered ? (isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400') : (isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400')}`}>{String.fromCharCode(65 + idx)}</span>
                                    <span className="font-medium text-[0.8em] py-0.5 leading-snug">{alt.text}</span>
                                </button>
                            );
                        })}
                    </div>

                    {isAnswered && (
                        <div className="mt-8 space-y-4 animate-in slide-in-from-top-4">
                            <div className="p-5 bg-slate-50 dark:bg-zinc-950 rounded-2xl border-l-4 border-primary">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[0.6em] font-black uppercase text-primary flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Feedback Acadêmico</h4>
                                    <button onClick={() => !flashcardGenerated && handleGenerateFlashcard()} disabled={generatingFlashcard || flashcardGenerated} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[0.5em] font-black uppercase tracking-widest transition-all ${flashcardGenerated ? 'text-emerald-500' : 'bg-primary text-white shadow-md active:scale-95'}`}>
                                        {generatingFlashcard ? <Loader2 className="h-3 w-3 animate-spin" /> : (flashcardGenerated ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />)}
                                        {flashcardGenerated ? 'SALVO' : 'FLASHCARD IA'}
                                    </button>
                                </div>
                                <p className="text-[0.75em] font-medium leading-relaxed italic text-justify text-slate-600 dark:text-slate-400">
                                    {currentQ.explanation?.replace('[ANEXAR_IMAGEM_MANUAL]', '').trim() || 'Comentário não disponível.'}
                                </p>
                            </div>

                            {/* BOTAO EXPLICAR INCORRETAS - AGORA AZUL */}
                            {!wrongExplanations[currentQ.id] ? (
                                <button onClick={handleExplainWrong} disabled={explainingWrong} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-[0.6em] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                    {explainingWrong ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />} EXPLICAR ALTERNATIVAS INCORRETAS (IA)
                                </button>
                            ) : (
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border-l-4 border-blue-500 animate-in fade-in">
                                    <h4 className="text-[0.6em] font-black uppercase text-blue-600 mb-2 flex items-center gap-2"><ZapOff className="h-4 w-4" /> Por que as outras são falsas?</h4>
                                    <p className="text-[0.7em] font-medium leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-justify">
                                        {wrongExplanations[currentQ.id]}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>

        <footer className="h-16 shrink-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-center z-50">
            <div className="max-w-3xl w-full flex gap-3">
                <button onClick={prevQuestion} disabled={currentIndex === 0} className="flex-1 max-w-[120px] bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 h-11 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-20"><ChevronLeft className="h-4 w-4" /> ANTERIOR</button>
                <button onClick={nextQuestion} className="flex-[2] bg-primary text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">{currentIndex === questions.length - 1 ? 'CONCLUIR SESSÃO' : 'PRÓXIMO ITEM'} <ChevronRight className="h-4 w-4" /></button>
            </div>
        </footer>
    </div>
  );
};