
-- Adiciona coluna last_seen se não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Cria tabela de histórico de XP se não existir
CREATE TABLE IF NOT EXISTS public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS para segurança
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para XP History
CREATE POLICY "Users can view own xp history" ON public.xp_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp history" ON public.xp_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Garante que usuários possam atualizar seu próprio last_seen e xp
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
