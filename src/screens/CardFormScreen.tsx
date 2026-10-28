import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, ErrorText, Field, messageOf, Page, useFeedback } from '../components/ui';
import { inputMoney, parseMoney, text, today } from '../domain/finance';
import { cycleForDate } from '../domain/billing';
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
  const [closing, setClosing] = useState(String(existing?.closingDay ?? 25));
  const [due, setDue] = useState(String(existing?.dueDay ?? 5));
  const [openingMonth, setOpeningMonth] = useState(
    existing?.openingBillMonth ?? cycleForDate(today(), 25),
  );
  const [error, setError] = useState('');
  const snapshot = JSON.stringify({ name, limit, used, closing, due, openingMonth }),
    initial = useRef(snapshot);
  const allowLeave = useUnsavedChanges(snapshot !== initial.current, saving);
  const save = async () => {
    setError('');
    try {
      const input = {
        name: text(name, 'Nome'),
        limit: parseMoney(limit),
        openingUsed: moneyOrZero(used),
        cycleConfigured: true,
        closingDay: Number(closing),
        dueDay: Number(due),
        openingBillMonth: openingMonth,
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
          label="Dia do fechamento *"
          value={closing}
          onChangeText={setClosing}
          keyboardType="number-pad"
          maxLength={2}
          hint="De 1 a 31. Compras nesse dia entram na próxima fatura."
        />
        <Field
          label="Dia do vencimento *"
          value={due}
          onChangeText={setDue}
          keyboardType="number-pad"
          maxLength={2}
          hint="Datas no fim do mês se ajustam ao último dia disponível."
        />
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
        <Field
          label="Fatura dos gastos anteriores (AAAA-MM)"
          value={openingMonth}
          onChangeText={setOpeningMonth}
          maxLength={7}
          hint="Mês do fechamento para esse saldo. Parcelas antigas podem ser cadastradas como compras, sem repetir o valor aqui."
        />
        {existing && (
          <Text style={styles.small}>
            Alterar os dias afeta novas compras e as datas exibidas. Os meses das compras já
            registradas são preservados.
          </Text>
        )}
      </Card>
      <Text style={styles.small}>Não cadastre número, senha ou código de segurança do cartão.</Text>
      <ErrorText message={error} />
      <Button label={saving ? 'Salvando…' : 'Salvar cartão'} onPress={save} disabled={saving} />
    </Page>
  );
}
