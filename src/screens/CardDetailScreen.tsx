import { cardBills, cycleDates, cycleForDate, shiftMonth } from '../domain/billing';
import { CreditUsage } from '../components/CreditUsage';
import { CashAccountPicker } from '../components/CashAccountPicker';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, ErrorText, Field, messageOf, Page, useFeedback } from '../components/ui';
import { TransactionRow } from '../components/FinanceRows';
import { displayDate, inputMoney, money, parseDate, parseMoney, today } from '../domain/finance';
import { cardTotals, payCard, removeCard } from '../domain/planning';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function CardDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'CardDetail'>) {
  const { data, commit, saving } = useFinance();
  const { styles, colors } = useTheme();
  const { confirm, notify } = useFeedback();
  const card = data.cards.find((c) => c.id === route.params.id);
  const [cashAccountId, setCashAccountId] = useState(data.cashAccounts[0].id);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(displayDate(today()));
  const [error, setError] = useState('');
  const [month, setMonth] = useState(
    () =>
      (card
        ? cardBills(data, route.params.id, today()).find((b) => b.balance > 0)?.month
        : undefined) ?? cycleForDate(today(), card?.closingDay),
  );
  const [limit, setLimit] = useState(20);
  const [showPayment, setShowPayment] = useState(false);
  if (!card)
    return (
      <Page title="Cartão não encontrado" back={() => navigation.goBack()}>
        <Text style={styles.body}>Este cartão não está mais disponível.</Text>
      </Page>
    );
  const summary = cardTotals(data, card.id);
  const bills = cardBills(data, card.id, today());
  const bill = bills.find((b) => b.month === month) ?? {
    month,
    balance: 0,
    charges: 0,
    paid: 0,
    opening: 0,
    status: today() >= cycleDates(card, month).closingDate ? 'Fechada' : 'Futura',
    ...cycleDates(card, month),
  };
  const future = bills.filter((b) => b.month > month).reduce((sum, b) => sum + b.balance, 0);
  const items = data.transactions
    .filter((t) => (t.cardId === card.id || t.cardPaymentFor === card.id) && t.billMonth === month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const pay = async () => {
    setError('');
    try {
      const cents = parseMoney(amount),
        iso = parseDate(date, false);
      if (cents > bill.balance) throw new Error('O pagamento ultrapassa os gastos pendentes.');
      if (
        !(await confirm({
          title: 'Registrar pagamento da fatura?',
          message: `${money(cents)} sairão do saldo em conta e liberarão o mesmo valor no cartão. Isso não duplica os gastos por categoria.`,
          accept: 'Registrar pagamento',
        }))
      )
        return;
      await commit((current) => payCard(current, card.id, cents, iso, cashAccountId, month));
      setAmount('');
      setShowPayment(false);
      notify('Fatura paga e crédito atualizado.');
    } catch (e) {
      setError(messageOf(e));
    }
  };
  const remove = async () => {
    if (
      !(await confirm({
        title: 'Excluir cartão?',
        message: 'Só é possível excluir cartões sem gastos pendentes e sem histórico.',
        accept: 'Excluir cartão',
        destructive: true,
      }))
    )
      return;
    try {
      await commit((current) => removeCard(current, card.id));
      notify('Cartão excluído.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page title={card.name} back={() => navigation.goBack()}>
      {!card.cycleConfigured && (
        <Card>
          <Text style={styles.subtitle}>Confirme os dias deste cartão</Text>
          <Text style={styles.body}>
            Este cartão veio da versão anterior, que não guardava fechamento e vencimento. O ciclo
            padrão é dia 25/5. Edite o cartão para usar as datas reais antes de cadastrar compras
            parceladas ou ativar os lembretes.
          </Text>
          <Button
            label="Configurar fechamento e vencimento"
            onPress={() => navigation.navigate('CardForm', { id: card.id })}
          />
        </Card>
      )}
      <Card>
        <CreditUsage card={card} used={summary.outstanding} />
        <Button
          label="Editar cartão"
          variant="secondary"
          onPress={() => navigation.navigate('CardForm', { id: card.id })}
        />
        <Button
          label="+ Registrar gasto"
          onPress={() =>
            navigation.navigate('TransactionForm', { type: 'expense', cardId: card.id })
          }
        />
      </Card>
      <Card>
        <View style={styles.between}>
          <Button
            label="← Anterior"
            compact
            variant="secondary"
            onPress={() => {
              setMonth(shiftMonth(month, -1));
              setLimit(20);
            }}
          />
          <Text style={styles.subtitle}>{month.split('-').reverse().join('/')}</Text>
          <Button
            label="Próxima →"
            compact
            variant="secondary"
            onPress={() => {
              setMonth(shiftMonth(month, 1));
              setLimit(20);
            }}
          />
        </View>
        <Text
          style={[
            styles.eyebrow,
            { color: bill.status === 'Vencida' ? colors.red : colors.accent },
          ]}
        >
          FATURA {bill.status.toUpperCase()}
        </Text>
        <Text style={[styles.title, { fontSize: 34 }]}>{money(bill.balance)}</Text>
        <Text style={styles.body}>
          Fecha {displayDate(bill.closingDate)} · vence {displayDate(bill.dueDate)}
        </Text>
        <Text style={styles.small}>
          Compras {money(bill.charges)} · pagamentos {money(bill.paid)}
        </Text>
        {!!bill.opening && (
          <Text style={styles.small}>
            Inclui {money(bill.opening)} do saldo anterior ao cadastro.
          </Text>
        )}
        <Text style={styles.body}>Próximas faturas: {money(future)}</Text>
        <Text style={styles.small}>
          {today() >= bill.closingDate
            ? 'Fatura fechada: novas compras pertencem ao próximo ciclo. Correções de registros antigos continuam disponíveis.'
            : 'O total desta fatura contém só as parcelas deste mês. O limite acima considera também todas as parcelas futuras.'}
        </Text>
      </Card>
      <ErrorText message={error} />
      {bill.balance > 0 && (
        <Button
          label={showPayment ? 'Ocultar pagamento' : 'Registrar pagamento desta fatura'}
          variant="secondary"
          onPress={() => setShowPayment(!showPayment)}
        />
      )}
      {bill.balance > 0 && showPayment && (
        <Card>
          <Text style={styles.subtitle}>Pagamento da fatura</Text>
          <CashAccountPicker
            label="Pagar a partir da conta"
            value={cashAccountId}
            onChange={setCashAccountId}
          />
          <Field
            label="Valor pago (R$) *"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            maxLength={20}
          />
          <Button
            label={`Preencher total: ${money(bill.balance)}`}
            variant="secondary"
            compact
            onPress={() => setAmount(inputMoney(bill.balance))}
          />
          <Field label="Data do pagamento *" value={date} onChangeText={setDate} maxLength={10} />
          <Button
            label={saving ? 'Salvando…' : 'Registrar pagamento da fatura'}
            onPress={pay}
            disabled={saving}
          />
        </Card>
      )}
      <Text style={styles.subtitle}>Itens desta fatura</Text>
      {items.slice(0, limit).map((item) => (
        <View key={item.id}>
          <TransactionRow
            item={item}
            category={
              item.cardPaymentFor
                ? 'Pagamento de fatura'
                : (data.categories.find((c) => c.id === item.categoryId)?.name ?? '')
            }
            onPress={() => navigation.navigate('TransactionForm', { id: item.id })}
          />
          <View style={styles.divider} />
        </View>
      ))}
      {!items.length && (
        <Text style={styles.body}>
          Nenhuma movimentação. Os gastos iniciais ficam no total a pagar, sem duplicar o histórico.
        </Text>
      )}
      {items.length > limit && (
        <Button label="Mostrar mais" variant="secondary" onPress={() => setLimit((v) => v + 20)} />
      )}
      <Button label="Excluir cartão" variant="danger" onPress={remove} disabled={saving} />
    </Page>
  );
}
