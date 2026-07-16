
-- 1) Helper: has any business role
CREATE OR REPLACE FUNCTION public.has_any_business_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','orcamentos','pcp','producao','qualidade','expedicao','medicao')
  );
$$;

REVOKE ALL ON FUNCTION public.has_any_business_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_business_role(uuid) TO authenticated;

-- 2) Replace broad SELECT policies on business tables
DROP POLICY IF EXISTS "Autenticados podem ler sub_areas" ON public.sub_areas;
CREATE POLICY "sub_areas_read_business_role" ON public.sub_areas
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "linhas_read_all" ON public.contrato_linhas_preco;
CREATE POLICY "linhas_read_business_role" ON public.contrato_linhas_preco
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "contratos_read_all" ON public.contratos;
CREATE POLICY "contratos_read_business_role" ON public.contratos
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "equip_read_all" ON public.equipamentos;
CREATE POLICY "equip_read_business_role" ON public.equipamentos
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "func_read_all" ON public.funcionarios;
CREATE POLICY "func_read_business_role" ON public.funcionarios
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "auth read anexos" ON public.solicitacao_anexos;
CREATE POLICY "solic_anexos_read_business_role" ON public.solicitacao_anexos
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "auth read solicitacoes" ON public.solicitacoes_orcamento;
CREATE POLICY "solicitacoes_read_business_role" ON public.solicitacoes_orcamento
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "auth read itens" ON public.orcamento_itens;
CREATE POLICY "orc_itens_read_business_role" ON public.orcamento_itens
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "auth read analises" ON public.analises_tecnicas;
CREATE POLICY "analises_read_business_role" ON public.analises_tecnicas
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "auth read orcamentos" ON public.orcamentos;
CREATE POLICY "orcamentos_read_business_role" ON public.orcamentos
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "auth read orc anexos" ON public.orcamento_anexos;
CREATE POLICY "orc_anexos_read_business_role" ON public.orcamento_anexos
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

DROP POLICY IF EXISTS "auth read pedidos" ON public.pedidos;
CREATE POLICY "pedidos_read_business_role" ON public.pedidos
  FOR SELECT TO authenticated
  USING (public.has_any_business_role(auth.uid()));

-- 3) Profiles: own row or admin only
DROP POLICY IF EXISTS "profiles_read_all_auth" ON public.profiles;
CREATE POLICY "profiles_read_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- 4) Restrict SECURITY DEFINER function EXECUTE
-- handle_new_user is only called by the auth.users trigger; no client should execute it.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role / is_admin are used inside RLS policies; keep authenticated EXECUTE but
-- remove PUBLIC / anon exposure to reduce the SECURITY DEFINER attack surface.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
