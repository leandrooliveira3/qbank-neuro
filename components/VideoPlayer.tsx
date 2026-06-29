import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
    activeVideo: any;
    getYouTubeID: (url: string) => string | null;
    isDriveVideo: (url: string) => boolean;
    progressMap: Record<string, any>;
    setWatchTime: (t: number) => void;
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
    setWatchTime,
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

    if (driveUrl) {
        return (
            <iframe 
                key={`drive-${activeVideo.id}`}
                ref={playerRef} 
                src={activeVideo.url} // Preview URL
                className="w-full h-full absolute inset-0 border-0" 
                allow="autoplay; fullscreen"
                allowFullScreen
            />
        );
    }

    return (
        <video 
            key={`raw-${activeVideo.id}`}
            ref={videoRef} 
            src={activeVideo.url}
            controls 
            controlsList="nodownload" 
            className="w-full h-full max-h-screen outline-none" 
            autoPlay 
            onContextMenu={(e) => e.preventDefault()} 
            onEnded={() => navigateLesson('next')}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onPlaying={() => setIsVideoPlaying(true)}
            onTimeUpdate={(e) => setWatchTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
                const t = progressMap[activeVideo.id]?.progress_seconds;
                if (t && t > 0) {
                    e.currentTarget.currentTime = t;
                    setWatchTime(t);
                }
            }}
        />
    );
};
