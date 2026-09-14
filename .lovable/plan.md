# Módulos operacionais ligados ao Pedido

## Objetivo

Transformar os módulos hoje vazios de **PCP, Produção, Qualidade, Expedição e Medição** em um fluxo operacional integrado ao Pedido, com rastreabilidade por **Contrato → Pedido → Conjunto → TAG** e um painel gerencial de KPIs.

## Fluxo que será entregue

```text
Pedido aberto
  → PCP estrutura conjuntos/TAGs e publica o cronograma
  → Produção executa processos e registra paralisações
  → Qualidade inspeciona, bloqueia ou libera conjuntos
  → Expedição monta romaneios parciais com conjuntos liberados
  → Medição registra valores, notas, vencimentos e pagamentos
  → Pedido concluído
```

## 1. Estrutura de dados e permissões

- Criar tabelas para:
  - planos de PCP e suas datas-base;
  - conjuntos/TAGs do pedido, quantidade, peso e prioridade;
  - etapas do cronograma por conjunto;
  - histórico de reprogramações, com datas anteriores, novas datas, motivo e dias de impacto;
  - apontamentos de produção por processo;
  - paralisações, causa, equipamento, início, fim e duração;
  - inspeções, não conformidades, retrabalho e liberação da qualidade;
  - romaneios e seus conjuntos/quantidades expedidas;
  - medições, notas fiscais, vencimentos e pagamentos.
- Adicionar índices, atualização automática de datas e validações para impedir quantidades expedidas acima do disponível.
- Manter leitura para perfis operacionais e escrita por setor: PCP, Produção, Qualidade, Expedição, Medição e Admin.
- Aplicar permissões explícitas e segurança por linha em todas as novas tabelas.
- Manter os dados atuais de pedidos e orçamentos sem remoções ou mudanças destrutivas.

## 2. PCP

- Exibir os pedidos recebidos de Orçamentos com empresa, contrato, sub-área, prazo e situação.
- Permitir criar e editar o planejamento do pedido.
- Cadastrar conjuntos com código, TAG, descrição, quantidade, peso, prioridade e datas previstas.
- Montar o cronograma por etapas: corte, dobra, usinagem, montagem, soldagem, pintura, qualidade e expedição.
- Registrar cada reprogramação sem apagar o planejamento anterior.
- Mostrar avanço físico real, avanço planejado na data e desvio em pontos percentuais/dias.
- Reprogramações alteram a curva planejada e o atraso previsto, sem falsificar o avanço físico já executado.

## 3. Produção

- Exibir uma visão por Pedido e por Conjunto/TAG.
- Permitir iniciar, pausar, retomar e concluir cada processo produtivo.
- Registrar responsável, equipamento, data/hora, quantidade ou peso executado e observações.
- Registrar paralisações com motivo padronizado, detalhe, início/fim, equipamento e impacto em horas.
- Calcular o avanço do conjunto pelas etapas concluídas e o avanço do pedido ponderado pelo peso ou, quando não informado, pela quantidade.
- Destacar conjuntos atrasados, paralisados e aguardando próxima etapa.

## 4. Qualidade

- Criar fila de inspeções por Pedido, Conjunto/TAG e etapa produtiva.
- Registrar inspeções dimensionais, soldagem, pintura e inspeção final, com resultado e observações.
- Abrir não conformidade, indicar retrabalho e reinspecionar mantendo o histórico.
- Liberar o conjunto somente após aprovação final.
- Bloquear a inclusão em romaneio enquanto o conjunto não estiver liberado.

## 5. Expedição

- Exibir somente conjuntos liberados pela Qualidade e seus saldos disponíveis.
- Criar romaneios parciais por Pedido, com número, data, destino, transporte e observações.
- Adicionar conjuntos e quantidades/pesos ao romaneio, controlando saldo já expedido.
- Acompanhar romaneios em preparação, expedidos, entregues ou cancelados.
- Atualizar automaticamente os indicadores de expedição parcial e completa do Pedido.

## 6. Medição

- Registrar medições vinculadas ao Pedido e, quando aplicável, aos romaneios entregues.
- Controlar número da medição, período, valor medido, aprovação e observações.
- Registrar nota fiscal, emissão, vencimento, valor faturado, recebimento e data de pagamento.
- Exibir saldos a medir, faturados, vencidos e recebidos por Pedido e Contrato.
- Permitir encerramento do Pedido quando produção, qualidade, expedição e medição estiverem completas.

## 7. Painel de KPIs

- Adicionar filtros por Contrato, Pedido e período.
- Exibir:
  - avanço físico planejado versus realizado por pedido;
  - pedidos no prazo, em risco e atrasados;
  - horas de paralisação e principais causas;
  - eficiência produtiva: horas produtivas ÷ horas apontadas;
  - conjuntos produzidos, liberados e expedidos;
  - reprovações e retrabalhos da Qualidade;
  - valores medidos, faturados, vencidos e recebidos;
  - consolidação dos indicadores por Contrato.
- Manter o painel atual de Orçamentos e retirar os avisos de “em construção”.
- Usar gráficos e tabelas compactas, mantendo a identidade visual da Omega Service.

## 8. Integração e experiência

- Usar os módulos existentes na navegação, substituindo as telas provisórias.
- Padronizar busca, filtros, indicadores, tabelas, formulários e detalhes laterais.
- Atualizar dados entre módulos após cada operação, sem exigir recarregar a página.
- Incluir mensagens claras para bloqueios, estados vazios e erros de permissão.
- Adicionar metadados próprios em cada página do módulo.

## Critérios de conclusão

- Um Pedido aprovado pode ser planejado, dividido em conjuntos/TAGs, produzido, inspecionado, expedido parcialmente e medido até o encerramento.
- Toda reprogramação e paralisação permanece auditável.
- Um conjunto reprovado não pode ser expedido.
- O saldo expedido nunca supera o saldo liberado.
- Os KPIs refletem os registros reais e podem ser filtrados por Contrato e Pedido.
- Validar as permissões de cada setor e testar o fluxo completo em desktop e celular.
