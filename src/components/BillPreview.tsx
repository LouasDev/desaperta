import React from 'react';
import { Text, View } from 'react-native';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
import { cardBills, cycleForDate } from '../domain/billing';
import { money, today } from '../domain/finance';
import type { CreditCard } from '../domain/models';
export function BillPreview({ card }: { card: CreditCard }) {
  const { data } = useFinance();
  const { styles, colors } = useTheme();
  if (!card.cycleConfigured)
    return (
      <Text style={styles.small}>Confirme fechamento e vencimento nos detalhes do cartão.</Text>
    );
  const cycle = cycleForDate(today(), card.closingDay);
  const bills = cardBills(data, card.id, today());
  const current =
    bills.find((b) => b.balance > 0 && b.month <= cycle) ?? bills.find((b) => b.month === cycle)!;
  const future = bills
    .filter((b) => b.month > current.month)
    .reduce((sum, b) => sum + b.balance, 0);
  return (
    <View style={{ gap: 5, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }}>
      <View style={styles.between}>
        <Text style={styles.body}>Fatura {current.month.split('-').reverse().join('/')}</Text>
        <Text style={styles.subtitle}>{money(current.balance)}</Text>
      </View>
      <Text style={styles.small}>
        {current.status} · próximas faturas {money(future)}
      </Text>
    </View>
  );
}
