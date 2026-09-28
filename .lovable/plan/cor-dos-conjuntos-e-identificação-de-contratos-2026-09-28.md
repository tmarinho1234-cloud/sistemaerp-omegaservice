# Cor dos conjuntos e identificação de contratos

## Objetivo
Adicionar a cor aos conjuntos e padronizar todas as listagens para mostrar somente o número do contrato, sem remover dados existentes.

## Alterações
- Acrescentar o campo opcional `cor` aos conjuntos do orçamento e aos conjuntos do pedido, preservando todos os registros atuais.
- Incluir “Cor” no cadastro e na edição de conjuntos em Orçamentos e copiar esse valor quando o pedido for criado ou sincronizado.
- Exibir a cor na tabela de conjuntos do PCP.
- Exibir a cor nos conjuntos da Produção com uma pequena amostra visual quando houver valor cadastrado; nomes comuns, RAL e Munsell terão aproximações visuais seguras.
- Mostrar a cor também nas demais telas que detalham conjuntos/TAGs.
- Trocar as consultas e tipos de contratos para disponibilizar o campo `numero`.
- Remover “Empresa” das listagens e substituir nome do contrato pelo número em Orçamentos, PCP, Produção, Qualidade, Expedição, Medição, Databook e demais listagens compartilhadas.
- Manter busca e filtros de contrato funcionando pelo número.

## Validação
- Verificar criação, edição e cópia da cor do orçamento para o pedido.
- Conferir as listagens e detalhes protegidos em desktop, incluindo a amostra de cor na Produção.
- Confirmar compilação sem erros e ausência de regressões nas ações internas das tabelas.

## Detalhes técnicos
- Migration aditiva, com colunas `text null` em `orcamento_conjuntos` e `pedido_conjuntos`; sem alteração de RLS ou exclusão de dados.
- Atualização dos tipos gerados após a migration.
- A busca deixará de considerar empresa/nome do contrato e passará a considerar `contratos.numero`.
