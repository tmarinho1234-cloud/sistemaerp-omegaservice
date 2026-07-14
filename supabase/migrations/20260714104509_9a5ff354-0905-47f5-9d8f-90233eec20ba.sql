
-- 1) Add empresa (nome do cliente/empresa) direto no contrato
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS empresa text;

-- Backfill empresa a partir do cliente atual
UPDATE public.contratos c
SET empresa = cl.nome
FROM public.clientes cl
WHERE c.cliente_id = cl.id AND c.empresa IS NULL;

-- Torna empresa obrigatória
ALTER TABLE public.contratos ALTER COLUMN empresa SET NOT NULL;

-- Remove FK e coluna cliente_id de contratos
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_cliente_id_fkey;
ALTER TABLE public.contratos DROP COLUMN IF EXISTS cliente_id;

-- 2) Sub-áreas do contrato
CREATE TABLE public.sub_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  codigo text,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contrato_id, nome)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sub_areas TO authenticated;
GRANT ALL ON public.sub_areas TO service_role;

ALTER TABLE public.sub_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler sub_areas" ON public.sub_areas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Orcamentos/admin gerenciam sub_areas" ON public.sub_areas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'orcamentos'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'orcamentos'));

CREATE TRIGGER set_sub_areas_updated_at BEFORE UPDATE ON public.sub_areas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Vincular solicitacoes/pedidos a contrato + sub_area, remover cliente_id
ALTER TABLE public.solicitacoes_orcamento
  ADD COLUMN IF NOT EXISTS sub_area_id uuid REFERENCES public.sub_areas(id) ON DELETE SET NULL;
ALTER TABLE public.solicitacoes_orcamento DROP COLUMN IF EXISTS cliente_id;
ALTER TABLE public.solicitacoes_orcamento ALTER COLUMN contrato_id SET NOT NULL;

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS sub_area_id uuid REFERENCES public.sub_areas(id) ON DELETE SET NULL;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS cliente_id;

-- 4) Remove tabela clientes (não é mais entidade separada)
DROP TABLE IF EXISTS public.clientes CASCADE;
