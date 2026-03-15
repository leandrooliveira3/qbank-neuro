import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../services/supabase';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';
import { 
  Users, Search, UserPlus, Check, X, Loader2, 
  User, Activity, Brain, Layers, FileText, Download,
  BarChart2, BookOpen, Folder, ChevronRight, CheckSquare, Square,
  Flame, Medal, Award, Trophy, Send, ArrowRight
} from 'lucide-react';
import { MEDALS } from '../services/xpService';

type Tab = 'friends' | 'explore' | 'requests';

export const Comunidade: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); // Incoming
  const [sentRequests, setSentRequests] = useState<any[]>([]); // Outgoing
  const [exploreResults, setExploreResults] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [friendStats, setFriendStats] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  
  // Selection Logic
  const [availableBanks, setAvailableBanks] = useState<{name: string, count: number}[]>([]);
  const [showBankSelection, setShowBankSelection] = useState<string | null>(null); 
  const [selectedBanksToImport, setSelectedBanksToImport] = useState<Set<string>>(new Set());

  // Store IDs for filtering explore tab
  const [friendIdsSet, setFriendIdsSet] = useState<Set<string>>(new Set());
  const [sentRequestIdsSet, setSentRequestIdsSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchIncomingRequests();
      fetchSentRequests();
    }
  }, [user]);

  useEffect(() => {
      if (activeTab === 'explore') fetchExploreUsers();
  }, [activeTab, friendIdsSet, sentRequestIdsSet, requests]);

  useEffect(() => {
      if (selectedFriend) fetchFriendStats(selectedFriend.id);
  }, [selectedFriend]);

  const fetchFriends = async () => {
    if (!user) return;
    setLoading(true);
    const { data: f1 } = await supabase.from('friendships').select('addressee_id, created_at').eq('requester_id', user.id).eq('status', 'accepted');
    const { data: f2 } = await supabase.from('friendships').select('requester_id, created_at').eq('addressee_id', user.id).eq('status', 'accepted');
    
    const ids = [
        ...(f1?.map(f => f.addressee_id) || []),
        ...(f2?.map(f => f.requester_id) || [])
    ];
    
    setFriendIdsSet(new Set(ids));

    if (ids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids).is('deleted_at', null);
        setFriends(profiles || []);
    } else {
        setFriends([]);
    }
    setLoading(false);
  };

  const fetchIncomingRequests = async () => {
      if (!user) return;
      const { data } = await supabase.from('friendships').select('id, requester:profiles!requester_id(*)').eq('addressee_id', user.id).eq('status', 'pending');
      setRequests(data || []);
  };

  const fetchSentRequests = async () => {
      if (!user) return;
      // Fetch requests I sent that are still pending
      const { data } = await supabase.from('friendships').select('id, addressee:profiles!addressee_id(*)').eq('requester_id', user.id).eq('status', 'pending');
      
      const sent = data || [];
      setSentRequests(sent);
      setSentRequestIdsSet(new Set(sent.map(r => r.addressee.id)));
  };

  const fetchExploreUsers = async () => {
      if (!user) return;
      setLoading(true);
      
      let query = supabase.from('profiles')
        .select('*')
        .neq('id', user.id)
        .is('deleted_at', null) // Ensure deleted users don't show up
        .limit(50); 

      if (searchQuery.trim()) {
          query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      } else {
          query = query.order('xp', { ascending: false });
      }

      const { data } = await query;
      
      // IDs de solicitações recebidas (para não mostrar quem já te convidou no Explorar)
      const incomingRequestIds = new Set(requests.map(r => r.requester.id));

      // Filtra: Já amigos, Solicitações Enviadas, Solicitações Recebidas
      const filtered = data?.filter(u => 
          !friendIdsSet.has(u.id) && 
          !sentRequestIdsSet.has(u.id) &&
          !incomingRequestIds.has(u.id)
      ) || [];
      
      setExploreResults(filtered);
      setLoading(false);
  };

  // Debounced search effect
  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          if (activeTab === 'explore') fetchExploreUsers();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const sendRequest = async (targetId: string) => {
      if (!user) return;
      const { error } = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: targetId });
      if (error) {
          alert("Erro ao enviar convite (talvez já exista).");
      } else {
          alert("Convite enviado!");
          // Update local state to immediately reflect changes
          setSentRequestIdsSet(prev => new Set([...prev, targetId]));
          fetchSentRequests();
          setExploreResults(prev => prev.filter(u => u.id !== targetId));
      }
  };

  const cancelSentRequest = async (requestId: string, targetUserId: string) => {
      if (!confirm("Cancelar solicitação de amizade?")) return;
      
      // Optimistic Update
      setSentRequests(prev => prev.filter(r => r.id !== requestId));
      setSentRequestIdsSet(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
      });

      const { error } = await supabase.from('friendships').delete().eq('id', requestId);
      
      if (error) {
          alert("Erro ao cancelar solicitação.");
          fetchSentRequests(); // Revert on error
      }
  };

  const respondRequest = async (friendshipId: string, accept: boolean) => {
      if (accept) { 
          await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId); 
          fetchFriends(); 
      } 
      else { 
          await supabase.from('friendships').delete().eq('id', friendshipId); 
      }
      fetchIncomingRequests();
  };

  const fetchFriendStats = async (friendId: string) => {
      setFriendStats(null);
      const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('created_by', friendId);
      const { count: cCount } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', friendId);
      const { count: sCount } = await supabase.from('summaries').select('*', { count: 'exact', head: true }).eq('user_id', friendId);
      const { data: answers } = await supabase.from('user_answers').select('is_correct').eq('user_id', friendId);

      let accuracy = 0;
      if (answers && answers.length > 0) {
          const correct = answers.filter(a => a.is_correct).length;
          accuracy = Math.round((correct / answers.length) * 100);
      }

      setFriendStats({
          questions: qCount || 0,
          cards: cCount || 0,
          summaries: sCount || 0,
          accuracy
      });
  };

  const prepareImport = async (type: 'questions' | 'flashcards' | 'summaries') => {
      if (!selectedFriend) return;
      setImporting(true);
      setAvailableBanks([]);
      setSelectedBanksToImport(new Set());
      try {
          const targetTable = type;
          const userCol = type === 'questions' ? 'created_by' : 'user_id';
          
          // Use pagination to get ALL items (bypass 1000 limit)
          const allData: any[] = [];
          const PAGE_SIZE = 1000;
          let page = 0;
          let hasMore = true;
          
          while (hasMore) {
              const { data, error } = await supabase
                  .from(targetTable)
                  .select('bank_name')
                  .eq(userCol, selectedFriend.id)
                  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
              
              if (error) {
                  hasMore = false;
                  continue;
              }
              
              if (data && data.length > 0) {
                  allData.push(...data);
                  hasMore = data.length === PAGE_SIZE;
                  page++;
              } else {
                  hasMore = false;
              }
          }
          
          if (allData.length > 0) {
              const bankCounts: Record<string, number> = {};
              allData.forEach((item: any) => {
                  const bName = item.bank_name || (type === 'questions' ? 'Geral' : type === 'flashcards' ? 'Principal' : 'Meus Resumos');
                  bankCounts[bName] = (bankCounts[bName] || 0) + 1;
              });
              setAvailableBanks(Object.entries(bankCounts).map(([name, count]) => ({ name, count })));
              setShowBankSelection(type);
          } else {
              alert("Nenhum item encontrado neste banco.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setImporting(false);
      }
  };

  const confirmImport = async () => {
      if (!user || !selectedFriend || !showBankSelection) return;
      if (selectedBanksToImport.size === 0) {
          alert("Selecione pelo menos um banco.");
          return;
      }
      setImporting(true);
      try {
          const type = showBankSelection;
          const targetTable = type;
          const userCol = type === 'questions' ? 'created_by' : 'user_id';
          const defaultBankName = type === 'questions' ? 'Geral' : type === 'flashcards' ? 'Principal' : 'Meus Resumos';
          const banks = Array.from(selectedBanksToImport);
          
          // Use pagination to get ALL items (bypass 1000 limit)
          const allData: any[] = [];
          const PAGE_SIZE = 1000;
          let page = 0;
          let hasMore = true;
          
          while (hasMore) {
              const { data, error } = await supabase
                  .from(targetTable)
                  .select('*')
                  .eq(userCol, selectedFriend.id)
                  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
              
              if (error) {
                  if (page === 0) throw error;
                  hasMore = false;
                  continue;
              }
              
              if (data && data.length > 0) {
                  allData.push(...data);
                  hasMore = data.length === PAGE_SIZE;
                  page++;
              } else {
                  hasMore = false;
              }
          }
          
          const filteredData = allData.filter((item: any) => {
              const itemBank = item.bank_name || defaultBankName;
              return banks.includes(itemBank);
          });
          if (filteredData.length === 0) {
              alert("Erro: Itens não encontrados.");
              return;
          }
          const newItems = filteredData.map((item: any) => {
              const newItem = { ...item, id: crypto.randomUUID() };
              
              if (type === 'questions') {
                  newItem.created_by = user.id;
                  if (newItem.alternatives) newItem.alternatives = newItem.alternatives.map((alt: any) => ({ ...alt, id: crypto.randomUUID() }));
              } 
              else if (type === 'flashcards') {
                  newItem.user_id = user.id;
                  // RESET SRS FOR IMPORTED CARDS
                  newItem.status = 'new';
                  newItem.interval = 0;
                  newItem.ease_factor = 2.5;
                  newItem.repetitions = 0;
                  newItem.next_review = new Date().toISOString();
                  newItem.last_review = null;
              }
              else {
                  newItem.user_id = user.id;
              }
              return newItem;
          });
          await syncEngine.bulkEnqueue(targetTable, newItems);
          alert(`${newItems.length} itens importados com sucesso! Já estão na sua fila.`);
          setShowBankSelection(null);
      } catch (e: any) {
          alert("Erro na importação: " + e.message);
      } finally {
          setImporting(false);
      }
  };

  const toggleBankSelection = (name: string) => {
      setSelectedBanksToImport(prev => {
          const next = new Set(prev);
          if (next.has(name)) next.delete(name); else next.add(name);
          return next;
      });
  };

  const friendMedals = useMemo(() => {
      if (!selectedFriend?.achievements) return [];
      return selectedFriend.achievements.map((id: string) => MEDALS[id as keyof typeof MEDALS]).filter(Boolean);
  }, [selectedFriend]);

  return (
    <Layout title="Comunidade Acadêmica" fullWidth>
      <div className="h-full flex flex-col space-y-4 overflow-hidden w-full p-4 md:p-6 relative">
        
        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200 dark:border-zinc-900 w-full md:w-fit shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => { setActiveTab('friends'); setSelectedFriend(null); }} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${activeTab === 'friends' && !selectedFriend ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}><Users className="h-3.5 w-3.5 mr-2" /> Meus Amigos</button>
            <button onClick={() => { setActiveTab('explore'); setSelectedFriend(null); }} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${activeTab === 'explore' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}><Search className="h-3.5 w-3.5 mr-2" /> Explorar</button>
            <button onClick={() => { setActiveTab('requests'); setSelectedFriend(null); }} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${activeTab === 'requests' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}><UserPlus className="h-3.5 w-3.5 mr-2" /> Solicitações {requests.length > 0 && <span className="ml-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[7px]">{requests.length}</span>}</button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            
            {/* VIEW: LISTA DE AMIGOS */}
            {activeTab === 'friends' && !selectedFriend && (
                <div className="h-full overflow-y-auto custom-scrollbar p-1">
                    {loading ? (
                        <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
                    ) : friends.length === 0 ? (
                        <div className="p-20 text-center opacity-30 border-2 border-dashed rounded-[2rem] border-slate-200 dark:border-zinc-800">
                            <Users className="h-12 w-12 mx-auto mb-3" />
                            <p className="font-black text-[10px] uppercase">Sua rede está vazia</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {friends.map(f => (
                                <div key={f.id} onClick={() => setSelectedFriend(f)} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-5 rounded-2xl shadow-sm hover:border-primary transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-zinc-700">
                                            {f.avatar_url ? <img src={f.avatar_url} className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-slate-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{f.full_name}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{f.specialty || 'Neurologia'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-zinc-900 flex justify-between items-center">
                                        <span className="text-[8px] font-black uppercase text-primary bg-primary/5 px-2 py-1 rounded-lg">Ver Bancos</span>
                                        <Activity className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* VIEW: PERFIL AMIGO */}
            {selectedFriend && (
                <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] overflow-hidden shadow-xl animate-in slide-in-from-right-4 relative max-w-5xl mx-auto w-full">
                    {/* ... (Existing Profile View with Bank Selection) ... */}
                    {showBankSelection && (
                        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm flex flex-col p-6 animate-in fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Importar {showBankSelection}</h3>
                                <button onClick={() => setShowBankSelection(null)} className="p-2 bg-slate-100 dark:bg-zinc-900 rounded-full"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                                {availableBanks.map(b => (
                                    <div key={b.name} onClick={() => toggleBankSelection(b.name)} className={`p-4 rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${selectedBanksToImport.has(b.name) ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500' : 'bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'}`}>
                                        <div className="flex items-center gap-3">
                                            <Folder className={`h-5 w-5 ${selectedBanksToImport.has(b.name) ? 'text-indigo-500' : 'text-slate-400'}`} />
                                            <div>
                                                <p className="text-[10px] font-black uppercase">{b.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">{b.count} itens</p>
                                            </div>
                                        </div>
                                        {selectedBanksToImport.has(b.name) ? <CheckSquare className="h-5 w-5 text-indigo-500" /> : <Square className="h-5 w-5 text-slate-300" />}
                                    </div>
                                ))}
                            </div>
                            <button onClick={confirmImport} disabled={importing} className="w-full bg-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex justify-center items-center gap-2 disabled:opacity-50">
                                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} IMPORTAR SELECIONADOS
                            </button>
                        </div>
                    )}

                    <div className="p-6 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-white dark:bg-black overflow-hidden border-2 border-white dark:border-zinc-800 shadow-md">
                                {selectedFriend.avatar_url ? <img src={selectedFriend.avatar_url} className="w-full h-full object-cover" /> : <User className="h-6 w-6 text-slate-300 m-auto" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedFriend.full_name}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedFriend.specialty}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />
                                        <span className="text-[8px] font-black text-orange-700 dark:text-orange-400">{selectedFriend.streak_count || 0} Dias</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedFriend(null)} className="p-2 text-slate-400 hover:text-red-500"><X className="h-6 w-6" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        
                        {friendMedals.length > 0 && (
                            <div className="mb-2">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Conquistas</p>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                    {friendMedals.map(m => (
                                        <div key={m.id} className={`p-2.5 rounded-xl border flex flex-col items-center justify-center min-w-[80px] ${m.bg} ${m.color} border-current`}>
                                            {m.icon === 'Medal' ? <Medal className="h-5 w-5 mb-1" /> : m.icon === 'Award' ? <Award className="h-5 w-5 mb-1" /> : <Trophy className="h-5 w-5 mb-1" />}
                                            <p className="text-[7px] font-black uppercase text-center leading-tight">{m.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Acurácia Global</p>
                                <div className="text-2xl font-black text-emerald-500">{friendStats?.accuracy || 0}%</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Questões Criadas</p>
                                <div className="text-2xl font-black text-primary">{friendStats?.questions || 0}</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Flashcards</p>
                                <div className="text-2xl font-black text-blue-500">{friendStats?.cards || 0}</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Resumos</p>
                                <div className="text-2xl font-black text-purple-500">{friendStats?.summaries || 0}</div>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-lg">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2"><Download className="h-4 w-4 text-emerald-400" /> Central de Troca</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button onClick={() => prepareImport('questions')} disabled={importing} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition-all disabled:opacity-50">
                                    <BookOpen className="h-6 w-6 text-primary mb-2" />
                                    <p className="font-black text-[10px] uppercase">Importar Questões</p>
                                    <p className="text-[8px] opacity-60">Escolher Bancos</p>
                                </button>
                                <button onClick={() => prepareImport('flashcards')} disabled={importing} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition-all disabled:opacity-50">
                                    <Layers className="h-6 w-6 text-blue-400 mb-2" />
                                    <p className="font-black text-[10px] uppercase">Importar Flashcards</p>
                                    <p className="text-[8px] opacity-60">Escolher Decks</p>
                                </button>
                                <button onClick={() => prepareImport('summaries')} disabled={importing} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition-all disabled:opacity-50">
                                    <FileText className="h-6 w-6 text-purple-400 mb-2" />
                                    <p className="font-black text-[10px] uppercase">Importar Resumos</p>
                                    <p className="text-[8px] opacity-60">Escolher Coleções</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: EXPLORAR */}
            {activeTab === 'explore' && (
                <div className="h-full p-1 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar usuários por nome ou e-mail..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            // No OnKeyDown needed as useEffect debounces
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-primary shadow-sm"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
                        ) : exploreResults.length > 0 ? (
                            <div className="space-y-3">
                                {exploreResults.map(u => (
                                    <div key={u.id} className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-900 flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-xl" /> : <User className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-xs text-slate-900 dark:text-white">{u.full_name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{u.specialty || 'Neurologia'}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => sendRequest(u.id)} className="bg-primary text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all">Adicionar</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center opacity-40 mt-10">
                                <p className="font-black text-[10px] uppercase">Nenhum usuário encontrado</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW: SOLICITAÇÕES */}
            {activeTab === 'requests' && (
                <div className="h-full overflow-y-auto custom-scrollbar p-1 space-y-6">
                    
                    {/* ENVIADAS (OUTGOING) - UPDATED WITH CANCEL BUTTON */}
                    {sentRequests.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Convites Enviados ({sentRequests.length})</h3>
                            {sentRequests.map(req => (
                                <div key={req.id} className="bg-white/50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm opacity-90 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                            {req.addressee.avatar_url ? <img src={req.addressee.avatar_url} className="w-full h-full object-cover rounded-lg" /> : <User className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-xs text-slate-700 dark:text-slate-300">{req.addressee.full_name}</p>
                                            <p className="text-[8px] text-slate-400 uppercase">Pendente</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => cancelSentRequest(req.id, req.addressee.id)}
                                        className="text-[8px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 px-3 py-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors flex items-center gap-1 group"
                                    >
                                        <span className="group-hover:hidden">Aguardando</span>
                                        <span className="hidden group-hover:inline">Cancelar</span>
                                        <X className="h-3 w-3 hidden group-hover:block" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* RECEBIDAS (INCOMING) */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-3"><UserPlus className="h-3 w-3 text-primary" /> Solicitações Recebidas ({requests.length})</h3>
                        {requests.length === 0 ? (
                            <div className="p-10 text-center opacity-30 border-2 border-dashed rounded-[2rem] border-slate-200 dark:border-zinc-800">
                                <Check className="h-10 w-10 mx-auto mb-3" />
                                <p className="font-black text-[10px] uppercase">Nenhuma pendência</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {requests.map(req => (
                                    <div key={req.id} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-900 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-xs text-slate-900 dark:text-white">{req.requester.full_name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Quer conectar-se com você</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => respondRequest(req.id, true)} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md active:scale-95">Aceitar</button>
                                            <button onClick={() => respondRequest(req.id, false)} className="flex-1 bg-slate-100 dark:bg-zinc-900 text-slate-500 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-red-500 active:scale-95">Recusar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
      </div>
    </Layout>
  );
};
