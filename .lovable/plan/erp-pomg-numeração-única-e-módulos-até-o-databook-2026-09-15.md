# ERP POMG — numeração única e módulos até o Databook

Reorganizar o sistema em torno de um código único **POMG-XXX-ANO** que nasce na solicitação e acompanha a demanda até a entrega, ajustando Orçamentos, PCP, Produção, Qualidade, Expedição, Medição e criando o Databook.

## Fluxo entregue

```text
Solicitação → POMG-001-2026 → Orçamento → Conjuntos → Análise Técnica
→ Proposta enviada → Aprovação → Prazo / Data SLA → PCP → Produção
→ Qualidade → Medição → Expedição → Databook → Entrega / Encerramento
```

## Fase 1 — Numeração POMG e Orçamentos

- Todo registro de demanda recebe um código **POMG-XXX-ANO**, sequencial por ano, gerado automaticamente e mostrado em todas as telas.
- Orçamentos passam a mostrar: data da solicitação, data de envio da proposta, prazo e Data SLA.
- Situação da proposta: **Orçamento · Ag. Aprovação · Aprovado · Cancelado**.
- Ao aprovar, o sistema pede prazo e Data SLA, e só então a demanda entra no PCP.

## Fase 2 — Conjuntos e Análise Técnica no Orçamento

- Criação dos conjuntos dentro do Orçamento: quantidade, peso de cada conjunto e as atividades de cada um (Corte, Dobra, Montagem, Acabamento, Pintura, Usinagem).
- Aba **Atividade Extra** para incluir uma atividade fora da lista padrão, com nome livre.
- Análise Técnica ganha: aquisição de materiais Sim/Não e, se sim, o prazo de aquisição.
- Checklist de relatórios/inspeções da demanda (não do conjunto): Dimensional, Solda, Pintura e Outro Ensaio com nome informado (ex.: Ultrassom).

## Fase 3 — PCP com farol

- Tela principal lista todas as propostas com POMG, proposta, contrato, subárea, avanço geral, prazo restante, avanço previsto, avanço real, situação e farol.
- Situações: Não Iniciado, Aguardando Material, Em Fabricação, Ag. Entrega, Entregue, Paralisada.
- Farol por demanda, comparando avanço previsto, avanço real e prazo restante: verde no previsto, amarelo com desvio, vermelho crítico.
- Filtros por contrato e subárea.

## Fase 4 — Produção

- Acompanhamento por conjunto e por atividade, incluindo a atividade extra do orçamento.
- Para cada demanda/conjunto: quantidade total a fabricar, já fabricada, restante e o peso correspondente.
- Registro de **atividade não prevista ou ensaio** surgida na produção: nome, descrição, observação e situação, vinculada ao POMG.

## Fase 5 — Qualidade

- Painel de conjuntos por demanda usando exatamente os relatórios/inspeções marcados na Análise Técnica.
- Registro de resultado por inspeção, reinspeção e liberação do conjunto.

## Fase 6 — Expedição

- Entrega por conjunto, permitindo várias entregas parciais até a entrega total.
- Quantidade total a entregar, já entregue, restante e peso por demanda/conjunto.
- Romaneio com POMG, conjuntos expedidos, peso e Nota Fiscal (apenas anexada aqui, emitida por outro setor), ligada ao conjunto ou à proposta e ao peso.
- Indicação de entrega **Parcial** ou **Total** e do que segue pendente.

## Fase 7 — Medição e Databook

- Medição vinculada ao POMG, com acompanhamento dos valores medidos e recebidos.
- Painel de **Databook** por demanda: checklist de relatórios definido na Análise Técnica, situação de cada relatório e anexos, formando o databook do pedido.
- Encerramento da demanda quando produção, qualidade, expedição, medição e databook estiverem completos.

## Detalhes técnicos

- Nova coluna de código POMG em solicitações, com sequência anual por função no banco, propagada para orçamento, pedido, conjuntos, romaneios, medições e databook.
- Novas tabelas: conjuntos do orçamento e suas atividades (incluindo extra), requisitos de inspeção por demanda, atividades não previstas de produção, relatórios de databook e notas fiscais ligadas ao romaneio.
- Situações da proposta e do PCP como enums; farol calculado a partir de avanço previsto (datas), avanço real (atividades concluídas) e prazo restante.
- Permissões por setor mantidas (Orçamentos, PCP, Produção, Qualidade, Expedição, Medição, Admin) com segurança por linha em todas as novas tabelas.
- Dados atuais preservados: nenhuma remoção de tabela ou coluna existente.

## Critérios de conclusão

- Uma demanda criada hoje recebe POMG-XXX-2026 e mantém esse código em todas as telas até o encerramento.
- Conjuntos e atividades definidos no orçamento aparecem automaticamente na produção e na qualidade.
- O PCP mostra farol e avanço previsto versus real, com filtros por contrato e subárea.
- A expedição permite entregas parciais por conjunto com nota fiscal anexada e saldo controlado.
- O Databook reúne os relatórios definidos na análise técnica da demanda.
