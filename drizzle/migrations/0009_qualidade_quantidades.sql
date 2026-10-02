ALTER TABLE public.inspecoes_qualidade
  ADD COLUMN IF NOT EXISTS quantidade_inspecionada numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_aprovada numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_reprovada numeric NOT NULL DEFAULT 0;
ALTER TABLE public.pedido_conjuntos
  ADD COLUMN IF NOT EXISTS quantidade_liberada numeric NOT NULL DEFAULT 0;

-- Backfill: última inspeção de cada tipo recebe a quantidade fabricada
WITH ult AS (
  SELECT DISTINCT ON (i.conjunto_id, i.tipo) i.id, i.resultado, pc.quantidade_fabricada q
  FROM public.inspecoes_qualidade i JOIN public.pedido_conjuntos pc ON pc.id = i.conjunto_id
  ORDER BY i.conjunto_id, i.tipo, i.data_inspecao DESC, i.created_at DESC
)
UPDATE public.inspecoes_qualidade i SET
  quantidade_inspecionada = CASE WHEN ult.resultado IN ('aprovado','reprovado') THEN ult.q ELSE 0 END,
  quantidade_aprovada = CASE WHEN ult.resultado = 'aprovado' THEN ult.q ELSE 0 END,
  quantidade_reprovada = CASE WHEN ult.resultado = 'reprovado' THEN ult.q ELSE 0 END
FROM ult WHERE ult.id = i.id;

CREATE OR REPLACE FUNCTION public.validar_inspecao_quantidade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_pronta numeric; v_ja numeric;
BEGIN
  IF NEW.quantidade_inspecionada <= 0 THEN RAISE EXCEPTION 'Informe a quantidade inspecionada'; END IF;
  IF NEW.quantidade_aprovada < 0 OR NEW.quantidade_reprovada < 0 THEN RAISE EXCEPTION 'Quantidades não podem ser negativas'; END IF;
  IF NEW.quantidade_aprovada + NEW.quantidade_reprovada <> NEW.quantidade_inspecionada THEN
    RAISE EXCEPTION 'Quantidade inspecionada deve ser igual a aprovada + reprovada';
  END IF;
  SELECT quantidade_fabricada INTO v_pronta FROM public.pedido_conjuntos WHERE id = NEW.conjunto_id;
  SELECT COALESCE(sum(quantidade_inspecionada),0) INTO v_ja FROM public.inspecoes_qualidade
    WHERE conjunto_id = NEW.conjunto_id AND tipo = NEW.tipo AND id <> NEW.id;
  IF v_ja + NEW.quantidade_inspecionada > COALESCE(v_pronta,0) THEN
    RAISE EXCEPTION 'Quantidade acima do saldo disponível para inspeção (disponível: %)', GREATEST(COALESCE(v_pronta,0) - v_ja, 0);
  END IF;
  NEW.resultado := CASE WHEN NEW.quantidade_reprovada > 0 THEN 'reprovado' ELSE 'aprovado' END;
  RETURN NEW;
END; $$;

CREATE TRIGGER validar_inspecao_quantidade_trigger
BEFORE INSERT OR UPDATE ON public.inspecoes_qualidade
FOR EACH ROW EXECUTE FUNCTION public.validar_inspecao_quantidade();

CREATE OR REPLACE FUNCTION public.atualizar_liberacao_qualidade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_conjunto uuid; v_lib numeric; v_qtd numeric; v_progresso numeric;
BEGIN
  v_conjunto := COALESCE(NEW.conjunto_id, OLD.conjunto_id);
  SELECT COALESCE(sum(quantidade_aprovada),0) INTO v_lib FROM public.inspecoes_qualidade
    WHERE conjunto_id = v_conjunto AND tipo = 'final';
  SELECT quantidade, progresso INTO v_qtd, v_progresso FROM public.pedido_conjuntos WHERE id = v_conjunto;
  UPDATE public.pedido_conjuntos SET
    quantidade_liberada = v_lib,
    liberado_qualidade = v_lib > 0,
    status = CASE
      WHEN status IN ('expedido','parcialmente_expedido') THEN status
      WHEN v_lib >= COALESCE(v_qtd,0) AND v_lib > 0 THEN 'liberado'
      WHEN COALESCE(v_progresso,0) >= 100 THEN 'aguardando_qualidade'
      WHEN COALESCE(v_progresso,0) > 0 THEN 'em_producao'
      ELSE 'planejado' END,
    updated_at = now()
  WHERE id = v_conjunto;
  RETURN COALESCE(NEW, OLD);
END; $$;

UPDATE public.pedido_conjuntos pc SET quantidade_liberada = COALESCE((
  SELECT sum(quantidade_aprovada) FROM public.inspecoes_qualidade i WHERE i.conjunto_id = pc.id AND i.tipo = 'final'),0);
UPDATE public.pedido_conjuntos SET liberado_qualidade = quantidade_liberada > 0;

CREATE OR REPLACE FUNCTION public.validar_romaneio_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_lib numeric; total_expedido numeric;
BEGIN
  SELECT quantidade_liberada INTO v_lib FROM public.pedido_conjuntos WHERE id = NEW.conjunto_id;
  IF COALESCE(v_lib,0) <= 0 THEN RAISE EXCEPTION 'Conjunto sem quantidade liberada pela Qualidade'; END IF;
  SELECT COALESCE(sum(ri.quantidade),0) INTO total_expedido FROM public.romaneio_itens ri JOIN public.romaneios r ON r.id=ri.romaneio_id
    WHERE ri.conjunto_id=NEW.conjunto_id AND r.status <> 'cancelado' AND ri.id <> NEW.id;
  IF total_expedido + NEW.quantidade > v_lib THEN
    RAISE EXCEPTION 'Quantidade acima do saldo liberado pela Qualidade (disponível: %)', GREATEST(v_lib - total_expedido, 0);
  END IF;
  RETURN NEW;
END; $$;