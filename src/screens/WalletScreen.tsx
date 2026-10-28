import React from 'react';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParams } from '../navigation/types';
import { Button, Card, Page } from '../components/ui';
import { MenuRow } from '../components/MenuRow';
import { CreditUsage } from '../components/CreditUsage';
import { BillPreview } from '../components/BillPreview';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
import { accountBalance } from '../domain/accounts';
import { cardTotals } from '../domain/planning';
import { money } from '../domain/finance';
export default function WalletScreen() {
  const { data } = useFinance();
  const { styles } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootParams>>();
  return (
    <Page title="Carteira" subtitle="Suas contas, seus cartões e cada fatura em um lugar.">
      <Text style={styles.subtitle}>Contas</Text>
      <Card style={{ gap: 0 }}>
        {data.cashAccounts.map((a) => (
          <MenuRow
            key={a.id}
            icon="wallet"
            title={a.name}
            description={money(accountBalance(data, a.id))}
            onPress={() => navigation.navigate('AccountDetail', { id: a.id })}
          />
        ))}
      </Card>
      <Button
        label="+ Adicionar conta"
        variant="secondary"
        onPress={() => navigation.navigate('AccountForm')}
      />
      <Text style={styles.subtitle}>Cartões de crédito</Text>
      {data.cards.map((c) => (
        <Card key={c.id}>
          <CreditUsage card={c} used={cardTotals(data, c.id).outstanding} />
          <BillPreview card={c} />
          <Button
            label={`Ver faturas · ${c.name}`}
            variant="secondary"
            onPress={() => navigation.navigate('CardDetail', { id: c.id })}
          />
        </Card>
      ))}
      {!data.cards.length && (
        <Text style={styles.body}>
          Cadastre um cartão para acompanhar compras, parcelas e faturas.
        </Text>
      )}
      <Button
        label="+ Adicionar cartão"
        variant="secondary"
        onPress={() => navigation.navigate('CardForm')}
      />
    </Page>
  );
}
