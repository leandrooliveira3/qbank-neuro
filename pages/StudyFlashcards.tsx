
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';
import { mediaService } from '../services/mediaService';
import { Flashcard } from '../types';
import { XP_VALUES, xpService } from '../services/xpService';
import { 
  X, Loader2, 
  Brain, Trophy, Clock, HelpCircle, Shuffle, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

// ... neuroSM18 function (unchanged) ...
const neuroSM18 = (card: Flashcard, rating: 'again' | 'hard' | 'good' | 'easy', modifier: number = 1.0) => {
    let { interval, ease_factor, repetitions, status } = card;
    let nextReview = new Date();
    const MIN_EASE = 1.3;
    const MAX_EASE = 3.5;

    switch (rating) {
        case 'again':
            interval = 0; 
            ease_factor = Math.max(MIN_EASE, ease_factor - 0.2);
            repetitions = 0;
            status = 'learning';
            break;
        case 'hard':
            interval = Math.max(1, Math.ceil(interval * 1.2));
            ease_factor = Math.max(MIN_EASE, ease_factor - 0.15);
            repetitions += 1;
            status = 'review';
            break;
        case 'good':
            if (repetitions === 0) interval = 1;
            else if (repetitions === 1) interval = 4;
            else interval = Math.ceil(interval * ease_factor);
            repetitions += 1;
            status = 'review';
            break;
        case 'easy':
            if (repetitions === 0) interval = 6;
            else interval = Math.ceil(interval * ease_factor * 1.5);
            ease_factor = Math.min(MAX_EASE, ease_factor + 0.15);
            repetitions += 1;
            status = 'mastered';
            break;
    }

    if (interval > 0) interval = Math.max(1, Math.ceil(interval * modifier));
    if (rating === 'again') {
        nextReview = new Date(Date.now() + 10 * 60 * 1000);
    } else {
        nextReview.setDate(nextReview.getDate() + interval);
    }

    return {
        ...card,
        interval,
        ease_factor: parseFloat(ease_factor.toFixed(2)),
        repetitions,
        status,
        next_review: nextReview.toISOString(),
        last_review: new Date().toISOString()
    };
};

export const StudyFlashcards: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { state } = useLocation();
  const studyMode = state?.studyMode || 'due';

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, learned: 0, mastered: 0 });
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [srsModifier, setSrsModifier] = useState(1.0);
  
  // Accumulate XP locally
  const [accumulatedXP, setAccumulatedXP] = useState(0);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => { 
      const profile = localStorage.getItem('neuro_srs_profile') || 'standard';
      let mod = 1.0;
      if (profile === 'cramming') mod = 0.5;
      else if (profile === 'deep') mod = 1.5;
      setSrsModifier(mod);
      loadSessionCards(); 
  }, [user, studyMode]);

  const loadSessionCards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allCards = await localDB.getAll('flashcards');
      const userCards = allCards.filter(c => c.user_id === user.id);
      let sessionCards: Flashcard[];

      if (studyMode === 'free') {
        sessionCards = [...userCards].sort(() => Math.random() - 0.5);
      } else if (studyMode === 'intensive') {
        sessionCards = [...userCards].sort((a, b) => (a.interval || 0) - (b.interval || 0));
      } else {
        // ── Due mode: apply priority + daily limit ──
        const now = new Date();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        const priorityRaw = localStorage.getItem('neuro_priority_config');
        const priorityCfg = priorityRaw ? JSON.parse(priorityRaw) : null;
        const isPriorityActive = priorityCfg?.activatedAt
            && (Date.now() - new Date(priorityCfg.activatedAt).getTime()) < sevenDaysMs;
        const priorityTopics: string[] = isPriorityActive ? (priorityCfg.topics || []) : [];

        // Priority cards: pull ALL cards from priority topics (even if not yet due), sorted by next_review
        const priorityCards = priorityTopics.length > 0
            ? userCards
                .filter(c => priorityTopics.includes(c.category || 'Sem Categoria'))
                .sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime())
            : [];

        // Normal due cards: only due, not in priority topics, oldest first
        const normalDue = userCards
            .filter(c => new Date(c.next_review) <= now && !priorityTopics.includes(c.category || 'Sem Categoria'))
            .sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime());

        sessionCards = [...priorityCards, ...normalDue];

        // ── Apply daily limit ──
        const dailyLimit = parseInt(localStorage.getItem('neuro_daily_limit') || '0');
        if (dailyLimit > 0 && sessionCards.length > dailyLimit) {
          const overflow = sessionCards.slice(dailyLimit);
          // Redistribute overflow across next 1-3 days so they don't pile up
          const updates = overflow.map((card, i) => {
            const daysAhead = 1 + (i % 3);
            const newDate = new Date();
            newDate.setDate(newDate.getDate() + daysAhead);
            return { ...card, next_review: newDate.toISOString() };
          });
          await Promise.all(updates.map(u => syncEngine.enqueue('flashcards', u)));
          sessionCards = sessionCards.slice(0, dailyLimit);
        }
      }

      setCards(sessionCards);
    } finally { setLoading(false); }
  };

  useEffect(() => {
      const card = cards[currentIndex];
      if (card?.front_image_url) {
          mediaService.getImageUrl(card.front_image_url).then(setCurrentImageUrl);
      } else {
          setCurrentImageUrl('');
      }
  }, [currentIndex, cards]);

  const handleRate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!user || currentIndex >= cards.length) return;
    
    setIsTransitioning(true);

    if (studyMode !== 'free') {
        const updatedCard = neuroSM18(cards[currentIndex], rating, srsModifier);
        await syncEngine.enqueue('flashcards', updatedCard);
    }
    
    // Just accumulate local stat
    const xpPerCard = XP_VALUES.FLASHCARD_REVIEW;
    setAccumulatedXP(prev => prev + xpPerCard);
    
    setSessionStats(p => ({
        reviewed: p.reviewed + 1,
        learned: rating === 'good' ? p.learned + 1 : p.learned,
        mastered: rating === 'easy' ? p.mastered + 1 : p.mastered
    }));

    setTimeout(() => {
        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            setCurrentImageUrl('');
            setCurrentIndex(p => p + 1);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 50);
        } else {
            // FINISH SESSION: AWARD XP HERE
            if (accumulatedXP + xpPerCard > 0) {
               // Add the last card's XP to the total before awarding
               xpService.addXP(accumulatedXP + xpPerCard, 'Revisão Concluída', 'Flashcards');
            }
            setFinished(true);
            setIsTransitioning(false);
        }
    }, 250);
  };

  const handleExit = () => {
      // Exit early = NO XP awarded for unfinished session
      navigate('/');
  };

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-black z-[200]"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  if (finished || cards.length === 0) {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden text-center z-[200]">
            <div className="bg-emerald-500/10 p-6 rounded-full mb-6 border-2 border-emerald-500/20">
                <Trophy className="h-12 w-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black mb-6 tracking-tighter">Sessão Finalizada</h2>
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-10">
                {[
                    { label: 'Vistos', val: sessionStats.reviewed, color: 'text-slate-900 dark:text-white' },
                    { label: 'Ganhos', val: sessionStats.learned, color: 'text-blue-500' },
                    { label: 'Domínio', val: sessionStats.mastered, color: 'text-emerald-500' }
                ].map((s, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                        <span className="text-[7px] font-black uppercase text-slate-400 block mb-0.5">{s.label}</span>
                        <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                    </div>
                ))}
            </div>
            <div className="p-4 bg-primary/10 rounded-xl mb-6 border border-primary/20">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">XP Ganho</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">+{accumulatedXP}</p>
            </div>
            <button onClick={() => navigate('/', { state: { xpEarned: accumulatedXP, source: 'Flashcards' } })} className="bg-primary text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                Voltar ao Dashboard
            </button>
        </div>
    );
  }

  const currentCard = cards[currentIndex];
  const hasOcclusions = currentCard.occlusions && currentCard.occlusions.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-black z-[100] flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-14 shrink-0 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between z-[110] shadow-sm">
            <button onClick={() => confirm("Sair agora cancelará o XP desta sessão.") && handleExit()} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-zinc-900 rounded-lg">
                <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    {studyMode === 'free' ? <><Shuffle className="h-3 w-3" /> Estudo Livre</> : (studyMode === 'intensive' ? 'Modo Intensivo' : 'Algoritmo de Revisão')}
                </span>
                <div className="w-20 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
                </div>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 shrink-0">
                <span className="text-[9px] font-black text-slate-500">{currentIndex + 1} / {cards.length}</span>
            </div>
        </header>

        {/* CARD AREA */}
        <main className={`flex-1 min-h-0 relative flex items-center justify-center p-4 overflow-hidden transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-full max-w-lg h-full flex flex-col perspective-1000">
                <div className={`relative w-full h-full flip-card-inner preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* FRENTE */}
                    <div 
                        className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col overflow-hidden cursor-pointer"
                        onClick={() => !isFlipped && setIsFlipped(true)}
                    >
                        {currentCard.front_image_url ? (
                            <div className="flex-[1.5] min-h-0 bg-slate-50 dark:bg-black/40 flex items-center justify-center p-3 border-b border-slate-100 dark:border-zinc-800 relative">
                                <div className="relative h-full w-full flex items-center justify-center">
                                    <div className="relative inline-block h-full max-w-full shadow-md rounded-xl overflow-hidden bg-black">
                                        <img 
                                            key={currentCard.id}
                                            src={currentImageUrl || currentCard.front_image_url} 
                                            alt="Referência" 
                                            className="h-full w-auto max-w-full object-contain block"
                                        />
                                        {hasOcclusions && currentCard.occlusions?.map(occ => (
                                            <div 
                                                key={occ.id}
                                                style={{ left: `${occ.x}%`, top: `${occ.y}%`, width: `${occ.width}%`, height: `${occ.height}%` }}
                                                className="absolute bg-zinc-950 border border-zinc-700 z-10"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                                <Brain className="h-10 w-10 text-slate-400 mb-2" />
                                <span className="text-[7px] font-black uppercase tracking-widest">Conceito Teórico</span>
                            </div>
                        )}

                        <div className="flex-1 min-h-0 p-6 flex flex-col text-center bg-white dark:bg-zinc-900">
                            <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                                <HelpCircle className="h-3 w-3 text-primary" />
                                <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Enunciado Médico</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center py-2">
                                <h2 className="text-base md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed px-2">
                                    {currentCard.front || "Identifique a estrutura ou diagnóstico."}
                                </h2>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-50 dark:border-zinc-800 shrink-0">
                                <span className="text-[7px] font-black text-primary/50 uppercase tracking-[0.3em] animate-pulse">Toque para revelar</span>
                            </div>
                        </div>
                    </div>

                    {/* VERSO */}
                    <div 
                        className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-emerald-500 shadow-xl flex flex-col overflow-hidden"
                    >
                        {currentCard.front_image_url ? (
                            <div className="flex-[1.5] min-h-0 bg-emerald-500/5 dark:bg-emerald-500/10 flex items-center justify-center p-3 border-b border-emerald-100 dark:border-emerald-900/40 relative">
                                <div className="relative h-full w-full flex items-center justify-center">
                                    <div className="relative inline-block h-full max-w-full shadow-md rounded-xl overflow-hidden bg-black border border-emerald-400/20">
                                        <img 
                                            key={`back-${currentCard.id}`}
                                            src={currentImageUrl || currentCard.front_image_url} 
                                            alt="Gabarito" 
                                            className="h-full w-auto max-w-full object-contain block opacity-90"
                                        />
                                        {hasOcclusions && currentCard.occlusions?.map(occ => (
                                            <div 
                                                key={occ.id}
                                                style={{ left: `${occ.x}%`, top: `${occ.y}%`, width: `${occ.width}%`, height: `${occ.height}%` }}
                                                className="absolute border border-emerald-400 bg-emerald-400/20 z-10 animate-pulse"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="flex-1 min-h-0 p-6 flex flex-col text-center bg-emerald-500/[0.02]">
                            <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span className="text-[7px] font-black uppercase text-emerald-500 tracking-widest">Conclusão Acadêmica</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar py-2 px-1">
                                <p className="text-sm md:text-xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                                    {currentCard.back}
                                </p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-emerald-50 dark:border-emerald-900/50 shrink-0">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{currentCard.category || 'Geral'}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>

        {/* FOOTER */}
        <footer className="h-20 shrink-0 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-center z-[110] shadow-lg">
            <div className="w-full max-w-lg">
                {!isFlipped ? (
                    <button 
                        onClick={() => setIsFlipped(true)} 
                        className="w-full h-12 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                        MOSTRAR RESPOSTA
                    </button>
                ) : (
                    studyMode === 'free' ? (
                        <div className="flex justify-center">
                            <button 
                                onClick={() => handleRate('good')}
                                disabled={isTransitioning}
                                className="w-full bg-primary text-white h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <>PRÓXIMO <ArrowLeft className="h-3 w-3 rotate-180" /></>}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-bottom-2">
                            {[
                                { id: 'again', label: 'Errei', sub: '10m', bg: 'bg-rose-500' },
                                { id: 'hard', label: 'Duro', sub: `${Math.ceil((currentCard.interval || 1) * 1.2 * srsModifier)}d`, bg: 'bg-orange-500' },
                                { id: 'good', label: 'Bom', sub: `${Math.ceil((currentCard.interval || 1) * (currentCard.ease_factor || 2.5) * srsModifier)}d`, bg: 'bg-blue-600' },
                                { id: 'easy', label: 'Fácil', sub: `${Math.ceil((currentCard.interval || 1) * (currentCard.ease_factor || 2.5) * 1.5 * srsModifier)}d`, bg: 'bg-emerald-600' }
                            ].map((btn) => (
                                <button 
                                    key={btn.id}
                                    onClick={() => handleRate(btn.id as any)}
                                    disabled={isTransitioning}
                                    className={`flex flex-col items-center justify-center ${btn.bg} text-white h-12 rounded-xl transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:active:scale-100`}
                                >
                                    <span className="text-[9px] font-black uppercase tracking-tighter leading-none">{btn.label}</span>
                                    <span className="text-[6px] font-bold opacity-70 uppercase flex items-center mt-1">
                                        <Clock className="h-1.5 w-1.5 mr-0.5" /> {btn.sub}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )
                )}
            </div>
        </footer>
    </div>
  );
};
