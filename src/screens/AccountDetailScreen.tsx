import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Page } from '../components/ui';
import { TransactionRow } from '../components/FinanceRows';
import { accountBalance } from '../domain/accounts';
import { money } from '../domain/finance';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function AccountDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootParams, 'AccountDetail'>) {
  const { data } = useFinance();
  const { styles } = useTheme();
  const [limit, setLimit] = useState(30);
  const account = data.cashAccounts.find((a) => a.id === route.params.id);
  if (!account)
    return (
      <Page title="Conta não encontrada" back={() => navigation.goBack()}>
        <Text style={styles.body}>Esta conta não está mais disponível.</Text>
      </Page>
    );
  const items = data.transactions
    .filter((t) => t.cashAccountId === account.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return (
    <Page title={account.name} back={() => navigation.goBack()}>
      <Card>
        <Text style={styles.body}>Saldo da conta</Text>
        <Text style={styles.title}>{money(accountBalance(data, account.id))}</Text>
        <Button
          label="Editar conta"
          variant="secondary"
          onPress={() => navigation.navigate('AccountForm', { id: account.id })}
        />
        <Button
          label="+ Novo lançamento nesta conta"
          onPress={() => navigation.navigate('TransactionForm', { cashAccountId: account.id })}
        />
      </Card>
      <Text style={styles.subtitle}>Extrato da conta</Text>
      {items.slice(0, limit).map((item) => (
        <View key={item.id}>
          <TransactionRow
            item={item}
            category={
              item.transferId
                ? 'Transferência'
                : (data.categories.find((c) => c.id === item.categoryId)?.name ?? '')
            }
            onPress={() => {
              const payment = data.payments.find((p) => p.id === item.paymentId);
              if (payment) navigation.navigate('DebtDetail', { id: payment.debtId });
              else navigation.navigate('TransactionForm', { id: item.id });
            }}
          />
          <View style={styles.divider} />
        </View>
      ))}
      {!items.length && <Text style={styles.body}>Nenhuma movimentação nesta conta.</Text>}
      {items.length > limit && (
        <Button label="Mostrar mais" variant="secondary" onPress={() => setLimit((v) => v + 30)} />
      )}
    </Page>
  );
}
