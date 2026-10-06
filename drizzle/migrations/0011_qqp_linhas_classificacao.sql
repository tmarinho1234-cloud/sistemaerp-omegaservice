ALTER TABLE public.contrato_linhas_preco ADD COLUMN IF NOT EXISTS classificacao text CHECK (classificacao IN ('fornecimento','servico'));
CREATE UNIQUE INDEX IF NOT EXISTS contrato_linhas_preco_contrato_codigo_uk ON public.contrato_linhas_preco(contrato_id, codigo);

ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS contrato_linha_id uuid REFERENCES public.contrato_linhas_preco(id) ON DELETE SET NULL;
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS item_qqp text;
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS classificacao text CHECK (classificacao IN ('fornecimento','servico'));

CREATE TABLE public.medicao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicao_id uuid NOT NULL REFERENCES public.medicoes(id) ON DELETE CASCADE,
  orcamento_item_id uuid NOT NULL REFERENCES public.orcamento_itens(id) ON DELETE RESTRICT,
  quantidade numeric NOT NULL DEFAULT 0,
  percentual numeric NOT NULL DEFAULT 0,
  valor numeric NOT NULL DEFAULT 0 CHECK (valor >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.medicao_itens(orcamento_item_id);
CREATE INDEX ON public.medicao_itens(medicao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicao_itens TO authenticated;
GRANT ALL ON public.medicao_itens TO service_role;
ALTER TABLE public.medicao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY medicao_itens_read_business ON public.medicao_itens FOR SELECT TO authenticated USING (public.has_any_business_role(auth.uid()));
CREATE POLICY medicao_itens_manage ON public.medicao_itens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'medicao') OR public.is_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'medicao') OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.validar_medicao_item() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contratado numeric; v_usado numeric;
BEGIN
  SELECT COALESCE(preco_total, quantidade*preco_unitario) INTO v_contratado FROM orcamento_itens WHERE id = NEW.orcamento_item_id;
  SELECT COALESCE(SUM(mi.valor),0) INTO v_usado FROM medicao_itens mi JOIN medicoes m ON m.id = mi.medicao_id
   WHERE mi.orcamento_item_id = NEW.orcamento_item_id AND m.status <> 'cancelada' AND mi.id <> NEW.id;
  IF v_usado + NEW.valor > COALESCE(v_contratado,0) + 0.005 THEN
    RAISE EXCEPTION 'Valor medido excede o saldo da linha QQP (saldo: %)', round(COALESCE(v_contratado,0) - v_usado, 2);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validar_medicao_item BEFORE INSERT OR UPDATE ON public.medicao_itens
FOR EACH ROW EXECUTE FUNCTION public.validar_medicao_item();

ALTER PUBLICATION supabase_realtime ADD TABLE public.medicao_itens;