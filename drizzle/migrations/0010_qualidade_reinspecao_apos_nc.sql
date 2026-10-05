CREATE OR REPLACE FUNCTION public.validar_inspecao_quantidade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pronta numeric;
  v_ja numeric;
BEGIN
  IF NEW.quantidade_inspecionada <= 0 THEN
    RAISE EXCEPTION 'Informe a quantidade inspecionada';
  END IF;
  IF NEW.quantidade_aprovada < 0 OR NEW.quantidade_reprovada < 0 THEN
    RAISE EXCEPTION 'Quantidades não podem ser negativas';
  END IF;
  IF NEW.quantidade_aprovada + NEW.quantidade_reprovada <> NEW.quantidade_inspecionada THEN
    RAISE EXCEPTION 'Quantidade inspecionada deve ser igual a aprovada + reprovada';
  END IF;

  SELECT quantidade_fabricada
  INTO v_pronta
  FROM public.pedido_conjuntos
  WHERE id = NEW.conjunto_id;

  SELECT COALESCE(sum(
    i.quantidade_aprovada +
    CASE
      WHEN i.quantidade_reprovada > 0
        AND EXISTS (
          SELECT 1
          FROM public.nao_conformidades nc
          WHERE nc.inspecao_id = i.id
            AND nc.status = 'encerrada'
        )
      THEN 0
      ELSE i.quantidade_reprovada
    END
  ), 0)
  INTO v_ja
  FROM public.inspecoes_qualidade i
  WHERE i.conjunto_id = NEW.conjunto_id
    AND i.tipo = NEW.tipo
    AND i.id <> NEW.id;

  IF v_ja + NEW.quantidade_inspecionada > COALESCE(v_pronta, 0) THEN
    RAISE EXCEPTION 'Quantidade acima do saldo disponível para inspeção (disponível: %)', GREATEST(COALESCE(v_pronta, 0) - v_ja, 0);
  END IF;

  NEW.resultado := CASE WHEN NEW.quantidade_reprovada > 0 THEN 'reprovado' ELSE 'aprovado' END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validar_inspecao_quantidade() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validar_inspecao_quantidade() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_inspecao_quantidade() TO service_role;