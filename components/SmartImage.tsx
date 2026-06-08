
import React, { useState, useEffect } from 'react';
import { mediaService } from '../services/mediaService';
import { ImageIcon, Loader2, AlertCircle, Maximize2, X } from 'lucide-react';

interface SmartImageProps {
  url?: string;
  alt: string;
  className?: string;
  showSkeleton?: boolean;
  onDoubleClick?: () => void;
}

export const SmartImage: React.FC<SmartImageProps> = ({ url, alt, className = "", showSkeleton = true, onDoubleClick }) => {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    mediaService.getImageUrl(url)
      .then(finalUrl => {
        if (isMounted) {
          setSrc(finalUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (!url) return null;

  if (loading && showSkeleton) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-zinc-900 rounded-2xl animate-pulse ${className}`}>
        <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/20 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/40 p-4 ${className}`}>
        <AlertCircle className="h-6 w-6 text-red-400 mb-2" />
        <span className="text-[8px] font-black uppercase text-red-400 text-center tracking-widest">Mídia Indisponível</span>
      </div>
    );
  }

  return (
    <>
      <div 
        className="relative group overflow-hidden rounded-xl border border-slate-200/50 dark:border-zinc-800 bg-black/5 dark:bg-black/40 flex items-center justify-center cursor-zoom-in inline-block select-none max-w-full"
        onClick={(e) => {
          e.stopPropagation();
          setIsFullscreen(true);
        }}
      >
        <img 
          src={src} 
          alt={alt} 
          className={`${className} max-h-full max-w-full object-contain block transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalHeight > img.naturalWidth) {
              setIsVertical(true);
            }
          }}
          onError={() => setError(true)}
          onDoubleClick={onDoubleClick}
        />
        
        {isVertical && (
          <div className="absolute top-2 left-2 right-2 bg-amber-500/95 dark:bg-amber-600/95 text-white py-1 px-2.5 rounded-md text-[8px] font-black uppercase tracking-wider shadow-md flex items-center justify-between z-10 animate-bounce pointer-events-none">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5" /> Imagem longa: clique para ver em tela cheia
            </span>
            <Maximize2 className="h-2.5 w-2.5" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
          <span className="bg-zinc-900/90 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-zinc-800 flex items-center gap-1 shadow-md">
            <Maximize2 className="h-2.5 w-2.5" /> Ampliar Imagem
          </span>
        </div>
      </div>

      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="absolute top-4 right-4 z-[10000]">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
              className="p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider border border-zinc-800"
            >
              <X className="h-5 w-5" /> Fechar
            </button>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-800/40 text-[9px] font-black text-slate-300 uppercase tracking-widest text-center shadow-lg pointer-events-none">
            Toque em qualquer lugar fora para voltar
          </div>

          <div className="relative max-h-[85vh] max-w-[95vw] shadow-2xl rounded-2xl bg-black flex items-center justify-center overflow-auto">
            <div className="relative inline-block max-h-[85vh] max-w-[95vw] min-w-[200px]" onClick={(e) => e.stopPropagation()}>
              <img 
                src={src} 
                alt={alt} 
                className="max-h-[85vh] max-w-[95vw] object-contain block rounded-xl shadow-inner"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};