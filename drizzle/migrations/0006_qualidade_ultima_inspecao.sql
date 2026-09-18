CREATE OR REPLACE FUNCTION public.atualizar_liberacao_qualidade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_conjunto uuid;
  v_reprovado boolean;
  v_final_aprovado boolean;
  v_progresso numeric;
BEGIN
  v_conjunto := COALESCE(NEW.conjunto_id, OLD.conjunto_id);

  WITH ult AS (
    SELECT DISTINCT ON (tipo) tipo, resultado
    FROM public.inspecoes_qualidade
    WHERE conjunto_id = v_conjunto
    ORDER BY tipo, data_inspecao DESC, created_at DESC
  )
  SELECT
    EXISTS (SELECT 1 FROM ult WHERE resultado = 'reprovado'),
    EXISTS (SELECT 1 FROM ult WHERE tipo = 'final' AND resultado = 'aprovado')
  INTO v_reprovado, v_final_aprovado;

  SELECT progresso INTO v_progresso FROM public.pedido_conjuntos WHERE id = v_conjunto;

  IF v_final_aprovado AND NOT v_reprovado THEN
    UPDATE public.pedido_conjuntos
      SET liberado_qualidade = true, status = 'liberado', updated_at = now()
      WHERE id = v_conjunto;
  ELSE
    UPDATE public.pedido_conjuntos
      SET liberado_qualidade = false,
          status = CASE
            WHEN COALESCE(v_progresso, 0) >= 100 THEN 'aguardando_qualidade'
            WHEN COALESCE(v_progresso, 0) > 0 THEN 'em_producao'
            ELSE 'planejado'
          END,
          updated_at = now()
      WHERE id = v_conjunto;
  END IF;

  RETURN COALESCE(NEW, OLD);
END; $function$;

DROP TRIGGER IF EXISTS atualizar_liberacao_qualidade_trigger ON public.inspecoes_qualidade;
CREATE TRIGGER atualizar_liberacao_qualidade_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.inspecoes_qualidade
FOR EACH ROW EXECUTE FUNCTION public.atualizar_liberacao_qualidade();