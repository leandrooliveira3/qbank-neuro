
import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { flashcardImages, replaceFlashcardBackImage } from '../services/flashcardMedia';
import { scheduleFlashcard, reviewQueue, retryDelayMinutes, type FlashcardRating } from '../services/flashcardReview';
import { useAuthStore } from '../store/useAuthStore';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';
import { mediaService } from '../services/mediaService';
import { storageService } from '../services/storage';
import { Flashcard } from '../types';
import { XP_VALUES, xpService } from '../services/xpService';
import { 
  X, Loader2, 
  Brain, Trophy, Clock, HelpCircle, Shuffle, ArrowLeft, CheckCircle2,
  Undo2, MoreVertical, Ban, Edit2, CalendarClock, Sparkles, ImagePlus, Save,
  Maximize2, AlertCircle, Trash2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { explainFlashcardContext, generateQuestionFromFlashcard } from '../services/ai';
import { CloudImagePicker } from '../components/CloudImagePicker';

const safeCardHtml = (html: string) => DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'sub', 'sup', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
});

export const StudyFlashcards: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { state, key: routeKey } = useLocation();
  const studyMode = state?.studyMode || 'due';
  const freeStudy = studyMode === 'free' || (studyMode === 'config' && state?.reviewConfig?.type === 'free');
  const profile = user?.srs_profile || localStorage.getItem('neuro_srs_profile') || 'standard';

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, learned: 0, mastered: 0 });
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [currentBackImageUrl, setCurrentBackImageUrl] = useState<string>('');
  
  // Accumulate XP locally
  const [accumulatedXP, setAccumulatedXP] = useState(0);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const saving = useRef(false);
  const activeCardId = useRef<string | undefined>(undefined);
  activeCardId.current = cards[currentIndex]?.id;
  const [actionError, setActionError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCloudPickerOpen, setIsCloudPickerOpen] = useState(false);
  const [editForm, setEditForm] = useState({ front: '', back: '' });
  const [editBackSource, setEditBackSource] = useState('');
  const [editBackPreview, setEditBackPreview] = useState('');
  const [editBackFile, setEditBackFile] = useState<File | null>(null);
  useEffect(() => {
      if (editBackFile && editBackPreview.startsWith('blob:')) return () => URL.revokeObjectURL(editBackPreview);
  }, [editBackFile, editBackPreview]);
  const editBackImgRef = React.useRef<HTMLInputElement>(null);

  const [isFullscreenImageOpen, setIsFullscreenImageOpen] = useState(false);
  const [fullscreenSrc, setFullscreenSrc] = useState<string>('');
  const [fullscreenOcclusions, setFullscreenOcclusions] = useState<any[]>([]);
  const [isFullscreenBack, setIsFullscreenBack] = useState(false);
  
  const [isFrontVertical, setIsFrontVertical] = useState(false);
  const [isBackVertical, setIsBackVertical] = useState(false);
  
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [savingExplanation, setSavingExplanation] = useState(false);
  
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [generatedQuestionSuccess, setGeneratedQuestionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIsGeneratingQuestion(false);
    setGeneratedQuestionSuccess(null);
  }, [cards[currentIndex]?.id]);
  
  useEffect(() => {
      if (!user?.id) return;
      const controller = new AbortController();
      let running = false;
      let hasCards = false;
      const load = async () => {
          if (running || hasCards) return;
          running = true;
          try {
              hasCards = await loadSessionCards(controller.signal);
          } catch {
              if (!controller.signal.aborted) setActionError('Não foi possível carregar os flashcards neste dispositivo.');
          } finally {
              running = false;
          }
      };
      setCurrentIndex(0);
      setCards([]);
      setFinished(false);
      setIsFlipped(false);
      setActionError('');
      void load();
      window.addEventListener('neuro_sync_completed', load);
      return () => {
          controller.abort();
          window.removeEventListener('neuro_sync_completed', load);
      };
  }, [user?.id, routeKey]);

  const loadSessionCards = async (signal: AbortSignal) => {
    if (!user) return false;
    setLoading(true);
    try {
      const allCards = await localDB.getAll('flashcards');
      if (signal.aborted) return false;
      const ownedCards = allCards.filter(c => c.user_id === user.id);
      const userCards = ownedCards.filter(c => c.status !== 'inactive');
      let sessionCards: Flashcard[];

      if (studyMode === 'preview') {
        const previewId = state?.previewCardId;
        const target = ownedCards.find(c => c.id === previewId);
        sessionCards = target ? [target] : [];
      } else if (studyMode === 'free') {
        sessionCards = [...userCards].sort(() => Math.random() - 0.5);
      } else if (studyMode === 'intensive') {
        sessionCards = [...userCards].sort((a, b) => (a.interval || 0) - (b.interval || 0));
      } else {
        const config = studyMode === 'config' ? state?.reviewConfig : undefined;
        const priority = user.priority_config ?? (() => {
            try { return JSON.parse(localStorage.getItem('neuro_priority_config') || 'null'); }
            catch { return null; }
        })();
        sessionCards = reviewQueue(ownedCards, {
            type: config?.type ?? 'due', bank: config?.bank, category: config?.category,
            limit: studyMode === 'config' ? config?.limit ?? 20 : undefined,
            dailyLimit: user.daily_limit ?? Number(localStorage.getItem('neuro_daily_limit') || '0'),
            priority,
        });
      }

      if (!signal.aborted) setCards(sessionCards);
      return sessionCards.length > 0;
    } finally { if (!signal.aborted) setLoading(false); }
  };

  const currentCard = cards[currentIndex];
  const { front: frontSource, back: backSource } = flashcardImages(currentCard);

  useEffect(() => {
      let active = true;
      const displayed: string[] = [];
      setIsFrontVertical(false);
      setIsBackVertical(false);
      setCurrentImageUrl('');
      setCurrentBackImageUrl('');
      const load = async (source: string, show: (url: string) => void) => {
          const url = await mediaService.getImageUrl(source);
          if (active) {
              displayed.push(url);
              show(url);
          } else mediaService.releaseImageUrl(url);
      };
      if (frontSource) void load(frontSource, setCurrentImageUrl);
      if (backSource) void load(backSource, setCurrentBackImageUrl);
      return () => {
          active = false;
          displayed.forEach(url => mediaService.releaseImageUrl(url));
      };
  }, [currentCard?.id, frontSource, backSource]);

  const commitStudyAction = async (card: Flashcard, action: 'upsert' | 'delete' = 'upsert') => {
      if (saving.current) return false;
      saving.current = true;
      setIsTransitioning(true);
      setActionError('');
      try {
          await syncEngine.enqueue('flashcards', card, action);
          return true;
      } catch {
          setActionError('Não foi possível salvar a alteração. Tente novamente.');
          setIsTransitioning(false);
          return false;
      } finally {
          saving.current = false;
      }
  };

  const advance = (earned = 0) => {
      setIsFlipped(false);
      setAiExplanation(null);
      setIsExplaining(false);
      if (currentIndex + 1 < cards.length) {
          setCurrentIndex(currentIndex + 1);
      } else {
          const total = accumulatedXP + earned;
          if (total > 0) void xpService.addXP(total, 'Revisão Concluída', 'Flashcards');
          setFinished(true);
      }
      setIsTransitioning(false);
  };

  const handleRate = async (rating: FlashcardRating) => {
      if (studyMode === 'preview' || freeStudy || !currentCard || !user || isTransitioning) return;
      const reviewed = scheduleFlashcard(currentCard, rating, profile);
      if (!await commitStudyAction(reviewed)) return;
      const earned = XP_VALUES.FLASHCARD_REVIEW;
      setAccumulatedXP(prev => prev + earned);
      setSessionStats(prev => ({
          reviewed: prev.reviewed + 1,
          learned: prev.learned + Number(rating === 'good'),
          mastered: prev.mastered + Number(rating === 'easy'),
      }));
      advance(earned);
  };

  const handleExit = () => {
      if (studyMode === 'preview') { navigate('/flashcards'); return; }
      if (accumulatedXP > 0) {
          xpService.addXP(accumulatedXP, 'Revisão Parcial', 'Flashcards');
      }
      navigate('/', { state: { xpEarned: accumulatedXP > 0 ? accumulatedXP : undefined, source: 'Flashcards' } });
  };

  const handleExplainAI = async () => {
      if (isExplaining || aiExplanation || !cards[currentIndex]) return;
      const card = cards[currentIndex];
      setIsExplaining(true);
      try {
          let explanation = await explainFlashcardContext(card.front, card.back);
          // Sanitize possible markdown fallbacks from the LLM just in case
          explanation = explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          explanation = explanation.replace(/\*(.*?)\*/g, '<em>$1</em>');
          explanation = explanation.replace(/### (.*?)\n/g, '<strong>$1</strong><br/>');
          explanation = explanation.replace(/## (.*?)\n/g, '<strong>$1</strong><br/>');
          explanation = explanation.replace(/# (.*?)\n/g, '<strong>$1</strong><br/>');
          if (activeCardId.current === card.id) setAiExplanation(explanation);
      } catch (err: any) {
          if (activeCardId.current !== card.id) return;
          console.error('Failed to explain flashcard context', err);
          if (err?.message?.includes("CRÉDITOS_ESGOTADOS")) {
              setAiExplanation(`<strong>Créditos Esgotados:</strong> ${err.message.replace("CRÉDITOS_ESGOTADOS: ", "")}`);
          } else {
              setAiExplanation('Não foi possível gerar a explicação no momento. Por favor, verifique seus créditos do Gemini API no Google AI Studio.');
          }
      } finally {
          if (activeCardId.current === card.id) setIsExplaining(false);
      }
  };

  const handleSaveAIExplanation = async () => {
      if (!aiExplanation || !currentCard || saving.current || savingExplanation || isTransitioning) return;
      saving.current = true;
      setActionError('');
      setSavingExplanation(true);
      try {
          const card = cards[currentIndex];
          let newBack = card.back || '';
          const aiBlock = `[AI_EXPLANATION]${aiExplanation}[/AI_EXPLANATION]`;
          if (newBack.includes('[AI_EXPLANATION]')) {
              newBack = newBack.replace(/\[AI_EXPLANATION\][\s\S]*?\[\/AI_EXPLANATION\]/, aiBlock);
          } else {
              newBack += `\n\n${aiBlock}`;
          }
          const updatedCard = { ...card, back: newBack };
          await syncEngine.enqueue('flashcards', updatedCard);
          setCards(prev => prev.map(item => item.id === updatedCard.id ? updatedCard : item));
          if (activeCardId.current === updatedCard.id) setAiExplanation(null);
      } catch {
          setActionError('Não foi possível salvar a explicação. Tente novamente.');
      } finally {
          saving.current = false;
          setSavingExplanation(false);
      }
  };

  const handleGenerateQuestionAI = async () => {
      if (isGeneratingQuestion || !cards[currentIndex] || !user?.id) return;
      const card = cards[currentIndex];
      setIsGeneratingQuestion(true);
      setGeneratedQuestionSuccess(null);
      try {
          const generated = await generateQuestionFromFlashcard(card.front, card.back, card.category);
          
          const questionId = crypto.randomUUID();
          const payload = {
              id: questionId,
              bank_name: 'CASOS DE FLASHCARDS',
              category: card.category || 'Geral',
              subcategory: generated.subcategoria || '',
              difficulty: 'Difícil',
              statement: generated.enunciado,
              explanation: generated.comentario,
              statement_image_url: '',
              alternatives: generated.alternativas.map(alt => ({
                  id: crypto.randomUUID(),
                  text: alt.text,
                  is_correct: alt.is_correct
              })),
              created_by: user.id,
              created_at: new Date().toISOString(),
              tags: generated.tags || []
          };
          
          await syncEngine.enqueue('questions', payload);
          if (activeCardId.current === card.id) setGeneratedQuestionSuccess('Caso clínico de fellowship elaborado e adicionado no banco "CASOS DE FLASHCARDS" com sucesso!');
      } catch (err: any) {
          if (activeCardId.current !== card.id) return;
          console.error('Failed to generate question from flashcard', err);
          if (err?.message?.includes("CRÉDITOS_ESGOTADOS")) {
              setGeneratedQuestionSuccess(`Erro: ${err.message.replace("CRÉDITOS_ESGOTADOS: ", "")}`);
          } else {
              setGeneratedQuestionSuccess('Não foi possível gerar no momento. Por favor, revise seus créditos do Gemini API no Google AI Studio.');
          }
      } finally {
          if (activeCardId.current === card.id) setIsGeneratingQuestion(false);
      }
  };

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-black z-[200]"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  if (finished || cards.length === 0) {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden text-center z-[200]">
            <div className="bg-emerald-500/10 p-6 rounded-full mb-6 border-2 border-emerald-500/20">
                <Trophy className="h-12 w-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black mb-6 tracking-tighter">{cards.length === 0 && !finished ? 'Nenhum flashcard disponível para esta sessão' : 'Sessão Finalizada'}</h2>
            {actionError && <p role="alert" className="text-rose-600 mb-4">{actionError}</p>}
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

  const handleBury = async () => {
      if (!user || !currentCard || studyMode === 'preview' || isTransitioning) return;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (await commitStudyAction({ ...currentCard, next_review: tomorrow.toISOString() })) advance();
  };

  const handleSuspend = async () => {
      if (!user || !currentCard || studyMode === 'preview' || isTransitioning) return;
      if (await commitStudyAction({ ...currentCard, status: 'inactive' })) advance();
  };

  const handleDeleteActiveCard = async () => {
      if (!user || !currentCard || isTransitioning) return;
      if (!confirm('Tem certeza de que deseja excluir permanentemente este flashcard?')) return;
      if (!await commitStudyAction(currentCard, 'delete')) return;
      if (studyMode === 'preview') {
          navigate('/flashcards');
      } else if (currentIndex + 1 === cards.length) {
          advance();
      } else {
          setCards(prev => prev.filter(card => card.id !== currentCard.id));
          setIsFlipped(false);
          setAiExplanation(null);
          setIsExplaining(false);
          setIsTransitioning(false);
      }
  };

  const hasOcclusions = currentCard?.occlusions && currentCard.occlusions.length > 0;
  
  const backText = currentCard?.back || '';
  let savedAiText: string | null = null;
  let regularBack = backText;
  
  const aiMatch = backText.match(/\[AI_EXPLANATION\]([\s\S]*?)\[\/AI_EXPLANATION\]/);
  if (aiMatch) {
      savedAiText = aiMatch[1].trim();
      regularBack = backText.replace(/\[AI_EXPLANATION\][\s\S]*?\[\/AI_EXPLANATION\]/, '').trim();
  } else {
      // Legacy extraction
      const legacyMatch = backText.match(/<br\/><br\/><strong>Contexto Aprofundado \(IA\):<\/strong><br\/>([\s\S]*)/);
      if (legacyMatch) {
          savedAiText = legacyMatch[1].trim();
          regularBack = backText.replace(/<br\/><br\/><strong>Contexto Aprofundado \(IA\):<\/strong><br\/>[\s\S]*/, '').trim();
      }
  }

  const handleEditClick = () => {
    setEditForm({ front: currentCard.front, back: currentCard.back });
    setEditBackFile(null);
    setEditBackSource(backSource);
    setEditBackPreview(currentBackImageUrl || backSource);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleEditBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('Imagem muito grande. Máximo 5MB.');
    setEditBackFile(file);
    setEditBackPreview(URL.createObjectURL(file));
  };

  const saveEdit = async () => {
    if (saving.current || isTransitioning) return;
    saving.current = true;
    setIsTransitioning(true);
    setActionError('');
    try {
        let back = editBackSource;
        if (editBackFile) {
            const name = [currentCard.category, currentCard.bank_name, editForm.front].filter(Boolean).join('_');
            back = await storageService.uploadImage(editBackFile, 'flashcards', name);
            setEditBackSource(back);
            setEditBackPreview(back);
            setEditBackFile(null);
        }
        const card = back === backSource ? currentCard : replaceFlashcardBackImage(currentCard, back);
        if ((!editForm.front.trim() || !editForm.back.trim()) && !flashcardImages(card).front && !back) {
            setActionError('Preencha a frente e o verso ou anexe uma imagem.');
            return;
        }
        const updated = { ...card, ...editForm };
        await syncEngine.enqueue('flashcards', updated);
        setCards(prev => prev.map(card => card.id === updated.id ? updated : card));
        setIsEditing(false);
    } catch {
        setActionError('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
        saving.current = false;
        setIsTransitioning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-black z-[100] flex flex-col overflow-hidden">
        {isEditing && (
            <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6 shadow-xl flex flex-col max-h-[90vh] overflow-y-auto">
                    <h3 className="font-black mb-4">Editar Flashcard</h3>
                    <textarea value={editForm.front} onChange={e => setEditForm({...editForm, front: e.target.value})} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3 mb-3 min-h-[80px] text-sm" placeholder="Frente do Flashcard" />
                    <textarea value={editForm.back} onChange={e => setEditForm({...editForm, back: e.target.value})} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3 mb-4 min-h-[80px] text-sm" placeholder="Verso do Flashcard (Gabarito)" />
                    
                    <div className="mb-4">
                        <label className="text-[9px] text-slate-500 uppercase font-black block mb-2">Imagem de Resposta</label>
                        {editBackPreview ? (
                            <div className="relative rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-center p-2">
                                <img src={editBackPreview} className="max-h-[120px] object-contain rounded-lg" />
                                <button onClick={() => { setEditBackFile(null); setEditBackSource(''); setEditBackPreview(''); }} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded shadow-lg"><X className="h-3 w-3" /></button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {/* Upload local */}
                                <div 
                                    onClick={() => editBackImgRef.current?.click()} 
                                    className="bg-slate-50 dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all group"
                                >
                                    <input type="file" ref={editBackImgRef} className="hidden" accept="image/*" onChange={handleEditBackImageChange} />
                                    <ImagePlus className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors mb-1" />
                                    <p className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-300">Aparelho</p>
                                </div>
                                
                                {/* Selecionar da Nuvem */}
                                <div 
                                    onClick={() => setIsCloudPickerOpen(true)} 
                                    className="bg-slate-50 dark:bg-zinc-950 border-2 border-dashed border-slate-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all group"
                                >
                                    <ImagePlus className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors mb-1" />
                                    <p className="text-[9px] font-black uppercase text-slate-600 dark:text-zinc-300">Nuvem</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {actionError && <p role="alert" className="text-sm text-rose-600">{actionError}</p>}
                    <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => setIsEditing(false)} disabled={isTransitioning} className="px-4 py-2 rounded-xl text-slate-500 font-bold text-xs uppercase">Cancelar</button>
                        <button onClick={saveEdit} disabled={isTransitioning} className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs uppercase">Salvar Alterações</button>
                    </div>
                </div>
            </div>
        )}
        {/* HEADER */}
        <header className="h-14 shrink-0 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between z-[110] shadow-sm relative">
            <button onClick={() => (studyMode === 'preview' || confirm("Deseja interromper a sessão? O progresso dos cards revisados será salvo.")) && handleExit()} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-zinc-900 rounded-lg">
                <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    {(studyMode === 'free' || (studyMode === 'config' && state?.reviewConfig?.type === 'free')) ? <><Shuffle className="h-3 w-3" /> Estudo Livre</> : (studyMode === 'config' ? `Revisão (${state?.reviewConfig?.limit === 9999 ? 'Ilimitado' : state?.reviewConfig?.limit} Cards)` : (studyMode === 'intensive' ? 'Modo Intensivo' : 'Algoritmo de Revisão'))}
                </span>
                <div className="w-20 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
                </div>
            </div>
            <div className="flex bg-slate-50 dark:bg-zinc-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 shrink-0 gap-2 items-center relative">
                <span className="text-[9px] font-black text-slate-500">{currentIndex + 1} / {cards.length}</span>
                <div className="h-4 w-px bg-slate-300 dark:bg-zinc-700"></div>
                <button onClick={() => setShowMenu(!showMenu)} className="text-slate-400 hover:text-primary transition-colors">
                    <MoreVertical className="h-3 w-3" />
                </button>
                {showMenu && (
                    <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden py-1 z-50 animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={handleEditClick} 
                            className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-black transition-colors"
                        >
                            <Edit2 className="h-3 w-3" /> Editar
                        </button>
                        {studyMode !== 'preview' && !freeStudy && <>
                        <button 
                            onClick={() => { setShowMenu(false); handleBury(); }} 
                            className="w-full text-left px-4 py-2 text-[10px] font-bold text-blue-500 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-black transition-colors"
                        >
                            <CalendarClock className="h-3 w-3" /> Adiar (Bury)
                        </button>
                        <button 
                            onClick={() => { setShowMenu(false); handleSuspend(); }} 
                            className="w-full text-left px-4 py-2 text-[10px] font-bold text-red-500 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-black transition-colors"
                        >
                            <Ban className="h-3 w-3" /> Suspender
                        </button>
                        </>}
                        <button 
                            onClick={() => { setShowMenu(false); handleDeleteActiveCard(); }} 
                            className="w-full text-left px-4 py-2 text-[10px] font-bold text-rose-500 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-black transition-colors border-t border-slate-100 dark:border-zinc-800"
                        >
                            <Trash2 className="h-3 w-3" /> Excluir Card
                        </button>
                    </div>
                )}
            </div>
        </header>

        {actionError && !isEditing && <p role="alert" className="px-4 text-sm text-rose-600">{actionError}</p>}
        {/* CARD AREA */}
        <main className={`flex-1 min-h-0 relative flex items-center justify-center p-4 overflow-hidden transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-full max-w-lg h-full flex flex-col perspective-1000">
                <div className={`relative w-full h-full flip-card-inner preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* FRENTE */}
                    <div 
                        className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col overflow-hidden cursor-pointer"
                        onClick={() => setIsFlipped(true)}
                    >
                        {frontSource ? (
                            <div className="flex-[1.5] min-h-0 bg-slate-50 dark:bg-black/40 border-b border-slate-100 dark:border-zinc-800 relative select-none">
                                {isFrontVertical && (
                                    <div className="absolute top-2 left-2 right-2 bg-amber-500/95 dark:bg-amber-600/95 text-white py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg flex items-center justify-between z-30 animate-bounce pointer-events-none">
                                        <span className="flex items-center gap-1.5">
                                            <AlertCircle className="h-3 w-3 text-white shrink-0" /> Imagem longa: toque para visualizar em tela cheia
                                        </span>
                                        <Maximize2 className="h-3 w-3 shrink-0" />
                                    </div>
                                )}
                                <div className="absolute inset-0 p-3 flex items-center justify-center">
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFullscreenSrc(currentImageUrl || frontSource);
                                            setFullscreenOcclusions(currentCard.occlusions || []);
                                            setIsFullscreenBack(false);
                                            setIsFullscreenImageOpen(true);
                                        }}
                                        className="relative max-h-full max-w-full shadow-md rounded-xl overflow-hidden bg-black cursor-zoom-in group flex items-center justify-center border border-slate-200/50 dark:border-zinc-800"
                                        title="Clique para ver em tela cheia"
                                    >
                                        <div className="relative inline-flex max-w-full max-h-full overflow-hidden">
                                            <img 
                                                key={currentCard.id}
                                                src={currentImageUrl || frontSource}
                                                alt="Referência" 
                                                className="max-h-full max-w-full object-contain block"
                                                referrerPolicy="no-referrer"
                                                onLoad={(e) => {
                                                    const img = e.currentTarget;
                                                    if (img.naturalHeight > img.naturalWidth) {
                                                        setIsFrontVertical(true);
                                                    }
                                                }}
                                            />
                                            {hasOcclusions && currentCard.occlusions?.map(occ => (
                                                <div 
                                                    key={occ.id}
                                                    style={{ left: `${occ.x}%`, top: `${occ.y}%`, width: `${occ.width}%`, height: `${occ.height}%` }}
                                                    className="absolute bg-zinc-950 border border-zinc-700 z-10"
                                                />
                                            ))}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                                            <Maximize2 className="h-6 w-6 text-white animate-pulse" />
                                        </div>
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
                                <h2 
                                    className="text-base md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed px-2"
                                    dangerouslySetInnerHTML={{ __html: safeCardHtml(currentCard.front || 'Identifique a estrutura ou diagnóstico.') }}
                                />
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-50 dark:border-zinc-800 shrink-0">
                                <span className="text-[7px] font-black text-primary/50 uppercase tracking-[0.3em] animate-pulse">Toque para revelar</span>
                            </div>
                        </div>
                    </div>

                    {/* VERSO */}
                    <div 
                        className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-emerald-500 shadow-xl flex flex-col overflow-hidden cursor-pointer"
                        onClick={() => setIsFlipped(false)}
                    >
                        {backSource ? (
                            <div className="flex-[1.5] min-h-0 bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-900/40 relative select-none">
                                {isBackVertical && (
                                    <div className="absolute top-2 left-2 right-2 bg-amber-500/95 dark:bg-amber-600/95 text-white py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg flex items-center justify-between z-30 animate-bounce pointer-events-none">
                                        <span className="flex items-center gap-1.5">
                                            <AlertCircle className="h-3 w-3 text-white shrink-0" /> Imagem longa: toque para visualizar em tela cheia
                                        </span>
                                        <Maximize2 className="h-3 w-3 shrink-0" />
                                    </div>
                                )}
                                <div className="absolute inset-0 p-3 flex items-center justify-center">
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const src = currentBackImageUrl || backSource;
                                            setFullscreenSrc(src);
                                            setFullscreenOcclusions(backSource === currentCard.front_image_url ? currentCard.occlusions || [] : []);
                                            setIsFullscreenBack(true);
                                            setIsFullscreenImageOpen(true);
                                        }}
                                        className="relative max-h-full max-w-full shadow-md rounded-xl overflow-hidden bg-black border border-emerald-400/20 cursor-zoom-in group flex items-center justify-center"
                                        title="Clique para ver em tela cheia"
                                    >
                                        <img 
                                            key={`back-${currentCard.id}`}
                                            src={currentBackImageUrl || backSource}
                                            alt="Gabarito" 
                                            className="max-h-full max-w-full object-contain block opacity-90"
                                            referrerPolicy="no-referrer"
                                            onLoad={(e) => {
                                                const img = e.currentTarget;
                                                if (img.naturalHeight > img.naturalWidth) {
                                                    setIsBackVertical(true);
                                                }
                                            }}
                                        />
                                        {hasOcclusions && backSource === currentCard.front_image_url && currentCard.occlusions?.map(occ => (
                                            <div 
                                                key={occ.id}
                                                style={{ left: `${occ.x}%`, top: `${occ.y}%`, width: `${occ.width}%`, height: `${occ.height}%` }}
                                                className="absolute border border-emerald-400 bg-emerald-400/20 z-10 animate-pulse"
                                            />
                                        ))}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                                            <Maximize2 className="h-6 w-6 text-white animate-pulse" />
                                        </div>
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
                                <p 
                                    className="text-sm md:text-xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed break-words"
                                    dangerouslySetInnerHTML={{ __html: safeCardHtml(regularBack) }}
                                />
                                
                                {/* AI Explanation Context */}
                                {(savedAiText || aiExplanation || isExplaining) && (
                                    <div className="mt-8 pt-6 border-t border-emerald-100 dark:border-emerald-900/30">
                                        {isExplaining ? (
                                            <div className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-50 dark:bg-zinc-900 text-slate-500 rounded-xl animate-pulse">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="font-bold text-[10px] tracking-widest uppercase">Gerando explicação didática...</span>
                                            </div>
                                        ) : (
                                            <div className={`text-left bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 ${savedAiText ? 'opacity-90' : ''}`}>
                                                {!savedAiText && (
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Brain className="h-4 w-4 text-emerald-500" />
                                                            <span className="font-black text-[10px] tracking-widest uppercase text-emerald-600 dark:text-emerald-400">Contexto Aprofundado</span>
                                                        </div>
                                                        {aiExplanation && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSaveAIExplanation(); }}
                                                                disabled={savingExplanation}
                                                                className={`fade-in flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${savingExplanation ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400' : 'bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 shadow-sm hover:shadow active:scale-95'}`}
                                                            >
                                                                {savingExplanation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                                <span className="font-black text-[8px] tracking-widest uppercase">Salvar no Card</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                <div 
                                                    className={`${savedAiText ? 'text-[11px] md:text-xs' : 'text-xs md:text-sm'} text-slate-700 dark:text-slate-300 leading-relaxed ai-prose`}
                                                    dangerouslySetInnerHTML={{ __html: safeCardHtml(aiExplanation || savedAiText || '') }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(!savedAiText && !aiExplanation && !isExplaining) && (
                                    <div className="mt-8 pt-6 border-t border-emerald-100 dark:border-emerald-900/30">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleExplainAI(); }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all shadow-sm group"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            <span className="font-black text-[10px] tracking-widest uppercase">Aprofundar Contexto via IA</span>
                                        </button>
                                    </div>
                                )}

                                {/* GERAR QUESTÃO POR IA */}
                                <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-900/30">
                                    {isGeneratingQuestion ? (
                                        <div className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-50 dark:bg-zinc-900 text-slate-500 rounded-xl animate-pulse">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            <span className="font-bold text-[10px] tracking-widest uppercase">Criando Caso Clínico de Altíssimo Nível...</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleGenerateQuestionAI(); }}
                                            disabled={isGeneratingQuestion}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-xl transition-all shadow-sm group border border-violet-100/50 dark:border-violet-900/30"
                                        >
                                            <Brain className="h-4 w-4 group-hover:scale-110 transition-transform text-violet-500" />
                                            <span className="font-black text-[10px] tracking-widest uppercase">GERAR QUESTÃO POR IA</span>
                                        </button>
                                    )}
                                    {generatedQuestionSuccess && (
                                        <div className={`mt-3 p-3 text-left rounded-xl border text-[11px] leading-normal font-medium ${generatedQuestionSuccess.startsWith('Erro') || generatedQuestionSuccess.startsWith('Não') ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                            <p>{generatedQuestionSuccess}</p>
                                        </div>
                                    )}
                                </div>

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
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-2">
                             <button 
                                onClick={() => setIsFlipped(false)}
                                className="flex items-center gap-1.5 text-[8px] font-black uppercase text-slate-400 hover:text-primary transition-colors"
                             >
                                <Undo2 className="h-3 w-3" /> Desvirar Card
                             </button>
                             <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">{studyMode !== 'preview' && !freeStudy && 'Qual foi sua dificuldade?'}</span>
                        </div>
                        {studyMode === 'preview' ? (
                            <button className="w-full h-12 font-black text-xs" onClick={handleExit}>Voltar aos flashcards</button>
                        ) : freeStudy ? (
                        <div className="flex justify-center">
                            <button 
                                onClick={() => advance()}
                                disabled={isTransitioning}
                                className="w-full bg-primary text-white h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <>PRÓXIMO <ArrowLeft className="h-3 w-3 rotate-180" /></>}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-bottom-2">
                            {[
                                { id: 'again', label: 'Errei', bg: 'bg-rose-500' },
                                { id: 'hard', label: 'Duro', bg: 'bg-orange-500' },
                                { id: 'good', label: 'Bom', bg: 'bg-blue-600' },
                                { id: 'easy', label: 'Fácil', bg: 'bg-emerald-600' }
                            ].map((btn) => {
                                const sim = scheduleFlashcard(currentCard, btn.id as FlashcardRating, profile);
                                const timeStr = btn.id === 'again' ? `${retryDelayMinutes} min` : `${sim.interval} d`;
                                return (
                                <button 
                                    key={btn.id}
                                    onClick={() => handleRate(btn.id as FlashcardRating)}
                                    disabled={isTransitioning}
                                    className={`flex flex-col items-center justify-center ${btn.bg} text-white h-12 rounded-xl transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:active:scale-100`}
                                >
                                    <span className="text-[9px] font-black uppercase tracking-tighter leading-none">{btn.label}</span>
                                    <span className="text-[6px] font-bold opacity-70 uppercase flex items-center mt-1">
                                        <Clock className="h-1.5 w-1.5 mr-0.5" /> {timeStr}
                                    </span>
                                </button>
                                );
                            })}
                        </div>
                    )}
                    </div>
                )}
            </div>
        </footer>

        {/* MODAL FULLSCREEN LIGHTBOX */}
        {isFullscreenImageOpen && (
            <div 
                className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200 cursor-zoom-out"
                onClick={() => setIsFullscreenImageOpen(false)}
            >
                {/* Header controls inside modal */}
                <div className="absolute top-4 right-4 z-[10000] flex gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsFullscreenImageOpen(false); }}
                        className="p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider border border-zinc-800"
                    >
                        <X className="h-5 w-5" /> Fechar
                    </button>
                </div>

                {/* Subtitle / Tip at bottom */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-800/40 text-[9px] font-black text-slate-300 uppercase tracking-widest text-center shadow-lg pointer-events-none">
                    Toque em qualquer lugar fora para voltar ao card
                </div>

                {/* Main image view with alignment container */}
                <div className="relative max-h-[85vh] max-w-[95vw] shadow-2xl rounded-2xl bg-black flex items-center justify-center overflow-auto">
                    <div className="relative inline-block max-h-[85vh] max-w-[95vw] min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={fullscreenSrc} 
                            alt="Visualização Completa" 
                            className="max-h-[85vh] max-w-[95vw] object-contain block rounded-xl shadow-inner"
                        />
                        {fullscreenOcclusions?.map(occ => (
                            <div 
                                key={occ.id}
                                style={{ left: `${occ.x}%`, top: `${occ.y}%`, width: `${occ.width}%`, height: `${occ.height}%` }}
                                className={isFullscreenBack ? "absolute border border-emerald-400 bg-emerald-400/20 z-10" : "absolute bg-zinc-950 border border-zinc-700 z-10"}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )}

        <CloudImagePicker
          isOpen={isCloudPickerOpen}
          onClose={() => setIsCloudPickerOpen(false)}
          onSelect={(url) => {
            setEditBackFile(null);
            setEditBackSource(url);
            setEditBackPreview(url);
            setIsCloudPickerOpen(false);
          }}
        />
    </div>
  );
};
