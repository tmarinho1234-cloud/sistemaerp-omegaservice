ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS prazo_fabricacao_dias integer;

ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS data_entrega_reprogramada date;

ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_prazo_fabricacao_dias_check;

ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_prazo_fabricacao_dias_check CHECK (prazo_fabricacao_dias IS NULL OR prazo_fabricacao_dias >= 0);

CREATE OR REPLACE FUNCTION public.reprogramar_entrega_pedido(p_pedido_id uuid, p_nova_data date, p_motivo text, p_prazo_fabricacao_dias integer DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $function$
DECLARE v_anterior date;
BEGIN
  IF p_nova_data IS NULL THEN RAISE EXCEPTION 'Informe a nova data de entrega'; END IF;
  IF COALESCE(btrim(p_motivo), '') = '' THEN RAISE EXCEPTION 'Informe o motivo da reprogramação'; END IF;
  SELECT COALESCE(data_entrega_reprogramada, data_sla, prazo_entrega) INTO v_anterior FROM public.pedidos WHERE id = p_pedido_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Demanda não encontrada ou sem permissão'; END IF;
  INSERT INTO public.pcp_reprogramacoes (pedido_id, data_anterior, nova_data, motivo, impacto_dias, tipo, created_by)
  VALUES (p_pedido_id, v_anterior, p_nova_data, btrim(p_motivo), CASE WHEN v_anterior IS NULL THEN 0 ELSE p_nova_data - v_anterior END, 'entrega_pedido', auth.uid());
  UPDATE public.pedidos SET data_entrega_reprogramada = p_nova_data, prazo_fabricacao_dias = p_prazo_fabricacao_dias WHERE id = p_pedido_id;
END; $function$;

REVOKE ALL ON FUNCTION public.reprogramar_entrega_pedido(uuid, date, text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.reprogramar_entrega_pedido(uuid, date, text, integer) TO authenticated;