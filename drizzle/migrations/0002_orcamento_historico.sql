CREATE TABLE public.orcamento_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  solicitacao_id uuid REFERENCES public.solicitacoes_orcamento(id) ON DELETE CASCADE,
  acao text NOT NULL,
  descricao text,
  valor_anterior numeric,
  valor_novo numeric,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orcamento_historico_orc_idx ON public.orcamento_historico (orcamento_id, created_at DESC);

GRANT SELECT, INSERT ON public.orcamento_historico TO authenticated;
GRANT ALL ON public.orcamento_historico TO service_role;

ALTER TABLE public.orcamento_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orc_hist_read" ON public.orcamento_historico FOR SELECT TO authenticated
USING (public.has_any_business_role(auth.uid()));

CREATE POLICY "orc_hist_insert" ON public.orcamento_historico FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'orcamentos') OR public.is_admin(auth.uid()));
