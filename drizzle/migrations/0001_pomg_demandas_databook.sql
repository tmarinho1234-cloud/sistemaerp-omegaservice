-- 1. Sequência anual POMG
CREATE TABLE public.pomg_sequencias (
  ano integer PRIMARY KEY,
  ultimo integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.pomg_sequencias TO authenticated;
GRANT ALL ON public.pomg_sequencias TO service_role;
ALTER TABLE public.pomg_sequencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pomg_seq_read" ON public.pomg_sequencias FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));

CREATE OR REPLACE FUNCTION public.proximo_pomg()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ano integer := EXTRACT(YEAR FROM now())::int; v_num integer;
BEGIN
  INSERT INTO public.pomg_sequencias (ano, ultimo) VALUES (v_ano, 1)
  ON CONFLICT (ano) DO UPDATE SET ultimo = public.pomg_sequencias.ultimo + 1
  RETURNING ultimo INTO v_num;
  RETURN 'POMG-' || lpad(v_num::text, 3, '0') || '-' || v_ano::text;
END; $$;
REVOKE ALL ON FUNCTION public.proximo_pomg() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.proximo_pomg() TO authenticated, service_role;

-- 2. Código POMG na demanda
ALTER TABLE public.solicitacoes_orcamento ADD COLUMN IF NOT EXISTS pomg_codigo text;
CREATE UNIQUE INDEX IF NOT EXISTS solicitacoes_pomg_uidx ON public.solicitacoes_orcamento (pomg_codigo);

CREATE OR REPLACE FUNCTION public.set_pomg_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pomg_codigo IS NULL THEN NEW.pomg_codigo := public.proximo_pomg(); END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_solicitacoes_pomg BEFORE INSERT ON public.solicitacoes_orcamento
FOR EACH ROW EXECUTE FUNCTION public.set_pomg_codigo();

UPDATE public.solicitacoes_orcamento s
SET pomg_codigo = 'POMG-' || lpad(t.rn::text, 3, '0') || '-' || EXTRACT(YEAR FROM s.created_at)::int::text
FROM (SELECT id, row_number() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at) rn FROM public.solicitacoes_orcamento) t
WHERE t.id = s.id AND s.pomg_codigo IS NULL;

INSERT INTO public.pomg_sequencias (ano, ultimo)
SELECT EXTRACT(YEAR FROM created_at)::int, count(*)::int FROM public.solicitacoes_orcamento GROUP BY 1
ON CONFLICT (ano) DO UPDATE SET ultimo = GREATEST(public.pomg_sequencias.ultimo, EXCLUDED.ultimo);

ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS pomg_codigo text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS pomg_codigo text;
UPDATE public.orcamentos o SET pomg_codigo = s.pomg_codigo FROM public.solicitacoes_orcamento s WHERE s.id = o.solicitacao_id AND o.pomg_codigo IS NULL;
UPDATE public.pedidos p SET pomg_codigo = o.pomg_codigo FROM public.orcamentos o WHERE o.id = p.orcamento_id AND p.pomg_codigo IS NULL;

-- 3. Situação, prazo e SLA da proposta
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS situacao text NOT NULL DEFAULT 'orcamento';
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS prazo_dias integer;
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS data_sla date;
ALTER TABLE public.orcamentos ADD CONSTRAINT orcamentos_situacao_chk CHECK (situacao IN ('orcamento','ag_aprovacao','aprovado','cancelado'));
UPDATE public.orcamentos SET situacao = CASE status WHEN 'rascunho' THEN 'orcamento' WHEN 'enviado' THEN 'ag_aprovacao' WHEN 'aprovado' THEN 'aprovado' ELSE 'cancelado' END;

ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS prazo_dias integer;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS data_sla date;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS pcp_status text NOT NULL DEFAULT 'nao_iniciado';
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_pcp_status_chk CHECK (pcp_status IN ('nao_iniciado','aguardando_material','em_fabricacao','ag_entrega','entregue','paralisada'));

-- 4. Análise técnica: aquisição de materiais
ALTER TABLE public.analises_tecnicas ADD COLUMN IF NOT EXISTS aquisicao_materiais boolean NOT NULL DEFAULT false;
ALTER TABLE public.analises_tecnicas ADD COLUMN IF NOT EXISTS prazo_aquisicao_dias integer;

-- 5. Conjuntos do orçamento e atividades
CREATE TABLE public.orcamento_conjuntos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  quantidade numeric NOT NULL DEFAULT 1,
  peso_kg numeric,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_conjuntos TO authenticated;
GRANT ALL ON public.orcamento_conjuntos TO service_role;
ALTER TABLE public.orcamento_conjuntos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oc_read" ON public.orcamento_conjuntos FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "oc_write" ON public.orcamento_conjuntos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid()));
CREATE TRIGGER oc_updated_at BEFORE UPDATE ON public.orcamento_conjuntos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orcamento_conjunto_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id uuid NOT NULL REFERENCES public.orcamento_conjuntos(id) ON DELETE CASCADE,
  atividade text NOT NULL,
  nome_extra text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_conjunto_atividades TO authenticated;
GRANT ALL ON public.orcamento_conjunto_atividades TO service_role;
ALTER TABLE public.orcamento_conjunto_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oca_read" ON public.orcamento_conjunto_atividades FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "oca_write" ON public.orcamento_conjunto_atividades FOR ALL TO authenticated USING (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid()));

-- 6. Requisitos de inspeção por demanda (POMG)
CREATE TABLE public.demanda_requisitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes_orcamento(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  nome_ensaio text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX demanda_requisitos_sol_idx ON public.demanda_requisitos (solicitacao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demanda_requisitos TO authenticated;
GRANT ALL ON public.demanda_requisitos TO service_role;
ALTER TABLE public.demanda_requisitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dr_read" ON public.demanda_requisitos FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "dr_write" ON public.demanda_requisitos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'qualidade') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'qualidade') OR public.is_admin(auth.uid()));

-- 7. Conjuntos do pedido: origem e quantidade fabricada
ALTER TABLE public.pedido_conjuntos ADD COLUMN IF NOT EXISTS orcamento_conjunto_id uuid REFERENCES public.orcamento_conjuntos(id) ON DELETE SET NULL;
ALTER TABLE public.pedido_conjuntos ADD COLUMN IF NOT EXISTS quantidade_fabricada numeric NOT NULL DEFAULT 0;
ALTER TABLE public.pedido_conjuntos ADD COLUMN IF NOT EXISTS peso_fabricado_kg numeric NOT NULL DEFAULT 0;

CREATE TABLE public.pedido_conjunto_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  conjunto_id uuid NOT NULL REFERENCES public.pedido_conjuntos(id) ON DELETE CASCADE,
  atividade text NOT NULL,
  nome_extra text,
  ordem integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'nao_iniciada',
  quantidade_executada numeric NOT NULL DEFAULT 0,
  peso_executado_kg numeric NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pca_status_chk CHECK (status IN ('nao_iniciada','em_andamento','concluida','paralisada'))
);
CREATE INDEX pca_conjunto_idx ON public.pedido_conjunto_atividades (conjunto_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_conjunto_atividades TO authenticated;
GRANT ALL ON public.pedido_conjunto_atividades TO service_role;
ALTER TABLE public.pedido_conjunto_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pca_read" ON public.pedido_conjunto_atividades FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "pca_write" ON public.pedido_conjunto_atividades FOR ALL TO authenticated USING (public.has_role(auth.uid(),'producao') OR public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'producao') OR public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid()));
CREATE TRIGGER pca_updated_at BEFORE UPDATE ON public.pedido_conjunto_atividades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Atividades ou ensaios não previstos na produção
CREATE TABLE public.atividades_nao_previstas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  conjunto_id uuid REFERENCES public.pedido_conjuntos(id) ON DELETE SET NULL,
  nome text NOT NULL,
  descricao text,
  observacao text,
  status text NOT NULL DEFAULT 'aberta',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anp_status_chk CHECK (status IN ('aberta','em_andamento','concluida','cancelada'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atividades_nao_previstas TO authenticated;
GRANT ALL ON public.atividades_nao_previstas TO service_role;
ALTER TABLE public.atividades_nao_previstas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anp_read" ON public.atividades_nao_previstas FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "anp_write" ON public.atividades_nao_previstas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'producao') OR public.has_role(auth.uid(),'qualidade') OR public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'producao') OR public.has_role(auth.uid(),'qualidade') OR public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid()));
CREATE TRIGGER anp_updated_at BEFORE UPDATE ON public.atividades_nao_previstas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Databook: relatórios por demanda
CREATE TABLE public.databook_relatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  nome_ensaio text,
  status text NOT NULL DEFAULT 'pendente',
  storage_path text,
  nome_arquivo text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dbr_status_chk CHECK (status IN ('pendente','em_elaboracao','concluido','aprovado'))
);
CREATE INDEX dbr_pedido_idx ON public.databook_relatorios (pedido_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.databook_relatorios TO authenticated;
GRANT ALL ON public.databook_relatorios TO service_role;
ALTER TABLE public.databook_relatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dbr_read" ON public.databook_relatorios FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "dbr_write" ON public.databook_relatorios FOR ALL TO authenticated USING (public.has_role(auth.uid(),'qualidade') OR public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'qualidade') OR public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid()));
CREATE TRIGGER dbr_updated_at BEFORE UPDATE ON public.databook_relatorios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Notas fiscais do romaneio
CREATE TABLE public.romaneio_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  romaneio_id uuid NOT NULL REFERENCES public.romaneios(id) ON DELETE CASCADE,
  conjunto_id uuid REFERENCES public.pedido_conjuntos(id) ON DELETE SET NULL,
  numero text NOT NULL,
  peso_kg numeric,
  valor numeric,
  data_emissao date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX romaneio_notas_rom_idx ON public.romaneio_notas (romaneio_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.romaneio_notas TO authenticated;
GRANT ALL ON public.romaneio_notas TO service_role;
ALTER TABLE public.romaneio_notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rn_read" ON public.romaneio_notas FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "rn_write" ON public.romaneio_notas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'expedicao') OR public.has_role(auth.uid(),'medicao') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'expedicao') OR public.has_role(auth.uid(),'medicao') OR public.is_admin(auth.uid()));