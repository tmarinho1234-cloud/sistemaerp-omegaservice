
CREATE TABLE public.orcamento_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'outros',
  tamanho bigint,
  tipo text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_anexos TO authenticated;
GRANT ALL ON public.orcamento_anexos TO service_role;

ALTER TABLE public.orcamento_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read orc anexos" ON public.orcamento_anexos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "orc manage orc anexos" ON public.orcamento_anexos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'orcamentos'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'orcamentos'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX orcamento_anexos_orcamento_id_idx ON public.orcamento_anexos(orcamento_id);
