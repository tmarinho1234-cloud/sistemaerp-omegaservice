DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'solicitacoes_orcamento','analises_tecnicas','demanda_requisitos','orcamentos','orcamento_conjuntos',
    'orcamento_conjunto_atividades','orcamento_itens','orcamento_historico','pcp_planos','pcp_reprogramacoes',
    'cronograma_etapas','apontamentos_producao','paralisacoes','atividades_nao_previstas','inspecoes_qualidade',
    'nao_conformidades','romaneios','romaneio_itens','romaneio_notas','medicoes','notas_fiscais',
    'databook_relatorios','contratos','sub_areas'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;