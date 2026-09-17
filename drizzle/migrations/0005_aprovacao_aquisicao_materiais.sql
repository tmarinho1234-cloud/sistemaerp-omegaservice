CREATE TABLE public.feriados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feriados TO authenticated;
GRANT ALL ON public.feriados TO service_role;

ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis de negocio leem feriados" ON public.feriados
  FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));

CREATE POLICY "PCP e orcamentos gerenciam feriados" ON public.feriados
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'pcp') OR public.has_role(auth.uid(),'orcamentos'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'pcp') OR public.has_role(auth.uid(),'orcamentos'));

CREATE TRIGGER feriados_updated_at BEFORE UPDATE ON public.feriados FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS data_aprovacao date;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS data_aprovacao date;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS prazo_aquisicao_dias integer;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS data_chegada_materiais date;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS data_chegada_materiais_original date;
ALTER TABLE public.pcp_reprogramacoes ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'entrega';

UPDATE public.orcamentos SET data_aprovacao = (respondido_em)::date WHERE data_aprovacao IS NULL AND status = 'aprovado' AND respondido_em IS NOT NULL;

UPDATE public.pedidos p SET data_aprovacao = o.data_aprovacao
FROM public.orcamentos o WHERE p.orcamento_id = o.id AND p.data_aprovacao IS NULL AND o.data_aprovacao IS NOT NULL;

UPDATE public.pedidos p SET prazo_aquisicao_dias = a.prazo_aquisicao_dias
FROM public.orcamentos o JOIN public.analises_tecnicas a ON a.solicitacao_id = o.solicitacao_id
WHERE p.orcamento_id = o.id AND p.prazo_aquisicao_dias IS NULL AND a.prazo_aquisicao_dias IS NOT NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.feriados;