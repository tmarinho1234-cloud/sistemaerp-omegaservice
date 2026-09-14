CREATE TABLE public.pcp_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL UNIQUE REFERENCES public.pedidos(id) ON DELETE CASCADE,
  data_inicio date,
  data_fim_prevista date,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado','reprogramado','concluido')),
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pcp_planos TO authenticated;
GRANT ALL ON public.pcp_planos TO service_role;
ALTER TABLE public.pcp_planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcp_planos_read_business" ON public.pcp_planos FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "pcp_planos_manage" ON public.pcp_planos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid()));

CREATE TABLE public.pedido_conjuntos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  tag text NOT NULL,
  descricao text NOT NULL,
  quantidade numeric NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  peso_kg numeric CHECK (peso_kg IS NULL OR peso_kg >= 0),
  prioridade integer NOT NULL DEFAULT 3 CHECK (prioridade BETWEEN 1 AND 5),
  inicio_previsto date,
  fim_previsto date,
  status text NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado','em_producao','aguardando_qualidade','liberado','parcialmente_expedido','expedido','concluido')),
  progresso numeric NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
  liberado_qualidade boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pedido_id, tag)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_conjuntos TO authenticated;
GRANT ALL ON public.pedido_conjuntos TO service_role;
ALTER TABLE public.pedido_conjuntos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conjuntos_read_business" ON public.pedido_conjuntos FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "conjuntos_manage_pcp" ON public.pedido_conjuntos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid()));
CREATE POLICY "conjuntos_update_operational" ON public.pedido_conjuntos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'producao') OR public.has_role(auth.uid(),'qualidade') OR public.has_role(auth.uid(),'expedicao')) WITH CHECK (public.has_role(auth.uid(),'producao') OR public.has_role(auth.uid(),'qualidade') OR public.has_role(auth.uid(),'expedicao'));

CREATE TABLE public.cronograma_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id uuid NOT NULL REFERENCES public.pedido_conjuntos(id) ON DELETE CASCADE,
  processo text NOT NULL CHECK (processo IN ('corte','dobra','usinagem','montagem','soldagem','pintura','qualidade','expedicao')),
  ordem integer NOT NULL DEFAULT 0,
  inicio_previsto date,
  fim_previsto date,
  peso_percentual numeric NOT NULL DEFAULT 0 CHECK (peso_percentual BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','pausado','concluido')),
  progresso numeric NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conjunto_id, processo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cronograma_etapas TO authenticated;
GRANT ALL ON public.cronograma_etapas TO service_role;
ALTER TABLE public.cronograma_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cronograma_read_business" ON public.cronograma_etapas FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "cronograma_manage_pcp" ON public.cronograma_etapas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid()));
CREATE POLICY "cronograma_update_producao" ON public.cronograma_etapas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'producao')) WITH CHECK (public.has_role(auth.uid(),'producao'));

CREATE TABLE public.pcp_reprogramacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  conjunto_id uuid REFERENCES public.pedido_conjuntos(id) ON DELETE CASCADE,
  data_anterior date,
  nova_data date NOT NULL,
  motivo text NOT NULL,
  impacto_dias integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pcp_reprogramacoes TO authenticated;
GRANT ALL ON public.pcp_reprogramacoes TO service_role;
ALTER TABLE public.pcp_reprogramacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reprogramacoes_read_business" ON public.pcp_reprogramacoes FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "reprogramacoes_manage_pcp" ON public.pcp_reprogramacoes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid()));

CREATE TABLE public.apontamentos_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  conjunto_id uuid NOT NULL REFERENCES public.pedido_conjuntos(id) ON DELETE CASCADE,
  etapa_id uuid REFERENCES public.cronograma_etapas(id) ON DELETE SET NULL,
  processo text NOT NULL CHECK (processo IN ('corte','dobra','usinagem','montagem','soldagem','pintura')),
  funcionario_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE SET NULL,
  inicio timestamptz NOT NULL DEFAULT now(),
  fim timestamptz,
  quantidade_executada numeric NOT NULL DEFAULT 0 CHECK (quantidade_executada >= 0),
  peso_executado_kg numeric CHECK (peso_executado_kg IS NULL OR peso_executado_kg >= 0),
  observacoes text,
  status text NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','pausado','concluido')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apontamentos_producao TO authenticated;
GRANT ALL ON public.apontamentos_producao TO service_role;
ALTER TABLE public.apontamentos_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apontamentos_read_business" ON public.apontamentos_producao FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "apontamentos_manage_producao" ON public.apontamentos_producao FOR ALL TO authenticated USING (public.has_role(auth.uid(),'producao') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'producao') OR public.is_admin(auth.uid()));

CREATE TABLE public.paralisacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  conjunto_id uuid REFERENCES public.pedido_conjuntos(id) ON DELETE CASCADE,
  apontamento_id uuid REFERENCES public.apontamentos_producao(id) ON DELETE SET NULL,
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE SET NULL,
  motivo text NOT NULL CHECK (motivo IN ('falta_material','manutencao','absenteismo','projeto','qualidade','energia','outros')),
  detalhe text,
  inicio timestamptz NOT NULL DEFAULT now(),
  fim timestamptz,
  duracao_horas numeric GENERATED ALWAYS AS (CASE WHEN fim IS NULL THEN NULL ELSE round((extract(epoch from (fim - inicio)) / 3600)::numeric, 2) END) STORED,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paralisacoes TO authenticated;
GRANT ALL ON public.paralisacoes TO service_role;
ALTER TABLE public.paralisacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paralisacoes_read_business" ON public.paralisacoes FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "paralisacoes_manage_producao" ON public.paralisacoes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'producao') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'producao') OR public.is_admin(auth.uid()));

CREATE TABLE public.inspecoes_qualidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  conjunto_id uuid NOT NULL REFERENCES public.pedido_conjuntos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('dimensional','soldagem','pintura','final')),
  resultado text NOT NULL DEFAULT 'pendente' CHECK (resultado IN ('pendente','aprovado','reprovado')),
  data_inspecao date NOT NULL DEFAULT CURRENT_DATE,
  inspetor_id uuid,
  observacoes text,
  reinspecao_de uuid REFERENCES public.inspecoes_qualidade(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspecoes_qualidade TO authenticated;
GRANT ALL ON public.inspecoes_qualidade TO service_role;
ALTER TABLE public.inspecoes_qualidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspecoes_read_business" ON public.inspecoes_qualidade FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "inspecoes_manage_qualidade" ON public.inspecoes_qualidade FOR ALL TO authenticated USING (public.has_role(auth.uid(),'qualidade') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'qualidade') OR public.is_admin(auth.uid()));

CREATE TABLE public.nao_conformidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspecao_id uuid NOT NULL REFERENCES public.inspecoes_qualidade(id) ON DELETE CASCADE,
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  conjunto_id uuid NOT NULL REFERENCES public.pedido_conjuntos(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  acao_corretiva text,
  exige_retrabalho boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','em_retrabalho','aguardando_reinspecao','encerrada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nao_conformidades TO authenticated;
GRANT ALL ON public.nao_conformidades TO service_role;
ALTER TABLE public.nao_conformidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ncs_read_business" ON public.nao_conformidades FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "ncs_manage_qualidade" ON public.nao_conformidades FOR ALL TO authenticated USING (public.has_role(auth.uid(),'qualidade') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'qualidade') OR public.is_admin(auth.uid()));

CREATE TABLE public.romaneios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  numero text NOT NULL UNIQUE,
  data_romaneio date NOT NULL DEFAULT CURRENT_DATE,
  destino text,
  transporte text,
  status text NOT NULL DEFAULT 'preparacao' CHECK (status IN ('preparacao','expedido','entregue','cancelado')),
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.romaneios TO authenticated;
GRANT ALL ON public.romaneios TO service_role;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romaneios_read_business" ON public.romaneios FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "romaneios_manage_expedicao" ON public.romaneios FOR ALL TO authenticated USING (public.has_role(auth.uid(),'expedicao') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'expedicao') OR public.is_admin(auth.uid()));

CREATE TABLE public.romaneio_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  romaneio_id uuid NOT NULL REFERENCES public.romaneios(id) ON DELETE CASCADE,
  conjunto_id uuid NOT NULL REFERENCES public.pedido_conjuntos(id) ON DELETE RESTRICT,
  quantidade numeric NOT NULL CHECK (quantidade > 0),
  peso_kg numeric CHECK (peso_kg IS NULL OR peso_kg >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (romaneio_id, conjunto_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.romaneio_itens TO authenticated;
GRANT ALL ON public.romaneio_itens TO service_role;
ALTER TABLE public.romaneio_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "romaneio_itens_read_business" ON public.romaneio_itens FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "romaneio_itens_manage_expedicao" ON public.romaneio_itens FOR ALL TO authenticated USING (public.has_role(auth.uid(),'expedicao') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'expedicao') OR public.is_admin(auth.uid()));

CREATE TABLE public.medicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  romaneio_id uuid REFERENCES public.romaneios(id) ON DELETE SET NULL,
  numero text NOT NULL,
  periodo_inicio date,
  periodo_fim date,
  valor_medido numeric NOT NULL DEFAULT 0 CHECK (valor_medido >= 0),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviada','aprovada','reprovada')),
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pedido_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicoes TO authenticated;
GRANT ALL ON public.medicoes TO service_role;
ALTER TABLE public.medicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medicoes_read_business" ON public.medicoes FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "medicoes_manage_medicao" ON public.medicoes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'medicao') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'medicao') OR public.is_admin(auth.uid()));

CREATE TABLE public.notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  medicao_id uuid REFERENCES public.medicoes(id) ON DELETE SET NULL,
  numero text NOT NULL,
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date,
  valor numeric NOT NULL DEFAULT 0 CHECK (valor >= 0),
  status text NOT NULL DEFAULT 'emitida' CHECK (status IN ('emitida','vencida','paga','cancelada')),
  data_pagamento date,
  valor_recebido numeric NOT NULL DEFAULT 0 CHECK (valor_recebido >= 0),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pedido_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_fiscais TO authenticated;
GRANT ALL ON public.notas_fiscais TO service_role;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notas_read_business" ON public.notas_fiscais FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY "notas_manage_medicao" ON public.notas_fiscais FOR ALL TO authenticated USING (public.has_role(auth.uid(),'medicao') OR public.is_admin(auth.uid())) WITH CHECK (public.has_role(auth.uid(),'medicao') OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.validar_romaneio_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total_planejado numeric; total_expedido numeric; liberado boolean;
BEGIN
  SELECT quantidade, liberado_qualidade INTO total_planejado, liberado FROM public.pedido_conjuntos WHERE id = NEW.conjunto_id;
  IF NOT COALESCE(liberado, false) THEN RAISE EXCEPTION 'Conjunto ainda não liberado pela Qualidade'; END IF;
  SELECT COALESCE(sum(ri.quantidade),0) INTO total_expedido FROM public.romaneio_itens ri JOIN public.romaneios r ON r.id=ri.romaneio_id WHERE ri.conjunto_id=NEW.conjunto_id AND r.status <> 'cancelado' AND ri.id <> NEW.id;
  IF total_expedido + NEW.quantidade > total_planejado THEN RAISE EXCEPTION 'Quantidade expedida supera o saldo liberado'; END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validar_romaneio_item() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validar_romaneio_item() TO service_role;
CREATE TRIGGER validar_romaneio_item_trigger BEFORE INSERT OR UPDATE ON public.romaneio_itens FOR EACH ROW EXECUTE FUNCTION public.validar_romaneio_item();

CREATE OR REPLACE FUNCTION public.atualizar_liberacao_qualidade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tipo='final' AND NEW.resultado='aprovado' THEN UPDATE public.pedido_conjuntos SET liberado_qualidade=true, status='liberado', updated_at=now() WHERE id=NEW.conjunto_id;
  ELSIF NEW.resultado='reprovado' THEN UPDATE public.pedido_conjuntos SET liberado_qualidade=false, updated_at=now() WHERE id=NEW.conjunto_id;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.atualizar_liberacao_qualidade() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.atualizar_liberacao_qualidade() TO service_role;
CREATE TRIGGER atualizar_liberacao_qualidade_trigger AFTER INSERT OR UPDATE OF resultado ON public.inspecoes_qualidade FOR EACH ROW EXECUTE FUNCTION public.atualizar_liberacao_qualidade();

CREATE INDEX pcp_planos_pedido_idx ON public.pcp_planos(pedido_id);
CREATE INDEX conjuntos_pedido_idx ON public.pedido_conjuntos(pedido_id);
CREATE INDEX etapas_conjunto_idx ON public.cronograma_etapas(conjunto_id);
CREATE INDEX reprogramacoes_pedido_idx ON public.pcp_reprogramacoes(pedido_id);
CREATE INDEX apontamentos_pedido_idx ON public.apontamentos_producao(pedido_id);
CREATE INDEX paralisacoes_pedido_idx ON public.paralisacoes(pedido_id);
CREATE INDEX inspecoes_pedido_idx ON public.inspecoes_qualidade(pedido_id);
CREATE INDEX romaneios_pedido_idx ON public.romaneios(pedido_id);
CREATE INDEX medicoes_pedido_idx ON public.medicoes(pedido_id);
CREATE INDEX notas_pedido_idx ON public.notas_fiscais(pedido_id);

CREATE TRIGGER pcp_planos_updated_at BEFORE UPDATE ON public.pcp_planos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER conjuntos_updated_at BEFORE UPDATE ON public.pedido_conjuntos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER etapas_updated_at BEFORE UPDATE ON public.cronograma_etapas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER apontamentos_updated_at BEFORE UPDATE ON public.apontamentos_producao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER inspecoes_updated_at BEFORE UPDATE ON public.inspecoes_qualidade FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ncs_updated_at BEFORE UPDATE ON public.nao_conformidades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER romaneios_updated_at BEFORE UPDATE ON public.romaneios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER medicoes_updated_at BEFORE UPDATE ON public.medicoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER notas_updated_at BEFORE UPDATE ON public.notas_fiscais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();