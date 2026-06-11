import React, { useState, useEffect } from 'react';
import { storageService, StorageFolder } from '../services/storage';
import { Search, X, Loader2, Image as ImageIcon, Check, FolderOpen, AlertCircle, RefreshCw } from 'lucide-react';

interface CloudImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

export const CloudImagePicker: React.FC<CloudImagePickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Biblioteca de Imagens na Nuvem"
}) => {
  const [activeFolder, setActiveFolder] = useState<StorageFolder>('flashcards');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const folders: { id: StorageFolder; label: string }[] = [
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'questions', label: 'Questões / Casos Clínicos' },
    { id: 'library', label: 'Documentos' },
  ];

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const urls = await storageService.listImages(activeFolder);
      setImages(urls);
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível carregar as imagens do banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, activeFolder]);

  // Extract a readable filename from the Supabase public URL
  const getDisplayFilename = (url: string) => {
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split('/');
      const last = parts[parts.length - 1];
      // If it looks like a UUID or random hash, make it shorter/prettier or just show a cropped format
      if (last.length > 25) {
        return last.substring(0, 15) + '...' + last.substring(last.length - 8);
      }
      return last;
    } catch {
      return 'Imagem';
    }
  };

  const filteredImages = images.filter(url => {
    const filename = getDisplayFilename(url).toLowerCase();
    return filename.includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-zinc-950 border border-slate-250 dark:border-zinc-900 rounded-[2rem] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50/50 dark:bg-black/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-905 dark:text-white uppercase text-xs tracking-wider leading-none">
                {title}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1 tracking-wide">
                Selecione uma imagem já presente no Supabase
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-400 hover:text-red-500 transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Tabs bar */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-900 space-y-4">
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-100 dark:border-zinc-900 pb-3 overflow-x-auto custom-scrollbar">
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f.id)}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                  activeFolder === f.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar imagem pelo nome do arquivo..."
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-850 p-2.5 pl-10 rounded-xl text-xs font-semibold focus:border-primary focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchImages}
              disabled={loading}
              className="px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all whitespace-nowrap"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-black/10 custom-scrollbar min-h-[300px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center p-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary mb-3" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Carregando imagens do Supabase...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/10 border border-dashed border-red-200 dark:border-red-900/30 rounded-2xl max-w-md mx-auto my-6">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-xs font-black text-red-650 dark:text-red-400 uppercase tracking-wide leading-relaxed">
                {error}
              </p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <ImageIcon className="h-10 w-10 text-slate-300 dark:text-zinc-700 mb-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Nenhuma imagem encontrada
              </p>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-wider mt-1.5">
                {searchQuery ? 'Tente ajustar sua busca por nome.' : `A pasta '${activeFolder}' no bucket está vazia.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredImages.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelect(url)}
                  className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-primary hover:shadow-md cursor-pointer transition-all group flex flex-col"
                >
                  {/* Image wrapper */}
                  <div className="aspect-video bg-slate-100 dark:bg-black/50 flex items-center justify-center overflow-hidden border-b border-slate-105 dark:border-zinc-800 relative">
                    <img
                      src={url}
                      alt="Thumbnail"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-350"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                    <div className="absolute bottom-2 right-2 bg-primary text-white p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                  {/* Image info */}
                  <div className="p-2 min-w-0">
                    <p className="text-[9px] font-bold text-slate-700 dark:text-zinc-300 truncate tracking-wide" title={getDisplayFilename(url)}>
                      {getDisplayFilename(url)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
