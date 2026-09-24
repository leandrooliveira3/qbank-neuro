
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const updateLastSeen = async (userId: string) => {
    if (!userId) return;
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', userId);
            
        if (error) {
            console.warn("Falha ao atualizar last_seen (Sync/Permissões):", error.message);
        }
    } catch (e) {
        // Silencioso em produção
    }
};

const syncProfileToLocalStorage = (profile: Partial<UserProfile>) => {
  if (!profile) return;
  if (profile.srs_profile) {
    localStorage.setItem('neuro_srs_profile', profile.srs_profile);
  }
  if (profile.daily_limit !== undefined && profile.daily_limit !== null) {
    localStorage.setItem('neuro_daily_limit', String(profile.daily_limit));
  }
  if (profile.priority_config) {
    localStorage.setItem('neuro_priority_config', typeof profile.priority_config === 'string' ? profile.priority_config : JSON.stringify(profile.priority_config));
  } else if (profile.hasOwnProperty('priority_config') && !profile.priority_config) {
    localStorage.removeItem('neuro_priority_config');
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('neuro_sync_completed', async () => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.id) {
      const localProfile = await localDB.get('profiles', currentUser.id);
      if (localProfile) {
        useAuthStore.setState({ user: localProfile });
        syncProfileToLocalStorage(localProfile);
      }
    }
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  updateProfile: async (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      const newUser = { ...currentUser, ...updates };
      set({ user: newUser });
      await localDB.put('profiles', newUser); 
      await syncEngine.enqueue('profiles', newUser);
      syncProfileToLocalStorage(newUser);
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const formattedEmail = email.trim().toLowerCase();
      
      // Fallback para login offline se o dispositivo estiver desconectado
      if (!navigator.onLine) {
        const localProfiles = await localDB.getAll('profiles');
        const matched = localProfiles.find((p: any) => p.email?.trim().toLowerCase() === formattedEmail) 
          || (localProfiles.length > 0 ? localProfiles[0] : null);

        if (matched) {
          localStorage.setItem('neuro_last_user_id', matched.id);
          syncProfileToLocalStorage(matched);
          set({ user: matched, loading: false, initialized: true });
          return { error: null };
        } else {
          set({ loading: false });
          return { error: 'Sem conexão com a internet e nenhum perfil local salvo para este e-mail.' };
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email: formattedEmail, 
        password 
      });
      
      if (authError) {
        set({ loading: false });
        return { error: authError.message };
      }

      if (authData.user) {
        // Prioridade: Buscar dados frescos do servidor no Login
        let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

        // Fallback para local se offline/falha
        if (!profile) {
            profile = await localDB.get('profiles', authData.user.id);
        }

        if (profile) {
            if (profile.status === 'pending') {
                await supabase.auth.signOut();
                set({ loading: false, user: null });
                return { error: 'Sua conta aguarda aprovação do administrador.' };
            }
            if (profile.deleted_at) {
                await supabase.auth.signOut();
                set({ loading: false, user: null });
                return { error: 'Esta conta foi desativada.' };
            }
            
            const userProfile: UserProfile = { 
                id: authData.user.id, 
                email: authData.user.email!, 
                role: (profile.role as 'admin' | 'user') || 'user', 
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                specialty: profile.specialty,
                xp: profile.xp || 0,
                level: profile.level || 1,
                rank: profile.rank || 'Estudante de Medicina',
                created_at: profile.created_at || authData.user.created_at!,
                last_daily_bonus: profile.last_daily_bonus,
                streak_count: profile.streak_count || 0,
                achievements: profile.achievements || [],
                srs_profile: profile.srs_profile || 'standard',
                daily_limit: profile.daily_limit || 0,
                priority_config: profile.priority_config || null
            };

            await localDB.put('profiles', userProfile);
            localStorage.setItem('neuro_last_user_id', userProfile.id);
            syncProfileToLocalStorage(userProfile);
            set({ user: userProfile, loading: false, initialized: true });
            
            setTimeout(() => syncEngine.startSync(true), 100);
            updateLastSeen(userProfile.id);
            return { error: null };
        }
      }

      return { error: 'Falha na autenticação: Perfil não encontrado.' };
    } catch (e: any) {
      set({ loading: false });
      return { error: e.message || 'Erro crítico no sistema de login.' };
    }
  },

  logout: async () => {
    const userId = get().user?.id;
    set({ loading: true });
    localStorage.removeItem('neuro_last_user_id');
    
    try {
      if (userId && navigator.onLine) {
        await syncEngine.pushLocalChanges(userId);
      }
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Logout suave:", e);
    } finally {
      const storesToClear = ['profiles', 'sync_queue', 'active_practice_sessions'];
      for (const store of storesToClear) await localDB.clear(store);
      
      set({ user: null, loading: false, initialized: true });
    }
  },

  checkSession: async () => {
    set({ loading: true });
    try {
      let sessionUser: any = null;
      try {
        const { data } = await supabase.auth.getSession();
        sessionUser = data?.session?.user;
      } catch (err) {
        console.warn("Falha ao obter sessão do Supabase (offline):", err);
      }

      if (sessionUser) {
        // 1. Carrega do LocalDB para renderização instantânea (Optimistic UI)
        let localProfile = await localDB.get('profiles', sessionUser.id);
        
        if (localProfile) {
            localStorage.setItem('neuro_last_user_id', localProfile.id);
            set({ user: localProfile });
        }

        // 2. Se estiver online, busca a "Verdade" do servidor imediatamente para corrigir discrepâncias de Streak/XP
        if (navigator.onLine) {
            try {
              const { data: remoteProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', sessionUser.id)
                  .maybeSingle();

              if (remoteProfile) {
                  localProfile = {
                      ...localProfile,
                      xp: remoteProfile.xp ?? 0,
                      level: remoteProfile.level ?? 1,
                      rank: remoteProfile.rank ?? 'Estudante de Medicina',
                      last_daily_bonus: remoteProfile.last_daily_bonus,
                      streak_count: remoteProfile.streak_count ?? 0,
                      achievements: remoteProfile.achievements ?? [],
                      srs_profile: remoteProfile.srs_profile ?? 'standard',
                      daily_limit: remoteProfile.daily_limit ?? 0,
                      priority_config: remoteProfile.priority_config ?? null,
                      role: remoteProfile.role,
                      full_name: remoteProfile.full_name,
                      avatar_url: remoteProfile.avatar_url,
                      specialty: remoteProfile.specialty,
                      id: remoteProfile.id
                  };
                  
                  await localDB.put('profiles', localProfile);
                  syncProfileToLocalStorage(localProfile);
                  set({ user: localProfile });
              }
            } catch (err) {
              console.warn("Falha ao atualizar perfil remoto:", err);
            }
        }
          
        if (localProfile) {
          if (localProfile.status === 'pending' || localProfile.deleted_at) {
             await supabase.auth.signOut();
             set({ user: null });
             return;
          }
          
          if (navigator.onLine) {
            setTimeout(() => syncEngine.startSync(), 500);
            updateLastSeen(localProfile.id);
          }
        }
      } else {
        // Modo Offline ou token expirado sem internet:
        // Verifica se há perfil armazenado localmente para manter a navegação do usuário ativa
        const lastUserId = localStorage.getItem('neuro_last_user_id');
        let offlineProfile: any = null;
        if (lastUserId) {
          offlineProfile = await localDB.get('profiles', lastUserId);
        }
        if (!offlineProfile) {
          const allProfiles = await localDB.getAll('profiles');
          if (allProfiles.length > 0) offlineProfile = allProfiles[0];
        }

        if (offlineProfile && (!navigator.onLine || !offlineProfile.deleted_at)) {
          console.log("[Auth] Restaurando perfil ativo do cache local (modo offline):", offlineProfile.email);
          set({ user: offlineProfile });
        } else {
          set({ user: null });
        }
      }
    } catch (e) {
      console.error("Erro ao validar sessão:", e);
      const allProfiles = await localDB.getAll('profiles');
      if (allProfiles.length > 0) {
        set({ user: allProfiles[0] });
      } else {
        set({ user: null });
      }
    } finally {
      set({ loading: false, initialized: true });
    }
  }
}));
