import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/useAuthStore';
import { useFlashcardStore } from '../store/useFlashcardStore';
import { FlashcardConfig } from '../types';
import { 
  Save, AlertCircle, RotateCcw, Sliders, Clock, Zap,
  BookOpen, Settings, ChevronRight
} from 'lucide-react';

export const AdvancedFlashcardConfig: React.FC = () => {
  const { user } = useAuthStore();
  const { config, loadConfig, saveConfig } = useFlashcardStore();
  const [local, setLocal] = useState<FlashcardConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'learning' | 'review' | 'daily' | 'autoflip'>('learning');

  useEffect(() => {
    if (!user) return;
    loadConfig(user.id);
  }, [user]);

  useEffect(() => {
    if (config) {
      setLocal(config);
    }
  }, [config]);

  const handleSave = async () => {
    if (!user || !local) return;
    setSaving(true);
    try {
      const toSave: FlashcardConfig = {
        ...local,
        user_id: user.id,
      };
      await saveConfig(toSave);
      setFeedback({ type: 'success', msg: 'Configurações salvas com sucesso!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!user || !config) return;
    if (confirm('Restaurar configurações padrão?')) {
      const defaults: FlashcardConfig = {
        user_id: user.id,
        learning_steps: [1, 10, 1440],
        relearning_steps: [10, 1440],
        initial_ease: 2.5,
        min_ease: 1.3,
        max_ease: 3.5,
        interval_modifier: 1.0,
        max_interval: 36500,
        auto_flip_enabled: false,
        auto_flip_delay_ms: 3000,
        new_cards_per_day: 20,
        review_cards_per_day: 200,
      };
      setLocal(defaults);
    }
  };

  if (!local) return <Layout title="Configuração Avançada"><div className="flex items-center justify-center p-20"><span className="text-slate-400">Carregando...</span></div></Layout>;

  return (
    <Layout title="Configuração Avançada de Flashcards">
      <div className="max-w-2xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <header>
          <h1 className="text-4xl font-black tracking-tighter">Configuração Anki</h1>
          <p className="text-slate-500 text-sm mt-2">Ajuste fino do algoritmo de repetição espaçada (SM-2)</p>
        </header>

        {/* Feedback */}
        {feedback && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{feedback.msg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto">
          {[
            { id: 'learning' as const, label: 'Aprendizado', icon: BookOpen },
            { id: 'review' as const, label: 'Revisão', icon: Sliders },
            { id: 'daily' as const, label: 'Limites Diários', icon: Clock },
            { id: 'autoflip' as const, label: 'Auto-flip', icon: RotateCcw },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          
          {/* Learning Steps */}
          {activeTab === 'learning' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-3">Passos de Aprendizado (minutos)</label>
                <p className="text-xs text-slate-500 mb-4">Intervalo entre revisões durante a fase de aprendizado. Padrão: 1, 10, 1440 minutos (1 dia)</p>
                <div className="space-y-2">
                  {local.learning_steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="number"
                        value={step}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          const updated = [...local.learning_steps];
                          updated[i] = v;
                          setLocal({ ...local, learning_steps: updated });
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                      />
                      <span className="text-xs text-slate-400 w-16 text-right">min</span>
                      <button
                        onClick={() => {
                          const updated = local.learning_steps.filter((_, idx) => idx !== i);
                          setLocal({ ...local, learning_steps: updated });
                        }}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setLocal({ ...local, learning_steps: [...local.learning_steps, 1440] })}
                  className="mt-3 px-4 py-2 bg-slate-100 dark:bg-zinc-900 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-800"
                >
                  + Adicionar passo
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold mb-3">Ease Factor Inicial</label>
                <p className="text-xs text-slate-500 mb-4">Valor inicial de dificuldade. Padrão: 2.5</p>
                <input
                  type="number"
                  step="0.1"
                  min="1.3"
                  max="3.5"
                  value={local.initial_ease}
                  onChange={(e) => setLocal({ ...local, initial_ease: parseFloat(e.target.value) || 2.5 })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          )}

          {/* Review Steps */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-3">Passos de Reaprendizado (minutos)</label>
                <p className="text-xs text-slate-500 mb-4">Intervalo para cards que falharam. Padrão: 10, 1440 minutos</p>
                <div className="space-y-2">
                  {local.relearning_steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="number"
                        value={step}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          const updated = [...local.relearning_steps];
                          updated[i] = v;
                          setLocal({ ...local, relearning_steps: updated });
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                      />
                      <span className="text-xs text-slate-400 w-16 text-right">min</span>
                      <button
                        onClick={() => {
                          const updated = local.relearning_steps.filter((_, idx) => idx !== i);
                          setLocal({ ...local, relearning_steps: updated });
                        }}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setLocal({ ...local, relearning_steps: [...local.relearning_steps, 1440] })}
                  className="mt-3 px-4 py-2 bg-slate-100 dark:bg-zinc-900 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-800"
                >
                  + Adicionar passo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-3">Ease Factor Mínimo</label>
                  <p className="text-xs text-slate-500 mb-4">Padrão: 1.3</p>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={local.min_ease}
                    onChange={(e) => setLocal({ ...local, min_ease: parseFloat(e.target.value) || 1.3 })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-3">Ease Factor Máximo</label>
                  <p className="text-xs text-slate-500 mb-4">Padrão: 3.5</p>
                  <input
                    type="number"
                    step="0.1"
                    max="5.0"
                    value={local.max_ease}
                    onChange={(e) => setLocal({ ...local, max_ease: parseFloat(e.target.value) || 3.5 })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-3">Modificador de Intervalo</label>
                  <p className="text-xs text-slate-500 mb-4">Padrão: 1.0 (acelerar com &lt;1.0, desacelerar com &gt;1.0)</p>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="2.0"
                    value={local.interval_modifier}
                    onChange={(e) => setLocal({ ...local, interval_modifier: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-3">Intervalo Máximo (dias)</label>
                  <p className="text-xs text-slate-500 mb-4">Padrão: 36500 (100 anos)</p>
                  <input
                    type="number"
                    min="365"
                    value={local.max_interval}
                    onChange={(e) => setLocal({ ...local, max_interval: parseInt(e.target.value) || 36500 })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Daily Limits */}
          {activeTab === 'daily' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-3">Novos Cards por Dia</label>
                <p className="text-xs text-slate-500 mb-4">Padrão: 20. Quantos cards novos estudar por dia</p>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={local.new_cards_per_day}
                  onChange={(e) => setLocal({ ...local, new_cards_per_day: parseInt(e.target.value) || 20 })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-3">Cards de Revisão por Dia</label>
                <p className="text-xs text-slate-500 mb-4">Padrão: 200. Quantos cards revisar por dia</p>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={local.review_cards_per_day}
                  onChange={(e) => setLocal({ ...local, review_cards_per_day: parseInt(e.target.value) || 200 })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          )}

          {/* Auto Flip */}
          {activeTab === 'autoflip' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={local.auto_flip_enabled}
                    onChange={(e) => setLocal({ ...local, auto_flip_enabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="font-bold">Ativar Auto-flip</span>
                </label>
                <p className="text-xs text-slate-500 mt-2">Virar automaticamente após exibir a resposta</p>
              </div>

              {local.auto_flip_enabled && (
                <div>
                  <label className="block text-sm font-bold mb-3">Tempo de Auto-flip (ms)</label>
                  <p className="text-xs text-slate-500 mb-4">Padrão: 3000ms (3 segundos)</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="500"
                      value={local.auto_flip_delay_ms}
                      onChange={(e) => setLocal({ ...local, auto_flip_delay_ms: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="font-bold min-w-16 text-right">{Math.round(local.auto_flip_delay_ms / 1000)}s</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-zinc-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-primary text-white rounded-xl font-bold uppercase text-sm tracking-wider hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </button>
        </div>

      </div>
    </Layout>
  );
};
