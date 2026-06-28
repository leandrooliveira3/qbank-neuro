
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { localDB } from '../services/localDB';
import { syncEngine } from '../services/syncEngine';
import { supabase } from '../services/supabase'; 
import { Video, VideoProgress, VideoMaterial, VideoComment, Question } from '../types';
import { useNavigate, useLocation } from 'react-router';
import { xpService, XP_VALUES } from '../services/xpService';
import { generateQuestionsFromPrompt } from '../services/ai';
import { SmartImage } from '../components/SmartImage';
import { 
  MonitorPlay, Play, CheckCircle2, 
  X, Loader2, Search, List, Menu,
  Cloud, ChevronRight, ChevronDown, 
  ArrowLeft, ArrowRight,
  Folder, Film, Edit2, Save, Trash2,
  MessageSquare, Terminal,
  Moon, Sun, FolderOpen, Video as VideoIcon,
  Plus, Link as LinkIcon, StickyNote, Sparkles, Brain,
  ThumbsUp, CornerDownRight, Send, User,
  Clock, RefreshCw, Check, Download, FileVideo, AlertCircle,
  Trophy, Target, Maximize
} from 'lucide-react';

// --- ESTRUTURA DE DADOS PARA A ÁRVORE DE NAVEGAÇÃO ---
interface FileNode {
  type: 'file';
  data: Video;
  id: string;
  name: string;
}

interface FolderNode {
  type: 'folder';
  id: string;
  name: string;
  children: (FolderNode | FileNode)[];
  isOpen: boolean;
}

export const Videos: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, VideoProgress>>({});
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingDrive, setSyncingDrive] = useState(false);
  
  // UI State
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    const resumeState = location.state as { resumeVideoInfo?: any } | null;
    if (resumeState?.resumeVideoInfo) {
      const v = resumeState.resumeVideoInfo.video;
      setActiveVideo(v);
      
      // Patch the local state with exact time right away before data loads completely
      setProgressMap(prev => ({
          ...prev,
          [v.id]: {
              ...prev[v.id],
              progress_seconds: resumeState.resumeVideoInfo.current_time,
          } as VideoProgress
      }));
      setWatchTime(resumeState.resumeVideoInfo.current_time);
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Alteração: Sidebar inicia aberta para ser a "primeira coisa a aparecer"
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  useEffect(() => {
    if (activeVideo) {
      setWatchTime(progressMap[activeVideo.id]?.progress_seconds || 0);
      setIsVideoPlaying(true);
    } else {
      setWatchTime(0);
      setIsVideoPlaying(false);
    }
  }, [activeVideo]);
  
  // Sincronização do Modo Cinema com o Tema Global
  const cinemaMode = theme === 'dark';
  
  const [activeTab, setActiveTab] = useState<'comments' | 'materials'>('comments');

  // Navigation Tree State
  const [folderStructure, setFolderStructure] = useState<(FolderNode | FileNode)[]>([]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [flatList, setFlatList] = useState<Video[]>([]); 

  // Watch Time Tracking (Visual only now)
  const [watchTime, setWatchTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Materials State
  const [newMaterialType, setNewMaterialType] = useState<'link' | 'note'>('note');
  const [newMaterialContent, setNewMaterialContent] = useState('');
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);

  // Comments State
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Admin State
  const isMasterAdmin = user?.email === 'steamleandro@hotmail.com' || user?.role === 'admin';
  const [showLogs, setShowLogs] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // Quiz
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState<'practice' | 'simulation'>('practice');

  // Search
  const [search, setSearch] = useState('');

  const playerRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Removido useEffect que fechava a sidebar automaticamente no mobile
  // para atender ao requisito de exibir o menu primeiro.

  useEffect(() => {
    const fn = () => loadContent();
    fn();
    // window.addEventListener('neuro_sync_completed', fn);
    // return () => window.removeEventListener('neuro_sync_completed', fn);
  }, [user?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).neuro_active_video = !!activeVideo;
      (window as any).neuro_video_playing = isVideoPlaying;
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).neuro_active_video = false;
        (window as any).neuro_video_playing = false;
      }
    };
  }, [activeVideo, isVideoPlaying]);

  // RESET TIMER & PLAY STATE ON VIDEO CHANGE
  useEffect(() => {
      if (activeVideo) {
          const startT = progressMap[activeVideo.id]?.progress_seconds || 0;
          setWatchTime(startT);
          
          if (isDriveVideo(activeVideo.url) || getYouTubeID(activeVideo.url)) {
              setIsVideoPlaying(true);
          } else {
              setIsVideoPlaying(false);
          }
      } else {
          setWatchTime(0);
          setIsVideoPlaying(false);
      }
  }, [activeVideo?.id]);

  // TIMER LOGIC (Visual Progress Bar)
  useEffect(() => {
      let interval: any;
      if (activeVideo && isVideoPlaying) {
          const isIframe = isDriveVideo(activeVideo.url) || getYouTubeID(activeVideo.url);
          if (isIframe) {
              interval = setInterval(() => {
                  setWatchTime(prev => prev + 1);
              }, 1000);
          }
      } else {
          clearInterval(interval);
      }
      return () => clearInterval(interval);
  }, [activeVideo, isVideoPlaying]);

  const loadContent = async (forceRefresh = false) => {
    if (!user) return;
    setLoading(true);
    try {
        if (navigator.onLine) {
            const { data: remoteVideos, error } = await supabase
                .from('videos')
                .select('*')
                .eq('status', 'active');
            
            if (!error && remoteVideos && remoteVideos.length > 0) {
                await localDB.clear('videos');
                await localDB.bulkPut('videos', remoteVideos);
            }
        }
        
        const allVideos = await localDB.getAll('videos');
        const allProgress = await localDB.getAll('video_progress');
        const allMaterials = await localDB.getAll('video_materials');
        const allComments = await localDB.getAll('video_comments');
        
        const sortedVideos = allVideos.sort((a, b) => 
            a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
        );

        setVideos(sortedVideos);
        
        const structure = buildStructure(sortedVideos);
        setFolderStructure(structure);
        setFlatList(flattenStructure(structure));

        const pMap: Record<string, VideoProgress> = {};
        allProgress.filter(p => p.user_id === user.id).forEach(p => pMap[p.video_id] = p);
        setProgressMap(pMap);
        setMaterials(allMaterials);
        setComments(allComments);

        if (forceRefresh) alert("Catálogo atualizado com sucesso.");

    } catch (e) {
        console.error("Erro ao carregar vídeos:", e);
    } finally {
        setLoading(false);
    }
  };

  const buildStructure = (videoList: Video[]) => {
      const root: (FolderNode | FileNode)[] = [];
      const findOrCreateFolder = (parentList: (FolderNode | FileNode)[], name: string, idPath: string): FolderNode => {
          let folder = parentList.find(n => n.type === 'folder' && n.name === name) as FolderNode;
          if (!folder) {
              folder = { type: 'folder', name, children: [], isOpen: false, id: idPath };
              parentList.push(folder);
          }
          return folder;
      };
      videoList.forEach(video => {
          const rawPath = video.drive_path || 'Geral';
          const pathParts = rawPath.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
          let currentLevel = root;
          let currentPath = '';
          pathParts.forEach((part) => {
              currentPath += (currentPath ? '/' : '') + part;
              const folder = findOrCreateFolder(currentLevel, part, currentPath);
              currentLevel = folder.children;
          });
          currentLevel.push({ type: 'file', name: video.title, data: video, id: video.id });
      });
      const sortNodes = (nodes: (FolderNode | FileNode)[]) => {
          nodes.sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name, undefined, { numeric: true });
              return a.type === 'folder' ? -1 : 1;
          });
          nodes.forEach(node => { if (node.type === 'folder') sortNodes(node.children); });
      };
      sortNodes(root);
      if (root.length > 0 && root[0].type === 'folder') setOpenFolders(new Set([root[0].id]));
      return root;
  };

  const flattenStructure = (nodes: (FolderNode | FileNode)[]): Video[] => {
      let flat: Video[] = [];
      nodes.forEach(node => {
          if (node.type === 'file') flat.push(node.data);
          else flat = flat.concat(flattenStructure(node.children));
      });
      return flat;
  };

  const toggleFolder = (folderId: string) => {
      setOpenFolders(prev => {
          const next = new Set(prev);
          if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
          return next;
      });
  };

  const handleDriveSync = async () => {
      if (!isMasterAdmin || syncingDrive) return;
      setSyncingDrive(true);
      setShowLogs(true);
      setSyncLogs(["🚀 Iniciando Sincronização Recursiva (Loop)..."]);

      let totalProcessed = 0;
      let batchIndex = 1;
      let keepSyncing = true;
      let pageToken = null;
      
      // Marca o tempo de início para identificar arquivos deletados depois
      const syncThreshold = new Date().toISOString();

      try {
        while (keepSyncing) {
          setSyncLogs(prev => [...prev, `\n--- Lote ${batchIndex} ---`]);

          const { data, error } = await supabase.functions.invoke('sync-drive-videos', {
              body: { pageToken }
          });
          
          if (error) {
              setSyncLogs(prev => [...prev, `❌ ERRO: ${error.message}`]);
              if (!error.message?.includes('Timeout')) {
                  keepSyncing = false;
                  break;
              }
          }
          
          const count = data?.processed || 0;
          pageToken = data?.nextPageToken;
          totalProcessed += count;

          if (data && data.logs) {
              const shortLogs = data.logs.slice(-3);
              setSyncLogs(prev => [...prev, ...shortLogs]);
          }

          setSyncLogs(prev => [...prev, `✅ Processados neste lote: ${count}`]);
          
          if (!pageToken && count === 0) {
              keepSyncing = false;
              setSyncLogs(prev => [...prev, "🏁 Varredura finalizada."]);
          } else if (!pageToken) {
              keepSyncing = false;
              setSyncLogs(prev => [...prev, "🏁 Fim da lista de arquivos."]);
          } else {
              setSyncLogs(prev => [...prev, "⏳ Aguardando próximo lote..."]);
              await loadContent(false);
              await new Promise(r => setTimeout(r, 1500));
              batchIndex++;
          }
        }

        // LIMPEZA DE ARQUIVOS DELETADOS
        setSyncLogs(prev => [...prev, "🧹 Iniciando limpeza de arquivos removidos..."]);
        const { data: pruneData, error: pruneError } = await supabase.functions.invoke('sync-drive-videos', {
            body: { action: 'prune', threshold: syncThreshold }
        });

        if (pruneError) {
            setSyncLogs(prev => [...prev, `❌ ERRO na limpeza: ${pruneError.message}`]);
        } else {
            setSyncLogs(prev => [...prev, `🗑️ Removidos ${pruneData.deletedCount || 0} vídeos obsoletos do banco.`]);
        }

      } catch (e: any) {
          setSyncLogs(prev => [...prev, `❌ ERRO FATAL: ${e.message}`]);
      } finally {
          setSyncingDrive(false);
          await loadContent(true);
      }
  };

  const updateProgress = async (videoId: string, completed: boolean) => {
      if (!user) return;
      
      const currentTimeToSave = videoRef.current?.currentTime || watchTime;

      const progress: VideoProgress = {
          id: progressMap[videoId]?.id || crypto.randomUUID(),
          user_id: user.id,
          video_id: videoId,
          progress_seconds: currentTimeToSave,
          completed,
          last_watched: new Date().toISOString()
      };
      await syncEngine.enqueue('video_progress', progress);
      setProgressMap(prev => ({ ...prev, [videoId]: progress }));
      if (completed) xpService.addXP(XP_VALUES.VIDEO_COMPLETE, 'Aula Concluída');
      
      // Save active session for resume overlay if not completed
      if (!completed && activeVideo) {
          await localDB.put('active_video_session', {
              id: user.id,
              user_id: user.id,
              video_id: videoId,
              video: activeVideo,
              current_time: currentTimeToSave,
              last_updated: new Date().toISOString()
          });
      } else if (completed) {
          await localDB.delete('active_video_session', user.id).catch(() => {});
      }
  };

  // Active session tracking state
  const lastStateRef = useRef({ activeVideo, watchTime, user });
  useEffect(() => {
      lastStateRef.current = { activeVideo, watchTime, user };
  }, [activeVideo, watchTime, user?.id]);

  // Save when video changes or unmounts
  useEffect(() => {
      return () => {
          const state = lastStateRef.current;
          if (state.activeVideo && state.user) {
              const currentT = videoRef.current?.currentTime || state.watchTime;
              if (currentT > 5 && !progressMap[state.activeVideo.id]?.completed) {
                  localDB.put('active_video_session', {
                      id: state.user.id,
                      user_id: state.user.id,
                      video_id: state.activeVideo.id,
                      video: state.activeVideo,
                      current_time: currentT,
                      last_updated: new Date().toISOString()
                  }).catch(() => {});
              }
          }
      };
  }, [activeVideo]);

  const getYouTubeID = (url: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const isDriveVideo = (url: string) => {
      return url.includes('drive.google.com');
  };

  const getDriveId = (video: Video) => {
      if (video.drive_file_id) return video.drive_file_id;
      const match = video.url.match(/\/d\/(.+?)\//);
      return match ? match[1] : null;
  };

  const handleAddMaterial = async () => {
      if (!user || !activeVideo || !newMaterialTitle || !newMaterialContent) return;
      const mat: VideoMaterial = {
          id: crypto.randomUUID(), video_id: activeVideo.id, user_id: user.id, user_name: user.full_name || 'Usuário',
          type: newMaterialType, title: newMaterialTitle, content: newMaterialContent, created_at: new Date().toISOString()
      };
      await syncEngine.enqueue('video_materials', mat);
      setMaterials(prev => [...prev, mat]);
      setIsAddingMaterial(false); setNewMaterialTitle(''); setNewMaterialContent('');
  };

  const handleDeleteMaterial = async (id: string) => {
      if (!isMasterAdmin) return;
      if (confirm('Deletar este material?')) {
          await syncEngine.enqueue('video_materials', { id }, 'delete');
          setMaterials(prev => prev.filter(m => m.id !== id));
      }
  };

  const handlePostComment = async () => {
      if (!user || !activeVideo || !newComment.trim()) return;
      const comm: VideoComment = {
          id: crypto.randomUUID(), video_id: activeVideo.id, user_id: user.id, user_name: user.full_name || 'Usuário',
          user_avatar: user.avatar_url, content: newComment, parent_id: replyTo, likes: 0, created_at: new Date().toISOString()
      };
      await syncEngine.enqueue('video_comments', comm);
      setComments(prev => [...prev, comm]);
      setNewComment(''); setReplyTo(null);
  };

  const handleLikeComment = async (commentId: string) => {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
  };

  const handleGenerateQuiz = async () => {
      if (!activeVideo || generatingQuiz) return;
      setGeneratingQuiz(true);
      try {
          const prompt = `Crie 10 questões de múltipla escolha sobre o tema: "${activeVideo.title}". Nível Residência Médica. Retorne JSON.`;
          const questions = await generateQuestionsFromPrompt(prompt);
          if (!questions || !Array.isArray(questions) || questions.length === 0) throw new Error("Falha ao gerar questões.");
          
          const dbItems: Question[] = questions.map((q, idx) => {
              const gabaritoText = String(q.gabarito || 'A').trim();
              let finalChar = 'A';
              const exactMatch = gabaritoText.match(/^([A-E])$/i);
              if (exactMatch) {
                  finalChar = exactMatch[1].toUpperCase();
              } else {
                  const fallbackMatch = gabaritoText.match(/\b([A-E])\b/i) || gabaritoText.match(/([A-E])/i);
                  finalChar = fallbackMatch ? fallbackMatch[1].toUpperCase() : 'A';
              }
              const correctChar = finalChar;
              
              return {
                  id: crypto.randomUUID(), bank_name: 'Quiz Automático', category: activeVideo?.category || q.categoria || 'Geral',
                  subcategory: activeVideo?.title || '', difficulty: 'Médio', statement: q.enunciado, explanation: q.comentario || '',
                  alternatives: (q.alternativas || []).map((t, aidx) => ({ id: crypto.randomUUID(), text: t, is_correct: String.fromCharCode(65 + aidx) === correctChar })),
                  created_by: user!.id, created_at: new Date().toISOString(), tags: []
              };
          });

          // Pass the quiz mode to config
          const config = { 
              simulationName: `Quiz: ${activeVideo.title}`, 
              questionLimit: dbItems.length, 
              selectedBank: 'Quiz Automático', 
              practiceMode: 'all',
              isSimulation: quizMode === 'simulation' // Critical Flag
          };

          // If simulation mode, ensure questions are saved to DB first (optional, but good practice if you want persistent history)
          // For now, PracticeSession handles the saving logic for simulations if they are not pre-saved.
          
          navigate('/practice/session', { state: { questions: dbItems, config } });
      } catch (e: any) { alert("Erro ao gerar quiz: " + e.message); } finally { setGeneratingQuiz(false); }
  };

  const handleFullscreen = async () => {
      const playerContainer = document.getElementById('video-player-container');
      const elem = playerContainer || document.documentElement;
      try {
          if (elem.requestFullscreen) {
              await elem.requestFullscreen();
          } else if ((elem as any).webkitRequestFullscreen) {
              await (elem as any).webkitRequestFullscreen();
          } else if ((elem as any).msRequestFullscreen) {
              await (elem as any).msRequestFullscreen();
          }
          
          if ('wakeLock' in navigator) {
              try {
                  await (navigator as any).wakeLock.request('screen');
              } catch (e) {}
          }
      } catch (error) {
          console.error("Fullscreen error:", error);
      }
  };

  const navigateLesson = (direction: 'next' | 'prev') => {
      if (!activeVideo) return;
      const currentIndex = flatList.findIndex(v => v.id === activeVideo.id);
      if (currentIndex === -1) return;
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= 0 && nextIndex < flatList.length) setActiveVideo(flatList[nextIndex]);
  };

  const renderTree = (nodes: (FolderNode | FileNode)[]) => {
      if (!nodes) return null;
      const filteredNodes = search ? nodes : nodes;
      return filteredNodes.map(node => {
          if (node.type === 'file') {
              const isActive = activeVideo?.id === node.data.id;
              const isCompleted = progressMap[node.data.id]?.completed;
              const durationLabel = node.data.duration_seconds > 0 ? `${Math.floor(node.data.duration_seconds / 60)} min` : "---";
              
              return (
                  <div key={node.id} 
                    onClick={() => { 
                        setActiveVideo(node.data); 
                        // Auto-close sidebar on iPad/Tablet/Mobile to maximize player view
                        if (window.innerWidth < 1280) setIsSidebarOpen(false); 
                    }} 
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 group relative overflow-hidden ${cinemaMode ? (isActive ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200') : (isActive ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
                  >
                      {isActive && <div className={`absolute left-0 top-0 bottom-0 w-1 ${cinemaMode ? 'bg-white' : 'bg-emerald-500'}`}></div>}
                      <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-black/10 flex items-center justify-center">
                          {node.data.thumbnail_url ? <SmartImage url={node.data.thumbnail_url} alt="" className="w-full h-full object-cover" /> : (isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : (isActive ? <Play className="h-4 w-4 fill-current animate-pulse" /> : <div className={`h-2 w-2 rounded-full ${cinemaMode ? 'bg-zinc-600' : 'bg-slate-300'}`} />))}
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-[11px] font-bold leading-tight whitespace-normal break-words">{node.name}</p><p className={`text-[9px] mt-0.5 ${cinemaMode ? 'text-zinc-500' : 'text-slate-400'}`}>{durationLabel}</p></div>
                  </div>
              );
          } else {
              const isOpen = openFolders.has(node.id) || search.length > 0;
              return (
                  <div key={node.id} className="mb-1">
                      <div onClick={() => toggleFolder(node.id)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors group select-none ${cinemaMode ? 'hover:bg-zinc-900 text-zinc-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                          <div className="flex items-center gap-2 overflow-hidden">{isOpen ? <FolderOpen className={`h-4 w-4 shrink-0 ${cinemaMode ? 'text-zinc-100' : 'text-emerald-600'}`} /> : <Folder className={`h-4 w-4 shrink-0 ${cinemaMode ? 'text-zinc-600' : 'text-slate-400 group-hover:text-emerald-500'}`} />}<span className={`text-[11px] font-black uppercase tracking-wide truncate ${isOpen ? (cinemaMode ? 'text-white' : 'text-emerald-700') : ''}`}>{node.name}</span></div>
                          {isOpen ? <ChevronDown className="h-3 w-3 opacity-50" /> : <ChevronRight className="h-3 w-3 opacity-50" />}
                      </div>
                      {isOpen && (
                          <div className={`ml-3 pl-1 border-l ${cinemaMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                              {renderTree(node.children)}
                          </div>
                      )}
                  </div>
              );
          }
      });
  };

  const activeComments = comments.filter(c => c.video_id === activeVideo?.id && !c.parent_id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const activeMaterials = materials.filter(m => m.video_id === activeVideo?.id);

  // FIX: Prevent NaN if duration is 0
  const watchPercentage = activeVideo && activeVideo.duration_seconds > 0 
      ? Math.min(100, (watchTime / activeVideo.duration_seconds) * 100) 
      : 0;

  return (
    <Layout title="Sala de Aula" fullWidth>
      <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 ${cinemaMode ? 'bg-black text-zinc-300' : 'bg-slate-50 text-slate-900'}`}>
        
        {/* HEADER */}
        <div className={`h-16 border-b px-4 md:px-6 shrink-0 flex items-center justify-between z-20 transition-colors duration-500 ${cinemaMode ? 'bg-zinc-950 border-zinc-900 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                {/* MENU HAMBURGUER SUBSTITUINDO VOLTAR */}
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-full transition-colors shrink-0 ${cinemaMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                    {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div className="flex flex-col min-w-0">
                    <h1 className="text-xs md:text-sm font-black uppercase tracking-widest leading-none truncate">NeuroVideo Player</h1>
                    {activeVideo && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold truncate ${cinemaMode ? 'text-zinc-500' : 'text-slate-400'}`}>{activeVideo.title}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <button onClick={() => loadContent(true)} className={`p-2.5 rounded-xl transition-colors ${cinemaMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400' : 'bg-white hover:bg-slate-100 text-slate-400 border border-slate-200'}`} title="Atualizar Lista"><RefreshCw className="h-4 w-4" /></button>
                <button onClick={toggleTheme} className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-all ${cinemaMode ? 'bg-white text-black border-white hover:bg-zinc-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}>{cinemaMode ? <><Sun className="h-3.5 w-3.5" /><span className="hidden md:inline"> Light</span></> : <><Moon className="h-3.5 w-3.5" /><span className="hidden md:inline"> Cinema</span></>}</button>
                {isMasterAdmin && <button onClick={handleDriveSync} disabled={syncingDrive} className={`p-2.5 rounded-xl transition-colors ${cinemaMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400' : 'bg-white hover:bg-slate-100 text-slate-400 border border-slate-200'}`} title="Sync Drive">{syncingDrive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}</button>}
                {/* MENU DA DIREITA REMOVIDO PARA LIMPEZA */}
            </div>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 flex overflow-hidden relative">
            {/* LEFT SIDEBAR (TREE) - FIXED FOR IPAD & DESKTOP COLLAPSE */}
            <div className={`
                border-r flex flex-col absolute md:relative z-30 h-full transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden'}
                ${cinemaMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200'}
            `}>
                <div className={`p-4 md:p-5 border-b shrink-0 ${cinemaMode ? 'border-zinc-900' : 'border-slate-100 bg-slate-50/50'}`}>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${cinemaMode ? 'text-zinc-500' : 'text-slate-400'}`}>Estrutura do Curso</h3>
                    <div className="relative"><Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${cinemaMode ? 'text-zinc-600' : 'text-slate-400'}`} /><input type="text" placeholder="Buscar aula..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-[11px] font-bold outline-none transition-colors ${cinemaMode ? 'bg-black border-zinc-800 text-white focus:border-white/20' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500 shadow-sm'}`} /></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar py-2 pb-20 md:pb-2 w-80">
                    {loading ? <div className="py-20 flex flex-col items-center justify-center opacity-40"><Loader2 className={`animate-spin h-8 w-8 mb-2 ${cinemaMode ? 'text-white' : 'text-emerald-600'}`} /><span className="text-[9px] font-bold uppercase">Carregando...</span></div> : folderStructure.length === 0 ? <div className="py-20 text-center opacity-40 px-6"><Folder className="h-8 w-8 mx-auto mb-4 opacity-50" /><p className="text-[10px] font-black uppercase tracking-widest">Nenhuma aula encontrada</p></div> : <div className="space-y-0.5 px-2">{renderTree(folderStructure)}</div>}
                </div>
            </div>

            {/* RIGHT PLAYER AREA */}
            <div className={`flex-1 flex flex-col relative transition-colors duration-500 overflow-hidden w-full min-w-0 ${cinemaMode ? 'bg-black' : 'bg-slate-50'}`}>
                {activeVideo ? (
                    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
                        <div id="video-player-container" className="w-full bg-black aspect-video flex items-center justify-center relative group shrink-0 shadow-2xl z-10">
                            
                            {/* PLAYER RENDER: SINGLE CLICK SOLUTION (Using KEY prop to reset state on change) */}
                            {getYouTubeID(activeVideo.url) ? (
                                <iframe 
                                    key={activeVideo.id}
                                    ref={playerRef} 
                                    src={`https://www.youtube.com/embed/${getYouTubeID(activeVideo.url)}?autoplay=1&modestbranding=1&rel=0&showinfo=0${progressMap[activeVideo.id]?.progress_seconds ? `&start=${Math.floor(progressMap[activeVideo.id].progress_seconds)}` : ''}`} 
                                    className="w-full h-full absolute inset-0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen 
                                />
                            ) : isDriveVideo(activeVideo.url) ? (
                                <iframe 
                                    key={activeVideo.id} // FIX DOUBLE CLICK
                                    ref={playerRef} 
                                    src={activeVideo.url} // Preview URL
                                    className="w-full h-full absolute inset-0 border-0" 
                                    allow="autoplay; fullscreen"
                                    allowFullScreen
                                />
                            ) : (
                                <video 
                                    key={activeVideo.id}
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
                            )}
                        </div>
                        
                        <div className={`flex-1 p-4 md:p-8 ${cinemaMode ? 'bg-zinc-950 text-zinc-300' : 'bg-white text-slate-700'}`}>
                            <div className="max-w-6xl mx-auto flex flex-col gap-6 md:gap-8">
                                <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-between items-start border-b border-white/5 pb-6">
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${cinemaMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>{activeVideo.category}</span><span className="text-[8px] font-bold opacity-50 uppercase tracking-widest flex items-center gap-1"><Folder className="h-2.5 w-2.5" /> {activeVideo.drive_path || 'Raiz'}</span></div>
                                        <h2 className={`text-xl md:text-2xl font-black leading-tight break-words ${cinemaMode ? 'text-white' : 'text-slate-900'}`}>{activeVideo.title}</h2>
                                    </div>
                                    <div className="flex gap-2 shrink-0 w-full md:w-auto flex-wrap md:flex-nowrap">
                                        <button onClick={handleFullscreen} className={`flex-1 md:flex-none p-3 rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 ${cinemaMode ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700'}`} title="Tela Cheia (Modo Foco)">
                                            <Maximize className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => navigateLesson('prev')} className={`flex-1 md:flex-none p-3 rounded-xl transition-all active:scale-95 flex justify-center ${cinemaMode ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-white border hover:bg-slate-50 text-slate-700'}`} title="Aula Anterior"><ArrowLeft className="h-4 w-4" /></button>
                                        
                                        <button 
                                            onClick={() => updateProgress(activeVideo.id, !progressMap[activeVideo.id]?.completed)} 
                                            className={`flex-[2] md:flex-none px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 whitespace-nowrap relative group/btn ${
                                                progressMap[activeVideo.id]?.completed 
                                                    ? 'bg-emerald-600 text-white' 
                                                    : cinemaMode 
                                                        ? 'bg-white text-black hover:bg-zinc-200' 
                                                        : 'bg-slate-900 text-white hover:bg-slate-800'
                                            }`}
                                        >
                                            {progressMap[activeVideo.id]?.completed ? <CheckCircle2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 opacity-50" />}
                                            <span className="hidden sm:inline">{progressMap[activeVideo.id]?.completed ? 'Concluído' : 'Marcar Concluído'}</span>
                                            <span className="sm:hidden">{progressMap[activeVideo.id]?.completed ? 'OK' : 'Concluir'}</span>
                                        </button>

                                        <button onClick={() => navigateLesson('next')} className={`flex-1 md:flex-none p-3 rounded-xl transition-all active:scale-95 flex justify-center ${cinemaMode ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-white border hover:bg-slate-50 text-slate-700'}`} title="Próxima Aula"><ArrowRight className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className={`flex gap-6 md:gap-8 border-b overflow-x-auto no-scrollbar ${cinemaMode ? 'border-zinc-800' : 'border-slate-200'}`}>
                                        <button onClick={() => setActiveTab('comments')} className={`pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'comments' ? 'border-primary text-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}><MessageSquare className="h-3 w-3" /> Comentários</button>
                                        <button onClick={() => setActiveTab('materials')} className={`pb-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'materials' ? 'border-primary text-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}><Folder className="h-3 w-3" /> Materiais <span className="bg-zinc-800 px-1.5 rounded text-[8px] text-white">{activeMaterials.length}</span></button>
                                    </div>
                                    {activeTab === 'comments' && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                                            <div className="order-1 md:order-2">
                                                <div className={`p-5 md:p-6 rounded-2xl border flex flex-col items-center text-center space-y-4 sticky top-4 ${cinemaMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                                                    <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-500 mb-2"><Brain className="h-8 w-8" /></div>
                                                    <div><h3 className="font-black uppercase tracking-tight text-sm">Teste de Conhecimento</h3><p className="text-[10px] font-medium opacity-60 mt-1">10 Questões Geradas por IA sobre "{activeVideo.title}"</p></div>
                                                    
                                                    {/* MODE TOGGLE - AJUSTADO PARA EVITAR SOBREPOSIÇÃO */}
                                                    <div className={`flex flex-col sm:flex-row gap-2 p-1 rounded-xl w-full mb-1 ${cinemaMode ? 'bg-black border border-zinc-800' : 'bg-slate-100 border border-slate-200'}`}>
                                                        <button 
                                                            onClick={() => setQuizMode('practice')}
                                                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${quizMode === 'practice' ? (cinemaMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-400'}`}
                                                        >
                                                            <Target className="h-3 w-3" /> Prática
                                                        </button>
                                                        <button 
                                                            onClick={() => setQuizMode('simulation')}
                                                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${quizMode === 'simulation' ? (cinemaMode ? 'bg-zinc-800 text-indigo-400 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400'}`}
                                                        >
                                                            <Trophy className="h-3 w-3" /> Simulado
                                                        </button>
                                                    </div>

                                                    <button onClick={handleGenerateQuiz} disabled={generatingQuiz} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all">{generatingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} INICIAR QUIZ</button>
                                                    <p className="text-[8px] opacity-50 font-medium">
                                                        {quizMode === 'simulation' ? 'Valendo nota e XP para o ranking.' : 'Modo treino sem registro de estatísticas.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-6 order-2 md:order-1">
                                                <div className="flex gap-3">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${cinemaMode ? 'bg-zinc-800' : 'bg-slate-200'}`}>{user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" /> : <User className="h-5 w-5 opacity-50" />}</div>
                                                    <div className="flex-1 relative">
                                                        <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Adicione um comentário ou dúvida..." className={`w-full rounded-2xl p-4 text-xs font-medium outline-none resize-none min-h-[100px] ${cinemaMode ? 'bg-zinc-900 text-white placeholder-zinc-600 focus:bg-zinc-800' : 'bg-slate-100 text-slate-800 placeholder-slate-400 focus:bg-white border border-slate-200'}`} />
                                                        <button onClick={handlePostComment} disabled={!newComment.trim()} className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-xl disabled:opacity-50 active:scale-90 transition-all shadow-md"><Send className="h-4 w-4" /></button>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">{activeComments.length === 0 ? <div className="text-center py-10 opacity-40"><MessageSquare className="h-8 w-8 mx-auto mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">Seja o primeiro a comentar</p></div> : activeComments.map(comment => <div key={comment.id} className={`p-4 rounded-2xl ${cinemaMode ? 'bg-zinc-900' : 'bg-slate-50 border border-slate-100'}`}><div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-slate-300 overflow-hidden">{comment.user_avatar ? <img src={comment.user_avatar} className="w-full h-full object-cover" /> : <User className="h-3 w-3 m-auto mt-1.5 opacity-50" />}</div><span className="text-[10px] font-black uppercase">{comment.user_name}</span><span className="text-[8px] opacity-40 font-bold">{new Date(comment.created_at).toLocaleDateString()}</span></div></div><p className="text-xs font-medium leading-relaxed mb-3 opacity-90">{comment.content}</p><div className="flex items-center gap-4 text-[9px] font-bold opacity-60"><button onClick={() => handleLikeComment(comment.id)} className="flex items-center gap-1 hover:text-primary transition-colors"><ThumbsUp className="h-3 w-3" /> {comment.likes || 0}</button><button className="flex items-center gap-1 hover:text-primary transition-colors"><CornerDownRight className="h-3 w-3" /> Responder</button></div></div>)}</div>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'materials' && (
                                        <div className="space-y-6 animate-in fade-in">
                                            {!isAddingMaterial ? <button onClick={() => setIsAddingMaterial(true)} className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${cinemaMode ? 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400'}`}><Plus className="h-4 w-4" /> Adicionar Material</button> : <div className={`p-6 rounded-2xl border ${cinemaMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'} space-y-4`}><div className="flex gap-4"><button onClick={() => setNewMaterialType('note')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${newMaterialType === 'note' ? 'bg-primary border-primary text-white' : 'border-transparent bg-black/10'}`}>Nota</button><button onClick={() => setNewMaterialType('link')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${newMaterialType === 'link' ? 'bg-primary border-primary text-white' : 'border-transparent bg-black/10'}`}>Link</button></div><input value={newMaterialTitle} onChange={e => setNewMaterialTitle(e.target.value)} placeholder="Título do Material..." className={`w-full bg-transparent border-b p-2 text-sm font-bold outline-none focus:border-primary ${cinemaMode ? 'border-zinc-700' : 'border-slate-300'}`} /><textarea value={newMaterialContent} onChange={e => setNewMaterialContent(e.target.value)} placeholder={newMaterialType === 'link' ? 'Cole a URL aqui...' : 'Digite sua anotação...'} className={`w-full bg-transparent border p-3 rounded-xl text-xs min-h-[100px] outline-none focus:border-primary ${cinemaMode ? 'border-zinc-700' : 'border-slate-300'}`} /><div className="flex justify-end gap-2"><button onClick={() => setIsAddingMaterial(false)} className="px-4 py-2 text-[10px] font-black uppercase opacity-60 hover:opacity-100">Cancelar</button><button onClick={handleAddMaterial} className="bg-primary text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Salvar</button></div></div>}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{activeMaterials.map(mat => <div key={mat.id} className={`p-5 rounded-2xl border group relative ${cinemaMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}><div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2">{mat.type === 'link' ? <LinkIcon className="h-4 w-4 text-blue-500" /> : <StickyNote className="h-4 w-4 text-yellow-500" />}<span className="text-xs font-black uppercase">{mat.title}</span></div>{isMasterAdmin && <button onClick={() => handleDeleteMaterial(mat.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 className="h-4 w-4" /></button>}</div>{mat.type === 'link' ? <a href={mat.content} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline truncate block">{mat.content}</a> : <p className="text-[10px] opacity-70 leading-relaxed whitespace-pre-wrap">{mat.content}</p>}<div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-[8px] font-bold opacity-40 uppercase"><span>Por {mat.user_name}</span><span>{new Date(mat.created_at).toLocaleDateString()}</span></div></div>)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 border-4 ${cinemaMode ? 'bg-zinc-900 border-zinc-800 text-zinc-700' : 'bg-white border-slate-200 text-slate-200'}`}><VideoIcon className="h-16 w-16 fill-current" /></div>
                        <h2 className={`text-3xl font-black tracking-tighter ${cinemaMode ? 'text-white' : 'text-slate-900'}`}>Selecione uma aula</h2>
                        <p className="text-sm mt-3 max-w-sm opacity-60 font-medium">Navegue pelo índice à esquerda para iniciar seus estudos.</p>
                    </div>
                )}
            </div>
        </div>
        {showLogs && <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-slate-950 w-full max-w-2xl rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col max-h-[60vh] overflow-hidden animate-in zoom-in-95"><div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900"><div className="flex items-center gap-3"><Terminal className="h-5 w-5 text-emerald-500" /><h3 className="text-xs font-mono font-bold text-emerald-500">SYNC_LOGS</h3></div>{!syncingDrive && <button onClick={() => setShowLogs(false)} className="p-1 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}</div><div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1 text-slate-300">{syncLogs.map((log, i) => <div key={i} className={`break-all ${log.includes('ERRO') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : ''}`}>{log}</div>)}{syncingDrive && <div className="text-emerald-500 animate-pulse">_processando... (não feche esta janela)</div>}</div></div></div>}
      </div>
    </Layout>
  );
};
