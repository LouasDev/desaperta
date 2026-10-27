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
import {
  Direction,
  displayDate,
  inputMoney,
  parseDate,
  parseMoney,
  paidAmount,
  saveDebt,
  text,
  today,
} from '../domain/finance';
import { RootParams } from '../navigation/types';
import { useUnsavedChanges } from '../navigation/useUnsavedChanges';
import { useFinance } from '../state/FinanceContext';
import { styles } from '../styles/theme';
export default function DebtFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'DebtForm'>) {
  const { data, commit, saving } = useFinance();
  const { notify } = useFeedback();
  const existing = data.debts.find((d) => d.id === route.params?.id);
  const [direction, setDirection] = useState<Direction>(
    existing?.direction ?? route.params?.direction ?? 'payable',
  );
  const [personName, setPerson] = useState(
    data.people.find((p) => p.id === existing?.personId)?.name ?? '',
  );
  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(existing ? inputMoney(existing.amount) : '');
  const [date, setDate] = useState(displayDate(existing?.dueDate ?? today()));
  const [error, setError] = useState('');
  const snapshot = JSON.stringify({ direction, personName, title, amount, date });
  const initialSnapshot = useRef(snapshot);
  const allowLeave = useUnsavedChanges(snapshot !== initialSnapshot.current, saving);
  const lockedDirection = existing && paidAmount(data, existing.id) > 0;
  const save = async () => {
    setError('');
    try {
      const input = {
        personName: text(personName, 'Pessoa'),
        title: text(title, 'Descrição'),
        amount: parseMoney(amount),
        dueDate: parseDate(date),
        direction,
      };
      await commit((current) => saveDebt(current, input, existing?.id));
      allowLeave();
      notify(existing ? 'Registro atualizado.' : 'Pendência salva. Seu saldo continua o mesmo.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  if (route.params?.id && !existing)
    return (
      <Page title="Registro não encontrado" back={() => navigation.goBack()}>
        <Text style={styles.body}>Esta pendência não está mais disponível.</Text>
      </Page>
    );
  return (
    <Page title={existing ? 'Editar pendência' : 'Nova pendência'} back={() => navigation.goBack()}>
      <Card>
        <Text style={styles.eyebrow}>Tipo de pendência</Text>
        {lockedDirection ? (
          <Text style={styles.body}>
            {direction === 'payable' ? 'Eu devo' : 'Me devem'} · O tipo fica fixo após o primeiro
            pagamento.
          </Text>
        ) : (
          <Chips
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'payable', label: 'Eu devo' },
              { value: 'receivable', label: 'Me devem' },
            ]}
          />
        )}
        <Field
          label={direction === 'payable' ? 'Para quem você deve? *' : 'Quem deve para você? *'}
          placeholder="Nome da pessoa ou empresa"
          value={personName}
          onChangeText={setPerson}
          autoCapitalize="words"
        />
        <Field
          label="Descrição *"
          placeholder="Ex.: parte do presente, empréstimo"
          value={title}
          onChangeText={setTitle}
        />
        <Field
          label="Valor total combinado (R$) *"
          placeholder="0,00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          maxLength={20}
          hint="Informe o total original. Os pagamentos serão registrados separadamente."
        />
        <Field
          label="Vencimento *"
          placeholder="DD/MM/AAAA"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </Card>
      <ErrorText message={error} />
      <Button label={saving ? 'Salvando…' : 'Salvar pendência'} disabled={saving} onPress={save} />
      <Text style={styles.small}>
        * Campos obrigatórios. Este cadastro organiza o compromisso. Ele não movimenta o seu saldo.
      </Text>
    </Page>
  );
}
