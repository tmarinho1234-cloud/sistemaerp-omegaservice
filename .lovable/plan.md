# Data de Aprovação, prazo de aquisição e início de fabricação

Ligar a aprovação da proposta ao planejamento do PCP: a data em que a proposta foi aprovada, o prazo de aquisição de materiais (em dias úteis) e a data prevista de chegada dos materiais / início da fabricação, calculada automaticamente.

## Fluxo

```text
Análise Técnica: aquisição de materiais SIM + prazo (dias úteis)
        ↓
Aprovação da proposta → registra Data de Aprovação
        ↓
PCP: Data de Aprovação + Prazo de Aquisição
     → Data prevista de chegada dos materiais / início da fabricação (dias úteis)
        ↓
Início da fabricação real (botão "Iniciar produção")
```

## 1. Cadastro de Feriados

- Nova tela em Cadastros: Feriados, com data e nome (ex.: 07/11/2026 — Consciência Negra).
- Todo cálculo de dias úteis desconsidera sábados, domingos e esses feriados.

## 2. Orçamentos

- A aprovação passa a registrar a **Data de Aprovação** (por padrão a data de hoje, podendo ser ajustada no formulário de aprovação).
- O **Prazo de Aquisição de Materiais** continua sendo informado uma única vez na Análise Técnica (dias úteis); a aba Aprovação apenas exibe o valor e a data prevista de chegada dos materiais já calculada.
- Ao aprovar, essas informações vão automaticamente para o PCP, sem lançamento manual.
- Reabrir / reaprovar a proposta atualiza os dados no PCP, como já acontece hoje.

## 3. PCP

- Tabela principal com: POMG · Contrato/Subárea (cliente) · Data de Aprovação · Prazo de Aquisição · Chegada de materiais / Início previsto · Início da fabricação real · Situação · Data de entrega (SLA) · Avanço · Farol.
- Colunas atuais de avanço previsto/real e farol são mantidas; o detalhamento da demanda também mostra os três novos campos.
- A data prevista de chegada dos materiais aparece destacada quando já vencida e a fabricação ainda não começou.

## 4. Reprogramação do prazo de aquisição

- No PCP é possível alterar o prazo de aquisição (dias úteis) de uma demanda, informando o motivo.
- A data de chegada dos materiais / início previsto é recalculada na hora.
- A data originalmente calculada e cada alteração ficam registradas no histórico de reprogramações da demanda, junto às reprogramações já existentes.

## Detalhes técnicos

- Migração aditiva:
  - `public.feriados` (data única, nome, ativo) com GRANTs, RLS e políticas: leitura para papéis de negócio, escrita para admin/pcp/orcamentos.
  - `orcamentos.data_aprovacao` (date), `pedidos.data_aprovacao` (date), `pedidos.prazo_aquisicao_dias` (int), `pedidos.data_chegada_materiais` (date), `pedidos.data_chegada_materiais_original` (date).
  - `pcp_reprogramacoes.tipo` (text, default `entrega`) para distinguir reprogramações de entrega e de aquisição de materiais.
  - Backfill: `data_aprovacao` a partir de `respondido_em` nas propostas já aprovadas; `prazo_aquisicao_dias` a partir de `analises_tecnicas`; datas de chegada recalculadas em código na primeira edição/reaprovação.
- Helper `diasUteis(dataBase, dias, feriados)` em `src/components/operations.tsx`, com hook `useFeriados()`; usado por Orçamentos e PCP.
- `orcamentos.tsx`: mutation de aprovação grava `data_aprovacao`, lê `prazo_aquisicao_dias` da análise técnica e grava no pedido `prazo_aquisicao_dias`, `data_chegada_materiais` e `data_chegada_materiais_original`; `sincronizarPedido` propaga o mesmo cálculo na reaprovação; entradas correspondentes no histórico da proposta.
- `pcp.tsx`: novas colunas, diálogo "Reprogramar aquisição" gravando em `pcp_reprogramacoes` com `tipo = 'aquisicao'` e recalculando `data_chegada_materiais`.
- `operations.tsx`: `PedidoResumo` ganha os novos campos; `TABELAS_SINCRONIZADAS` inclui `feriados`.
- Nova rota `src/routes/_authenticated/cadastros/feriados.tsx` reutilizando o padrão de `crud-page.tsx`, com item no menu Cadastros e metadados próprios.

## Critérios de conclusão

- Aprovar uma proposta grava a data de aprovação e faz o PCP mostrar prazo de aquisição e data prevista de chegada dos materiais sem digitação.
- O cálculo pula sábados, domingos e feriados cadastrados (17/09/2026 + 10 dias úteis = 01/10/2026, salvo feriados).
- Alterar o prazo de aquisição recalcula a data e mantém o histórico com a data original.
- A data de aprovação existe uma única vez, compartilhada por Orçamentos e PCP.
