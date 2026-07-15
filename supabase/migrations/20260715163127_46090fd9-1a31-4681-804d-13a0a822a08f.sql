
CREATE TYPE public.qqp_categoria AS ENUM ('kg','hora','m2','formato_a1','diaria','outros');

ALTER TABLE public.orcamento_itens
  ADD COLUMN categoria public.qqp_categoria NOT NULL DEFAULT 'outros';

-- Backfill categoria based on existing unidade text
UPDATE public.orcamento_itens SET categoria = 'kg' WHERE lower(unidade) IN ('kg','quilo','quilograma');
UPDATE public.orcamento_itens SET categoria = 'hora' WHERE lower(unidade) IN ('h','hora','hr','horas');
UPDATE public.orcamento_itens SET categoria = 'm2' WHERE lower(unidade) IN ('m2','m²');
UPDATE public.orcamento_itens SET categoria = 'formato_a1' WHERE lower(unidade) IN ('a1','formato a1','fmt a1');
UPDATE public.orcamento_itens SET categoria = 'diaria' WHERE lower(unidade) IN ('diaria','diária','dia');
