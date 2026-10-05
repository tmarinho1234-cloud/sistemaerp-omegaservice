# Ajuste dos status de quantidades na Qualidade

## O que será alterado
- No painel de cada conjunto, separar os indicadores por tipo de inspeção em linhas fixas: **Aprovado** acima e **Reprovado** abaixo.
- Quando uma não conformidade for encerrada, mostrar a quantidade vinculada como **Pendente**, sem apagar nem modificar o registro histórico da reprovação.
- Recalcular cada conjunto de forma independente, usando o vínculo entre a inspeção e sua não conformidade.
- Fazer a quantidade pendente voltar ao saldo disponível para uma nova inspeção do mesmo tipo.

## Regras preservadas
- Quantidades aprovadas continuam aprovadas e, na inspeção final, continuam liberando a Expedição.
- Reprovações com não conformidade aberta continuam como reprovadas e indisponíveis.
- O encerramento afeta apenas a quantidade, o tipo de inspeção e o conjunto ligados àquela não conformidade.
- O histórico de inspeções e reprovações permanece visível.

## Detalhes técnicos
- Atualizar a validação do banco para descontar do saldo consumido as reprovações cujas não conformidades já foram encerradas.
- Derivar no painel os totais de aprovado, reprovado ativo e pendente por conjunto e tipo de inspeção.
- Ao encerrar a não conformidade, atualizar apenas as consultas de não conformidades, inspeções e conjuntos necessárias.
- Validar compilação e o fluxo na prévia com uma demanda autenticada.
