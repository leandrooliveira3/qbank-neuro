
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Layout } from '../components/Layout';
import { 
  Plus, Zap, Play, RotateCw, Sparkles, Bot, Send,
  Users, Trophy, ArrowUpRight, Crown, Star, Check, X,
  Medal, UserPlus, Calendar as CalendarIcon, Flame,
  Layers, MonitorPlay, Clock, AlertCircle, CheckCircle2, ChevronRight,
  Trash2, Brain, FileText
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { localDB } from '../services/localDB';
import { useAuthStore } from '../store/useAuthStore';
import { DashboardStats } from '../types';
import { supabase } from '../services/supabase';
import { xpService, XP_VALUES, MEDICAL_RANKS } from '../services/xpService';
import { TOOLS_CATEGORIES } from '../constants';

interface FriendActivity {
    id: string;
    full_name: string;
    avatar_url: string;
    xp: number; 
    rank: string; 
    level: number; 
}

interface PendingRequest {
    id: string;
    requester: {
        id: string;
        full_name: string;
        avatar_url: string;
        specialty: string;
    }
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateProfile } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalQuestions: 0,
    totalCategories: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0
  });
  const [activeSession, setActiveSession] = useState<any>(null);
  const [dueFlashcardsCount, setDueFlashcardsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quickQuestion, setQuickQuestion] = useState('');
  
  // Community State
  const [communityPulse, setCommunityPulse] = useState<FriendActivity[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [communityTab, setCommunityTab] = useState<'ranking' | 'requests'>('ranking');
  
  const bonusProcessedRef = useRef(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const currentDateString = useMemo(() => {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
      const date = new Date().toLocaleDateString('pt-BR', options);
      return date.charAt(0).toUpperCase() + date.slice(1);
  }, []);

  const levelProgress = useMemo(() => {
      if (!user) return 0;
      const currentLevel = user.level || 1;
      const currentRankData = MEDICAL_RANKS.find(r => r.level === currentLevel) || MEDICAL_RANKS[0];
      const nextRankData = MEDICAL_RANKS.find(r => r.level === currentLevel + 1);
      
      if (!nextRankData) return 100;

      const currentXP = user.xp || 0;
      const xpInLevel = currentXP - currentRankData.minXp;
      const xpNeeded = nextRankData.minXp - currentRankData.minXp;
      
      const progress = (xpInLevel / xpNeeded) * 100;
      return Math.min(100, Math.max(0, progress));
  }, [user]);

  useEffect(() => {
      const state = location.state as { xpEarned?: number; source?: string } | null;
      if (state && state.xpEarned && state.xpEarned > 0) {
          setTimeout(() => {
              xpService.addXP(state.xpEarned!, `Sessão Finalizada (${state.source || 'Estudo'})`, state.source || 'Geral');
              window.history.replaceState({}, document.title);
          }, 500);
      }
  }, [location]);

  // Função auxiliar para garantir formato de data consistente (YYYY-MM-DD) local
  // Isso garante que a comparação seja feita por DATA DO CALENDÁRIO, não 24h corridas.
  const getLocalDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchLocalData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [qData, sessions, flashcards] = await Promise.all([
            localDB.getAll('questions'),
            localDB.getAll('active_practice_sessions'),
            localDB.getAll('flashcards')
        ]);

        const userQ = qData.filter(q => q.created_by === user.id);
        setStats({
            totalQuestions: userQ.length,
            totalCategories: new Set(userQ.map(q => q.category)).size,
            easyCount: userQ.filter(q => q.difficulty === 'Fácil').length,
            mediumCount: userQ.filter(q => q.difficulty === 'Médio').length,
            hardCount: userQ.filter(q => q.difficulty === 'Difícil').length
        });

        const mySession = sessions.find(s => s.user_id === user.id);
        if (mySession && mySession.questions_data && mySession.current_index < mySession.questions_data.length) {
            setActiveSession(mySession);
        } else {
            setActiveSession(null);
            if (mySession) await localDB.delete('active_practice_sessions', user.id);
        }

        const dueCount = flashcards.filter(c => c.user_id === user.id && c.status !== 'inactive' && new Date(c.next_review) <= new Date()).length;
        setDueFlashcardsCount(dueCount);

        // --- SISTEMA DE OFENSIVA (STREAK) ---
        // A lógica agora roda apenas se o user estiver carregado, garantindo sincronia.
        if (!bonusProcessedRef.current) {
            const today = new Date();
            const todayStr = getLocalDateString(today);
            const lastBonusDateStr = user.last_daily_bonus || '';
            
            // Só processa se a data de hoje for diferente da última data de bônus registrada
            if (lastBonusDateStr !== todayStr) {
                bonusProcessedRef.current = true;
                
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = getLocalDateString(yesterday);

                let newStreak = 1;
                
                // Se o último bônus foi ONTEM (calendar day), incrementa. 
                // Se foi antes de ontem, reseta para 1.
                if (lastBonusDateStr === yesterdayStr) {
                    newStreak = (user.streak_count || 0) + 1;
                } else {
                    // Quebra de ofensiva (ou primeiro dia)
                    newStreak = 1;
                }

                let awardedMedal: string | null = null;
                // XP Base Diário + (Streak * 2)
                let bonusXP = XP_VALUES.STREAK_BONUS_DAILY + (newStreak * 2);
                let bonusLabel = `Bônus Diário (Dia ${newStreak})`;

                // Marcos Importantes (Milestones)
                if (newStreak === 3) {
                    bonusXP += XP_VALUES.STREAK_3_BONUS;
                    awardedMedal = 'streak_3';
                    bonusLabel = 'Conquista: Disciplina Iniciante!';
                } else if (newStreak === 7) {
                    bonusXP += XP_VALUES.STREAK_7_BONUS;
                    awardedMedal = 'streak_7';
                    bonusLabel = 'Conquista: Semana Perfeita!';
                } else if (newStreak === 30) {
                    bonusXP += XP_VALUES.STREAK_30_BONUS;
                    awardedMedal = 'streak_30';
                    bonusLabel = 'Conquista: Mestre do Hábito (30 Dias)!';
                } else if (newStreak === 100) {
                    bonusXP += XP_VALUES.STREAK_100_BONUS;
                    awardedMedal = 'streak_100';
                    bonusLabel = 'Conquista: Centurião Clínico (100 Dias)!';
                } else if (newStreak === 365) {
                    bonusXP += XP_VALUES.STREAK_365_BONUS;
                    awardedMedal = 'streak_365';
                    bonusLabel = 'Conquista: Lenda Imortal (1 Ano)!';
                }

                const currentMedals = user.achievements || [];
                const updatedMedals = awardedMedal && !currentMedals.includes(awardedMedal) 
                    ? [...currentMedals, awardedMedal] 
                    : currentMedals;

                // Aplica atualizações e propaga para o backend imediatamente
                xpService.addXP(bonusXP, bonusLabel, 'Geral');
                updateProfile({ 
                    last_daily_bonus: todayStr,
                    streak_count: newStreak,
                    achievements: updatedMedals
                });
            }
        }

        setLoading(false); 
        fetchCommunityData(user.id);

      } catch (error) {
        console.error('Dashboard error:', error);
        setLoading(false);
      }
    };
    fetchLocalData();
  }, [user]);

  const fetchCommunityData = async (userId: string) => {
      if (!navigator.onLine) return;
      try {
          const { data: reqs } = await supabase.from('friendships').select('id, requester:profiles!requester_id(id, full_name, avatar_url, specialty)').eq('addressee_id', userId).eq('status', 'pending');
          if (reqs) setPendingRequests(reqs as any);
          if (reqs && reqs.length > 0) setCommunityTab('requests');

          const { data: f1 } = await supabase.from('friendships').select('addressee_id').eq('requester_id', userId).eq('status', 'accepted');
          const { data: f2 } = await supabase.from('friendships').select('requester_id').eq('addressee_id', userId).eq('status', 'accepted');
          
          const friendIds = [...(f1?.map(f => f.addressee_id) || []), ...(f2?.map(f => f.requester_id) || [])];
          friendIds.push(userId);
          
          if (friendIds.length === 0) return;

          const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url, xp, rank, level').in('id', friendIds).is('deleted_at', null);
          if (!profiles) return;

          const pulseData: FriendActivity[] = profiles.map(p => ({ id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, xp: p.xp || 0, rank: p.rank || 'Estudante', level: p.level || 1 }));
          pulseData.sort((a, b) => b.xp - a.xp);
          setCommunityPulse(pulseData.slice(0, 10));
      } catch (e) { console.warn("Community fetch failed", e); }
  };

  const handleAcceptRequest = async (id: string, accept: boolean) => {
      if (accept) { await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id); alert("Amizade aceita!"); } else { await supabase.from('friendships').delete().eq('id', id); }
      setPendingRequests(prev => prev.filter(r => r.id !== id));
      if (user) fetchCommunityData(user.id);
  };

  const handleDeleteSession = async () => {
      if (confirm('Deseja descartar a sessão atual?')) {
          if (user) await localDB.delete('active_practice_sessions', user.id);
          setActiveSession(null);
      }
  };

  const handleQuickAsk = () => { if (!quickQuestion.trim()) return; navigate('/chat', { state: { initialMessage: quickQuestion } }); };

  return (
    <Layout title="Portal Clínico">
      <div className="flex flex-col space-y-6 pb-10 w-full h-full">
        {activeSession && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-[1.5rem] p-5 flex items-center justify-between shadow-xl shadow-orange-500/20 border border-white/10 shrink-0 animate-in slide-in-from-top-4 relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 opacity-20"><Zap className="w-32 h-32 text-white" /></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                        <RotateCw className="h-6 w-6 text-white animate-spin-slow" />
                    </div>
                    <div>
                        <h3 className="text-white text-base font-black tracking-tight leading-none uppercase">Sessão em Andamento</h3>
                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1">Item {(activeSession.current_index || 0) + 1} aguardando.</p>
                    </div>
                </div>
                <div className="flex gap-2 relative z-10">
                    <button onClick={handleDeleteSession} className="bg-white/20 text-white p-3 rounded-xl hover:bg-red-500/50 transition-all"><Trash2 className="h-4 w-4" /></button>
                    <button onClick={() => navigate('/practice/session', { state: { resume: true } })} className="bg-white text-orange-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg active:scale-95">RETOMAR</button>
                </div>
            </div>
        )}
        
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group shrink-0">
            {/* ... Header, Stats, Menu ... */}
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1 opacity-60">
                            <CalendarIcon className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{currentDateString}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tighter mb-2">
                            {greeting}, <span className="text-primary">{user?.full_name?.split(' ')[0] || 'Doutor'}</span>
                        </h2>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-[200px]" onClick={() => navigate('/stats')}>
                                <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-yellow-500/30 shrink-0">
                                    {user?.level || 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 tracking-widest">
                                        <span className="text-slate-900 dark:text-white">{user?.rank || 'Calouro da Sinapse'}</span>
                                        <span>{user?.xp || 0} XP</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-800">
                                        <div className="h-full bg-primary" style={{ width: `${levelProgress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 px-3 py-2 rounded-xl border border-orange-100 dark:border-orange-900/40">
                                <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-pulse" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 leading-none">{user?.streak_count || 0} Dias</p>
                                    <p className="text-[7px] font-bold text-orange-400/80 uppercase">Sequência Atual</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                         <div className="text-center p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 min-w-[100px]">
                             <span className="text-2xl font-black text-slate-900 dark:text-white block leading-none">{loading ? '-' : stats.totalQuestions}</span>
                             <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Questões</span>
                         </div>
                         <div className="text-center p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 min-w-[100px]">
                             <span className="text-2xl font-black text-primary block leading-none">{loading ? '-' : stats.totalCategories}</span>
                             <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Temas</span>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { path: '/practice', icon: Play, label: 'Treinar', desc: 'Modo Prática', color: 'bg-primary text-white' },
                        { path: '/flashcards', icon: Layers, label: 'Flashcards', desc: 'Revisão Espaçada', color: 'bg-emerald-500 text-white' },
                        { path: '/videos', icon: MonitorPlay, label: 'Vídeo Aulas', desc: 'Acervo Didático', color: 'bg-indigo-500 text-white' },
                        { path: '/import', icon: Plus, label: 'Adicionar', desc: 'Novo Conteúdo', color: 'bg-slate-900 text-white' }
                    ].map((action, i) => (
                        <button key={i} onClick={() => navigate(action.path)} className="flex items-center p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all border border-slate-100 dark:border-zinc-800 group/btn">
                            <div className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center mr-3 shadow-md group-hover/btn:scale-110 transition-transform`}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <span className="text-xs font-black uppercase text-slate-900 dark:text-white block">{action.label}</span>
                                <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">{action.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* TUTOR IA QUICK ACCESS */}
                <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group mb-6">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><Sparkles className="h-24 w-24" /></div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 mb-1"><Bot className="h-5 w-5" /> Tutor Clínico IA</h3>
                        <p className="text-[10px] font-medium opacity-80 mb-4 max-w-md uppercase tracking-wide">Tire dúvidas sobre casos, farmacologia ou fisiopatologia instantaneamente.</p>
                        <div className="flex gap-2 w-full">
                            <textarea 
                                value={quickQuestion}
                                onChange={e => setQuickQuestion(e.target.value)}
                                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickAsk(); } }}
                                placeholder="Digite sua dúvida clínica aqui (ex: Critérios de exclusão para trombólise)..." 
                                className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-white/40 focus:bg-white/20 outline-none backdrop-blur-sm transition-all resize-none h-24 custom-scrollbar"
                            />
                            <button onClick={handleQuickAsk} className="bg-white text-emerald-600 w-24 rounded-2xl hover:bg-emerald-50 transition-colors shadow-lg active:scale-95 flex items-center justify-center"><Send className="h-6 w-6" /></button>
                        </div>
                    </div>
                </div>

                {/* FERRAMENTAS CLÍNICAS (CARROSSEL) */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-lg text-primary"><Brain className="h-4 w-4" /></div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Ferramentas Clínicas</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {TOOLS_CATEGORIES.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => navigate(tool.path)}
                                className="min-w-[160px] p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-primary transition-all text-left group"
                            >
                                <div className={`w-8 h-8 rounded-lg ${tool.bgLight} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <tool.icon className={`h-4 w-4 ${tool.text}`} />
                                </div>
                                <h4 className="font-black text-[10px] uppercase text-slate-900 dark:text-white mb-1 leading-tight">{tool.name}</h4>
                                <p className="text-[8px] text-slate-500 font-medium line-clamp-2">{tool.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ... (Rest of Dashboard - Community, Pending Tasks) ... */}
                {/* COMMUNITY WIDGET */}
                <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden mb-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500"></div>
                    
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/10 rounded-xl"><Users className="h-5 w-5 text-white" /></div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight">Comunidade</h3>
                                <div className="flex gap-2 mt-1">
                                    <button onClick={() => setCommunityTab('ranking')} className={`text-[8px] font-bold uppercase tracking-widest transition-colors ${communityTab === 'ranking' ? 'text-white underline decoration-primary underline-offset-4' : 'text-slate-500 hover:text-slate-300'}`}>Ranking</button>
                                    <button onClick={() => setCommunityTab('requests')} className={`text-[8px] font-bold uppercase tracking-widest transition-colors ${communityTab === 'requests' ? 'text-white underline decoration-primary underline-offset-4' : 'text-slate-500 hover:text-slate-300'}`}>Solicitações {pendingRequests.length > 0 && <span className="bg-red-500 text-white px-1 rounded-full">{pendingRequests.length}</span>}</button>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => navigate('/community')} className="text-[9px] font-black uppercase bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all flex items-center gap-1">Ver Todos <ArrowUpRight className="h-3 w-3" /></button>
                    </div>

                    {communityTab === 'ranking' && (
                        <>
                            {communityPulse.length === 0 ? (
                                <div className="text-center py-6 opacity-40 border border-dashed border-white/20 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sem atividade recente ou offline</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {communityPulse.map((friend, index) => (
                                        <div key={friend.id} className={`p-3 rounded-2xl flex items-center gap-3 transition-colors cursor-default ${friend.id === user?.id ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                                            <div className="relative shrink-0 w-8 flex justify-center text-[10px] font-black text-slate-400">
                                                {index + 1}º
                                            </div>
                                            <div className="relative shrink-0">
                                                <div className="h-10 w-10 rounded-xl bg-black overflow-hidden border border-white/20">
                                                    {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-black">{friend.full_name[0]}</div>}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[7px] font-black px-1 rounded shadow-sm">
                                                    Lv.{friend.level}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-[11px] font-black truncate text-white">{friend.full_name.split(' ')[0]} {friend.id === user?.id && '(Você)'}</h4>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                                        <span className="text-[9px] font-bold text-yellow-400">{friend.xp}</span>
                                                    </div>
                                                </div>
                                                <p className="text-[8px] font-bold uppercase text-slate-500 truncate">{friend.rank}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {communityTab === 'requests' && (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-6 opacity-40">
                                    <UserPlus className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma solicitação</p>
                                </div>
                            ) : (
                                pendingRequests.map(req => (
                                    <div key={req.id} className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-black overflow-hidden">
                                                {req.requester.avatar_url ? <img src={req.requester.avatar_url} className="w-full h-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-black">{req.requester.full_name[0]}</div>}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black">{req.requester.full_name}</p>
                                                <p className="text-[8px] opacity-60">{req.requester.specialty}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAcceptRequest(req.id, true)} className="p-1.5 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"><Check className="h-3 w-3 text-white" /></button>
                                            <button onClick={() => handleAcceptRequest(req.id, false)} className="p-1.5 bg-white/10 rounded-lg hover:bg-red-500 transition-colors"><X className="h-3 w-3 text-white" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* WIDGET PENDÊNCIAS */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                            <Clock className="h-4 w-4 text-orange-500" /> Pendências & Metas
                        </h3>
                        <span className="text-[8px] font-black uppercase bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-slate-500">
                            {(activeSession ? 1 : 0) + (dueFlashcardsCount > 0 ? 1 : 0)} Alertas
                        </span>
                    </div>

                    <div className="space-y-4">
                        {activeSession ? (
                            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 flex items-center justify-between group cursor-pointer" onClick={() => navigate('/practice/session', { state: { resume: true } })}>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                        <RotateCw className="h-5 w-5 animate-spin-slow" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase text-orange-800 dark:text-orange-200">Sessão em Andamento</h4>
                                        <p className="text-[8px] font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest">
                                            Item {(activeSession.current_index || 0) + 1} • {activeSession.questions_data?.length || 0} Total
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-orange-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                    <Play className="h-3 w-3 fill-current" />
                                </button>
                            </div>
                        ) : null}

                        {dueFlashcardsCount > 0 ? (
                            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between group cursor-pointer" onClick={() => navigate('/flashcards/study')}>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 relative">
                                        <Layers className="h-5 w-5" />
                                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase text-indigo-800 dark:text-indigo-200">Revisão Espaçada</h4>
                                        <p className="text-[8px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-widest">
                                            {dueFlashcardsCount} Cards Vencidos
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-indigo-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        ) : null}

                        {!activeSession && dueFlashcardsCount === 0 && (
                            <div className="text-center py-8 opacity-40">
                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                                <p className="text-[9px] font-black uppercase tracking-widest">Tudo em dia! Bom trabalho.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </Layout>
  );
};
