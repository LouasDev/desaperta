import React from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Page } from '../components/ui';
import { accountBalance } from '../domain/accounts';
import { money } from '../domain/finance';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function AccountsScreen({
  navigation,
}: NativeStackScreenProps<RootParams, 'Accounts'>) {
  const { data } = useFinance();
  const { styles, colors } = useTheme();
  return (
    <Page title="Contas e saldos" back={() => navigation.goBack()}>
      <Button label="+ Adicionar conta" onPress={() => navigation.navigate('AccountForm')} />
      {data.cashAccounts.length > 1 && (
        <Button
          label="Transferir entre contas"
          variant="secondary"
          onPress={() => navigation.navigate('TransferForm')}
        />
      )}
      {data.cashAccounts.map((account) => {
        const balance = accountBalance(data, account.id);
        return (
          <Card key={account.id}>
            <View style={styles.between}>
              <Text style={styles.subtitle}>{account.name}</Text>
              <Text style={[styles.subtitle, { color: balance < 0 ? colors.red : colors.ink }]}>
                {money(balance)}
              </Text>
            </View>
            <Text style={styles.small}>Saldo inicial: {money(account.openingBalance)}</Text>
            <Button
              label={`Ver extrato de ${account.name}`}
              variant="secondary"
              onPress={() => navigation.navigate('AccountDetail', { id: account.id })}
            />
            <Button
              label={`Editar ${account.name}`}
              variant="secondary"
              compact
              onPress={() => navigation.navigate('AccountForm', { id: account.id })}
            />
          </Card>
        );
      })}
      <Text style={styles.small}>
        Cada conta tem saldo próprio. Transferências internas não entram nas receitas, nos gastos ou
        nas metas.
      </Text>
    </Page>
  );
}
