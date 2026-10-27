# Desaperta 1.1

## Configuração inicial

Na primeira abertura, informe o saldo em conta e, opcionalmente, o limite de um cartão e seus gastos anteriores ainda não pagos. Limite de R$ 100 com R$ 50 usados resulta em R$ 50 disponíveis, sem somar crédito ao saldo em conta.

Em Ajustes é possível corrigir o saldo inicial e cadastrar mais cartões. O saldo inicial é o ponto de partida, não uma entrada para as metas. Não repita valores já cadastrados como receitas.

## Cartão

Em Novo lançamento, selecione Saída → Cartão de crédito → cartão. A compra consome limite e conta nas metas da categoria. Não diminui o dinheiro em conta naquele momento.

Em Cartões → Ver gastos e pagar fatura, registre o valor realmente pago. Esse pagamento diminui o saldo em conta e libera crédito, mas não aparece novamente como consumo nas metas/categorias.

Para corrigir um pagamento, abra sua linha no histórico e desfaça a operação. Uma compra não pode ser removida se isso deixar pagamentos maiores que os gastos pendentes; primeiro corrija o pagamento. Alterar o limite é permitido mesmo quando o saldo devedor o ultrapassa, e o app mostra o excesso.

O app controla o valor devedor total, sem fechamento de fatura, juros ou parcelamento automático nesta versão. Não há conexão bancária nem pagamentos reais.

## Gastos e entradas recorrentes

Dois caminhos:

- Em um novo lançamento, escolha **Todo mês**. O valor atual é registrado e um cadastro mensal é criado.
- Em **Recorrências**, crie um gasto ou entrada recorrente, como Spotify ou mesada. O cadastro gera previsões, sem movimentar o saldo.

Confirme cada previsão quando a operação acontecer, ou use **Pular este mês**. Cada ocorrência só pode ser registrada uma vez. Excluir um lançamento confirmado não faz a mesma ocorrência reaparecer. É possível editar o cadastro e pausá-lo. Retomar traz os meses ainda não resolvidos para revisão; os meses sem cobrança podem ser pulados.

A frequência é mensal, ancorada no dia da primeira ocorrência. Dias 29, 30 ou 31 são ajustados ao último dia disponível nos meses mais curtos. Alterações no cadastro não modificam lançamentos anteriores.

## Metas

Escolha uma categoria, um mês e um valor:

- Gasto: teto mensal; exibe quanto ainda pode gastar ou quanto ultrapassou.
- Entrada: objetivo mínimo; exibe quanto falta receber ou a conclusão.

As metas acompanham os lançamentos efetivos da categoria, incluindo compras no crédito. O pagamento da fatura é excluído para não duplicar o consumo. Previsões recorrentes ainda não confirmadas não contam. Uma categoria/tipo pode ter uma meta por mês.

## WhatsApp

Cadastre o telefone no formulário da pendência. Para o Brasil, informe DDD e número; para outros países, use `+` e o código internacional.

Nos detalhes, **Revisar resumo da pessoa** reúne todas as pendências abertas com aquela pessoa, abatendo pagamentos e separando valores a pagar e receber. O saldo final apresenta a diferença entre as duas direções.

**Abrir mensagem no WhatsApp** abre o link oficial `wa.me` com telefone e texto preenchidos. A mensagem só é enviada quando você confirma o envio no próprio WhatsApp. Nenhuma mensagem foi enviada durante os testes.

## Aparência

Em Ajustes → Aparência, selecione Sistema, Claro ou Escuro. A preferência é salva no aparelho, separada dos dados financeiros, e não altera o saldo.

## Dados existentes e backups

O esquema financeiro foi atualizado para a versão 2. O leitor aceita backups da versão 1 e os converte preservando pessoas, dívidas, baixas e lançamentos. A chave do armazenamento foi mantida para encontrar os dados anteriores. A próxima gravação salva o novo esquema.

A configuração inicial aparece também para bases antigas. Se o saldo inicial já foi lançado como receita, informe zero no novo assistente para evitar duplicação. A restauração de backup continua guardando uma cópia do estado anterior.

Backups da versão 2 incluem configuração, cartões, metas, recorrências e suas ocorrências. A aparência é uma preferência do dispositivo e não faz parte do backup financeiro.
