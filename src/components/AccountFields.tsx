import React from 'react';
import { Text, View } from 'react-native';
import { Chips } from './ui';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
import { CashAccountPicker } from './CashAccountPicker';
export function AccountFields({
  account,
  cardId,
  cashAccountId,
  onChange,
}: {
  account: 'cash' | 'credit';
  cardId?: string;
  cashAccountId?: string;
  onChange: (account: 'cash' | 'credit', cardId?: string, cashAccountId?: string) => void;
}) {
  const { data } = useFinance();
  const { styles } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.body}>Forma de pagamento</Text>
      <Chips
        value={account}
        onChange={(value) =>
          onChange(
            value,
            value === 'credit' ? (cardId ?? data.cards[0]?.id) : undefined,
            value === 'cash' ? (cashAccountId ?? data.cashAccounts[0].id) : undefined,
          )
        }
        options={[
          { value: 'cash', label: 'Saldo em conta' },
          { value: 'credit', label: 'Cartão de crédito' },
        ]}
      />
      {account === 'cash' && (
        <CashAccountPicker
          value={cashAccountId}
          onChange={(id) => onChange('cash', undefined, id)}
        />
      )}
      {account === 'credit' &&
        (data.cards.length ? (
          <Chips
            value={cardId ?? ''}
            onChange={(value) => onChange('credit', value)}
            options={data.cards.map((c) => ({ value: c.id, label: c.name }))}
          />
        ) : (
          <Text style={styles.error}>
            Cadastre um cartão em Ajustes → Cartões antes de registrar gastos no crédito.
          </Text>
        ))}
    </View>
  );
}
