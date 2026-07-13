
CREATE TYPE public.solicitacao_status AS ENUM ('recebida','em_analise','orcamento_em_elaboracao','enviada','aprovada','reprovada','convertida_pedido');
CREATE TYPE public.orcamento_status AS ENUM ('rascunho','enviado','aprovado','reprovado');
CREATE TYPE public.pedido_status AS ENUM ('aberto','em_producao','concluido','cancelado');

CREATE TABLE public.solicitacoes_orcamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  data_recebimento DATE NOT NULL DEFAULT CURRENT_DATE,
  prazo_cliente DATE,
  escopo TEXT NOT NULL,
  observacoes TEXT,
  status public.solicitacao_status NOT NULL DEFAULT 'recebida',
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes_orcamento TO authenticated;
GRANT ALL ON public.solicitacoes_orcamento TO service_role;
ALTER TABLE public.solicitacoes_orcamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read solicitacoes" ON public.solicitacoes_orcamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "orc manage solicitacoes" ON public.solicitacoes_orcamento FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pcp'))
  WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pcp'));
CREATE TRIGGER trg_solicitacoes_updated BEFORE UPDATE ON public.solicitacoes_orcamento FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.solicitacao_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_orcamento(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  nome TEXT NOT NULL,
  tamanho BIGINT,
  tipo TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacao_anexos TO authenticated;
GRANT ALL ON public.solicitacao_anexos TO service_role;
ALTER TABLE public.solicitacao_anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read anexos" ON public.solicitacao_anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "orc manage anexos" ON public.solicitacao_anexos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.analises_tecnicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_orcamento(id) ON DELETE CASCADE,
  parecer TEXT NOT NULL,
  viavel BOOLEAN NOT NULL DEFAULT true,
  materiais TEXT,
  processos TEXT,
  horas_estimadas NUMERIC(10,2),
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_analise DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analises_tecnicas TO authenticated;
GRANT ALL ON public.analises_tecnicas TO service_role;
ALTER TABLE public.analises_tecnicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read analises" ON public.analises_tecnicas FOR SELECT TO authenticated USING (true);
CREATE POLICY "orc manage analises" ON public.analises_tecnicas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pcp'))
  WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'pcp'));
CREATE TRIGGER trg_analises_updated BEFORE UPDATE ON public.analises_tecnicas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_orcamento(id) ON DELETE CASCADE,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  prazo_execucao_dias INTEGER,
  condicoes_comerciais TEXT,
  validade DATE,
  arquivo_path TEXT,
  status public.orcamento_status NOT NULL DEFAULT 'rascunho',
  enviado_em TIMESTAMPTZ,
  respondido_em TIMESTAMPTZ,
  motivo_reprovacao TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read orcamentos" ON public.orcamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "orc manage orcamentos" ON public.orcamentos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_orcamentos_updated BEFORE UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(14,3) NOT NULL DEFAULT 1,
  unidade TEXT NOT NULL DEFAULT 'un',
  peso_kg NUMERIC(14,3),
  preco_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
  preco_total NUMERIC(14,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_itens TO authenticated;
GRANT ALL ON public.orcamento_itens TO service_role;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read itens" ON public.orcamento_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "orc manage itens" ON public.orcamento_itens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  prazo_entrega DATE,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.pedido_status NOT NULL DEFAULT 'aberto',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read pedidos" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pcp manage pedidos" ON public.pedidos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'pcp') OR public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'pcp') OR public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
