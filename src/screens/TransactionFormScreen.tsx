import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  Chips,
  ErrorText,
  Field,
  messageOf,
  Page,
  useFeedback,
} from '../components/ui';
import {
  deleteTransaction,
  displayDate,
  Flow,
  inputMoney,
  parseDate,
  parseMoney,
  saveTransaction,
  text,
  today,
} from '../domain/finance';
import { RootParams } from '../navigation/types';
import { useUnsavedChanges } from '../navigation/useUnsavedChanges';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
import { AccountFields } from '../components/AccountFields';
import { resolveOccurrence, saveRecurrence } from '../domain/planning';
export default function TransactionFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'TransactionForm'>) {
  const { colors, styles, clay } = useTheme();
  const { data, commit, saving } = useFinance();
  const { notify, confirm } = useFeedback();
  const existing = data.transactions.find((t) => t.id === route.params?.id);
  const [type, setType] = useState<Flow>(existing?.type ?? route.params?.type ?? 'expense');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(existing ? inputMoney(existing.amount) : '');
  const [date, setDate] = useState(displayDate(existing?.date ?? today()));
  const [categoryId, setCategory] = useState(
    existing?.categoryId ?? (type === 'income' ? 'income-general' : 'expense-general'),
  );
  const [error, setError] = useState('');
  const [account, setAccount] = useState<'cash' | 'credit'>(
    existing?.account ?? (route.params?.cardId ? 'credit' : 'cash'),
  );
  const [cardId, setCardId] = useState(existing?.cardId ?? route.params?.cardId);
  const [repeat, setRepeat] = useState<'once' | 'monthly'>('once');
  const snapshot = JSON.stringify({
    type,
    title,
    amount,
    date,
    categoryId,
    account,
    cardId,
    repeat,
  });
  const initialSnapshot = useRef(snapshot);
  const allowLeave = useUnsavedChanges(snapshot !== initialSnapshot.current, saving);
  const categories = data.categories.filter((c) => c.type === type && !c.id.startsWith('payment-'));
  const save = async () => {
    setError('');
    try {
      const input = {
        title: text(title, 'Descrição'),
        amount: parseMoney(amount),
        date: parseDate(date, false),
        type,
        categoryId,
        account: type === 'expense' ? account : ('cash' as const),
        ...(type === 'expense' && account === 'credit' ? { cardId } : {}),
      };
      await commit((current) => {
        if (!existing && repeat === 'monthly') {
          const next = saveRecurrence(current, {
            title: input.title,
            amount: input.amount,
            type: input.type,
            categoryId: input.categoryId,
            account: input.account,
            cardId: input.cardId,
            startDate: input.date,
            active: true,
          });
          return resolveOccurrence(
            next,
            next.recurrences[next.recurrences.length - 1].id,
            input.date,
          );
        }
        return saveTransaction(current, input, existing?.id);
      });
      allowLeave();
      notify(
        existing
          ? 'Lançamento atualizado.'
          : repeat === 'monthly'
            ? 'Lançamento e recorrência mensal salvos.'
            : 'Lançamento salvo.',
      );
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  const remove = async () => {
    if (
      !existing ||
      !(await confirm({
        title: 'Excluir lançamento?',
        message: 'Este registro sairá do histórico e o saldo será recalculado.',
        accept: 'Excluir lançamento',
        destructive: true,
      }))
    )
      return;
    try {
      await commit((current) => deleteTransaction(current, existing.id));
      allowLeave();
      notify('Lançamento excluído.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  if (route.params?.id && !existing)
    return (
      <Page title="Registro não encontrado" back={() => navigation.goBack()}>
        <Text style={styles.body}>Este lançamento não está mais disponível.</Text>
      </Page>
    );
  if (existing?.cardPaymentFor)
    return (
      <Page title="Pagamento de fatura" back={() => navigation.goBack()}>
        <Card>
          <Text style={styles.subtitle}>{existing.title}</Text>
          <Text style={styles.body}>
            Valor: R$ {inputMoney(existing.amount)} · {displayDate(existing.date)}
          </Text>
          <Text style={styles.body}>
            Para corrigir, desfaça este pagamento e registre o valor correto na tela do cartão.
          </Text>
        </Card>
        <ErrorText message={error} />
        <Button
          label="Desfazer pagamento da fatura"
          variant="danger"
          onPress={remove}
          disabled={saving}
        />
      </Page>
    );
  return (
    <Page
      title={existing ? 'Editar lançamento' : 'Novo lançamento'}
      subtitle="Registre dinheiro que já entrou ou saiu."
      back={() => navigation.goBack()}
    >
      <Card>
        <Text style={styles.eyebrow}>Tipo de movimentação</Text>
        <Chips
          value={type}
          onChange={(v) => {
            setType(v);
            setCategory(v === 'income' ? 'income-general' : 'expense-general');
          }}
          options={[
            { value: 'income', label: '↙ Entrada' },
            { value: 'expense', label: '↗ Saída' },
          ]}
        />
        <Field
          label="Descrição *"
          placeholder="Ex.: mesada, lanche, passagem"
          value={title}
          onChangeText={setTitle}
        />
        <Field
          label="Valor (R$) *"
          placeholder="0,00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          maxLength={20}
        />
        <Field
          label="Data *"
          placeholder="DD/MM/AAAA"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          hint="Use DD/MM/AAAA. Apenas movimentações já realizadas."
        />
        <Text style={styles.body}>Categoria</Text>
        <Chips
          value={categoryId}
          onChange={setCategory}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        {type === 'expense' && (
          <AccountFields
            account={account}
            cardId={cardId}
            onChange={(value, selected) => {
              setAccount(value);
              setCardId(selected);
            }}
          />
        )}
        {!existing && (
          <>
            <Text style={styles.body}>Repetição</Text>
            <Chips
              value={repeat}
              onChange={setRepeat}
              options={[
                { value: 'once', label: 'Só este lançamento' },
                { value: 'monthly', label: 'Todo mês' },
              ]}
            />
            {repeat === 'monthly' && (
              <Text style={styles.small}>
                Este lançamento será salvo agora. Os próximos meses ficarão em Recorrências para
                você confirmar quando acontecerem.
              </Text>
            )}
          </>
        )}
      </Card>
      <ErrorText message={error} />
      <Button label={saving ? 'Salvando…' : 'Salvar lançamento'} disabled={saving} onPress={save} />
      {existing && (
        <Button label="Excluir lançamento" variant="danger" disabled={saving} onPress={remove} />
      )}
      <Text style={styles.small}>
        * Campos obrigatórios. Gastos no crédito consomem o limite do cartão. O saldo em conta só
        diminui ao pagar a fatura.
      </Text>
    </Page>
  );
}
