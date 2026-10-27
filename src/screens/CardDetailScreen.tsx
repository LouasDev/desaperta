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
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(displayDate(today()));
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(20);
  if (!card)
    return (
      <Page title="Cartão não encontrado" back={() => navigation.goBack()}>
        <Text style={styles.body}>Este cartão não está mais disponível.</Text>
      </Page>
    );
  const summary = cardTotals(data, card.id);
  const items = data.transactions
    .filter((t) => t.cardId === card.id || t.cardPaymentFor === card.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const pay = async () => {
    setError('');
    try {
      const cents = parseMoney(amount),
        iso = parseDate(date, false);
      if (cents > summary.outstanding)
        throw new Error('O pagamento ultrapassa os gastos pendentes.');
      if (
        !(await confirm({
          title: 'Registrar pagamento da fatura?',
          message: `${money(cents)} sairão do saldo em conta e liberarão o mesmo valor no cartão. Isso não duplica os gastos por categoria.`,
          accept: 'Registrar pagamento',
        }))
      )
        return;
      await commit((current) => payCard(current, card.id, cents, iso));
      setAmount('');
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
      <Card>
        <Text style={styles.body}>Crédito disponível</Text>
        <Text style={[styles.title, { color: summary.available < 0 ? colors.red : colors.ink }]}>
          {money(summary.available)}
        </Text>
        <Text style={styles.body}>
          Limite: {money(card.limit)} · A pagar: {money(summary.outstanding)}
        </Text>
        {summary.available < 0 && (
          <Text style={styles.error}>O valor pendente ultrapassa o limite cadastrado.</Text>
        )}
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
      <ErrorText message={error} />
      {summary.outstanding > 0 && (
        <Card>
          <Text style={styles.subtitle}>Pagamento da fatura</Text>
          <Field
            label="Valor pago (R$) *"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            maxLength={20}
          />
          <Button
            label={`Preencher total: ${money(summary.outstanding)}`}
            variant="secondary"
            compact
            onPress={() => setAmount(inputMoney(summary.outstanding))}
          />
          <Field label="Data do pagamento *" value={date} onChangeText={setDate} maxLength={10} />
          <Button
            label={saving ? 'Salvando…' : 'Registrar pagamento da fatura'}
            onPress={pay}
            disabled={saving}
          />
        </Card>
      )}
      <Text style={styles.subtitle}>Gastos e pagamentos</Text>
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
