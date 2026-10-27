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
import { styles } from '../styles/theme';
export default function TransactionFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'TransactionForm'>) {
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
  const snapshot = JSON.stringify({ type, title, amount, date, categoryId });
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
      };
      await commit((current) => saveTransaction(current, input, existing?.id));
      allowLeave();
      notify(existing ? 'Lançamento atualizado.' : 'Lançamento salvo. Seu saldo foi atualizado.');
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
      </Card>
      <ErrorText message={error} />
      <Button label={saving ? 'Salvando…' : 'Salvar lançamento'} disabled={saving} onPress={save} />
      {existing && (
        <Button label="Excluir lançamento" variant="danger" disabled={saving} onPress={remove} />
      )}
      <Text style={styles.small}>
        * Campos obrigatórios. Para registrar o dinheiro que você já tinha, crie uma entrada com a
        descrição “Saldo inicial”.
      </Text>
    </Page>
  );
}
