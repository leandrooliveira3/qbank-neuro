
import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { LogOut, Moon, Sun, Menu, CheckCircle2, CloudOff, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigate } from 'react-router';
import { syncEngine, SyncStatus } from '../services/syncEngine';
import { FloatingTimer } from './FloatingTimer';
import { XPNotification } from './XPNotification';
import { ImportProcessingWidget } from './ImportProcessingWidget'; // Import Widget

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  fullWidth?: boolean; 
}

export const Layout: React.FC<LayoutProps> = ({ children, title, fullWidth = false }) => {
  const { logout } = useAuthStore();
  const { theme, toggleTheme, applyTheme } = useThemeStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    applyTheme(theme);
    const handleOnline = () => { setIsOnline(true); syncEngine.startSync(true); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    syncEngine.setListener((status) => setSyncStatus(status));
    
    // Trigger sync on layout mount to synchronize across devices
    if (navigator.onLine) {
      syncEngine.startSync(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-screen w-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex overflow-hidden text-sm md:text-base">
      <div className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)} />
      <div className={`fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-black transform transition-transform duration-300 md:relative md:translate-x-0 md:w-56 md:shrink-0 border-r border-slate-200 dark:border-zinc-900 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <XPNotification />
        {/* WIDGET IMPORTAÇÃO GLOBAL */}
        <ImportProcessingWidget />
        
        <header className="h-14 shrink-0 border-b border-slate-200 dark:border-zinc-900 bg-white dark:bg-black px-4 md:px-6 flex items-center justify-between z-50 shadow-sm">
          <div className="flex items-center min-w-0">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 mr-2 text-slate-600 dark:text-slate-400 md:hidden hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg shrink-0">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col min-w-0">
              <h2 className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] truncate">{title}</h2>
              <div className="flex items-center mt-0.5 truncate">
                {!isOnline ? (
                  <div className="flex items-center text-orange-600 text-[7px] font-black uppercase tracking-widest">
                    <CloudOff className="h-2 w-2 mr-1" /> Offline
                  </div>
                ) : syncStatus === 'syncing' ? (
                  <div className="flex items-center text-primary text-[7px] font-black uppercase tracking-widest">
                    <RefreshCw className="h-2 w-2 mr-1 animate-spin" /> Sync...
                  </div>
                ) : (
                  <div className="flex items-center text-slate-400 text-[7px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="h-2 w-2 mr-1" /> Online
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-primary rounded-lg bg-slate-50 dark:bg-zinc-900">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 rounded-lg bg-slate-50 dark:bg-zinc-900">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className={`flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-background-dark ${fullWidth ? 'p-0' : 'p-3 md:p-6'}`}>
          {fullWidth ? (
             children
          ) : (
            <div className="max-w-[1600px] 2xl:max-w-[2000px] mx-auto w-full h-full flex flex-col">
              {children}
            </div>
          )}
        </div>
      </main>
      <FloatingTimer />
    </div>
  );
};
