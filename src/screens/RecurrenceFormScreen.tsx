import { CashAccountPicker } from '../components/CashAccountPicker';
import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AccountFields } from '../components/AccountFields';
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
  displayDate,
  Flow,
  inputMoney,
  parseDate,
  parseMoney,
  text,
  today,
} from '../domain/finance';
import { saveRecurrence } from '../domain/planning';
import { RootParams } from '../navigation/types';
import { useUnsavedChanges } from '../navigation/useUnsavedChanges';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function RecurrenceFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'RecurrenceForm'>) {
  const { data, commit, saving } = useFinance();
  const { styles } = useTheme();
  const { notify } = useFeedback();
  const existing = data.recurrences.find((r) => r.id === route.params?.id);
  const [type, setType] = useState<Flow>(existing?.type ?? route.params?.type ?? 'expense');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(existing ? inputMoney(existing.amount) : '');
  const [date, setDate] = useState(displayDate(existing?.startDate ?? today()));
  const [categoryId, setCategory] = useState(
    existing?.categoryId ?? (type === 'income' ? 'allowance' : 'subscriptions'),
  );
  const [account, setAccount] = useState<'cash' | 'credit'>(existing?.account ?? 'cash');
  const [cardId, setCardId] = useState(existing?.cardId);
  const [cashAccountId, setCashAccountId] = useState(
    existing?.cashAccountId ?? data.cashAccounts[0].id,
  );
  const [error, setError] = useState('');
  const snapshot = JSON.stringify({
      type,
      title,
      amount,
      date,
      categoryId,
      account,
      cardId,
      cashAccountId,
    }),
    initial = useRef(snapshot);
  const allowLeave = useUnsavedChanges(snapshot !== initial.current, saving);
  const save = async () => {
    setError('');
    try {
      const input = {
        title: text(title, 'Descrição'),
        amount: parseMoney(amount),
        type,
        categoryId,
        account: type === 'income' ? ('cash' as const) : account,
        ...(type === 'expense' && account === 'credit' ? { cardId } : { cashAccountId }),
        startDate: parseDate(date),
        active: existing?.active ?? true,
      };
      await commit((current) => saveRecurrence(current, input, existing?.id));
      allowLeave();
      notify('Recorrência salva. Confira as previsões antes de lançar.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page
      title={existing ? 'Editar recorrência' : 'Nova recorrência'}
      subtitle="Frequência mensal"
      back={() => navigation.goBack()}
    >
      <Card>
        <Chips
          value={type}
          onChange={(value) => {
            setType(value);
            setCategory(value === 'income' ? 'allowance' : 'subscriptions');
          }}
          options={[
            { value: 'expense', label: 'Gasto recorrente' },
            { value: 'income', label: 'Entrada recorrente' },
          ]}
        />
        <Field
          label="Descrição *"
          value={title}
          onChangeText={setTitle}
          placeholder={type === 'expense' ? 'Ex.: Spotify' : 'Ex.: Mesada'}
        />
        <Field
          label="Valor mensal (R$) *"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          maxLength={20}
        />
        <Field
          label="Primeira ocorrência *"
          value={date}
          onChangeText={setDate}
          maxLength={10}
          placeholder="DD/MM/AAAA"
          hint="O dia desta data será usado nos próximos meses."
        />
        <Text style={styles.body}>Categoria</Text>
        <Chips
          value={categoryId}
          onChange={setCategory}
          options={data.categories
            .filter((c) => c.type === type && !c.id.startsWith('payment-'))
            .map((c) => ({ value: c.id, label: c.name }))}
        />
        {type === 'income' && (
          <CashAccountPicker
            label="Receber na conta"
            value={cashAccountId}
            onChange={setCashAccountId}
          />
        )}
        {type === 'expense' && (
          <AccountFields
            account={account}
            cardId={cardId}
            cashAccountId={cashAccountId}
            onChange={(value, selected, cashId) => {
              setAccount(value);
              setCardId(selected);
              if (cashId) setCashAccountId(cashId);
            }}
          />
        )}
      </Card>
      <ErrorText message={error} />
      <Button
        label={saving ? 'Salvando…' : 'Salvar recorrência'}
        disabled={saving}
        onPress={save}
      />
      <Text style={styles.small}>
        O cadastro não lança valores automaticamente. Em Recorrências, confirme cada ocorrência
        realizada. Editar o cadastro altera as previsões ainda não lançadas.
      </Text>
    </Page>
  );
}
