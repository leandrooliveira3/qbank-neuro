
import React, { useEffect, useState } from 'react';
import { xpService } from '../services/xpService';
import { Star, Sparkles, ArrowUp } from 'lucide-react';

export const XPNotification: React.FC = () => {
  const [notification, setNotification] = useState<{ amount: number, label: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = xpService.subscribe((amount, label) => {
      setNotification({ amount, label });
      setVisible(true);
      
      // Duração de 5 segundos conforme solicitado
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setNotification(null), 500); // Wait for fade out
      }, 5000);

      return () => clearTimeout(timer);
    });
    return unsub;
  }, []);

  if (!notification && !visible) return null;

  return (
    <div 
      className={`fixed top-24 right-6 z-[9999] transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) transform ${
        visible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-20 opacity-0 scale-90'
      }`}
    >
      <div className="relative bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-0.5 rounded-[1.5rem] shadow-2xl shadow-purple-500/40">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[1.4rem] px-5 py-3 flex items-center gap-4 relative overflow-hidden min-w-[220px] border border-white/10">
            
            {/* Background Glow */}
            <div className="absolute -left-4 -top-4 w-16 h-16 bg-purple-500/40 blur-xl rounded-full animate-pulse"></div>
            
            <div className="relative flex items-center justify-center h-10 w-10 bg-purple-500 rounded-full shadow-lg shadow-purple-500/30 shrink-0">
                <ArrowUp className="h-6 w-6 text-white animate-bounce" />
            </div>
            
            <div className="relative z-10 flex-1">
                <h4 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white flex items-center">
                    +{notification?.amount} <span className="text-xs ml-1 not-italic text-purple-300 font-bold">XP</span>
                </h4>
                <p className="text-[9px] font-bold text-white/80 uppercase tracking-widest truncate max-w-[140px]">{notification?.label}</p>
            </div>

            <Sparkles className="absolute top-2 right-2 h-3 w-3 text-yellow-300 opacity-80 animate-spin-slow" />
        </div>
      </div>
    </div>
  );
};
