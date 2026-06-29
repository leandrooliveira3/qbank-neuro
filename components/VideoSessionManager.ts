import { useEffect } from 'react';

// Chave para armazenar o estado da sessão de vídeo localmente
const SESSION_KEY = 'neuro_video_session_recovery';

export const useVideoSessionManager = (
    activeVideo: any, 
    setActiveVideo: (v: any) => void,
    watchTime: number
) => {
    // 1. Salvar estado periodicamente
    useEffect(() => {
        if (!activeVideo) {
            localStorage.removeItem(SESSION_KEY);
            return;
        }

        const saveState = () => {
            try {
                localStorage.setItem(SESSION_KEY, JSON.stringify({
                    video: activeVideo,
                    watchTime: watchTime,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.error("Erro ao salvar sessão do vídeo", e);
            }
        };

        saveState();
        const interval = setInterval(saveState, 5000);
        
        const handlePageHide = () => saveState();
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('freeze', handlePageHide);

        return () => {
            clearInterval(interval);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('freeze', handlePageHide);
        };
    }, [activeVideo, watchTime]);

    // 2. Restaurar estado em caso de recarregamento (Safari tab discard)
    useEffect(() => {
        if (!activeVideo) {
            try {
                const stored = localStorage.getItem(SESSION_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Restaurar apenas se a sessão for recente (ex: menos de 2 horas)
                    if (Date.now() - parsed.timestamp < 2 * 60 * 60 * 1000) {
                        console.log("Restaurando sessão de vídeo descartada pelo Safari...");
                        setActiveVideo(parsed.video);
                        // A posição (watchTime) será restaurada via progressMap ou pelo próprio hook em Videos.tsx
                    } else {
                        localStorage.removeItem(SESSION_KEY);
                    }
                }
            } catch (e) {
                console.error("Erro ao restaurar sessão de vídeo", e);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Executar apenas na montagem
};
