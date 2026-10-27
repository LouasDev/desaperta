import React from 'react';
import { Text, View } from 'react-native';
import { Chips } from './ui';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export function CashAccountPicker({
  value,
  onChange,
  label = 'Conta',
}: {
  value?: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const { data } = useFinance();
  const { styles } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.body}>{label}</Text>
      <Chips
        value={value ?? data.cashAccounts[0].id}
        onChange={onChange}
        options={data.cashAccounts.map((a) => ({ value: a.id, label: a.name }))}
      />
    </View>
  );
}
