import { localDB } from './localDB';
import { useAuthStore } from '../store/useAuthStore';
import { syncEngine } from './syncEngine';

// Valores Rebalanceados para Meritocracia
export const XP_VALUES = {
  QUESTION_CORRECT: 15,       // Reduzido de 30. Requer acerto.
  QUESTION_WRONG: 0,          // Reduzido de 10. Erro não gera XP.
  FLASHCARD_REVIEW: 5,        // Reduzido de 15. Ação rápida deve ter valor menor.
  SUMMARY_CREATE: 50,         // Criação de conteúdo autoral.
  VIDEO_COMPLETE: 50,         // Reduzido de 150. Aprendizado passivo.
  SIMULATION_COMPLETE: 100,   // Base por terminar. O resto vem dos acertos.
  BONUS_COMPLETE: 0.2,        // Bônus de 20% ao completar sessão com sucesso.
  STREAK_BONUS_DAILY: 30,
  STREAK_3_BONUS: 100,
  STREAK_7_BONUS: 300,
  STREAK_30_BONUS: 1000,      // Novo
  STREAK_100_BONUS: 5000,     // Novo
  STREAK_365_BONUS: 20000,    // Novo
  PERFECT_SCORE: 100,         
  COMMUNITY_SHARE: 10         
};

export const MEDALS = {
    'streak_3': { id: 'streak_3', label: 'Disciplina Iniciante', desc: '3 dias consecutivos', icon: 'Medal', color: 'text-amber-600', bg: 'bg-amber-100' },
    'streak_7': { id: 'streak_7', label: 'Semana Perfeita', desc: '7 dias consecutivos', icon: 'Award', color: 'text-slate-400', bg: 'bg-slate-100' },
    'streak_30': { id: 'streak_30', label: 'Mestre do Hábito', desc: '30 dias consecutivos', icon: 'Trophy', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    'streak_100': { id: 'streak_100', label: 'Centurião Clínico', desc: '100 dias de foco', icon: 'Crown', color: 'text-rose-500', bg: 'bg-rose-100' },
    'streak_365': { id: 'streak_365', label: 'Lenda Imortal', desc: '1 ano de excelência', icon: 'Zap', color: 'text-purple-600', bg: 'bg-purple-100' }
};

export const XP_LEGEND = [
    { label: 'Questão Correta', val: '+15 XP' },
    { label: 'Questão (Erro)', val: '0 XP' },
    { label: 'Flashcard (Sessão)', val: '+5 XP/Card' },
    { label: 'Vídeo Aula', val: '+50 XP' },
    { label: 'Simulado (Base)', val: '+100 XP' },
    { label: 'Bônus Diário', val: '+30 XP (+ Streak)' },
];

// Sistema de Patentes Médicas (20 Níveis)
export const MEDICAL_RANKS = [
    { level: 1, title: 'Calouro da Sinapse', minXp: 0 },
    { level: 2, title: 'Observador do Axônio', minXp: 300 },
    { level: 3, title: 'Aprendiz de Glia', minXp: 800 },
    { level: 4, title: 'Explorador do Sulco', minXp: 1500 },
    { level: 5, title: 'Guardião da Mielina', minXp: 2500 },
    { level: 6, title: 'Analista de Potencial', minXp: 4000 },
    { level: 7, title: 'Tecelão de Dendritos', minXp: 6000 },
    { level: 8, title: 'Engenheiro de Redes', minXp: 9000 },
    { level: 9, title: 'Mestre do Lobo Frontal', minXp: 13000 },
    { level: 10, title: 'Sábio do Hipocampo', minXp: 18000 },
    { level: 11, title: 'Oráculo do Tronco', minXp: 25000 },
    { level: 12, title: 'Regente dos Neurotransmissores', minXp: 35000 },
    { level: 13, title: 'Grão-Mestre da Plasticidade', minXp: 50000 },
    { level: 14, title: 'Visconde da Substância Cinzenta', minXp: 70000 },
    { level: 15, title: 'Lorde do Connectoma', minXp: 100000 },
    { level: 16, title: 'Titã da Neurociência', minXp: 150000 },
    { level: 17, title: 'Lenda do Córtex', minXp: 220000 },
    { level: 18, title: 'A Singularidade Clínica', minXp: 350000 },
    { level: 19, title: 'O Neuro-Onisciente', minXp: 500000 },
    { level: 20, title: 'Deus Ex Machina Neural', minXp: 1000000 }
];

type XPListener = (amount: number, label: string) => void;

class XPService {
  private listeners: XPListener[] = [];

  subscribe(listener: XPListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(amount: number, label: string) {
    this.listeners.forEach(l => l(amount, label));
  }

  public getLevelInfo(xp: number) {
      let currentInfo = MEDICAL_RANKS[0];
      for (let i = MEDICAL_RANKS.length - 1; i >= 0; i--) {
          if (xp >= MEDICAL_RANKS[i].minXp) {
              currentInfo = MEDICAL_RANKS[i];
              break;
          }
      }
      return currentInfo;
  }

  async addXP(amount: number, label: string, category: string = 'Geral') {
    const { user, updateProfile } = useAuthStore.getState();
    if (!user || amount <= 0) return;

    const roundedAmount = Math.round(amount);
    const currentXP = (user.xp || 0) + roundedAmount;
    
    const levelInfo = this.getLevelInfo(currentXP);

    const updatedProfile = { 
        ...user, 
        xp: currentXP, 
        level: levelInfo.level, 
        rank: levelInfo.title 
    };

    updateProfile(updatedProfile);
    this.notify(roundedAmount, label);

    try {
        const historyItem = {
            id: crypto.randomUUID(),
            user_id: user.id,
            amount: roundedAmount,
            label,
            category,
            created_at: new Date().toISOString()
        };

        await localDB.put('xp_history', historyItem);
        // CRITICAL FIX: Enfileirar a sincronização do histórico
        await syncEngine.enqueue('xp_history', historyItem);
        
        if (navigator.onLine) {
            syncEngine.startSync(true);
        }

    } catch (e) {
        console.error("Erro ao processar XP:", e);
    }
  }

  async getHistory() {
      return await localDB.getAll('xp_history');
  }
}

export const xpService = new XPService();