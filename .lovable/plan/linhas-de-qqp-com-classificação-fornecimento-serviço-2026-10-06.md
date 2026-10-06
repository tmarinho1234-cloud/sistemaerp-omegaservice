# Linhas de QQP com classificação Fornecimento/Serviço

Fluxo: Contrato → Linhas QQP → Orçamento → Medição → Faturamento, com o mesmo Item QQP como referência do começo ao fim.

## 1. Contratos — importar planilha
- Na tela de Contratos, cada contrato ganha o botão **"Linhas QQP"**. Ele abre uma página/diálogo com a lista de linhas do contrato.
- **Importar Excel (.xlsx)** com as colunas ITEM QQP, DESCRIÇÃO, UND, VALOR e CLASSIFICAÇÃO (FORNECIMENTO/SERVIÇO). Antes de gravar, mostra uma prévia com as linhas que têm erro (valor inválido, classificação desconhecida, item repetido).
- Se o mesmo item QQP já existir, ele é atualizado em vez de duplicado. Também dá para incluir, editar ou excluir uma linha manualmente e baixar um modelo da planilha.
- VALOR = preço unitário da linha.

## 2. Orçamentos — escolher a linha
- Na aba Proposta, o campo de item passa a ter **"Selecionar linha QQP"**, com busca por código ou descrição, usando as linhas do contrato da solicitação.
- Ao escolher uma linha, o sistema preenche Item QQP, descrição, unidade, valor unitário e classificação. Você só informa a quantidade.
- Valor da linha = quantidade × valor unitário.
- A entrada manual continua disponível para contratos sem QQP importado.
- Resumo com **Total de Fornecimento**, **Total de Serviços** e **Valor Total do Orçamento**.

## 3. Medição — por linha do QQP
- A demanda mostra uma tabela com as linhas do orçamento aprovado: Item QQP, descrição, unidade, classificação, valor contratado, já faturado, saldo a faturar e % faturado.
- **Nova medição**: para cada linha, você informa a quantidade **ou** o percentual medido. O valor é calculado, e o sistema não deixa passar do saldo da linha.
- **Já faturado** soma as medições aprovadas daquela linha. O histórico das medições anteriores fica preservado.
- Subtotais por Fornecimento e por Serviço. Medições antigas, que não têm linhas, continuam aparecendo como estão.

## Pontos assumidos (confirme)
- "Valor contratado" da linha na Medição = valor orçado da linha (quantidade × valor unitário do orçamento aprovado).
- Uma medição conta como "faturada" quando está **aprovada**.

## Detalhes técnicos
- Migration aditiva:
  - `contrato_linhas_preco`: adicionar `classificacao text check in ('fornecimento','servico')` e um índice único `(contrato_id, codigo)`.
  - `orcamento_itens`: adicionar `contrato_linha_id uuid` (FK), `item_qqp text` e `classificacao text`, todos nullable.
  - Nova tabela `medicao_itens` (medicao_id, orcamento_item_id, quantidade, percentual, valor) com GRANT, RLS e policies no padrão das tabelas de medição.
  - Trigger que valida o saldo por linha.
- A leitura da planilha é feita no navegador com a biblioteca `xlsx` (SheetJS); a gravação é em lote.
- Incluir `medicao_itens` na sincronização em tempo real.
- Arquivos: `cadastros/contratos.tsx` (+ componente de linhas QQP), `orcamentos.index.tsx` (ItensEditor/PropostaEditor), `medicao.$pedidoId.tsx`, `operations.tsx`.
