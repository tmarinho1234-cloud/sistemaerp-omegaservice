ALTER TABLE public.orcamento_conjuntos
  ADD COLUMN cor text;

ALTER TABLE public.pedido_conjuntos
  ADD COLUMN cor text;

COMMENT ON COLUMN public.orcamento_conjuntos.cor IS 'Nome ou especificação textual da cor do conjunto.';
COMMENT ON COLUMN public.pedido_conjuntos.cor IS 'Nome ou especificação textual da cor do conjunto copiada do orçamento.';