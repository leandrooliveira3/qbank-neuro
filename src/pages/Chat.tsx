
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { createNeuroChat } from '../services/ai';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Bot, User, Loader2, Sparkles, Trash2, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const Chat: React.FC = () => {
  const { user } = useAuthStore();
  const { state } = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = createNeuroChat();
    }
    
    // Auto-send message from dashboard if present and not already processing
    if (state?.initialMessage && !hasInitialized.current) {
        hasInitialized.current = true;
        setInput(state.initialMessage);
        // Pequeno delay para garantir que o componente montou
        setTimeout(() => handleSend(state.initialMessage), 100);
    }
  }, [state]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (manualMsg?: string) => {
    const msgToSend = manualMsg || input;
    if (!msgToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msgToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseStream = chatRef.current.sendMessageStream({ message: userMessage.content });
      
      let assistantContent = '';
      const assistantMessageId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      for await (const chunk of responseStream) {
        const textChunk = chunk.text;
        if (textChunk) {
          assistantContent += textChunk;
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
          ));
        }
      }
    } catch (error: any) {
      console.error("Erro no chat:", error);
      
      let errorMsg = "Desculpe, tive um problema ao processar sua pergunta. Pode tentar novamente?";
      
      if (error.message?.includes('429')) {
        errorMsg = "Muitas requisições simultâneas. Aguarde um instante e tente novamente.";
      } else if (error.message?.includes('Tempo limite')) {
        errorMsg = "O servidor demorou muito para responder. Tente uma pergunta mais curta ou tente novamente.";
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorMsg = "Sessão expirada. Por favor, faça login novamente.";
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMsg = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (error.message?.includes('500')) {
        errorMsg = "Erro no servidor. Tente novamente em alguns instantes.";
      }
        
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Deseja limpar o histórico desta conversa?")) {
      setMessages([]);
      chatRef.current = createNeuroChat();
    }
  };

  return (
    <Layout title="NeuroChat Tutor">
      <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] max-w-4xl mx-auto pb-4">
        
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-t-[2rem] p-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-black text-sm tracking-tight">IA Tutor de Neurologia</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                Gemini-3-Flash
              </p>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
            title="Limpar Conversa"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 bg-slate-50 dark:bg-black/20 border-x border-slate-200 dark:border-zinc-900 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
              <div className="p-6 bg-emerald-950/30 rounded-full border border-primary/10">
                <MessageSquare className="h-12 w-12 text-primary/40" />
              </div>
              <div className="space-y-2">
                <h4 className="text-slate-900 dark:text-white font-black text-lg">Inicie uma Conversa</h4>
                <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium">
                  Pergunte sobre doenças desmielinizantes, AVC, semiologia ou neuroanatomia.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className={`flex max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${msg.role === 'user' ? 'ml-3 bg-slate-700' : 'mr-3 bg-primary/20'}`}>
                  {msg.role === 'user' ? <User className="h-4 w-4 text-slate-300" /> : <Sparkles className="h-4 w-4 text-primary" />}
                </div>
                
                <div className={`p-4 rounded-2xl text-sm leading-relaxed font-medium ${
                  msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none border border-primary/20 shadow-lg whitespace-pre-wrap' 
                  : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-zinc-800 rounded-tl-none shadow-sm'
                }`}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-emerald">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length-1]?.role === 'user' && (
            <div className="flex items-center space-x-2 text-primary animate-pulse ml-12">
               <Loader2 className="h-3 w-3 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest">Digitando...</span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-b-[2rem] p-4 shadow-xl shrink-0">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua dúvida clínica aqui..."
              disabled={isLoading}
              className="w-full bg-slate-50 dark:bg-black border-2 border-slate-200 dark:border-zinc-800 rounded-2xl pl-4 pr-14 py-4 text-sm text-slate-900 dark:text-white focus:border-primary outline-none transition-all placeholder-slate-400 disabled:opacity-50"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 bg-primary hover:bg-emerald-600 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-30 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
