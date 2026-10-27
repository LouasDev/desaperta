import React, { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, Chips, ErrorText, Field, messageOf, Page } from '../components/ui';
import { configure } from '../domain/planning';
import { moneyOrZero } from '../domain/formValues';
import { parseMoney, text } from '../domain/finance';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function OnboardingScreen() {
  const { data, commit, saving } = useFinance();
  const { styles } = useTheme();
  const [accountName, setAccountName] = useState('Conta principal');
  const [balance, setBalance] = useState('0,00');
  const [credit, setCredit] = useState<'no' | 'yes'>('no');
  const [name, setName] = useState('Meu cartão');
  const [limit, setLimit] = useState('');
  const [used, setUsed] = useState('0,00');
  const [error, setError] = useState('');
  const finish = async () => {
    setError('');
    try {
      const openingBalance = moneyOrZero(balance);
      const card =
        credit === 'yes'
          ? {
              name: text(name, 'Nome do cartão'),
              limit: parseMoney(limit),
              openingUsed: moneyOrZero(used),
            }
          : undefined;
      await commit((current) => configure(current, openingBalance, card, accountName));
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page title="Configuração inicial" subtitle="Defina o ponto de partida do seu controle.">
      <Card>
        <Text style={styles.subtitle}>Sua primeira conta</Text>
        <Field
          label="Nome da conta *"
          value={accountName}
          onChangeText={setAccountName}
          placeholder="Ex.: Nubank ou Carteira"
        />
        <Field
          label="Saldo inicial (R$)"
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
          maxLength={20}
          hint="Dinheiro que você já tem em conta ou na carteira. Use 0,00 para começar do zero."
        />
        {!!data.transactions.length && (
          <Text style={styles.body}>
            Seus registros anteriores serão mantidos. Este saldo será somado ao histórico; use zero
            se você já cadastrou o saldo inicial como uma entrada.
          </Text>
        )}
      </Card>
      <Card>
        <Text style={styles.subtitle}>Você tem cartão de crédito?</Text>
        <Chips
          value={credit}
          onChange={setCredit}
          options={[
            { value: 'no', label: 'Não' },
            { value: 'yes', label: 'Sim' },
          ]}
        />
        {credit === 'yes' && (
          <>
            <Field label="Nome do cartão *" value={name} onChangeText={setName} />
            <Field
              label="Limite total (R$) *"
              value={limit}
              onChangeText={setLimit}
              keyboardType="decimal-pad"
              maxLength={20}
              placeholder="Ex.: 100,00"
            />
            <Field
              label="Quanto já foi gasto no cartão (R$)"
              value={used}
              onChangeText={setUsed}
              keyboardType="decimal-pad"
              maxLength={20}
              hint="Valor ainda não pago. Com limite de R$ 100 e gastos de R$ 50, restam R$ 50 de crédito."
            />
            <Text style={styles.small}>
              O limite do cartão não será somado ao seu saldo em conta.
            </Text>
          </>
        )}
      </Card>
      <Text style={styles.small}>
        Depois você pode adicionar outras contas e cartões no painel ou em Ajustes.
      </Text>
      <ErrorText message={error} />
      <Button label={saving ? 'Salvando…' : 'Começar a usar'} disabled={saving} onPress={finish} />
    </Page>
  );
}
