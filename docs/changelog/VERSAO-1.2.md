# Desaperta 1.2 — contas e limite dos cartões

- Cadastre várias contas em **Ver contas → Adicionar conta** ou **Ajustes → Contas e saldos**. Cada conta tem nome, saldo inicial e extrato próprios. O painel mostra cada saldo e o total.
- Selecione a conta ao cadastrar uma entrada, saída ou recorrência, receber/pagar uma pendência e pagar a fatura de um cartão.
- Para mover dinheiro entre suas contas, use **Contas e saldos → Transferir entre contas**. Os dois lançamentos são salvos juntos, sem aumentar receitas, gastos ou metas. Desfazer uma transferência remove os dois lados.
- Cadastre vários cartões em **Adicionar cartão**. Cada um tem limite, histórico e barra independentes no painel, na lista e nos detalhes.
- A barra mostra o saldo devedor atual dividido pelo limite: R$ 700 utilizados de R$ 2.800 correspondem a 25%, com R$ 2.100 disponíveis. Pagar a fatura reduz a barra e libera crédito. O indicador não é uma comparação mensal: acompanha todo o limite ainda utilizado.
- Se os gastos ultrapassarem o limite cadastrado, o preenchimento para em 100%, fica vermelho e mostra o valor excedido. Os registros continuam refletindo o valor real.

## Dados anteriores

O esquema passou para a versão 3. Backups das versões 1 e 2 continuam aceitos. O saldo inicial e os lançamentos anteriores são vinculados automaticamente a **Conta principal**, sem duplicar os valores. Cartões, metas, contatos e recorrências são preservados.

É possível renomear essa conta e criar outras. Não exclua nem recrie seus dados para atualizar. Uma conta com histórico ou recorrências não pode ser excluída, para preservar os vínculos.

## Validação

31 testes automatizados passaram, incluindo contas independentes, transferência e estorno conjunto, baixa de fatura na conta escolhida, recebimento de dívida, recorrências por conta, vários cartões e migração da versão 2.

Na interface, uma base fictícia com Banco A de R$ 700 e Carteira de R$ 100 manteve total de R$ 800 ao transferir R$ 50 entre elas (R$ 650 e R$ 150). Uma despesa de R$ 20 na Carteira alterou somente essa conta para R$ 130, com total R$ 780. Os cartões com R$ 700/R$ 2.800 e R$ 100/R$ 1.000 mostraram barras de 25% e 10%, respectivamente.

TypeScript, formatação e exportação de bundles web, Android e iOS concluídos. A reabertura da base de teste preservou os saldos e cartões, sem novos erros de renderização no console. As operações nativas continuam sujeitas ao teste em aparelho físico.
