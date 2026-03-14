import { create } from 'zustand';
import { AIImportedQuestion } from '../types';

interface ImportState {
  isProcessing: boolean;
  isMinimized: boolean;
  progress: number;
  totalChunks: number;
  processedChunks: number;
  statusMessage: string;
  results: AIImportedQuestion[];
  errors: string[];
  
  startProcess: (totalChunks: number) => void;
  updateProgress: (processed: number, message: string) => void;
  incrementProgress: (message: string) => void;
  addResults: (newQuestions: AIImportedQuestion[]) => void;
  updateResult: (index: number, question: AIImportedQuestion) => void;
  removeResult: (index: number) => void;
  setResults: (results: AIImportedQuestion[]) => void;
  addError: (error: string) => void;
  finishProcess: () => void;
  minimize: () => void;
  maximize: () => void;
  reset: () => void;
  clearAll: () => void;
}

const cleanAlternativeText = (text: string) => {
    if (!text) return 'Alternativa vazia';
    return text.replace(/^([a-eA-E0-9]{1,2}[.\)\-\s]+)/, '').trim() || text;
};

const getQuestionFingerprint = (text: string) => {
    if (!text) return Math.random().toString();
    return text
        .toLowerCase()
        .replace(/^(quest[aã]o\s*)?\d+[\s.)-:]*/i, '') 
        .replace(/[\s\t\n\r\W_]/g, '') 
        .substring(0, 150); 
};

export const useImportStore = create<ImportState>((set) => ({
  isProcessing: false,
  isMinimized: false,
  progress: 0,
  totalChunks: 0,
  processedChunks: 0,
  statusMessage: '',
  results: [],
  errors: [],

  startProcess: (totalChunks) => set({ 
    isProcessing: true, 
    isMinimized: false,
    totalChunks: totalChunks > 0 ? totalChunks : 1,
    processedChunks: 0, 
    progress: 0, 
    results: [], 
    errors: [],
    statusMessage: 'Iniciando extração...'
  }),

  incrementProgress: (message) => set((state) => {
    const nextProcessed = state.processedChunks + 1;
    const safeTotal = state.totalChunks > 0 ? state.totalChunks : 1;
    const rawProgress = Math.round((nextProcessed / safeTotal) * 100);
    return {
        processedChunks: nextProcessed,
        progress: Math.min(100, Math.max(0, rawProgress)),
        statusMessage: message
    };
  }),

  updateProgress: (processed, message) => set((state) => {
    const safeTotal = state.totalChunks > 0 ? state.totalChunks : 1;
    const rawProgress = Math.round((processed / safeTotal) * 100);
    return {
        processedChunks: processed,
        progress: Math.min(100, Math.max(0, rawProgress)),
        statusMessage: message
    };
  }),

  addResults: (newQuestions) => set((state) => {
    const existingFingerprints = new Set(state.results.map(q => getQuestionFingerprint(q.enunciado)));
    
    const processedIncoming = newQuestions.map(q => ({
        ...q,
        alternativas: Array.isArray(q.alternativas) 
            ? q.alternativas.map(alt => cleanAlternativeText(String(alt))) 
            : []
    }));

    const uniqueIncoming = processedIncoming.filter(newQ => {
      const fp = getQuestionFingerprint(newQ.enunciado);
      if (!fp || existingFingerprints.has(fp)) return false;
      existingFingerprints.add(fp);
      return true;
    });

    return {
      results: [...state.results, ...uniqueIncoming]
    };
  }),

  updateResult: (index, question) => set((state) => {
    const newResults = [...state.results];
    if (newResults[index]) {
        newResults[index] = {
            ...question,
            alternativas: (question.alternativas || []).map(alt => cleanAlternativeText(String(alt)))
        };
    }
    return { results: newResults };
  }),

  removeResult: (index) => set((state) => {
    const newResults = [...state.results];
    newResults.splice(index, 1);
    return { results: newResults };
  }),

  setResults: (results) => set({ 
    results: results.map(q => ({
        ...q,
        alternativas: (q.alternativas || []).map(alt => cleanAlternativeText(String(alt)))
    }))
  }),

  addError: (error) => set((state) => ({
    errors: [...state.errors, error]
  })),

  finishProcess: () => set({
    isProcessing: false,
    progress: 100,
    statusMessage: 'Extração Concluída!'
  }),

  minimize: () => set({ isMinimized: true }),
  maximize: () => set({ isMinimized: false }),
  
  reset: () => set({ 
    isProcessing: false, 
    progress: 0, 
    statusMessage: '',
    totalChunks: 0,
    processedChunks: 0
  }),

  clearAll: () => set({
    isProcessing: false,
    isMinimized: false,
    progress: 0,
    totalChunks: 0,
    processedChunks: 0,
    statusMessage: '',
    results: [],
    errors: []
  })
}));