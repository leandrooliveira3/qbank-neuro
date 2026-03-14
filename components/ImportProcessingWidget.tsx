
import React from 'react';
import { useImportStore } from '../store/useImportStore';
import { questionProcessor } from '../services/questionProcessor';
import { useNavigate, useLocation } from 'react-router';
import { Loader2, Minimize2, CheckCircle2, AlertTriangle, FileText, XCircle, Maximize2, Zap } from 'lucide-react';

export const ImportProcessingWidget: React.FC = () => {
  const { isProcessing, isMinimized, progress, statusMessage, results, minimize, maximize, clearAll, errors } = useImportStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Ocultar widget se estiver na página de importação (para não sobrepor a UI principal)
  if (location.pathname === '/import') return null;

  if (!isProcessing && results.length === 0 && errors.length === 0) return null;

  const handleNavigate = () => {
      navigate('/import');
      if (!isProcessing) maximize();
  };

  const handleMinimize = (e: React.MouseEvent) => {
      e.stopPropagation();
      minimize();
  };

  const handleCancel = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Cancelar processamento em andamento?')) {
          questionProcessor.cancel(); // Cancela o worker
          clearAll(); // Limpa a store
      }
  };

  const handleReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/import');
    maximize();
  };

  if (isMinimized) {
    return (
      <div 
        onClick={handleNavigate}
        className="fixed bottom-6 right-6 z-[200] bg-slate-900 text-white p-3 rounded-full shadow-2xl cursor-pointer hover:scale-110 transition-transform border-2 border-emerald-500 flex items-center justify-center animate-in slide-in-from-bottom-10 group"
        title="Clique para ver detalhes"
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        ) : (
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        )}
        <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-slate-900">
            {results.length}
        </span>
      </div>
    );
  }

  return (
    <div 
        onClick={handleNavigate}
        className="fixed bottom-6 right-6 z-[200] w-80 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-right-10 flex flex-col cursor-pointer transition-transform hover:scale-[1.02]"
    >
      <div className="bg-slate-900 p-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
            {isProcessing ? <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            <span className="text-xs font-black text-white uppercase tracking-widest">
                {isProcessing ? 'IA em Background' : 'IA Concluída'}
            </span>
        </div>
        <div className="flex gap-2">
            <button onClick={handleMinimize} className="text-slate-400 hover:text-white p-1"><Minimize2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-1">
                <span>Progresso Global</span>
                <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${isProcessing ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                    style={{ width: `${progress}%` }} 
                />
            </div>
            <p className="text-[10px] font-medium text-slate-400 mt-2 truncate">
                {isProcessing ? (statusMessage || 'Analisando dados...') : 'Pronto para revisão.'}
            </p>
        </div>

        {/* Dica de Background */}
        {isProcessing && (
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                <Zap className="h-3 w-3 text-emerald-500 shrink-0" />
                <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight">
                    Extraindo dados em segundo plano.
                </p>
            </div>
        )}

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl">
            <div className="flex items-center gap-2">
                <div className="bg-white dark:bg-black p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                    <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">{results.length} Itens</p>
                    <p className="text-[8px] font-bold text-slate-400">Extraídos até agora</p>
                </div>
            </div>
            {errors.length > 0 && (
                <div className="flex items-center gap-1 text-red-500 text-[9px] font-black">
                    <AlertTriangle className="h-3 w-3" /> {errors.length} Falhas
                </div>
            )}
        </div>

        <div className="flex gap-2">
            <button onClick={handleCancel} className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-red-500 flex items-center justify-center gap-1">
                <XCircle className="h-3 w-3" /> {isProcessing ? 'Parar' : 'Limpar'}
            </button>
            
            {/* Botão REVISAR sempre visível se houver resultados, mesmo processando */}
            {(results.length > 0) && (
                <button onClick={handleReview} className="flex-1 py-2 rounded-lg bg-primary text-white text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700 flex items-center justify-center gap-1">
                    <Maximize2 className="h-3 w-3" /> Revisar ({results.length})
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
