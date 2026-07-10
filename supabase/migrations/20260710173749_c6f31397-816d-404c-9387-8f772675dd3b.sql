
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin','orcamentos','pcp','producao','qualidade','expedicao','medicao','viewer');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  matricula TEXT,
  setor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE POLICY "user_roles_read_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ TRIGGER: auto criar profile + role viewer no signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT UTIL ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CLIENTES ============
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  contato TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_read_all" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clientes_write_orc_admin" ON public.clientes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid()));
CREATE TRIGGER clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CONTRATOS ============
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL, -- Alumar, Vale Ferrosos, Vale Base Metals
  numero TEXT,
  data_inicio DATE,
  data_fim DATE,
  prazo_pagamento_dias INTEGER DEFAULT 30,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;
GRANT ALL ON public.contratos TO service_role;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_read_all" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "contratos_write_orc_admin" ON public.contratos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid()));
CREATE TRIGGER contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ LINHAS DE PREÇO DO CONTRATO ============
CREATE TABLE public.contrato_linhas_preco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'kg',
  preco_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_linhas_preco TO authenticated;
GRANT ALL ON public.contrato_linhas_preco TO service_role;
ALTER TABLE public.contrato_linhas_preco ENABLE ROW LEVEL SECURITY;
CREATE POLICY "linhas_read_all" ON public.contrato_linhas_preco FOR SELECT TO authenticated USING (true);
CREATE POLICY "linhas_write_orc_admin" ON public.contrato_linhas_preco FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'orcamentos') OR public.is_admin(auth.uid()));
CREATE TRIGGER linhas_updated_at BEFORE UPDATE ON public.contrato_linhas_preco FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EQUIPAMENTOS ============
CREATE TABLE public.equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT,
  setor TEXT,
  status TEXT NOT NULL DEFAULT 'disponivel',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamentos TO authenticated;
GRANT ALL ON public.equipamentos TO service_role;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equip_read_all" ON public.equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "equip_write_pcp_prod_admin" ON public.equipamentos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'pcp') OR public.has_role(auth.uid(),'producao') OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'pcp') OR public.has_role(auth.uid(),'producao') OR public.is_admin(auth.uid()));
CREATE TRIGGER equip_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ FUNCIONÁRIOS ============
CREATE TABLE public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  funcao TEXT,
  setor TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_admissao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcionarios TO authenticated;
GRANT ALL ON public.funcionarios TO service_role;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "func_read_all" ON public.funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "func_write_pcp_admin" ON public.funcionarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'pcp') OR public.is_admin(auth.uid()));
CREATE TRIGGER func_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
