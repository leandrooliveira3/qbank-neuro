
-- Tabela independente para Qbank Residência
CREATE TABLE IF NOT EXISTS public.qresidencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  subcategory TEXT,
  statement TEXT NOT NULL,
  alternatives JSONB NOT NULL, -- Array de objetos {id, text, is_correct}
  explanation TEXT,
  difficulty TEXT,
  tags TEXT[],
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.qresidencia ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Leitura pública para autenticados" ON public.qresidencia
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insert via Service Role ou Admin" ON public.qresidencia
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Update/Delete Admin" ON public.qresidencia
  FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'steamleandro@hotmail.com' OR (select role from profiles where id = auth.uid()) = 'admin');
