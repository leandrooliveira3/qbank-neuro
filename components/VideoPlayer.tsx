import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';

interface VideoPlayerProps {
    activeVideo: any;
    getYouTubeID: (url: string) => string | null;
    isDriveVideo: (url: string) => boolean;
    progressMap: Record<string, any>;
    updateWatchTime: (t: number) => void;
    setIsVideoPlaying: (playing: boolean) => void;
    navigateLesson: (direction: 'next' | 'prev') => void;
    playerRef: React.RefObject<HTMLIFrameElement>;
    videoRef: React.RefObject<HTMLVideoElement>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    activeVideo,
    getYouTubeID,
    isDriveVideo,
    progressMap,
    updateWatchTime,
    setIsVideoPlaying,
    navigateLesson,
    playerRef,
    videoRef
}) => {
    // Tratamento rigoroso de limpeza de memória e descarte
    useEffect(() => {
        const videoElement = videoRef.current;
        const iframeElement = playerRef.current;
        
        return () => {
            // Cleanup para <video>
            if (videoElement) {
                videoElement.pause();
                videoElement.removeAttribute('src');
                videoElement.load();
            }
            // Cleanup para <iframe>
            if (iframeElement) {
                iframeElement.src = 'about:blank';
            }
            
            // Garantir que Garbage Collector possa limpar buffers
            if (typeof window !== 'undefined' && (window as any).gc) {
                // Em alguns ambientes de dev
                try { (window as any).gc(); } catch (e) {}
            }
        };
    }, [activeVideo.id, playerRef, videoRef]);

    const ytId = getYouTubeID(activeVideo.url);
    const driveUrl = isDriveVideo(activeVideo.url);

    const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);

    useEffect(() => {
        if (!driveUrl) {
            setResolvedUrl(activeVideo.url);
            return;
        }

        let isMounted = true;
        setResolvedUrl(null);
        setIsLoadingUrl(true);

        const fetchDirectUrl = async () => {
            const fileIdMatch = activeVideo.url.match(/\/d\/([^/]+)/);
            const fileId = fileIdMatch ? fileIdMatch[1] : activeVideo.drive_file_id;

            if (fileId) {
                try {
                    const { data, error } = await supabase.functions.invoke('stream-drive-video', {
                        body: { fileId }
                    });
                    
                    if (isMounted) {
                        if (data && data.url && data.accessToken) {
                            setResolvedUrl(`${data.url}&access_token=${data.accessToken}`);
                        } else {
                            // Fallback for iframe if extraction fails
                            setResolvedUrl(activeVideo.url);
                        }
                    }
                } catch (err) {
                    if (isMounted) setResolvedUrl(activeVideo.url);
                }
            } else {
                if (isMounted) setResolvedUrl(activeVideo.url);
            }
            if (isMounted) setIsLoadingUrl(false);
        };

        fetchDirectUrl();
        
        return () => { isMounted = false; };
    }, [activeVideo.url, driveUrl, activeVideo.drive_file_id]);
    
    if (ytId) {
        return (
            <iframe 
                key={`yt-${activeVideo.id}`}
                ref={playerRef} 
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0&showinfo=0${progressMap[activeVideo.id]?.progress_seconds ? `&start=${Math.floor(progressMap[activeVideo.id].progress_seconds)}` : ''}`} 
                className="w-full h-full absolute inset-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen 
            />
        );
    }

    if (isLoadingUrl || !resolvedUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black absolute inset-0">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    // Se falhar ao obter a URL direta e continuar sendo o link do Drive (preview), usa iframe como fallback
    if (driveUrl && !resolvedUrl.includes('googleapis.com')) {
        return (
            <iframe 
                key={`drive-${activeVideo.id}`}
                ref={playerRef} 
                src={resolvedUrl} // Preview URL
                className="w-full h-full absolute inset-0 border-0" 
                allow="autoplay; fullscreen"
                allowFullScreen
            />
        );
    }

    // Usa a tag nativa de vídeo para todos os links diretos (incluindo o gerado pela API do Drive)
    return (
        <video 
            key={`raw-${activeVideo.id}`}
            ref={videoRef} 
            src={resolvedUrl}
            controls 
            controlsList="nodownload" 
            className="w-full h-full max-h-screen outline-none absolute inset-0" 
            autoPlay 
            onContextMenu={(e) => e.preventDefault()} 
            onEnded={() => navigateLesson('next')}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onPlaying={() => setIsVideoPlaying(true)}
            onTimeUpdate={(e) => updateWatchTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
                const t = progressMap[activeVideo.id]?.progress_seconds;
                if (t && t > 0) {
                    e.currentTarget.currentTime = t;
                    updateWatchTime(t);
                }
            }}
        />
    );
};
