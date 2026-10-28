# Desaperta 1.3 — faturas, parcelas e importação local

## Configuração e navegação

O assistente inicial tem três etapas: contas, cartões e revisão. Permite cadastrar várias contas com saldos positivos ou negativos e vários cartões, com limite, saldo anterior, fechamento e vencimento próprios. A configuração só é gravada depois da revisão final.

A barra inferior agora tem cinco destinos: **Início, Carteira, Novo, Extrato e Mais**. Contas e cartões ficam em Carteira. Entrada, saída, compra no cartão, transferência, pendência e importação ficam em Novo. Metas, recorrências, pendências e ajustes ficam organizados em Mais. O Início passou a concentrar os indicadores. A paleta usa grafite e roxo, com versões clara e escura.

## Compras parceladas e faturas

Informe o **valor total da compra**, o número de parcelas de 1 a 60 e a data da compra. O app divide os centavos sem alterar o total. Por exemplo, R$ 1.200 em 12x gera 12 faturas de R$ 100. R$ 100 em 3x gera R$ 33,34 + R$ 33,33 + R$ 33,33.

Cada parcela pertence a um mês de fechamento. O limite considera toda a dívida ainda não paga, incluindo parcelas futuras. Já o valor da fatura mostra somente os itens daquele ciclo. Pagar R$ 100 libera somente R$ 100 do limite e debita a conta selecionada, sem repetir a despesa por categoria. O pagamento pode ser parcial ou antecipado, mas não pode ultrapassar o saldo da fatura selecionada.

O mês da primeira fatura é calculado pelo fechamento e pode ser adiado no cadastro. Compras feitas no próprio dia de fechamento ou depois dele entram no ciclo seguinte. Vencimentos iguais ou anteriores ao dia de fechamento pertencem ao mês seguinte; dias 29, 30 e 31 são ajustados ao último dia disponível em meses mais curtos.

As faturas têm estados Aberta, Fechada, Futura, Vencida e Paga. Depois do fechamento, novas compras vão automaticamente para o próximo ciclo. Correções de lançamentos antigos continuam disponíveis com confirmação. Alterar os dias de um cartão não muda os meses já atribuídos às compras; altera as datas exibidas para os ciclos e as novas compras.

Para corrigir uma compra parcelada, remova a compra inteira e cadastre novamente. Não é possível editar ou excluir apenas uma parcela, pois isso mudaria o total contratado. Pagamentos incompatíveis precisam ser desfeitos antes de excluir os gastos correspondentes.

Metas e despesas do painel consideram parcelas no mês da fatura. Parcelas de meses futuros aparecem como previstas e não aumentam o gasto atual. O app registra seu controle local; não faz pagamentos bancários, não calcula juros/rotativo e não confirma a liquidação no banco. A data de processamento da compra pode variar por instituição: confira a fatura real ao conciliar.

## Dados existentes

O esquema de armazenamento passou para a versão 4. Backups das versões 1, 2 e 3 continuam aceitos. Saldos, cartões, compras, pendências e pagamentos são preservados. Compras antigas sem ciclo permanecem no mês em que estavam registradas, para preservar os relatórios anteriores. Pagamentos antigos sem mês específico são distribuídos das faturas mais antigas para as mais novas.

Como a versão anterior não guardava fechamento e vencimento, cartões migrados exibem um aviso para confirmar os dias na edição. Os padrões 25/5 são provisórios. Eles não geram lembretes nem novas compras parceladas antes da confirmação dos dias reais. O saldo anterior fica inicialmente na fatura do mês da migração e pode ser ajustado na edição do cartão.

Não inclua a mesma dívida em “gastos anteriores” e em compras cadastradas depois. Para distribuir parcelas antigas, use os lançamentos da fatura importada ou cadastre as compras e ajuste o saldo anterior para evitar repetição.

## Importação de Nubank, Inter e arquivos compatíveis

Conforme a preferência do usuário, os registros financeiros continuam **100% locais**, sem servidor financeiro ou conexão automática com os bancos. Acesse **Novo → Importar extrato** ou **Mais → Importar extrato**. Selecione a conta ou o cartão de destino e um arquivo CSV ou OFX de até 2 MB. PDF não é suportado.

O CSV aceita cabeçalhos em português/inglês, valores decimais brasileiros, separadores de ponto e vírgula, vírgula ou tabulação, campos entre aspas, descrições multilinha e leitura UTF-8/Latin-1. Os testes incluem layouts de conta Nubank (Data, Valor, Identificador, Descrição), cartão (date, title, amount) e conta Inter (Data Lançamento, Histórico, Valor). Arquivos com outros cabeçalhos precisam ser ajustados ou exportados como OFX. Não foi usado nenhum extrato real do usuário para validar os layouts.

OFX suporta transações SGML/XML com DTPOSTED, TRNAMT, FITID e MEMO/NAME; outras moedas são recusadas. Para arquivos sem moeda declarada, confira se os valores são em reais antes de importar. Prefira OFX para manter os identificadores do banco.

A prévia permite selecionar categorias, ignorar itens e identificar débitos que são pagamentos de fatura. Estes podem ser vinculados ao cartão e ao mês correspondente para liberar o limite sem contar a despesa duas vezes. Transferências entre suas próprias contas que já estão registradas devem ser ignoradas na prévia. Antes de trazer um histórico, ajuste o saldo inicial para que ele represente o saldo **antes** daquele período.

CSV de cartão trata valores positivos como compras e negativos como pagamentos/estornos; OFX usa o sinal bancário. Pagamentos e estornos de cartão ficam desmarcados na prévia. Pagamentos devem ser registrados/vinculados pela fatura; estornos exigem conciliação manual nesta versão. O mês informado na importação do cartão é aplicado às linhas daquela fatura, inclusive parcelas cuja data original foi mantida pelo banco. A importação de uma fatura traz as parcelas nela presentes; não inventa as parcelas futuras ausentes do arquivo.

O app reconhece linhas já importadas pelo identificador ou pelo conteúdo, destino e mês da fatura. Importar novamente o mesmo arquivo não duplica os valores. Movimentações semelhantes a registros existentes aparecem para revisão e podem vir desmarcadas. Arquivos de formatos distintos, períodos diferentes ou descrições alteradas exigem conferência: a comparação não substitui uma conciliação bancária completa.

A importação é validada como uma operação única e preserva uma cópia anterior no armazenamento de backup. Se uma linha não puder ser gravada, nenhuma das linhas do lote é adicionada.

## Lembretes no Android

Ative em **Mais → Ajustes → Ativar lembretes no celular** e autorize as notificações do sistema. Os avisos de fechamento e vencimento são locais, às 9h, sem valores financeiros no texto. Apenas cartões com dias confirmados geram avisos.

O app mantém os próximos 60 lembretes, calculados em uma janela de até 12 meses, e renova o agendamento ao abrir/retomar o app ou editar os cartões. O Android pode atrasar ou impedir avisos por permissões ou economia de bateria. O status do agendamento e falhas de permissão ficam visíveis em Ajustes. Não há notificações de fatura no navegador. A entrega real precisa ser conferida no aparelho do usuário.

## Validação

49 testes automatizados passaram, incluindo migração, centavos, 12 parcelas, fechamento, vencimento, virada de ano, fevereiro, pagamentos, limites, metas, CSV/OFX, acentos, duplicidade e plano de lembretes. TypeScript passou.

Na interface com dados fictícios: o assistente gravou duas contas e dois cartões; uma compra de R$ 1.200 em 12x mostrou R$ 100 em cada fatura e R$ 1.200 comprometidos no limite; um pagamento de R$ 100 baixou só a fatura selecionada e liberou R$ 100. A importação de R$ 200 de entrada e R$ 25 de saída atualizou apenas a conta escolhida. Uma segunda prévia do mesmo CSV mostrou zero registros novos e dois já importados. Reabrir preservou dados e tema; não houve erros no console na validação final.

## Atualizações e WhatsApp

O aplicativo inclui EAS Update vinculado à conta `louas`, com busca ao abrir e controles em Mais → Ajustes. Veja [como atualizar sem reinstalar](ATUALIZACOES.md). Este APK é necessário para instalar o motor de atualização; depois dele, melhorias compatíveis de interface e regras podem ser publicadas sem novo instalador. Recursos nativos continuam exigindo um novo runtime/APK.

O resumo do WhatsApp passou a ter cabeçalho, data, itens agrupados por direção, vencimentos, pagamentos parciais já descontados, subtotais e saldo líquido destacado. Valores em sentidos opostos são apresentados como compensação, sem marcar pendências como pagas. A prévia pode ser revisada e compartilhada pelo sistema; o atalho direto continua abrindo a conversa para o usuário enviar. Resumos acima de 8 mil caracteres usam o compartilhamento completo, evitando falhas em URLs longas. Nenhuma mensagem foi enviada durante os testes.
