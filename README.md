# Flowright ERP

Criar um Sistema ERP. conforme o script abaixo:
1. Recebimento da Solicitação de Orçamento

Responsável: Orçamentos

Entrada

Solicitação enviada pelo cliente via e-mail.

Ações

Receber a solicitação.

Cadastrar a solicitação no sistema.

Identificar:

·         Cliente;

·         Contrato correspondente (Alumar, Vale Ferrosos ou Vale Base Metals);

·         Data de recebimento;

·         Prazo solicitado pelo cliente;

·         Documentos anexados (desenhos, memoriais, especificações etc.).

Saída

Solicitação cadastrada e pronta para análise técnica.

2. Análise Técnica

Responsável: Orçamentos

Ações

Analisar toda a documentação recebida.

Identificar os itens a serem fabricados.

Verificar quais linhas de preços do contrato serão utilizadas.

Levantar:

·         Peso estimado;

·         Processos necessários;

·         Complexidade da fabricação;

·         Necessidade de pintura;

·         Necessidade de usinagem;

·         Necessidade de inspeções especiais.

Saída

Dados técnicos para elaboração do orçamento.

3. Elaboração do Orçamento

Responsável: Orçamentos

Ações

Calcular os custos conforme a linha contratual.

Elaborar o cronograma inicial da fabricação.

Definir:

·         Prazo para aquisição de materiais (quando necessário);

·         Data prevista para início da fabricação;

·         Prazo de fabricação;

·         Data prevista para entrega.

Gerar a proposta comercial.

Registrar a revisão da proposta.

Saída

Orçamento concluído.

4. Envio ao Cliente

Responsável: Orçamentos

Ações

Enviar proposta comercial.

Registrar data de envio.

Alterar status para Aguardando Aprovação.

Decisão

Cliente solicita revisão

·         Revisar a proposta

Caso reprovado

Encerrar orçamento.

Caso aprovado

Receber o número do Pedido do Cliente.

Registrar:

·         Número do Pedido;

·         Data;

·         Valor;

·         Prazo contratual.

Alterar status para Pedido Liberado.

5. Levantamento de Matéria-Prima

Responsável: PCP / Setor de materiais

Ações

Levantar toda a matéria-prima necessária.

Consultar estoque.

Verificar certificados dos materiais.

Reservar materiais disponíveis.

Decisão

Material disponível

Reservar material.

Liberar para planejamento.

Material indisponível

Solicitar compra.

Acompanhar aquisição.

Receber material.

Conferir documentação.

Liberar material para produção.

6. Planejamento da Produção (PCP)

Responsável: PCP

Ações

Receber o pedido aprovado.

Avaliar:

Disponibilidade de materiais;

Disponibilidade de mão de obra;

Capacidade produtiva;

Equipamentos;

Prioridades da fábrica.

Confirmar ou reprogramar o cronograma elaborado pelo Orçamento.

Registrar justificativa em caso de reprogramação.

Liberar o pedido para fabricação.

 

 

Regras de Negócio

O PCP acompanha o Pedido inteiro.

O cronograma poderá ser alterado somente pelo PCP.

Todo histórico de reprogramações deverá ser registrado.

7. Cadastro da Estrutura da Fabricação

Cada Pedido poderá possuir diversos Conjuntos.

Cada conjunto poderá possuir diversas Peças.

Cada conjunto ou peça receberá uma TAG para rastreabilidade.

Dependendo da solicitação do cliente:

Pode ser fabricado o conjunto completo;

Pode ser fabricada apenas uma peça do conjunto.

Quando a fabricação ocorrer para o conjunto completo, será utilizada uma única TAG para identificação.

Cada conjunto deverá possuir:

TAG;

Descrição;

Peso;

Quantidade de peças;

Status;

Percentual executado.

8. Acompanhamento da Produção

Responsável: PCP

O acompanhamento deverá ocorrer simultaneamente por:

Pedido

Percentual geral;

Peso produzido;

Peso pendente.

Conjunto

TAG;

Percentual executado;

Peso do conjunto;

Situação atual.

Processo Fabril

Quando aplicável:

Corte;

Dobra;

Usinagem;

Montagem;

Soldagem;

Pintura.

Cada processo deverá registrar:

Data de início;

Data de término;

Responsável;

Peso executado;

Percentual concluído;

Observações.

8.1 Plano de Perdas e Paralisações da Produção

Responsável: PCP / Produção

Objetivo

Registrar todas as ocorrências que impactem o andamento da fabricação, permitindo identificar perdas de produtividade, medir seus impactos no cronograma e gerar indicadores para ações de melhoria contínua.

Registro de Paralisações

Sempre que houver interrupção de qualquer processo produtivo, deverá ser realizado o registro da paralisação.

Informações Gerais

Número do Pedido;

Conjunto (TAG);

Peça (quando aplicável);

Processo Fabril;

Data da ocorrência;

Hora de início da paralisação;

Hora de término da paralisação;

Tempo total da paralisação (calculado automaticamente);

Responsável pelo registro;

Observações.

Motivos da Paralisação

Cada paralisação deverá ser classificada conforme um motivo padronizado.

Materiais

Falta de material;

Material incorreto;

Aguardando recebimento;

Aguardando certificado de material.

Equipamentos

Quebra de equipamento;

Manutenção corretiva;

Manutenção preventiva;

Falta de ferramenta;

Equipamento indisponível;

Calibração.

Produção

Mudança de prioridade;

Alteração de projeto;

Aguardando programação;

Retrabalho;

Aguardando processo anterior.

Qualidade

Aguardando inspeção;

Reprovação dimensional;

Reprovação de soldagem;

Reprovação de pintura;

Não conformidade.

Recursos Humanos

Absenteísmo;

Falta de operador;

Treinamento;

Troca de turno.

Cliente

Alteração do escopo;

Suspensão da fabricação;

Aguardando aprovação;

Alteração do cronograma.

Outros

Falta de energia;

Condições climáticas;

Problemas logísticos;

Outros.

Controle de Equipamentos

Quando a paralisação estiver relacionada a equipamentos, registrar:

Equipamento;

Código do equipamento;

Setor;

Tipo da ocorrência;

Tempo de indisponibilidade;

Responsável pela manutenção.

Controle de Absenteísmo

Quando a paralisação ocorrer por ausência de colaboradores, registrar:

Funcionário;

Matrícula;

Função;

Setor;

Data;

Motivo;

Horas perdidas;

Substituição realizada (Sim/Não).

Impacto na Produção

O sistema deverá calcular automaticamente:

Tempo total de parada;

Horas perdidas;

Peso impactado;

Quantidade de conjuntos impactados;

Percentual da produção afetada;

Atraso estimado no cronograma.

Caso necessário, o PCP poderá reprogramar o cronograma, mantendo o histórico das alterações.

 

Regras de Negócio

Toda paralisação deverá estar vinculada a um Pedido, Conjunto (TAG) e Processo Fabril.

O sistema deverá calcular automaticamente o tempo total da paralisação com base nos horários de início e término.

Uma paralisação poderá estar vinculada a um equipamento específico quando aplicável.

O registro da paralisação deverá permanecer disponível para consultas, auditorias e análises históricas.

O tempo perdido deverá refletir automaticamente nos indicadores da Produção, PCP e Gestão.

O sistema deverá permitir a emissão de relatórios gerenciais por período, setor, equipamento, motivo da paralisação e pedido.

 

9. Controle da Qualidade

Responsável: Qualidade

A Qualidade acompanhará toda a fabricação.

Cada conjunto passará pelas inspeções aplicáveis.

Inspeção Dimensional

Conferência dimensional;

Aprovação ou reprovação.

Inspeção de Soldagem

Inspeção visual;

Ensaios quando aplicáveis;

Aprovação ou reprovação.

Inspeção de Pintura

Quando houver pintura:

Espessura;

Aparência;

Conformidade com especificação.

Regras de Negócio

Nenhum conjunto poderá avançar para a próxima etapa sem aprovação do inspetor responsável.

Caso seja reprovado:

·         Registrar Não Conformidade;

·         Encaminhar para retrabalho;

·         Realizar nova inspeção.

Após aprovação:

Status do conjunto:

Liberado para Expedição

10. Expedição

Responsável: Expedição

A expedição será iniciada quando houver conjuntos liberados pela Qualidade.

Ações

Selecionar os conjuntos liberados para entrega.

Definir o tipo de entrega:

·         Entrega realizada pela empresa (frete sob responsabilidade da empresa);

·         Cliente retira na fábrica.

Gerar o Romaneio contendo:

·         Número do Pedido;

·         Cliente;

·         TAGs expedidas;

·         Conjuntos expedidos;

·         Quantidade de peças;

·         Peso expedido;

·         Data da expedição.

Emitir a Nota Fiscal correspondente ao romaneio.

Registrar:

·         Número do Romaneio;

·         Número da Nota Fiscal;

·         Data da Expedição;

·         Tipo de Entrega;

·         Transportadora (quando aplicável);

·         Motorista (quando aplicável);

·         Observações.

Regras de Negócio

O pedido poderá possuir uma ou várias expedições parciais.

Um romaneio poderá conter um ou mais conjuntos.

Somente conjuntos aprovados pela Qualidade poderão ser expedidos.

O pedido permanecerá aberto enquanto existirem conjuntos pendentes.

O sistema atualizará automaticamente o peso expedido e o percentual entregue.

11. Medição

Responsável: Medição

Após a emissão da Nota Fiscal, o setor de Medição acompanhará todo o processo de faturamento e recebimento.

Registrar

Número do Pedido;

Número da Nota Fiscal;

Cliente;

Valor da Nota Fiscal;

Peso entregue referente à Nota Fiscal;

Data de emissão;

Data da entrega;

Previsão de pagamento conforme contrato.

Status da Nota Fiscal

Emitida;

Entregue;

Em aprovação;

Programada para pagamento;

Paga.

Regras de Negócio

Cada Nota Fiscal deverá estar vinculada ao Pedido.

O peso entregue será acumulado automaticamente no Pedido.

A previsão de pagamento será calculada conforme o contrato.

O sistema poderá integrar com os sistemas já existentes para consultar o status das notas e pagamentos.

O pedido somente será considerado totalmente faturado quando todo o peso contratado tiver sido expedido.

12. Encerramento do Pedido

O Pedido será encerrado quando:

Todos os conjuntos estiverem fabricados;

Todas as inspeções estiverem aprovadas;

Todas as entregas tiverem sido realizadas;

Todas as Notas Fiscais tiverem sido emitidas;

Todo o peso contratado tiver sido expedido;

Todas as medições estiverem concluídas.

Status Final: Pedido Concluído.

Indicadores (KPIs)

Orçamentos

Solicitações recebidas;

Orçamentos enviados;

Taxa de aprovação;

Tempo médio de elaboração.

Aprovações mensais peso e valor

Análise por Contrato e áreas

PCP

Pedidos em andamento;

Planejado × Realizado;

Reprogramações;

Atrasos por etapa;

Carga da fábrica.

Performance por equipes;

Performance de atendimento;

 

Produção

Avanço por Pedido;

Avanço por Conjunto (TAG);

Avanço por Processo;

Avanço por Peso;

Peso produzido;

Peso pendente;

Tempo por etapa.

Qualidade

Inspeções pendentes;

Inspeções aprovadas;

Retrabalhos;

Não conformidades;

Tempo médio de liberação.

Expedição

Conjuntos liberados;

Romaneios emitidos;

Notas Fiscais emitidas;

Peso expedido;

Peso pendente de expedição;

Entregas realizadas pela empresa;

Entregas retiradas pelo cliente.

Medição

Notas emitidas;

Notas entregues;

Notas em aprovação;

Notas programadas para pagamento;

Notas pagas;

Valor faturado;

Faturamento previsto x realizado.

Valor recebido;

Peso faturado;

Peso entregue;

Saldo a faturar;

Próximos vencimentos de pagamento.

Indicadores Plano de perdas (KPIs)

Produção

Horas produtivas;

Horas paradas;

Eficiência da produção;

Tempo médio de paralisação.

Equipamentos

Horas paradas por equipamento;

Equipamentos com maior índice de falhas;

Tempo médio entre falhas (MTBF);

Tempo médio para reparo (MTTR).

Recursos Humanos

Índice de absenteísmo;

Horas perdidas por setor;

Horas perdidas por colaborador.

PCP

Pedidos impactados;

Conjuntos impactados;

Peso impactado;

Dias de atraso;

Principais motivos das paralisações.

 

Fluxo Resumido

Solicitação de Orçamento → Análise Técnica → Elaboração do Orçamento → Aprovação do Cliente → Recebimento do Pedido → Levantamento de Materiais → Compras (quando necessário) → Planejamento (PCP) → Produção (Corte, Dobra, Usinagem, Montagem, Soldagem e Pintura) → Inspeções da Qualidade → Liberação dos Conjuntos → Expedições Parciais → Emissão de Romaneios → Emissão de Notas Fiscais → Medição e Acompanhamento dos Pagamentos → Encerramento do Pedido.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://core-build-loop.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2f07f9f7-b70c-49c8-804b-2afec908383a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
