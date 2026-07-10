
# ERP de Fabricação Industrial — Plano de Construção

Sistema completo cobrindo Orçamentos → PCP → Produção → Qualidade → Expedição → Medição, com KPIs e Plano de Perdas. Dado o escopo (11+ módulos, dezenas de tabelas, autenticação por setor, muitos dashboards), proponho **construir em fases incrementais**, entregando valor a cada etapa.

## Stack e Fundação

- **TanStack Start** (já configurado) + **Lovable Cloud** (Postgres + Auth + Storage) — habilitar no início.
- **Autenticação com perfis por setor**: Orçamentos, PCP, Produção, Qualidade, Expedição, Medição, Admin — via tabela `user_roles` + enum `app_role` + função `has_role`.
- **Design system**: tema industrial (tons neutros, azul aço, acentos de status), tipografia clara para densidade de dados (tabelas, KPIs).
- **Layout**: sidebar com navegação por módulo, top bar com contexto do usuário e busca global.

## Fases de Entrega

### Fase 1 — Fundação (esta primeira entrega)
1. Habilitar Lovable Cloud.
2. Autenticação (login/signup) + roles por setor.
3. Design system + layout base (sidebar, header, dashboard vazio).
4. Cadastros essenciais: **Clientes**, **Contratos** (Alumar, Vale Ferrosos, Vale Base Metals) com linhas de preço, **Equipamentos**, **Funcionários**.
5. Estrutura de banco base (tabelas de solicitações, pedidos, conjuntos, peças, TAGs) com RLS.

### Fase 2 — Orçamentos (etapas 1–4 do script)
- Recebimento de solicitação, análise técnica, elaboração de orçamento, envio e aprovação.
- Upload de documentos anexos.
- Geração de proposta comercial (PDF).
- Fluxo de status: Recebido → Em análise → Aguardando aprovação → Aprovado/Reprovado → Pedido Liberado.

### Fase 3 — PCP e Materiais (etapas 5–7)
- Levantamento de matéria-prima, consulta a estoque, reservas, solicitação de compras.
- Planejamento com cronograma, capacidade, reprogramações com histórico.
- Cadastro da estrutura: Pedido → Conjuntos → Peças, TAGs, pesos e percentuais.

### Fase 4 — Produção e Plano de Perdas (etapa 8 + 8.1)
- Acompanhamento por Pedido, Conjunto, Processo (corte, dobra, usinagem, montagem, soldagem, pintura).
- Apontamentos de início/término, responsáveis, peso executado.
- **Plano de perdas**: paralisações com motivos padronizados, controle de equipamentos, absenteísmo, cálculo automático de impacto.

### Fase 5 — Qualidade (etapa 9)
- Inspeções dimensional, soldagem, pintura.
- Registro de não conformidades e retrabalho.
- Bloqueio de avanço sem aprovação.

### Fase 6 — Expedição e Medição (etapas 10–11)
- Romaneios, notas fiscais, expedições parciais.
- Controle de status de NF (Emitida → Paga), previsão de pagamento por contrato.

### Fase 7 — Encerramento + KPIs (etapa 12 + dashboards)
- Dashboards por setor com todos os KPIs listados (Orçamentos, PCP, Produção, Qualidade, Expedição, Medição, Plano de Perdas).
- Relatórios exportáveis.
- Encerramento automático de pedidos.

## Detalhes Técnicos (para referência)

- **Banco**: ~25 tabelas principais com FKs, RLS por role, funções `has_role` e triggers para cálculos (peso acumulado, % executado, tempo de paralisação).
- **Server functions** para todas as operações protegidas (`requireSupabaseAuth`).
- **Storage**: bucket privado para documentos de solicitações, desenhos, certificados, NFs.
- **Cálculos automáticos** via triggers Postgres: tempo de paralisação, peso expedido, % concluído, previsão de atraso.
- **Rotas autenticadas** em `src/routes/_authenticated/` por módulo.

## O que entrego agora (Fase 1)

Fundação completa e funcional: auth com roles, layout do ERP, dashboard inicial, cadastros de clientes/contratos/equipamentos/funcionários, e schema de banco pronto para as fases seguintes. Ao aprovar, seguimos para Fase 2 (Orçamentos) no próximo turno, e assim por diante.

**Confirma esse faseamento?** Se preferir outra ordem (ex.: priorizar Produção antes de Orçamentos) ou juntar fases, me diga antes de eu começar.
