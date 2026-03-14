
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigate } from 'react-router';
import { supabase } from '../services/supabase';
import { 
  Brain, Moon, Sun, 
  ArrowRight, Loader2,
  AlertCircle, UserPlus, CheckCircle2,
  ArrowLeft, Info
} from 'lucide-react';
import { SPECIALTIES, TOOLS_CATEGORIES } from '../constants';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, applyTheme } = useThemeStore();
  const { user, login, loading: authLoading } = useAuthStore();
  
  const [view, setView] = useState<'portal' | 'auth' | 'register'>('portal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regSpecialty, setRegSpecialty] = useState('Neurologia');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => { applyTheme(theme); }, [theme]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('Preencha todos os campos.'); return; }
    
    // Login já redireciona internamente se sucesso
    const result = await login(email.trim(), password);
    if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Credenciais inválidas.');
    } else {
        // Redirecionamento de segurança caso o store não tenha feito
        navigate('/');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccessMsg(null);

      if (!email || !password || !regName || !regSurname || !regSpecialty) {
          setError('Todos os campos são obrigatórios.');
          return;
      }
      if (password.length < 6) {
          setError('A senha deve ter no mínimo 6 caracteres.');
          return;
      }

      setLocalLoading(true);
      try {
          const fullName = `${regName.trim()} ${regSurname.trim()}`;
          const { error: signUpError } = await supabase.auth.signUp({
              email: email.trim(),
              password: password,
              options: {
                  data: { 
                      full_name: fullName,
                      specialty: regSpecialty 
                  }
              }
          });

          if (signUpError) throw signUpError;

          setSuccessMsg('Conta criada com sucesso! Aguarde a liberação do administrador para acessar.');
          // Limpa form
          setRegName(''); setRegSurname(''); setEmail(''); setPassword('');
          setTimeout(() => setView('auth'), 5000);

      } catch (err: any) {
          setError(err.message || "Erro ao criar conta.");
      } finally {
          setLocalLoading(false);
      }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-950 dark:text-slate-100 overflow-hidden transition-colors relative">
      
      {/* LOADING OVERLAY */}
      {authLoading && (
          <div className="absolute inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Autenticando...</p>
          </div>
      )}

      <nav className="h-14 shrink-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('portal')}>
          <div className="bg-primary p-1.5 rounded-lg"><Brain className="h-4 w-4 text-white" /></div>
          <h1 className="text-base font-black tracking-tighter">Neuro<span className="text-primary">Portal</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 bg-slate-100 dark:bg-zinc-900 rounded-lg text-slate-500">{theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}</button>
          <button onClick={() => user ? navigate('/') : setView('auth')} className="bg-primary text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">{user ? 'Dashboard' : 'Entrar'}</button>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden relative">
        {view === 'portal' && (
          <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 lg:p-12 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-10">Ferramentas <br/><span className="text-primary">NeuroClínicas</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
                {TOOLS_CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => navigate(cat.path)} className="w-full text-left bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-[1.5rem] shadow-sm hover:border-primary group transition-all">
                    <div className={`w-10 h-10 rounded-xl ${cat.bgLight} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}><cat.icon className={`h-5 w-5 ${cat.text}`} /></div>
                    <h4 className="font-black text-sm mb-1">{cat.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 mb-4 font-medium">{cat.desc}</p>
                    <div className={`inline-flex items-center text-[8px] font-black uppercase ${cat.text}`}>Acessar <ArrowRight className="h-3 w-3 ml-1" /></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'auth' && (
          <div className="h-full flex items-center justify-center p-4 bg-slate-50 dark:bg-black animate-in fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-2xl">
              <div className="text-center mb-6"><h2 className="text-2xl font-black">Neuro<span className="text-primary">QBank</span></h2></div>
              
              {successMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{successMsg}</p>
                  </div>
              )}

              {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-red-600 dark:text-red-400 leading-tight">{error}</p>
                  </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl p-3 text-xs font-bold bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 focus:border-primary outline-none" />
                  <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl p-3 text-xs font-bold bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 focus:border-primary outline-none" />
                  <button type="submit" disabled={authLoading} className="w-full bg-primary text-white font-black py-4 rounded-xl text-[9px] uppercase tracking-widest shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                      ENTRAR
                  </button>
              </form>
              
              <div className="mt-6 text-center">
                  <button onClick={() => { setError(null); setView('register'); }} className="text-[9px] font-black uppercase text-slate-400 hover:text-primary transition-colors">
                      Não tem conta? Criar Acesso
                  </button>
              </div>
            </div>
          </div>
        )}

        {view === 'register' && (
          <div className="h-full flex items-center justify-center p-4 bg-slate-50 dark:bg-black animate-in slide-in-from-right-4">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-2xl relative">
              <button onClick={() => setView('auth')} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-primary"><ArrowLeft className="h-4 w-4" /></button>
              
              <div className="text-center mb-6">
                  <h2 className="text-xl font-black uppercase tracking-tight">Criar Acesso</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Solicitação Acadêmica</p>
              </div>

              {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-red-600 dark:text-red-400 leading-tight">{error}</p>
                  </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Nome" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full rounded-xl p-3 text-xs font-bold bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 focus:border-primary outline-none" required />
                      <input type="text" placeholder="Sobrenome" value={regSurname} onChange={(e) => setRegSurname(e.target.value)} className="w-full rounded-xl p-3 text-xs font-bold bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 focus:border-primary outline-none" required />
                  </div>
                  
                  <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Especialidade (Obrigatório)</label>
                      <select 
                          value={regSpecialty} 
                          onChange={e => setRegSpecialty(e.target.value)} 
                          className="w-full rounded-xl p-3 text-xs font-bold bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 focus:border-primary outline-none appearance-none"
                          required
                      >
                          {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>

                  <input type="email" placeholder="E-mail Institucional" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl p-3 text-xs font-bold bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 focus:border-primary outline-none" required />
                  <input type="password" placeholder="Senha (Mín 6)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl p-3 text-xs font-bold bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 focus:border-primary outline-none" required />
                  
                  <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800">
                      <p className="text-[8px] font-medium text-slate-500 leading-tight">
                          <Info className="h-3 w-3 inline mr-1 mb-0.5 text-primary" />
                          Seu cadastro será analisado pelo administrador antes da liberação do acesso.
                      </p>
                  </div>

                  <button type="submit" disabled={localLoading} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl text-[9px] uppercase tracking-widest shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                      {localLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />} SOLICITAR ACESSO
                  </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
