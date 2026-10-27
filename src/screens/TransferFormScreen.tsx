import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, ErrorText, Field, messageOf, Page, useFeedback } from '../components/ui';
import { CashAccountPicker } from '../components/CashAccountPicker';
import { transferBetweenAccounts } from '../domain/accounts';
import { displayDate, parseDate, parseMoney, today } from '../domain/finance';
import { RootParams } from '../navigation/types';
import { useUnsavedChanges } from '../navigation/useUnsavedChanges';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function TransferFormScreen({
  navigation,
}: NativeStackScreenProps<RootParams, 'TransferForm'>) {
  const { data, commit, saving } = useFinance();
  const { styles } = useTheme();
  const { notify } = useFeedback();
  const [from, setFrom] = useState(data.cashAccounts[0].id);
  const [to, setTo] = useState(data.cashAccounts[1]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(displayDate(today()));
  const [error, setError] = useState('');
  const snapshot = JSON.stringify({ from, to, amount, date }),
    initial = useRef(snapshot);
  const allowLeave = useUnsavedChanges(snapshot !== initial.current, saving);
  const save = async () => {
    setError('');
    try {
      const cents = parseMoney(amount),
        iso = parseDate(date, false);
      await commit((current) => transferBetweenAccounts(current, from, to, cents, iso));
      allowLeave();
      notify('Transferência registrada. O saldo total foi mantido.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page title="Transferir entre contas" back={() => navigation.goBack()}>
      <Card>
        <CashAccountPicker label="Conta de origem" value={from} onChange={setFrom} />
        <CashAccountPicker label="Conta de destino" value={to} onChange={setTo} />
        <Field
          label="Valor transferido (R$) *"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          maxLength={20}
        />
        <Field label="Data da transferência *" value={date} onChangeText={setDate} maxLength={10} />
      </Card>
      <Text style={styles.body}>
        Registra uma transferência que você já realizou. O app não movimenta dinheiro nos bancos. O
        valor sai de uma conta e entra na outra, sem contar nas metas.
      </Text>
      <ErrorText message={error} />
      <Button
        label={saving ? 'Salvando…' : 'Registrar transferência'}
        onPress={save}
        disabled={saving}
      />
    </Page>
  );
}
