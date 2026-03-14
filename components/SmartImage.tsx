
import React, { useState, useEffect } from 'react';
import { mediaService } from '../services/mediaService';
import { ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface SmartImageProps {
  url?: string;
  alt: string;
  className?: string;
  showSkeleton?: boolean;
  // Added onDoubleClick prop to solve TypeScript errors in tool pages
  onDoubleClick?: () => void;
}

export const SmartImage: React.FC<SmartImageProps> = ({ url, alt, className = "", showSkeleton = true, onDoubleClick }) => {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
    <img 
      src={src} 
      alt={alt} 
      className={`${className} transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
      onError={() => setError(true)}
      // Added onDoubleClick handler to the img element
      onDoubleClick={onDoubleClick}
    />
  );
};