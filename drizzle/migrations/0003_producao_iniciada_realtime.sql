ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS producao_iniciada boolean NOT NULL DEFAULT false;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS data_inicio_producao timestamptz;

UPDATE public.pedidos SET producao_iniciada = true, data_inicio_producao = COALESCE(data_inicio_producao, now())
WHERE pcp_status IN ('em_fabricacao','ag_entrega','entregue');

ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
ALTER TABLE public.pedido_conjuntos REPLICA IDENTITY FULL;
ALTER TABLE public.pedido_conjunto_atividades REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_conjuntos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_conjunto_atividades; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;