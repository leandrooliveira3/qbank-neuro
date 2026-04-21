
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { supabase, SUPABASE_URL } from '../services/supabase'; 
import { ANIME_AVATARS, SPECIALTIES } from '../constants';
import { 
  User as UserIcon, Check, Loader2, Save, 
  Key, RefreshCcw, Trash2, 
  AlertCircle, Database, HardDrive,
  ShieldCheck, Activity, Cpu, Search,
  Plus, X, LogOut, Trophy, Medal, Award,
  Clock, Brain, Cloud, Skull, RefreshCw, Eraser
} from 'lucide-react';
import { syncEngine } from '../services/syncEngine';
import { localDB } from '../services/localDB';
import { mediaService } from '../services/mediaService';
import { useFlashcardStore } from '../store/useFlashcardStore';
import { useNavigate } from 'react-router';
import { MEDALS } from '../services/xpService';

type Tab = 'profile' | 'system' | 'admin';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuthStore();
  const { resetAllProgress, decks, loadDecks } = useFlashcardStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [specialty, setSpecialty] = useState(user?.specialty || 'Neurologia');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [systemStats, setSystemStats] = useState({ questions: 0, answers: 0, cards: 0, users: 0, cacheSize: 'Calculando...' });
  const [syncingAuth, setSyncingAuth] = useState(false);
  const [resettingXP, setResettingXP] = useState(false);
  
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState<{id: string, name: string} | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [creatingUser, setCreatingUser] = useState(false);
  const [resettingFlashcards, setResettingFlashcards] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.email === 'steamleandro@hotmail.com';

  useEffect(() => {
    if (user) { 
        setFullName(user.full_name || ''); 
        setAvatarUrl(user.avatar_url || ''); 
        setSpecialty(user.specialty || 'Neurologia');
    }
  }, [user]);

  useEffect(() => { 
    if (activeTab === 'system') {
        calculateSystemStats();
    }
    if (isAdmin && activeTab === 'admin') {
        fetchAdminData();
    }
  }, [activeTab, isAdmin]);

  const calculateSystemStats = async () => {
      const [q, a, c, m] = await Promise.all([
          localDB.getAll('questions'),
          localDB.getAll('user_answers'),
          localDB.getAll('flashcards'),
          localDB.getAll('media_cache')
      ]);
      setSystemStats(prev => ({
          ...prev,
          questions: q.length,
          answers: a.length,
          cards: c.length,
          cacheSize: (m.length * 0.15).toFixed(1) + ' MB'
      }));
  };

  const fetchAdminData = async () => {
    setAdminLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsersList(profiles || []);
      setSystemStats(prev => ({ ...prev, users: profiles?.length || 0 }));
    } catch (e: any) {
        console.error("Erro administrativo:", e);
        setFeedback({ type: 'error', msg: `Erro Admin: ${e.message || 'Falha ao carregar'}` });
    } finally { setAdminLoading(false); }
  };

  const callAdminFunction = async (payload: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      const functionUrl = `${SUPABASE_URL}/functions/v1/admin-create-user`;
      const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(payload)
      });
      if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Erro na função administrativa");
      }
      return await response.json();
  };

  const handleError = (err: any) => {
      setFeedback({ type: 'error', msg: err.message || JSON.stringify(err) });
      setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setFeedback(null);
    try {
      await updateProfile({ full_name: fullName, avatar_url: avatarUrl, specialty });

      if (newPassword) {
        if (newPassword.length < 6) throw new Error("Mínimo 6 caracteres.");
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword('');
      }

      setFeedback({ type: 'success', msg: 'Perfil atualizado.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
      if(!confirm("Limpar cache local de mídia?")) return;
      setLoading(true);
      await localDB.clear('media_cache');
      mediaService.clearMemory();
      await calculateSystemStats();
      setFeedback({ type: 'success', msg: 'Cache limpo.' });
      setTimeout(() => setFeedback(null), 3000);
      setLoading(false);
  };

  const handleResetFlashcards = async () => {
      if (!user) return;
      if (!confirm('Resetar TODOS os flashcards? Isto limpará todo o histórico e intervalos.')) return;
      setResettingFlashcards(true);
      try {
          await resetAllProgress(user.id);
          setFeedback({ type: 'success', msg: 'Todos os flashcards foram resetados.' });
          setTimeout(() => setFeedback(null), 3000);
      } catch (e: any) {
          handleError(e);
      } finally {
          setResettingFlashcards(false);
      }
  };

  const handleFullSync = async () => {
      setLoading(true);
      await syncEngine.startSync(true);
      setFeedback({ type: 'success', msg: 'Sincronização concluída.' });
      setTimeout(() => setFeedback(null), 3000);
      setLoading(false);
  };

  const handleSyncAuth = async () => {
      setSyncingAuth(true);
      try {
          const res = await callAdminFunction({ action: 'sync_profiles' });
          setFeedback({ type: 'success', msg: `Sincronização: ${res.count || 0} perfis restaurados.` });
          await fetchAdminData();
          setTimeout(() => setFeedback(null), 4000);
      } catch (e: any) {
          handleError(e);
      } finally {
          setSyncingAuth(false);
      }
  };

  const handleGlobalResetXP = async () => {
      if (!confirm("ATENÇÃO CRÍTICA: Isso zerará o XP e Nível de TODOS os usuários do sistema. Esta ação é irreversível.\n\nTem absoluta certeza?")) return;
      setResettingXP(true);
      try {
          const res = await callAdminFunction({ action: 'reset_xp_global' });
          setFeedback({ type: 'success', msg: `Reset Global Concluído. ${res.count || 0} perfis afetados.` });
          await fetchAdminData();
      } catch (e: any) {
          handleError(e);
      } finally {
          setResettingXP(false);
      }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreatingUser(true);
      try {
          await callAdminFunction({
              action: 'create',
              email: newUserEmail,
              password: newUserPass,
              full_name: newUserName,
              role: newUserRole
          });
          setFeedback({ type: 'success', msg: 'Usuário criado com sucesso.' });
          setShowCreateUser(false);
          setNewUserEmail(''); setNewUserPass(''); setNewUserName('');
          await fetchAdminData();
          setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
          handleError(err);
      } finally {
          setCreatingUser(false);
      }
  };

  const handleApproveUser = async (u: any) => {
      if (!confirm(`Aprovar acesso para ${u.full_name}?`)) return;
      setAdminLoading(true);
      try {
          await callAdminFunction({ action: 'approve', userId: u.id });
          setFeedback({ type: 'success', msg: 'Usuário aprovado.' });
          await fetchAdminData();
          setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
          handleError(err);
      } finally {
          setAdminLoading(false);
      }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!showResetPassword) return;
      setCreatingUser(true);
      try {
          await callAdminFunction({ action: 'update-password', userId: showResetPassword.id, password: newUserPass });
          setFeedback({ type: 'success', msg: 'Senha atualizada.' });
          setShowResetPassword(null);
          setNewUserPass('');
          setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
          handleError(err);
      } finally {
          setCreatingUser(false);
      }
  };

  const handleDeleteUser = async (u: any) => {
      if (!confirm(`ATENÇÃO: Isso removerá permanentemente ${u.full_name} e todos os seus dados.\n\nTem certeza?`)) return;
      setAdminLoading(true);
      try {
          await callAdminFunction({ action: 'delete', userId: u.id });
          setFeedback({ type: 'success', msg: 'Usuário removido.' });
          await fetchAdminData();
          setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
          handleError(err);
      } finally {
          setAdminLoading(false);
      }
  };

  const handleFixNullStatements = async () => {
      setAdminLoading(true);
      try {
          const allQuestions = await localDB.getAll('questions');
          
          // Regex para encontrar "NULL" ou padrões de "Questão 1", "01.", "1- " no início
          const prefixRegex = /^(NULL|null|Quest[ãa]o\s*\d+|[\d]{1,3}[\s.)-:]+)\s*/i;
          
          const toFix = allQuestions.filter(q => 
              q.statement && prefixRegex.test(q.statement)
          );
          
          if (toFix.length === 0) {
              alert("Nenhuma questão com prefixos sujos (NULL ou Questão X) foi encontrada localmente.");
              return;
          }

          if (!confirm(`Foram encontradas ${toFix.length} questões com prefixos detectados (NULL/Questão X). Deseja limpar automaticamente?`)) return;

          const updates = toFix.map(q => ({
              ...q,
              statement: q.statement.replace(prefixRegex, '').trim()
          }));

          await localDB.bulkPut('questions', updates);
          await syncEngine.bulkEnqueue('questions', updates);
          
          setFeedback({ type: 'success', msg: `${updates.length} enunciados limpos com sucesso. Sincronizando...` });
          await calculateSystemStats();
          
      } catch (e: any) {
          handleError(e);
      } finally {
          setAdminLoading(false);
      }
  };

  const handleSelfDelete = async () => { 
      if (!confirm("ATENÇÃO: EXCLUSÃO DE CONTA\n\nDeseja continuar?")) return;
      await logout(); 
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => 
      (u.full_name || '').toLowerCase().includes(adminSearch.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(adminSearch.toLowerCase())
    );
  }, [usersList, adminSearch]);

  const userMedals = useMemo(() => {
      if (!user?.achievements) return [];
      return user.achievements.map(id => MEDALS[id as keyof typeof MEDALS]).filter(Boolean);
  }, [user]);

  return (
    <Layout title="Configurações">
      <div className="h-full flex flex-col space-y-4 overflow-hidden w-full max-w-full">
        
        {feedback && (
            <div className={`fixed bottom-24 right-6 z-[200] p-4 rounded-xl border-2 shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-4 max-w-sm ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-500/30 text-emerald-800' : 'bg-red-50 border-red-500/30 text-red-800'}`}>
                {feedback.type === 'success' ? <Check className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                <p className="text-[10px] font-black uppercase tracking-tight leading-relaxed">{feedback.msg}</p>
            </div>
        )}

        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200 dark:border-zinc-900 w-full shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('profile')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>
                <UserIcon className="h-3.5 w-3.5 mr-2" /> Perfil
            </button>
            <button onClick={() => setActiveTab('system')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${activeTab === 'system' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>
                <Cpu className="h-3.5 w-3.5 mr-2" /> Sistema
            </button>
            {isAdmin && (
                <button onClick={() => setActiveTab('admin')} className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${activeTab === 'admin' ? 'bg-white dark:bg-zinc-800 text-orange-600 shadow-sm' : 'text-slate-500'}`}>
                    <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Admin
                </button>
            )}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden w-full max-w-full">
            {activeTab === 'profile' && (
                <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in duration-300 w-full">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6 w-full max-w-full">
                        <section className="w-full">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-primary" /> Avatar</h3>
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 w-full">
                                {ANIME_AVATARS.map((avatar) => (
                                    <button key={avatar.name} onClick={() => setAvatarUrl(avatar.url)} className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${avatarUrl === avatar.url ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-slate-100 dark:border-zinc-800'}`}>
                                        <img src={avatar.url} className="w-full h-full object-cover" />
                                        {avatarUrl === avatar.url && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]"><Check className="text-primary h-4 w-4 stroke-[4px]" /></div>}
                                    </button>
                                ))}
                            </div>
                        </section>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                            <div className="space-y-4">
                                <div className="p-5 bg-slate-50 dark:bg-zinc-900/40 rounded-[2rem] border border-slate-100 dark:border-zinc-800 flex items-center gap-5">
                                    <div className="h-20 w-20 rounded-2xl border-4 border-white dark:border-zinc-800 overflow-hidden bg-white shadow-xl shrink-0"><img src={avatarUrl} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1 min-w-0">
                                        <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Nome Acadêmico</label>
                                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-transparent border-b-2 border-slate-200 dark:border-zinc-800 py-1 text-lg font-black focus:border-primary outline-none text-slate-900 dark:text-white" />
                                        <p className="text-[9px] text-slate-400 mt-2 font-bold truncate opacity-60">{user?.email}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[8px] font-black uppercase text-slate-400 mb-2 block tracking-widest ml-2 flex items-center gap-1">Especialidade</label>
                                    <select 
                                        value={specialty} 
                                        onChange={(e) => setSpecialty(e.target.value)} 
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-black uppercase focus:border-primary outline-none appearance-none"
                                    >
                                        {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="p-6 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-6 opacity-5"><Brain className="h-20 w-20" /></div>
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-4 flex items-center gap-2"><Key className="h-3.5 w-3.5" /> Segurança</h4>
                                    <div className="space-y-4">
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha (mín. 6 chars)" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold focus:bg-white/10 outline-none" />
                                        <div className="flex justify-between items-center">
                                            <button onClick={logout} className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-300 hover:text-white transition-colors"><LogOut className="h-3.5 w-3.5" /> Sair</button>
                                            <button onClick={handleSelfDelete} className="flex items-center gap-2 text-[9px] font-black uppercase text-red-400 hover:text-red-300 transition-colors bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-500"><Trash2 className="h-3.5 w-3.5" /> Excluir Minha Conta</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-yellow-500" /> Conquistas e Medalhas</h4>
                                <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm min-h-[250px]">
                                    {userMedals.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                                            <Medal className="h-10 w-10 mb-2 text-slate-400" />
                                            <p className="text-[9px] font-black uppercase text-center">Nenhuma medalha conquistada</p>
                                            <p className="text-[8px] mt-1 text-slate-500">Mantenha a ofensiva para ganhar</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {userMedals.map(m => (
                                                <div key={m.id} className={`p-3 rounded-2xl border flex flex-col items-center text-center ${m.bg} ${m.color} border-current`}>
                                                    {m.icon === 'Medal' ? <Medal className="h-6 w-6 mb-2" /> : m.icon === 'Award' ? <Award className="h-6 w-6 mb-2" /> : <Trophy className="h-6 w-6 mb-2" />}
                                                    <p className="text-[8px] font-black uppercase leading-tight">{m.label}</p>
                                                    <p className="text-[6px] font-bold opacity-70 mt-1 uppercase hidden sm:block">{m.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-zinc-900 flex justify-end shrink-0 bg-slate-50/30">
                        <button onClick={handleSaveProfile} disabled={loading} className="bg-primary hover:bg-emerald-700 text-white px-10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center transition-all disabled:opacity-50 active:scale-95">
                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} ATUALIZAR MEU PERFIL
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-6 rounded-[2rem] shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600"><Database className="h-6 w-6" /></div>
                                <div><h4 className="text-[10px] font-black uppercase text-slate-400">Banco de Dados</h4><p className="text-xl font-black">{systemStats.questions} Itens</p></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-6 rounded-[2rem] shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-600"><HardDrive className="h-6 w-6" /></div>
                                <div><h4 className="text-[10px] font-black uppercase text-slate-400">Cache Local</h4><p className="text-xl font-black">{systemStats.cacheSize}</p></div>
                            </div>
                            <button onClick={handleClearCache} className="w-full py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-[8px] font-black uppercase hover:bg-red-50 hover:text-red-600 transition-colors">Limpar Cache</button>
                        </div>
                        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-6 rounded-[2rem] shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl text-purple-600"><Cloud className="h-6 w-6" /></div>
                                <div><h4 className="text-[10px] font-black uppercase text-slate-400">Sincronização</h4><p className="text-xl font-black">{navigator.onLine ? 'Online' : 'Offline'}</p></div>
                            </div>
                            <button onClick={handleFullSync} className="w-full py-2 bg-primary text-white rounded-xl text-[8px] font-black uppercase shadow-md hover:bg-emerald-600 transition-all">Sincronizar Agora</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'admin' && isAdmin && (
                <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in">
                    <div className="p-4 md:p-6 border-b border-slate-100 dark:border-zinc-900 flex flex-col gap-4">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl"><ShieldCheck className="h-6 w-6" /></div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">Painel Administrativo</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{systemStats.users} Usuários Cadastrados</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-3 w-full">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar usuários..." 
                                    value={adminSearch} 
                                    onChange={e => setAdminSearch(e.target.value)} 
                                    className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest w-full focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            
                            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                                <button onClick={fetchAdminData} className="flex-1 lg:flex-none bg-slate-100 dark:bg-zinc-900 text-slate-500 px-3 py-2 rounded-xl text-[9px] font-black uppercase flex justify-center items-center gap-2 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors">
                                    <RefreshCw className="h-3.5 w-3.5" /> <span className="hidden md:inline">Atualizar</span>
                                </button>
                                <button onClick={handleSyncAuth} disabled={syncingAuth} className="flex-1 lg:flex-none bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap shadow-md">
                                    {syncingAuth ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />} Sync Auth
                                </button>
                                <button onClick={handleGlobalResetXP} disabled={resettingXP} className="flex-1 lg:flex-none bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 transition-colors whitespace-nowrap shadow-md">
                                    {resettingXP ? <Loader2 className="h-3 w-3 animate-spin" /> : <Skull className="h-3 w-3" />} ZERAR RANKING
                                </button>
                                <button onClick={handleFixNullStatements} className="flex-1 lg:flex-none bg-purple-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors whitespace-nowrap shadow-md">
                                    <Eraser className="h-3 w-3" /> FIX NULL
                                </button>
                                <button onClick={() => setShowCreateUser(true)} className="flex-1 lg:flex-none bg-emerald-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors whitespace-nowrap shadow-md">
                                    <Plus className="h-4 w-4" /> NOVO USUÁRIO
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-4 md:p-0 bg-slate-50 md:bg-white dark:bg-black md:dark:bg-zinc-950">
                        {adminLoading ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-50 py-10"><Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-2" /><span className="text-[10px] font-black uppercase">Carregando dados...</span></div>
                        ) : (
                            <>
                                <table className="w-full text-left border-collapse hidden md:table min-w-[800px]">
                                    <thead className="bg-slate-50/50 dark:bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="p-4 text-[8px] font-black uppercase text-slate-400 tracking-widest rounded-l-xl">Usuário</th>
                                            <th className="p-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Acesso</th>
                                            <th className="p-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                            <th className="p-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">XP Total</th>
                                            <th className="p-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Último Acesso</th>
                                            <th className="p-4 text-[8px] font-black uppercase text-slate-400 tracking-widest text-right rounded-r-xl">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-black uppercase text-slate-500 overflow-hidden">
                                                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.email.substring(0, 2)}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 dark:text-white">{u.full_name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${u.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>{u.role}</span></td>
                                                <td className="p-4">
                                                    {u.status === 'pending' ? (
                                                        <button onClick={() => handleApproveUser(u)} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase hover:bg-emerald-600 transition-colors shadow-md animate-pulse">Aprovar</button>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1"><Check className="h-3 w-3" /> Ativo</span>
                                                    )}
                                                </td>
                                                <td className="p-4"><span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{u.xp || 0}</span></td>
                                                <td className="p-4 text-[9px] font-bold text-slate-400">
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {u.last_seen ? new Date(u.last_seen).toLocaleString('pt-BR') : 'Nunca'}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2 transition-opacity">
                                                        <button onClick={() => setShowResetPassword({id: u.id, name: u.full_name})} className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-500 rounded-lg hover:text-blue-500 transition-colors" title="Resetar Senha"><Key className="h-3.5 w-3.5" /></button>
                                                        <button onClick={() => handleDeleteUser(u)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="space-y-3 md:hidden">
                                    {filteredUsers.map(u => (
                                        <div key={u.id} className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black uppercase text-slate-500 overflow-hidden">
                                                        {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.email.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 dark:text-white">{u.full_name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[7px] font-black uppercase ${u.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>{u.role}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    {u.status === 'pending' ? (
                                                        <button onClick={() => handleApproveUser(u)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 shadow-md">Aprovar</button>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg"><Check className="h-3 w-3" /> Ativo</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-900">
                                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {u.last_seen ? new Date(u.last_seen).toLocaleDateString('pt-BR') : 'N/A'}</span>
                                                <span className="text-[9px] font-mono font-black text-slate-600 dark:text-slate-300">XP: {u.xp || 0}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowResetPassword({id: u.id, name: u.full_name})} className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-500 rounded-lg hover:text-blue-500 transition-colors"><Key className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDeleteUser(u)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>

        {showCreateUser && (
            <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2rem] p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-zinc-800">
                    <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white mb-6">Novo Usuário</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <input type="text" placeholder="Nome Completo" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary" required />
                        <input type="email" placeholder="E-mail" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary" required />
                        <input type="password" placeholder="Senha" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary" required />
                        <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary">
                            <option value="user">Usuário Comum</option>
                            <option value="admin">Administrador</option>
                        </select>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowCreateUser(false)} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase bg-slate-100 dark:bg-zinc-900 text-slate-500">Cancelar</button>
                            <button type="submit" disabled={creatingUser} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center gap-2">
                                {creatingUser ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Criar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {showResetPassword && (
            <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-zinc-800">
                    <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white mb-2">Resetar Senha</h3>
                    <p className="text-xs text-slate-500 mb-6 font-medium">Para: <strong>{showResetPassword.name}</strong></p>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <input type="password" placeholder="Nova Senha (min 6 chars)" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary" required minLength={6} />
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowResetPassword(null)} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase bg-slate-100 dark:bg-zinc-900 text-slate-500">Cancelar</button>
                            <button type="submit" disabled={creatingUser} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase bg-red-600 text-white flex items-center justify-center gap-2">
                                {creatingUser ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};
