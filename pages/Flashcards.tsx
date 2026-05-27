
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { 
  Plus, Search, Edit2, Trash2, Save, X, Loader2, 
  Layers, Image as ImageIcon, Calendar, ArrowLeft,
  Filter, ImagePlus, Play, Zap, FilterX, XCircle,
  Scan, Undo2, CheckCircle2, Settings, Brain, Clock, GraduationCap,
  ZoomIn, ZoomOut, Move, Shuffle, Folder, ChevronDown, ChevronRight, SortAsc, Download, Upload,
  Star, AlertCircle, Infinity, Sparkles, Tag
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { syncEngine } from '../services/syncEngine';
import { localDB } from '../services/localDB';
import { storageService } from '../services/storage';
import { Flashcard, Occlusion } from '../types';
import { SmartImage } from '../components/SmartImage';
import { generateFlashcardsFromPrompt } from '../services/ai';
import Apkg from 'anki-apkg-export';
import download from 'downloadjs';

const SRS_PRESETS = [
  {
    id: 'standard',
    name: 'Neuro Padrão (SM-2)',
    icon: Brain,
    modifier: 1.0,
    description: 'Equilíbrio ideal entre retenção e carga de estudo. Baseado no algoritmo SuperMemo 2 otimizado.',
    color: 'text-emerald-500',
    border: 'border-emerald-500'
  },
  {
    id: 'cramming',
    name: 'Modo Exame (Curto Prazo)',
    icon: Clock,
    modifier: 0.5,
    description: 'Aumenta drasticamente a frequência. Ideal para semanas de prova ou revisão de emergência.',
    color: 'text-orange-500',
    border: 'border-orange-500'
  },
  {
    id: 'deep',
    name: 'Retenção Profunda',
    icon: GraduationCap,
    modifier: 1.5,
    description: 'Intervalos mais longos. Focado em memória de longo prazo com menor carga diária.',
    color: 'text-blue-500',
    border: 'border-blue-500'
  }
];

export const Flashcards: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form' | 'editor' | 'settings' | 'generator' | 'review-config'>('list');
  const [srsProfile, setSrsProfile] = useState('standard');
  const [dailyLimit, setDailyLimit] = useState<number>(0);
  const [priorityTopics, setPriorityTopics] = useState<string[]>([]);
  const [priorityBanks, setPriorityBanks] = useState<string[]>([]);
  const [priorityActivatedAt, setPriorityActivatedAt] = useState<string | null>(null);

  // Review Config State
  const [reviewConfigBank, setReviewConfigBank] = useState<string>('Todos');
  const [reviewConfigCategory, setReviewConfigCategory] = useState<string>('Todas');
  const [reviewConfigLimit, setReviewConfigLimit] = useState<number>(20);
  const [reviewConfigType, setReviewConfigType] = useState<'due' | 'new' | 'learning' | 'free'>('due');

  // Generator State
  const [genText, setGenText] = useState('');
  const [genCount, setGenCount] = useState<number>(5);
  const [genCategory, setGenCategory] = useState('');
  const [genBankName, setGenBankName] = useState('Principal');
  const [generating, setGenerating] = useState(false);
  
  // Organization State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState('Todos');
  const [sortBy, setSortBy] = useState<'date' | 'alpha'>('date');
  const [openThemes, setOpenThemes] = useState<Set<string>>(new Set());
  
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [formData, setFormData] = useState({ front: '', back: '', category: '', bank_name: 'Principal' });
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const frontImageRef = useRef<HTMLInputElement>(null);
  const [occlusions, setOcclusions] = useState<Occlusion[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Occlusion | null>(null);
  const [selectedOcclusionId, setSelectedOcclusionId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const imageElementRef = useRef<HTMLImageElement>(null); 
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoEnableOcclusion, setAutoEnableOcclusion] = useState(false);
  const [keepImageAfterSave, setKeepImageAfterSave] = useState(false); // To allow multiple cards per image

  useEffect(() => { 
      loadCards(); 
      const savedProfile = localStorage.getItem('neuro_srs_profile') || 'standard';
      setSrsProfile(savedProfile);
      const savedLimit = parseInt(localStorage.getItem('neuro_daily_limit') || '0');
      setDailyLimit(savedLimit);
      const priorityRaw = localStorage.getItem('neuro_priority_config');
      if (priorityRaw) {
          const cfg = JSON.parse(priorityRaw);
          setPriorityTopics(cfg.topics || []);
          setPriorityBanks(cfg.banks || []);
          setPriorityActivatedAt(cfg.activatedAt || null);
      }

      // // ;
      // return () => // ;
  }, [user]);

  const loadCards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allCards = await localDB.getAll('flashcards');
      setCards(allCards.filter(c => c.user_id === user.id));
    } finally { setLoading(false); }
  };

  const handleExportAnki = async () => {
      try {
          setLoading(true);
          const apkg = new Apkg();
          for (const card of cards) {
              const tags = [];
              if (card.category) tags.push(card.category);
              if (card.bank_name) tags.push(card.bank_name);
              apkg.addCard(card.front, card.back, { tags: tags.map(t => t.replace(/\s+/g, '_')) });
          }
          const zip = await apkg.save();
          const blob = new Blob([zip], { type: 'application/octet-stream' });
          download(blob, `neuro_flashcards_${new Date().toISOString().split('T')[0]}.apkg`);
          alert('Exportação concluída com sucesso!');
      } catch (err: any) {
          console.error('Erro ao exportar:', err);
          alert('Houve um erro ao exportar para o formato Anki.');
      } finally {
          setLoading(false);
      }
  };

  const handleSaveSettings = (profileId: string) => {
      setSrsProfile(profileId);
      localStorage.setItem('neuro_srs_profile', profileId);
  };

  const handleDailyLimitChange = (val: number) => {
      setDailyLimit(val);
      localStorage.setItem('neuro_daily_limit', String(val));
  };

  const handleTogglePriorityTopic = (topic: string) => {
      const isChecked = priorityTopics.includes(topic);
      const nextTopics = isChecked ? priorityTopics.filter(t => t !== topic) : [...priorityTopics, topic];

      let newActivatedAt = priorityActivatedAt;
      const now = new Date().toISOString();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const isStillActive = newActivatedAt && (Date.now() - new Date(newActivatedAt).getTime()) < sevenDaysMs;

      if (nextTopics.length === 0 && priorityBanks.length === 0) {
          newActivatedAt = null;
      } else if (!isStillActive) {
          newActivatedAt = now;
      }

      setPriorityTopics(nextTopics);
      setPriorityActivatedAt(newActivatedAt);
      localStorage.setItem('neuro_priority_config', JSON.stringify({ topics: nextTopics, banks: priorityBanks, activatedAt: newActivatedAt }));
  };

  const handleTogglePriorityBank = (bank: string) => {
      const isChecked = priorityBanks.includes(bank);
      const nextBanks = isChecked ? priorityBanks.filter(b => b !== bank) : [...priorityBanks, bank];

      let newActivatedAt = priorityActivatedAt;
      const now = new Date().toISOString();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const isStillActive = newActivatedAt && (Date.now() - new Date(newActivatedAt).getTime()) < sevenDaysMs;

      if (priorityTopics.length === 0 && nextBanks.length === 0) {
          newActivatedAt = null;
      } else if (!isStillActive) {
          newActivatedAt = now;
      }

      setPriorityBanks(nextBanks);
      setPriorityActivatedAt(newActivatedAt);
      localStorage.setItem('neuro_priority_config', JSON.stringify({ topics: priorityTopics, banks: nextBanks, activatedAt: newActivatedAt }));
  };

  const allCategoriesWithCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      for (const c of cards) {
          const cat = c.category || 'Sem Categoria';
          counts[cat] = (counts[cat] || 0) + 1;
      }
      return Object.keys(counts).sort().map(cat => ({ cat, count: counts[cat] }));
  }, [cards]);

  const allBanksWithCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      for (const c of cards) {
          const bank = c.bank_name || 'Principal';
          counts[bank] = (counts[bank] || 0) + 1;
      }
      return Object.keys(counts).sort().map(bank => ({ bank, count: counts[bank] }));
  }, [cards]);

  const availableBanks = useMemo(() => {
      const banks = new Set(cards.map(c => c.bank_name || 'Principal').filter(Boolean));
      return Array.from(banks).sort();
  }, [cards]);

  const handleSave = async () => {
    if (!user || (!formData.front && occlusions.length === 0) || !formData.back) return;
    setLoading(true);
    try {
      let frontImageUrl = editingCard?.front_image_url || '';
      
      // Upload logic: if there is a new file, upload it. If reusing previous, keep URL.
      if (frontImage) {
          // If we have a file object (new selection), upload.
          // Note: If we are "keeping image", frontPreview might be a Blob URL that needs to be re-uploaded or handled if changing sessions.
          // For simplicity in this context, we upload every time a *File* object is present.
          // Optimization: check if frontPreview starts with http (already uploaded) vs blob: (local).
          if (!frontImageUrl || frontPreview.startsWith('blob:')) {
             frontImageUrl = await storageService.uploadImage(frontImage, 'flashcards');
          }
      } else if (frontPreview && frontPreview.startsWith('http')) {
          frontImageUrl = frontPreview; // Reusing existing URL from DB
      }

      const cardData: Flashcard = editingCard ? { ...editingCard, ...formData, front_image_url: frontImageUrl, occlusions } : {
        id: crypto.randomUUID(),
        user_id: user.id,
        ...formData,
        front_image_url: frontImageUrl,
        occlusions,
        bank_name: formData.bank_name || 'Principal',
        category: formData.category || 'Geral',
        status: 'new', 
        interval: 0, 
        ease_factor: 2.5, 
        repetitions: 0,
        next_review: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      await syncEngine.enqueue('flashcards', cardData);
      loadCards();
      
      if (keepImageAfterSave && frontImageUrl) {
          // Reset form but keep image and category context
          setEditingCard(null);
          setFormData({ ...formData, front: '', back: '' }); 
          // Do NOT clear frontPreview or frontImage here
          // We must update frontPreview to the URL if it was a file, so subsequent saves reuse it
          setFrontPreview(frontImageUrl);
          setFrontImage(null); // Clear file object so we don't re-upload, we use URL now
          setOcclusions([]); // Clear old occlusions for new card
          alert("Card salvo! A imagem foi mantida para criar outro.");
      } else {
          setMode('list');
          resetForm();
      }
    } catch (e: any) {
      alert("Erro ao salvar card: " + e.message);
    } finally { setLoading(false); }
  };

  const resetForm = () => {
      setEditingCard(null); 
      setFormData({front:'', back:'', category:'', bank_name: 'Principal'}); 
      setFrontPreview(''); 
      setFrontImage(null);
      setOcclusions([]);
      setSelectedOcclusionId(null);
      setAutoEnableOcclusion(false);
      setZoomLevel(1);
      setKeepImageAfterSave(false);
  };

  const handleGenerateFlashcards = async () => {
      if (!user || !genText.trim()) return;
      setGenerating(true);
      try {
          const generatedCards = await generateFlashcardsFromPrompt(genText, genCount);
          if (generatedCards && generatedCards.length > 0) {
              const newCards: Flashcard[] = generatedCards.map(c => ({
                  id: crypto.randomUUID(),
                  user_id: user.id,
                  front: c.front,
                  back: c.back,
                  category: genCategory || 'Sem Categoria',
                  bank_name: genBankName || 'Principal',
                  status: 'new',
                  interval: 0,
                  ease_factor: 2.5,
                  repetitions: 0,
                  next_review: new Date().toISOString(),
                  created_at: new Date().toISOString()
              }));
              
              await syncEngine.bulkEnqueue('flashcards', newCards);
              await loadCards();
              
              alert(`${newCards.length} flashcards gerados com sucesso!`);
              setMode('list');
              setGenText('');
          }
      } catch (e: any) {
          alert("Erro ao gerar flashcards: " + e.message);
      } finally {
          setGenerating(false);
      }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cardToDelete = cards.find(c => c.id === id);
    if (!cardToDelete || !confirm("Excluir este flashcard?")) return;
    
    setCards(prev => prev.filter(c => c.id !== id));
    try {
      await syncEngine.enqueue('flashcards', cardToDelete, 'delete');
    } catch (err) {
      loadCards();
    }
  };

  const onFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(file);
      setFrontPreview(URL.createObjectURL(file));
      setOcclusions([]);
      if (autoEnableOcclusion) {
          setMode('editor');
          setAutoEnableOcclusion(false);
      }
    }
  };

  const handleOcclusionClick = () => {
      if (!frontPreview) {
          setAutoEnableOcclusion(true);
          frontImageRef.current?.click();
      } else {
          setMode('editor');
      }
  };

  // Editor Logic (Zoom, Draw) preserved...
  const handleZoom = (delta: number) => setZoomLevel(prev => Math.max(1, Math.min(4, prev + delta)));
  
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      if (!imageElementRef.current) return { x: 0, y: 0 };
      const rect = imageElementRef.current.getBoundingClientRect();
      let clientX, clientY;
      if ((e as React.TouchEvent).touches && (e as React.TouchEvent).touches.length > 0) {
          clientX = (e as React.TouchEvent).touches[0].clientX;
          clientY = (e as React.TouchEvent).touches[0].clientY;
      } else if ((e as React.MouseEvent).clientX !== undefined) {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      } else { return { x: 0, y: 0 }; }
      return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 };
  };

  const handleStartDraw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!imageElementRef.current) return;
      if ((e as React.TouchEvent).touches && (e as React.TouchEvent).touches.length > 1) return;
      setSelectedOcclusionId(null);
      const { x, y } = getCoordinates(e);
      setStartPos({ x, y });
      setIsDrawing(true);
      setCurrentRect({ id: 'temp', x, y, width: 0, height: 0 });
  };

  const handleMoveDraw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !imageElementRef.current || !currentRect) return;
      const { x: currentX, y: currentY } = getCoordinates(e);
      const clampedX = Math.max(0, Math.min(100, currentX));
      const clampedY = Math.max(0, Math.min(100, currentY));
      const width = Math.abs(clampedX - startPos.x);
      const height = Math.abs(clampedY - startPos.y);
      const x = Math.min(clampedX, startPos.x);
      const y = Math.min(clampedY, startPos.y);
      setCurrentRect({ ...currentRect, x, y, width, height });
  };

  const handleEndDraw = () => {
      if (!isDrawing || !currentRect) return;
      setIsDrawing(false);
      if (currentRect.width > 2 && currentRect.height > 2) {
          const newId = crypto.randomUUID();
          setOcclusions([...occlusions, { ...currentRect, id: newId }]);
          setSelectedOcclusionId(newId);
      }
      setCurrentRect(null);
  };

  const removeOcclusion = (id: string) => {
      setOcclusions(occlusions.filter(o => o.id !== id));
      if (selectedOcclusionId === id) setSelectedOcclusionId(null);
  };

  const handleUndo = () => { if (occlusions.length > 0) setOcclusions(prev => prev.slice(0, -1)); };

  const toggleTheme = (theme: string) => {
      setOpenThemes(prev => {
          const next = new Set(prev);
          if (next.has(theme)) next.delete(theme); else next.add(theme);
          return next;
      });
  };

  // Grouping Logic
  const filteredCards = useMemo(() => {
      let filtered = cards.filter(c => {
          const matchesSearch = c.front.toLowerCase().includes(searchTerm.toLowerCase()) || c.back.toLowerCase().includes(searchTerm.toLowerCase()) || (c.category || '').toLowerCase().includes(searchTerm.toLowerCase());
          const matchesBank = filterBank === 'Todos' || (c.bank_name || 'Principal') === filterBank;
          return matchesSearch && matchesBank;
      });

      if (sortBy === 'alpha') {
          filtered.sort((a, b) => a.front.localeCompare(b.front));
      } else {
          filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
      }
      return filtered;
  }, [cards, searchTerm, filterBank, sortBy]);

  const groupedCards = useMemo(() => {
      const groups: Record<string, Flashcard[]> = {};
      filteredCards.forEach(c => {
          const cat = c.category || 'Sem Categoria';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(c);
      });
      return groups;
  }, [filteredCards]);

  const handleDeleteFilteredFlashcards = async () => {
    if (!filteredCards.length || !confirm(`Excluir permanentemente todos os ${filteredCards.length} flashcards filtrados?`)) return;
    
    setLoading(true);
    try {
      await syncEngine.bulkDelete('flashcards', filteredCards);
      loadCards();
    } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteCategory = async (category: string, items: Flashcard[], e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm(`Excluir permanentemente todos os ${items.length} flashcards da categoria "${category}"?`)) return;
      
      setLoading(true);
      try {
          await syncEngine.bulkDelete('flashcards', items);
          loadCards();
      } catch (err: any) {
          alert("Erro ao excluir: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleActivateCategory = async (category: string, items: Flashcard[], e: React.MouseEvent) => {
      e.stopPropagation();
      const inactiveItems = items.filter(c => c.status === 'inactive');
      if (!inactiveItems.length) return;
      
      setLoading(true);
      try {
          const activated = inactiveItems.map(c => ({ ...c, status: 'new' as const }));
          await syncEngine.bulkEnqueue('flashcards', activated);
          loadCards();
      } catch (err: any) {
          alert("Erro ao ativar: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleActivateCard = async (card: Flashcard, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
          await syncEngine.enqueue('flashcards', { ...card, status: 'new' });
          loadCards();
      } catch (err: any) {
          alert("Erro ao ativar: " + err.message);
      }
  };

  const dueCount = cards.filter(c => c.status !== 'inactive' && c.status !== 'new' && new Date(c.next_review).getTime() <= Date.now()).length;

  // EDITOR RENDER (Unchanged mostly)
  if (mode === 'editor') {
      return (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col animate-in fade-in duration-300 touch-none overflow-hidden">
              <div className="bg-white/90 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 p-4 flex items-center justify-between shadow-sm shrink-0 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setMode('form')} className="p-2 text-slate-500 hover:text-primary flex items-center gap-2"><ArrowLeft className="h-5 w-5" /><span className="text-xs font-bold uppercase hidden sm:inline">Voltar</span></button>
                      <div className="flex items-center gap-2">
                          <button onClick={() => handleZoom(-0.5)} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg"><ZoomOut className="h-4 w-4" /></button>
                          <span className="text-[10px] font-black w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                          <button onClick={() => handleZoom(0.5)} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg"><ZoomIn className="h-4 w-4" /></button>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button onClick={handleUndo} disabled={occlusions.length === 0} className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Undo2 className="h-4 w-4" /> <span className="hidden sm:inline">Desfazer</span></button>
                      {selectedOcclusionId && <button onClick={() => removeOcclusion(selectedOcclusionId)} className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Trash2 className="h-4 w-4" /></button>}
                      <button onClick={() => setMode('form')} className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg">CONFIRMAR</button>
                  </div>
              </div>
              <div ref={scrollContainerRef} className="flex-1 overflow-auto p-8 flex items-start justify-center bg-slate-100 dark:bg-zinc-950 cursor-crosshair">
                  <div className="relative inline-block select-none touch-none shadow-2xl bg-black" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.1s ease-out' }} onMouseDown={handleStartDraw} onMouseMove={handleMoveDraw} onMouseUp={handleEndDraw} onMouseLeave={handleEndDraw} onTouchStart={handleStartDraw} onTouchMove={handleMoveDraw} onTouchEnd={handleEndDraw}>
                      <img ref={imageElementRef} src={frontPreview} alt="Base" draggable={false} className="max-w-full max-h-[85vh] object-contain block pointer-events-none select-none" />
                      <div className="absolute inset-0 pointer-events-none">
                          {occlusions.map(occ => (
                              <div key={occ.id} style={{ left: `${occ.x}%`, top: `${occ.y}%`, width: `${occ.width}%`, height: `${occ.height}%`, pointerEvents: 'auto' }} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setSelectedOcclusionId(occ.id); }} className={`absolute border-2 cursor-pointer transition-all ${selectedOcclusionId === occ.id ? 'bg-yellow-400/80 border-white z-20' : 'bg-yellow-500/50 border-yellow-300 z-10'}`} />
                          ))}
                          {currentRect && <div style={{ left: `${currentRect.x}%`, top: `${currentRect.y}%`, width: `${currentRect.width}%`, height: `${currentRect.height}%` }} className="absolute bg-white/20 border-2 border-white border-dashed z-30" />}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <Layout title="Estudo Ativo">
      <div className="h-full flex flex-col space-y-4 overflow-hidden">
        {mode === 'list' ? (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 flex-wrap">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tighter">Deck Pessoal</h2>
                <div className="flex items-center gap-4 mt-1">
                    <p className="text-slate-500 text-[9px] font-black uppercase flex items-center"><Layers className="h-3 w-3 mr-1 text-primary" /> {cards.length} Cards</p>
                    <p className={`${dueCount > 0 ? 'text-orange-500' : 'text-emerald-500'} text-[9px] font-black uppercase flex items-center`}><Calendar className="h-3 w-3 mr-1" /> {dueCount} Vencidos</p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto flex-wrap">
                <button onClick={() => setMode('review-config')} className="flex-1 md:flex-none bg-primary text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Play className="h-4 w-4" /> REVISAR</button>
                <button onClick={() => navigate('/flashcards/study', { state: { studyMode: 'config', reviewConfig: { type: 'free', limit: 9999 } } })} className="flex-1 md:flex-none bg-white dark:bg-zinc-800 text-slate-700 dark:text-white border-2 border-slate-200 dark:border-zinc-700 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"><Shuffle className="h-4 w-4 text-emerald-500" /> ESTUDO LIVRE</button>
                <button onClick={() => { resetForm(); setMode('form'); }} className="flex-1 md:flex-none bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase shadow-lg flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> NOVO</button>
                <button onClick={() => setMode('generator')} className="flex-1 md:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Sparkles className="h-4 w-4" /> GERAR</button>
                <div className="flex gap-2 isolate">
                    <button onClick={() => navigate('/flashcards/import')} className="flex-1 md:flex-none bg-indigo-600 text-white px-5 py-2.5 rounded-l-xl font-black text-[9px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border-r border-indigo-700/50"><Download className="h-4 w-4" /> IMPORTAR</button>
                    <button onClick={handleExportAnki} className="flex-1 md:flex-none bg-indigo-600 text-white px-5 py-2.5 rounded-r-xl font-black text-[9px] uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Upload className="h-4 w-4" /> EXPORTAR .APKG</button>
                </div>
                <button onClick={() => setMode('settings')} className="bg-slate-50 dark:bg-zinc-900 text-slate-400 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800"><Settings className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Pesquisar conteúdo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-xs font-black focus:border-primary" />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {(searchTerm || filterBank !== 'Todos') && (
                        <button 
                            onClick={handleDeleteFilteredFlashcards}
                            className="bg-rose-50 dark:bg-rose-900/10 text-rose-600 border border-rose-200 dark:border-rose-900 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase flex items-center gap-2 hover:bg-rose-100 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Limpar Filtrados ({filteredCards.length})
                        </button>
                    )}
                    <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="flex-1 md:w-40 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-2.5 rounded-xl text-xs font-black appearance-none">
                        <option value="Todos">Banco (Todos)</option>
                        {availableBanks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <button onClick={() => setSortBy(prev => prev === 'date' ? 'alpha' : 'date')} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-2.5 rounded-xl text-slate-500 hover:text-primary transition-colors">
                        <SortAsc className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0 space-y-4">
                {loading ? (
                  <div className="p-20 flex flex-col items-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
                ) : Object.keys(groupedCards).length === 0 ? (
                  <div className="p-20 text-center border-4 border-dashed border-slate-100 dark:border-zinc-900 rounded-[2.5rem] opacity-30"><FilterX className="h-10 w-10 mx-auto mb-3" /><p className="font-black text-[10px] uppercase">Nenhum Card Encontrado</p></div>
                ) : (
                  Object.entries(groupedCards).map(([category, items]: [string, Flashcard[]]) => (
                      <div key={category} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                          <div 
                              className="p-4 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-zinc-800"
                              onClick={() => toggleTheme(category)}
                          >
                              <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">{category}</span>
                                  <span className="text-[8px] font-bold bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-slate-500">{items.length}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                  {items.some(c => c.status === 'inactive') && (
                                      <button 
                                          onClick={(e) => handleActivateCategory(category, items, e)}
                                          className="p-1 px-3 text-[9px] font-black uppercase tracking-widest bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md hover:opacity-80 mx-2 flex items-center gap-1"
                                          title="Ativar Cards Inativos para Revisão"
                                      >
                                          <Play className="h-3 w-3" /> ATIVAR {items.filter(c => c.status === 'inactive').length} INATIVOS
                                      </button>
                                  )}
                                  <button 
                                      onClick={(e) => handleDeleteCategory(category, items, e)}
                                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                      title="Excluir Categoria"
                                  >
                                      <Trash2 className="h-4 w-4" />
                                  </button>
                                  {openThemes.has(category) ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                              </div>
                          </div>
                          
                          {openThemes.has(category) && (
                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 dark:bg-black/20">
                                  {items.map(card => (
                                      <div key={card.id} onClick={() => { setEditingCard(card); setFormData({front:card.front, back:card.back, category:card.category || '', bank_name: card.bank_name || 'Principal'}); setFrontPreview(card.front_image_url || ''); setOcclusions(card.occlusions || []); setMode('form'); }} className={`bg-white dark:bg-zinc-900 border ${card.status === 'inactive' ? 'border-dashed border-slate-300 dark:border-zinc-700 opacity-75' : 'border-slate-200 dark:border-zinc-800'} rounded-xl p-4 shadow-sm hover:border-primary transition-all cursor-pointer group flex flex-col h-full`}>
                                          {card.front_image_url && (
                                              <div className="mb-3 h-24 bg-slate-100 dark:bg-black rounded-lg flex items-center justify-center overflow-hidden relative">
                                                  <SmartImage url={card.front_image_url} alt="F" className="h-full object-contain" />
                                              </div>
                                          )}
                                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mb-2 flex-1">{card.front || 'Image Occlusion'}</p>
                                          <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-zinc-800">
                                              {card.status === 'inactive' ? (
                                                  <button onClick={(e) => handleActivateCard(card, e)} className="text-[7px] font-black bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-1 rounded-sm flex items-center gap-1 uppercase tracking-widest hover:opacity-80">
                                                      <Play className="h-2 w-2" /> Ativar
                                                  </button>
                                              ) : (
                                                  <span className="text-[7px] font-black uppercase text-slate-400">{new Date(card.next_review).toLocaleDateString()}</span>
                                              )}
                                              <button onClick={(e) => handleDelete(card.id, e)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  ))
                )}
            </div>
          </>
        ) : mode === 'generator' ? (
          <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2.5rem] p-6 md:p-10 shadow-xl overflow-y-auto custom-scrollbar min-h-0">
            <button onClick={() => setMode('list')} className="flex items-center text-slate-500 hover:text-primary text-[10px] font-black uppercase mb-8"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</button>
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter mb-2 flex items-center gap-2"><Sparkles className="h-6 w-6 text-emerald-500" /> Gerar Flashcards com IA</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Descreva o tema, assunto ou instruções específicas para a Inteligência Artificial criar seus flashcards do zero.</p>
              </div>

              <div>
                  <label className="text-[9px] text-slate-500 uppercase font-black block mb-2">Tema / Instruções</label>
                  <textarea 
                      value={genText} 
                      onChange={e => setGenText(e.target.value)} 
                      rows={6} 
                      className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-xs tracking-wide" 
                      placeholder="Ex: Crie flashcards sobre a anatomia do sistema nervoso central cruzando com as principais síndromes neurovasculares..." 
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="text-[9px] text-slate-500 uppercase font-black block mb-2">Especialidade (Opcional)</label>
                      <input 
                          value={genCategory} 
                          onChange={e => setGenCategory(e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-xs font-black" 
                          placeholder="Ex: Neurologia"
                      />
                  </div>
                  <div>
                      <label className="text-[9px] text-slate-500 uppercase font-black block mb-2">Nome do Deck</label>
                      <input 
                          value={genBankName} 
                          onChange={e => setGenBankName(e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-xs font-black" 
                          placeholder="Principal" 
                      />
                  </div>
              </div>

              <div>
                  <label className="text-[9px] text-slate-500 uppercase font-black flex items-center justify-between mb-4">
                      <span>Quantidade de Flashcards</span>
                      <span className="text-primary text-sm bg-primary/10 px-3 py-1 rounded-lg">{genCount} cards</span>
                  </label>
                  <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={genCount}
                      onChange={e => setGenCount(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                      <span>1</span>
                      <span>30</span>
                  </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-zinc-900 flex justify-end gap-3">
                  <button onClick={() => setMode('list')} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase">Cancelar</button>
                  <button 
                      onClick={handleGenerateFlashcards} 
                      disabled={generating || !genText.trim()} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                      {generating ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />} {generating ? "GERANDO..." : "GERAR FLASHCARDS"}
                  </button>
              </div>
            </div>
          </div>
        ) : mode === 'form' ? (
          <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2.5rem] p-6 md:p-10 shadow-xl overflow-y-auto custom-scrollbar min-h-0">
            <button onClick={() => setMode('list')} className="flex items-center text-slate-500 hover:text-primary text-[10px] font-black uppercase mb-8"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div><label className="text-[9px] text-slate-500 uppercase font-black block mb-2">Frente</label><textarea disabled={occlusions.length > 0} value={formData.front} onChange={e => setFormData({...formData, front: e.target.value})} rows={4} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold" placeholder={occlusions.length > 0 ? "Oclusão Ativa" : "Pergunta..."} /></div>
                <div><label className="text-[9px] text-slate-500 uppercase font-black block mb-2">Verso</label><textarea value={formData.back} onChange={e => setFormData({...formData, back: e.target.value})} rows={4} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-xs font-bold" placeholder="Explicação..." /></div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase font-black block mb-2">Especialidade</label>
                        <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-xs font-black" />
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase font-black block mb-2">Nome do Deck</label>
                        <input value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-xs font-black" placeholder="Principal" />
                    </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center"><label className="text-[9px] text-slate-500 uppercase font-black">Referência Visual</label>{frontPreview && <button onClick={handleOcclusionClick} className="bg-primary text-white px-3 py-1.5 rounded-lg text-[8px] font-black flex items-center gap-1 uppercase"><Scan className="h-3 w-3" /> OCLUSÕES</button>}</div>
                {frontPreview ? (
                  <div className="relative rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 bg-black flex items-center justify-center p-2 min-h-[200px]">
                      <div className="relative inline-block h-full"><img src={frontPreview} className="max-h-[300px] object-contain" />{occlusions.map(occ => (<div key={occ.id} style={{ left: `${occ.x}%`, top: `${occ.y}%`, width: `${occ.width}%`, height: `${occ.height}%` }} className="absolute bg-yellow-500/50 border border-yellow-300" />))}</div>
                      <button onClick={() => { setFrontImage(null); setFrontPreview(''); setOcclusions([]); }} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg shadow-lg"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div onClick={() => frontImageRef.current?.click()} className="bg-slate-50 dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-zinc-800 p-8 rounded-[1.5rem] flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary transition-all"><input type="file" ref={frontImageRef} className="hidden" accept="image/*" onChange={onFrontImageChange} /><ImagePlus className="h-8 w-8 text-slate-300 mb-2" /><p className="text-[9px] font-black uppercase text-slate-400">Anexar Mídia</p></div>
                )}
                
                {/* Keep Image Toggle */}
                {frontPreview && (
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900 rounded-xl">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={keepImageAfterSave} onChange={e => setKeepImageAfterSave(e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                        <span className="text-[9px] font-black uppercase text-indigo-700 dark:text-indigo-300">Criar múltiplos cards desta imagem</span>
                    </div>
                )}
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-900 flex justify-end gap-3"><button onClick={() => setMode('list')} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase">Cancelar</button><button onClick={handleSave} disabled={loading} className="bg-primary text-white px-10 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2">{loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} SALVAR CARD</button></div>
          </div>
        ) : mode === 'settings' ? (
          <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2.5rem] p-6 md:p-10 shadow-xl overflow-y-auto custom-scrollbar min-h-0">
              {/* Settings View */}
              <button onClick={() => setMode('list')} className="flex items-center text-slate-500 hover:text-primary text-[10px] font-black uppercase mb-10"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</button>

              {/* ─── Algoritmo ─── */}
              <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tighter mb-4">Algoritmo de Revisão</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  {SRS_PRESETS.map((preset) => (
                      <div key={preset.id} onClick={() => handleSaveSettings(preset.id)} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${srsProfile === preset.id ? `bg-slate-50 dark:bg-zinc-900 ${preset.border}` : 'bg-white dark:bg-zinc-950 border-slate-100 dark:border-zinc-900'}`}>
                          <preset.icon className={`h-8 w-8 ${preset.color} mb-4`} />
                          <h3 className="font-black text-sm mb-2">{preset.name}</h3>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{preset.description}</p>
                      </div>
                  ))}
              </div>

              {/* ─── Limite Diário ─── */}
              <div className="border-t border-slate-100 dark:border-zinc-900 pt-8 mb-10">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tighter mb-1">Limite Diário de Revisões</h2>
                  <p className="text-[10px] text-slate-400 mb-6">Cards que excederem o limite serão redistribuídos nos próximos dias sem desviar do algoritmo.</p>
                  <div className="flex items-center gap-4">
                      <input
                          type="range"
                          min="0"
                          max="200"
                          step="5"
                          value={dailyLimit}
                          onChange={e => handleDailyLimitChange(Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="w-20 shrink-0 bg-primary/10 text-primary px-3 py-2 rounded-xl font-black text-base text-center flex items-center justify-center gap-1">
                          {dailyLimit === 0 ? <Infinity className="h-5 w-5" /> : dailyLimit}
                      </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2">{dailyLimit === 0 ? 'Sem limite — todos os cards vencidos serão apresentados.' : `Máximo de ${dailyLimit} cards por sessão diária.`}</p>
              </div>

              {/* ─── Gerenciamento de Dados ─── */}
              <div className="border-t border-slate-100 dark:border-zinc-900 pt-8 mb-10">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tighter mb-1">Gerenciamento de Dados</h2>
                  <p className="text-[10px] text-slate-400 mb-6">Controle seu progresso e sincronização com o banco de dados principal.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Zero Progress */}
                      <div className="p-6 bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-[2rem]">
                          <div className="flex items-center gap-3 mb-3">
                              <Undo2 className="h-5 w-5 text-rose-500" />
                              <h3 className="font-black text-[11px] uppercase tracking-widest text-rose-700 dark:text-rose-400">Zerar Revisões</h3>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">Reinicia o algoritmo de todos os seus cards. Eles voltarão ao status "Novo".</p>
                          <button 
                            onClick={async () => {
                                if (!confirm("Isso apagará TODO o seu progresso de estudo (SRS) de todos os cards. Continuar?")) return;
                                setLoading(true);
                                try {
                                    const resetCards = cards.map(c => ({
                                        ...c,
                                        status: 'new' as const,
                                        interval: 0,
                                        ease_factor: 2.5,
                                        repetitions: 0,
                                        next_review: new Date().toISOString(),
                                        last_review: new Date().toISOString()
                                    }));
                                    await syncEngine.bulkEnqueue('flashcards', resetCards);
                                    await loadCards();
                                    alert("Progresso zerado com sucesso!");
                                } finally { setLoading(false); }
                            }}
                            className="w-full bg-rose-500 text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                          >
                              ZERAR TUDO
                          </button>
                      </div>

                      {/* Restore from DB */}
                      <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-[2rem]">
                          <div className="flex items-center gap-3 mb-3">
                              <Download className="h-5 w-5 text-indigo-500" />
                              <h3 className="font-black text-[11px] uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Restaurar Decks</h3>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">Adiciona ou restaura decks baseados nos temas oficiais disponíveis no database.</p>
                          <button 
                            onClick={() => navigate('/flashcards/import')}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                          >
                              ACESSAR DATABASE
                          </button>
                      </div>
                  </div>
              </div>

              {/* ─── Prioridade ─── */}
              <div className="border-t border-slate-100 dark:border-zinc-900 pt-8">
                  <div className="flex items-start justify-between mb-1 gap-4">
                      <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tighter">Prioridade de Banco / Tema</h2>
                      {(priorityTopics.length > 0 || priorityBanks.length > 0) && priorityActivatedAt && (() => {
                          const daysLeft = Math.max(0, 7 - Math.floor((Date.now() - new Date(priorityActivatedAt).getTime()) / (1000 * 60 * 60 * 24)));
                          return daysLeft > 0
                              ? <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full shrink-0">{daysLeft}d restantes</span>
                              : <span className="text-[9px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-400 px-2.5 py-1 rounded-full shrink-0">Expirado</span>;
                      })()}
                  </div>
                  <p className="text-[10px] text-slate-400 mb-6">Bancos ou Temas marcados terão prioridade absoluta por 7 dias — inclusive antecipando cards não vencidos. Após esgotados, a ordem normal do algoritmo é retomada.</p>

                  {/* BANCOS */}
                  {allBanksWithCounts.length > 0 && (
                      <div className="mb-6">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers className="h-3 w-3" /> Bancos de Questões</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {allBanksWithCounts.map(({ bank, count }) => {
                                  const checked = priorityBanks.includes(bank);
                                  return (
                                      <div key={bank} onClick={() => handleTogglePriorityBank(bank)} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all select-none ${checked ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700'}`}>
                                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-amber-400 border-amber-400' : 'border-slate-300 dark:border-zinc-600'}`}>
                                              {checked && <Star className="h-3 w-3 text-white fill-white" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <p className="text-xs font-black text-slate-800 dark:text-white truncate">{bank}</p>
                                              <p className="text-[8px] font-bold text-slate-400">{count} card{count !== 1 ? 's' : ''}</p>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}

                  {/* TEMAS / CATEGORIAS */}
                  {(() => {
                      if (allCategoriesWithCounts.length === 0) return null;
                      return (
                          <div>
                              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Tag className="h-3 w-3" /> Temas</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {allCategoriesWithCounts.map(({ cat, count }) => {
                                      const checked = priorityTopics.includes(cat);
                                      return (
                                          <div key={cat} onClick={() => handleTogglePriorityTopic(cat)} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all select-none ${checked ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700'}`}>
                                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-amber-400 border-amber-400' : 'border-slate-300 dark:border-zinc-600'}`}>
                                                  {checked && <Star className="h-3 w-3 text-white fill-white" />}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-black text-slate-800 dark:text-white truncate">{cat}</p>
                                                  <p className="text-[8px] font-bold text-slate-400">{count} card{count !== 1 ? 's' : ''}</p>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      );
                  })()}

                  {(priorityTopics.length > 0 || priorityBanks.length > 0) && (
                      <button
                          onClick={() => {
                              setPriorityTopics([]);
                              setPriorityBanks([]);
                              setPriorityActivatedAt(null);
                              localStorage.removeItem('neuro_priority_config');
                          }}
                          className="mt-6 text-[9px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                          <X className="h-3 w-3" /> Remover todas as prioridades
                      </button>
                  )}
              </div>
          </div>
        ) : mode === 'review-config' ? (
          <div className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2.5rem] p-6 md:p-10 shadow-xl overflow-y-auto custom-scrollbar min-h-0">
              <button onClick={() => setMode('list')} className="flex items-center text-slate-500 hover:text-primary text-[10px] font-black uppercase mb-10"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</button>

              <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter mb-8 flex items-center gap-2"><Play className="h-6 w-6 text-primary" /> Configurar Revisão</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black block mb-2">Bloco / Banco</label>
                      <select value={reviewConfigBank} onChange={e => { setReviewConfigBank(e.target.value); setReviewConfigCategory('Todas'); }} className="w-full bg-slate-50 dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 p-4 rounded-2xl text-xs font-black appearance-none focus:border-primary transition-colors">
                          <option value="Todos">Todos os Bancos</option>
                          {availableBanks.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black block mb-2">Tema / Categoria</label>
                      <select value={reviewConfigCategory} onChange={e => setReviewConfigCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 p-4 rounded-2xl text-xs font-black appearance-none focus:border-primary transition-colors">
                          <option value="Todas">Todas as Categorias</option>
                          {Array.from(new Set(cards.filter(c => reviewConfigBank === 'Todos' || c.bank_name === reviewConfigBank).map(c => c.category || 'Sem Categoria'))).sort().map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
              </div>

              <div className="mb-8">
                 <label className="text-[10px] text-slate-500 uppercase font-black block mb-4">Módulo de Estudo</label>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <button onClick={() => setReviewConfigType('due')} className={`p-4 rounded-2xl border-2 text-left transition-all ${reviewConfigType === 'due' ? 'border-primary bg-primary/10' : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950'}`}>
                         <Calendar className={`h-5 w-5 mb-2 ${reviewConfigType === 'due' ? 'text-primary' : 'text-slate-400'}`} />
                         <p className="font-black text-xs text-slate-900 dark:text-white">A Revisar</p>
                         <p className="text-[9px] text-slate-500 mt-1">Algoritmo Spaced Repetition</p>
                     </button>
                     <button onClick={() => setReviewConfigType('new')} className={`p-4 rounded-2xl border-2 text-left transition-all ${reviewConfigType === 'new' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950'}`}>
                         <Sparkles className={`h-5 w-5 mb-2 ${reviewConfigType === 'new' ? 'text-indigo-500' : 'text-slate-400'}`} />
                         <p className="font-black text-xs text-slate-900 dark:text-white">Cards Novos</p>
                         <p className="text-[9px] text-slate-500 mt-1">Apenas cards não vistos</p>
                     </button>
                     <button onClick={() => setReviewConfigType('learning')} className={`p-4 rounded-2xl border-2 text-left transition-all ${reviewConfigType === 'learning' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950'}`}>
                         <Undo2 className={`h-5 w-5 mb-2 ${reviewConfigType === 'learning' ? 'text-rose-500' : 'text-slate-400'}`} />
                         <p className="font-black text-xs text-slate-900 dark:text-white">Erros (Lapsed)</p>
                         <p className="text-[9px] text-slate-500 mt-1">Cards recém errados</p>
                     </button>
                     <button onClick={() => setReviewConfigType('free')} className={`p-4 rounded-2xl border-2 text-left transition-all ${reviewConfigType === 'free' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950'}`}>
                         <Shuffle className={`h-5 w-5 mb-2 ${reviewConfigType === 'free' ? 'text-emerald-500' : 'text-slate-400'}`} />
                         <p className="font-black text-xs text-slate-900 dark:text-white">Estudo Livre</p>
                         <p className="text-[9px] text-slate-500 mt-1">Ordem aleatória geral</p>
                     </button>
                 </div>
              </div>

              <div className="mb-10">
                  <label className="text-[10px] text-slate-500 uppercase font-black flex items-center justify-between mb-4">
                      <span>Quantidade Máxima</span>
                      <span className="text-primary text-sm bg-primary/10 px-3 py-1 rounded-lg">{reviewConfigLimit === 101 ? 'Ilimitado' : reviewConfigLimit}</span>
                  </label>
                  <input
                      type="range" min="10" max="101" step="10"
                      value={reviewConfigLimit} onChange={e => setReviewConfigLimit(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
              </div>

              <button onClick={() => navigate('/flashcards/study', { state: { studyMode: 'config', reviewConfig: { bank: reviewConfigBank, category: reviewConfigCategory, limit: reviewConfigLimit === 101 ? 9999 : reviewConfigLimit, type: reviewConfigType } } })} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all text-center flex items-center justify-center gap-2">
                 <Play className="h-5 w-5 fill-current" /> INICIAR SESSÃO
              </button>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};
