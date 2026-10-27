import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
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
import { Flow, inputMoney, parseMoney, today } from '../domain/finance';
import { displayMonth, parseMonth } from '../domain/formValues';
import { saveGoal } from '../domain/planning';
import { RootParams } from '../navigation/types';
import { useUnsavedChanges } from '../navigation/useUnsavedChanges';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function GoalFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'GoalForm'>) {
  const { data, commit, saving } = useFinance();
  const { styles } = useTheme();
  const { notify, confirm } = useFeedback();
  const existing = data.goals.find((g) => g.id === route.params?.id);
  const [type, setType] = useState<Flow>(existing?.type ?? 'expense');
  const [categoryId, setCategory] = useState(existing?.categoryId ?? 'leisure');
  const [amount, setAmount] = useState(existing ? inputMoney(existing.amount) : '');
  const [month, setMonth] = useState(displayMonth(existing?.month ?? today().slice(0, 7)));
  const [error, setError] = useState('');
  const snapshot = JSON.stringify({ type, categoryId, amount, month }),
    initial = useRef(snapshot);
  const allowLeave = useUnsavedChanges(snapshot !== initial.current, saving);
  const save = async () => {
    setError('');
    try {
      const input = { type, categoryId, amount: parseMoney(amount), month: parseMonth(month) };
      await commit((current) => saveGoal(current, input, existing?.id));
      allowLeave();
      notify('Meta salva.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  const remove = async () => {
    if (
      !existing ||
      !(await confirm({
        title: 'Excluir meta?',
        message: 'Seus lançamentos e histórico serão mantidos.',
        accept: 'Excluir meta',
        destructive: true,
      }))
    )
      return;
    try {
      await commit((current) => ({
        ...current,
        goals: current.goals.filter((g) => g.id !== existing.id),
      }));
      allowLeave();
      notify('Meta excluída.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page title={existing ? 'Editar meta' : 'Nova meta'} back={() => navigation.goBack()}>
      <Card>
        <Chips
          value={type}
          onChange={(value) => {
            setType(value);
            setCategory(value === 'income' ? 'allowance' : 'leisure');
          }}
          options={[
            { value: 'expense', label: 'Limite de gastos' },
            { value: 'income', label: 'Objetivo de entrada' },
          ]}
        />
        <Text style={styles.body}>Categoria</Text>
        <Chips
          value={categoryId}
          onChange={setCategory}
          options={data.categories
            .filter((c) => c.type === type)
            .map((c) => ({ value: c.id, label: c.name }))}
        />
        <Field
          label={type === 'expense' ? 'Gastar no máximo (R$) *' : 'Receber pelo menos (R$) *'}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          maxLength={20}
        />
        <Field
          label="Mês da meta *"
          value={month}
          onChangeText={setMonth}
          placeholder="MM/AAAA"
          maxLength={7}
        />
      </Card>
      <ErrorText message={error} />
      <Button label={saving ? 'Salvando…' : 'Salvar meta'} onPress={save} disabled={saving} />
      {existing && (
        <Button label="Excluir meta" variant="danger" onPress={remove} disabled={saving} />
      )}
    </Page>
  );
}
