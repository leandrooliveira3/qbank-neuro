import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Question } from '../types';
import { Heart, Loader2, Trash2, ChevronRight, Check } from 'lucide-react';

export const Favorites: React.FC = () => {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          question:questions (*)
        `)
        .eq('user_id', user.id);

      if (!error && data) {
        // Filter out nulls (deleted questions) and map
        const qList = data
            .map((item: any) => item.question)
            .filter((q: any) => q !== null);
        setQuestions(qList);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  const removeFavorite = async (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    // Optimistic update
    setQuestions(prev => prev.filter(q => q.id !== questionId));

    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('question_id', questionId);
  };

  const toggleQuestion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Layout title="Favoritas">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center">
                <Heart className="h-6 w-6 text-red-500 mr-2 fill-current" />
                Questões Favoritas
            </h1>
            <span className="text-sm text-slate-400">{questions.length} salvas</span>
        </div>

        {loading ? (
             <div className="flex justify-center p-12 text-slate-500">
                 <Loader2 className="h-8 w-8 animate-spin" />
             </div>
        ) : questions.length === 0 ? (
            <div className="h-64 border border-border border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                <Heart className="h-12 w-12 text-slate-600 mb-2 opacity-50" />
                <p className="text-slate-400 font-medium">Nenhuma questão favorita</p>
                <p className="text-sm text-slate-500 mt-1">Clique no ícone de coração ao praticar para salvar.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {questions.map((q) => (
                    <div 
                        key={q.id} 
                        onClick={() => toggleQuestion(q.id)}
                        className={`bg-surface border border-border rounded-lg p-4 transition-all cursor-pointer relative group ${
                            expandedId === q.id ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/50'
                        }`}
                    >
                        <button 
                            onClick={(e) => removeFavorite(q.id, e)}
                            className="absolute top-4 right-4 text-red-500 hover:text-red-400 p-1 bg-slate-800 rounded-full border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover dos favoritos"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex items-center space-x-2 mb-2 pr-8">
                             <span className="bg-slate-700 text-xs px-2 py-0.5 rounded text-slate-300 font-medium">{q.category}</span>
                             <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    q.difficulty === 'Fácil' ? 'text-green-400 bg-green-500/10' :
                                    q.difficulty === 'Difícil' ? 'text-red-400 bg-red-500/10' :
                                    'text-blue-400 bg-blue-500/10'
                                }`}>
                                    {q.difficulty}
                            </span>
                        </div>
                        
                        <p className="text-white text-sm line-clamp-2 font-medium pr-8">{q.statement}</p>
                        
                        {expandedId === q.id && (
                            <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-2 mb-4">
                                    {q.alternatives.map((alt) => (
                                        <div 
                                            key={alt.id} 
                                            className={`flex items-start text-sm p-2 rounded ${
                                                alt.is_correct 
                                                ? 'bg-green-500/10 border border-green-500/20 text-green-100' 
                                                : 'text-slate-500'
                                            }`}
                                        >
                                            {alt.is_correct && <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />}
                                            {!alt.is_correct && <div className="w-4 mr-2" />}
                                            <span>{alt.text}</span>
                                        </div>
                                    ))}
                                </div>
                                {q.explanation && (
                                    <div className="bg-slate-800/50 p-3 rounded text-sm text-slate-300">
                                        <span className="font-bold text-xs uppercase text-primary block mb-1">Comentário</span>
                                        {q.explanation}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {expandedId !== q.id && (
                             <div className="mt-2 flex justify-end">
                                 <ChevronRight className="h-4 w-4 text-slate-600" />
                             </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </Layout>
  );
};