import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, ErrorText, Field, messageOf, Page, useFeedback } from '../components/ui';
import { saveAccount, removeAccount } from '../domain/accounts';
import { inputMoney, text } from '../domain/finance';
import { signedMoney } from '../domain/formValues';
import { RootParams } from '../navigation/types';
import { useUnsavedChanges } from '../navigation/useUnsavedChanges';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function AccountFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'AccountForm'>) {
  const { data, commit, saving } = useFinance();
  const { styles } = useTheme();
  const { notify, confirm } = useFeedback();
  const existing = data.cashAccounts.find((a) => a.id === route.params?.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [balance, setBalance] = useState(existing ? inputMoney(existing.openingBalance) : '0,00');
  const [error, setError] = useState('');
  const snapshot = JSON.stringify({ name, balance }),
    initial = useRef(snapshot);
  const allowLeave = useUnsavedChanges(snapshot !== initial.current, saving);
  const save = async () => {
    setError('');
    try {
      const input = { name: text(name, 'Nome da conta'), openingBalance: signedMoney(balance) };
      await commit((current) => saveAccount(current, input, existing?.id));
      allowLeave();
      notify('Conta salva.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  const remove = async () => {
    if (
      !existing ||
      !(await confirm({
        title: 'Excluir conta?',
        message: 'Só é possível excluir contas com saldo zero, sem histórico e sem recorrências.',
        accept: 'Excluir conta',
        destructive: true,
      }))
    )
      return;
    try {
      await commit((current) => removeAccount(current, existing.id));
      allowLeave();
      notify('Conta excluída.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page title={existing ? 'Editar conta' : 'Nova conta'} back={() => navigation.goBack()}>
      <Card>
        <Field
          label="Nome da conta *"
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Nubank, Banco Inter, Carteira"
        />
        <Field
          label="Saldo inicial da conta (R$)"
          value={balance}
          onChangeText={setBalance}
          keyboardType="numbers-and-punctuation"
          maxLength={21}
          hint="Valor anterior ao primeiro lançamento desta conta. Pode ser negativo. Não repita receitas já registradas."
        />
      </Card>
      <Text style={styles.small}>
        Alterar o saldo inicial recalcula o saldo desta conta e o total do painel.
      </Text>
      <ErrorText message={error} />
      <Button label={saving ? 'Salvando…' : 'Salvar conta'} onPress={save} disabled={saving} />
      {existing && (
        <Button label="Excluir conta" variant="danger" onPress={remove} disabled={saving} />
      )}
    </Page>
  );
}
