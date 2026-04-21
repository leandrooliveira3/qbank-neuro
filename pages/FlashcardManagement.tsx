import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { useFlashcardStore } from '../store/useFlashcardStore';
import { FlashcardDeck, FlashcardInbox } from '../types';
import { 
  Plus, Trash2, FolderOpen, Archive, Check, AlertCircle,
  Inbox, ChevronRight, Settings, RotateCcw, Download
} from 'lucide-react';

export const FlashcardManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { decks, inbox, loadDecks, loadInbox, createDeck, deleteDeck, processInboxCard, deleteFromInbox } = useFlashcardStore();
  const [activeTab, setActiveTab] = useState<'decks' | 'inbox'>('decks');
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadDecks(user.id);
    loadInbox(user.id);
  }, [user]);

  const handleCreateDeck = async () => {
    if (!user || !newDeckName.trim()) return;
    setCreating(true);
    try {
      await createDeck(user.id, newDeckName, newDeckDesc);
      setNewDeckName('');
      setNewDeckDesc('');
      setShowNewDeck(false);
    } finally {
      setCreating(false);
    }
  };

  const handleProcessInbox = async (inboxCard: FlashcardInbox, deckId: string) => {
    if (!user) return;
    setProcessing(inboxCard.id);
    try {
      await processInboxCard(inboxCard.id, deckId, user.id);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteInbox = async (inboxId: string) => {
    if (!confirm('Descartar este card?')) return;
    await deleteFromInbox(inboxId);
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('Deletar deck? Todos os cards serão removidos.')) return;
    await deleteDeck(deckId);
  };

  const pendingInbox = inbox.filter(i => i.status === 'pending');
  const duplicateInbox = inbox.filter(i => i.status === 'duplicate');

  return (
    <Layout title="Gerenciamento de Flashcards">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        <header>
          <h1 className="text-4xl font-black tracking-tighter">Flashcards</h1>
          <p className="text-slate-500 text-sm mt-2">Organize decks, revise imports e gerencie seu arsenal de cards</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-zinc-800">
          {[
            { id: 'decks' as const, label: 'Meus Decks', icon: FolderOpen, count: decks.length },
            { id: 'inbox' as const, label: 'Inbox', icon: Inbox, count: inbox.filter(i => i.status === 'pending').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all relative ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Decks Tab */}
        {activeTab === 'decks' && (
          <div className="space-y-6">
            
            {/* New Deck Form */}
            {showNewDeck && (
              <div className="p-6 bg-slate-50 dark:bg-zinc-900 rounded-xl border-2 border-slate-200 dark:border-zinc-800 space-y-4">
                <h3 className="font-bold text-lg">Novo Deck</h3>
                <input
                  type="text"
                  placeholder="Nome do deck"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                  autoFocus
                />
                <textarea
                  placeholder="Descrição (opcional)"
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 resize-none h-24"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateDeck}
                    disabled={creating || !newDeckName.trim()}
                    className="flex-1 h-10 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-wider disabled:opacity-50"
                  >
                    {creating ? 'Criando...' : 'Criar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewDeck(false);
                      setNewDeckName('');
                      setNewDeckDesc('');
                    }}
                    className="px-6 h-10 border border-slate-300 dark:border-zinc-700 rounded-lg font-bold text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Deck List */}
            {decks.length === 0 && !showNewDeck ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-zinc-800 rounded-xl">
                <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium mb-6">Nenhum deck criado ainda</p>
                <button
                  onClick={() => setShowNewDeck(true)}
                  className="inline-flex items-center gap-2 h-10 px-6 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-wider"
                >
                  <Plus className="h-4 w-4" />
                  Criar primeiro deck
                </button>
              </div>
            ) : (
              <>
                {!showNewDeck && (
                  <button
                    onClick={() => setShowNewDeck(true)}
                    className="inline-flex items-center gap-2 h-10 px-6 bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-zinc-800"
                  >
                    <Plus className="h-4 w-4" />
                    Novo deck
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {decks.map(deck => (
                    <div
                      key={deck.id}
                      className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{deck.name}</h3>
                          {deck.description && (
                            <p className="text-sm text-slate-500 mt-1">{deck.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Deletar deck"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800 text-sm text-slate-500">
                        <span>{deck.cards_count || 0} cards</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div className="space-y-8">
            
            {/* Pending Cards */}
            {pendingInbox.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Cards Pendentes ({pendingInbox.length})
                </h3>
                <div className="space-y-3">
                  {pendingInbox.map(card => (
                    <div
                      key={card.id}
                      className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Pergunta</span>
                          <p className="text-sm font-medium">{card.front.substring(0, 100)}...</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Resposta</span>
                          <p className="text-sm font-medium">{card.back.substring(0, 100)}...</p>
                        </div>
                      </div>

                      {card.hint && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-900">
                          <span className="text-[10px] font-black uppercase text-blue-500 block mb-1">Dica</span>
                          <p className="text-sm">{card.hint}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleProcessInbox(card, e.target.value);
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm font-medium"
                          disabled={processing === card.id}
                        >
                          <option value="">Escolher deck...</option>
                          {decks.map(deck => (
                            <option key={deck.id} value={deck.id}>
                              {deck.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeleteInbox(card.id)}
                          className="px-4 py-2 text-slate-500 hover:text-red-500 border border-slate-300 dark:border-zinc-700 rounded-lg transition-colors"
                          title="Descartar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicate Cards */}
            {duplicateInbox.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-slate-400" />
                  Duplicados ({duplicateInbox.length})
                </h3>
                <p className="text-sm text-slate-500">Estes cards já existem em seus decks</p>
                <div className="space-y-3">
                  {duplicateInbox.map(card => (
                    <div
                      key={card.id}
                      className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg opacity-60"
                    >
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Pergunta</span>
                          <p className="text-sm font-medium">{card.front.substring(0, 100)}...</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Resposta</span>
                          <p className="text-sm font-medium">{card.back.substring(0, 100)}...</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteInbox(card.id)}
                        className="px-4 py-2 text-slate-500 hover:text-red-500 border border-slate-300 dark:border-zinc-700 rounded-lg transition-colors text-sm"
                      >
                        Remover do inbox
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inbox.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-zinc-800 rounded-xl">
                <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Seu inbox está vazio</p>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
};
