
import { create } from 'zustand';

interface FocusState {
  isActive: boolean;
  timeLeft: number;
  mode: 'Pomodoro' | 'Short Break' | 'Long Break';
  subject: string;
  isFloating: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setMode: (mode: 'Pomodoro' | 'Short Break' | 'Long Break') => void;
  setSubject: (subject: string) => void;
  toggleFloating: (val: boolean) => void;
}

const TIMES = {
  'Pomodoro': 25 * 60,
  'Short Break': 5 * 60,
  'Long Break': 15 * 60
};

export const useFocusStore = create<FocusState>((set, get) => ({
  isActive: false,
  timeLeft: 25 * 60,
  mode: 'Pomodoro',
  subject: 'Geral',
  isFloating: false,

  startTimer: () => set({ isActive: true, isFloating: true }),
  pauseTimer: () => set({ isActive: false }),
  resetTimer: () => set({ isActive: false, timeLeft: TIMES[get().mode] }),
  
  tick: () => set((state) => {
    if (state.timeLeft <= 0) {
      return { isActive: false, timeLeft: 0 };
    }
    return { timeLeft: state.timeLeft - 1 };
  }),

  setMode: (mode) => set({ 
    mode, 
    isActive: false, 
    timeLeft: TIMES[mode] 
  }),

  setSubject: (subject) => set({ subject }),
  toggleFloating: (isFloating) => set({ isFloating })
}));
