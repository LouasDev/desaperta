import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, ErrorText, Field, messageOf, Page, useFeedback } from '../components/ui';
import { inputMoney, parseMoney, text } from '../domain/finance';
import { moneyOrZero } from '../domain/formValues';
import { saveCard } from '../domain/planning';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
import { RootParams } from '../navigation/types';
import { useUnsavedChanges } from '../navigation/useUnsavedChanges';
export default function CardFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'CardForm'>) {
  const { data, commit, saving } = useFinance();
  const { styles } = useTheme();
  const { notify } = useFeedback();
  const existing = data.cards.find((c) => c.id === route.params?.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [limit, setLimit] = useState(existing ? inputMoney(existing.limit) : '');
  const [used, setUsed] = useState(existing ? inputMoney(existing.openingUsed) : '0,00');
  const [error, setError] = useState('');
  const snapshot = JSON.stringify({ name, limit, used }),
    initial = useRef(snapshot);
  const allowLeave = useUnsavedChanges(snapshot !== initial.current, saving);
  const save = async () => {
    setError('');
    try {
      const input = {
        name: text(name, 'Nome'),
        limit: parseMoney(limit),
        openingUsed: moneyOrZero(used),
      };
      await commit((current) => saveCard(current, input, existing?.id));
      allowLeave();
      notify('Cartão salvo.');
      navigation.goBack();
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page title={existing ? 'Editar cartão' : 'Novo cartão'} back={() => navigation.goBack()}>
      <Card>
        <Field
          label="Nome do cartão *"
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Meu cartão"
        />
        <Field
          label="Limite total (R$) *"
          value={limit}
          onChangeText={setLimit}
          keyboardType="decimal-pad"
          maxLength={20}
        />
        <Field
          label="Gastos anteriores ao cadastro (R$)"
          value={used}
          onChangeText={setUsed}
          keyboardType="decimal-pad"
          maxLength={20}
          hint="Saldo devedor antes de começar a registrar compras neste app. Não inclua compras já registradas."
        />
      </Card>
      <Text style={styles.small}>Não cadastre número, senha ou código de segurança do cartão.</Text>
      <ErrorText message={error} />
      <Button label={saving ? 'Salvando…' : 'Salvar cartão'} onPress={save} disabled={saving} />
    </Page>
  );
}
