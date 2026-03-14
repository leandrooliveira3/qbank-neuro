
import React, { useEffect } from 'react';
import { useFocusStore } from '../store/useFocusStore';
import { Play, Pause, RotateCcw, X, Maximize2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

export const FloatingTimer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive, timeLeft, mode, tick, startTimer, pauseTimer, resetTimer, isFloating, toggleFloating } = useFocusStore();

  useEffect(() => {
    let interval: number;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(tick, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, tick]);

  if (!isFloating || location.pathname === '/focus') return null;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (mode === 'Pomodoro' ? 25 * 60 : 5 * 60)) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-10">
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border-2 border-primary/30 w-48 overflow-hidden relative">
        <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-[8px] font-black uppercase tracking-widest text-primary">{mode}</span>
          <div className="flex gap-1">
            <button onClick={() => navigate('/focus')} className="p-1 hover:bg-white/10 rounded-md"><Maximize2 className="h-3 w-3" /></button>
            <button onClick={() => toggleFloating(false)} className="p-1 hover:bg-red-500/20 rounded-md"><X className="h-3 w-3" /></button>
          </div>
        </div>

        <div className="text-3xl font-black tracking-tighter text-center my-2 font-mono">
          {formatTime(timeLeft)}
        </div>

        <div className="flex justify-center gap-3 mt-3">
          <button 
            onClick={isActive ? pauseTimer : startTimer}
            className={`p-2 rounded-xl transition-all ${isActive ? 'bg-red-500/20 text-red-400' : 'bg-primary text-white'}`}
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={resetTimer} className="p-2 bg-white/10 rounded-xl hover:bg-white/20">
            <RotateCcw className="h-4 w-4 text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
