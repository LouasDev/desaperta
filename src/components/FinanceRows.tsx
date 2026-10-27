import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Debt,
  debtStatus,
  displayDate,
  FinanceData,
  money,
  remaining,
  Transaction,
} from '../domain/finance';
import { colors, styles } from '../styles/theme';
import { Icon } from './Icon';
export function TransactionRow({
  item,
  category,
  onPress,
}: {
  item: Transaction;
  category: string;
  onPress: () => void;
}) {
  const incoming = item.type === 'income';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${incoming ? 'entrada' : 'saída'} de ${money(item.amount)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.between, { paddingVertical: 16, opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={[styles.row, { flex: 1 }]}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#EBEDE7',
          }}
        >
          <Icon
            name={incoming ? 'in' : 'out'}
            size={17}
            color={incoming ? colors.green : colors.ink}
          />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 14, color: colors.ink, fontWeight: '500' }}>{item.title}</Text>
          <Text style={styles.small}>
            {category} · {displayDate(item.date)}
            {item.paymentId ? ' · Vinculado' : ''}
          </Text>
        </View>
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          fontVariant: ['tabular-nums'],
          color: incoming ? colors.green : colors.ink,
          flexShrink: 1,
          textAlign: 'right',
        }}
      >
        {incoming ? '+' : '−'} {money(item.amount)}
      </Text>
    </Pressable>
  );
}
export function DebtCard({
  debt,
  data,
  onPress,
}: {
  debt: Debt;
  data: FinanceData;
  onPress: () => void;
}) {
  const rest = remaining(data, debt),
    status = debtStatus(data, debt),
    name = data.people.find((p) => p.id === debt.personId)?.name;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${debt.title}, ${status}, falta ${money(rest)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.between}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.subtitle}>{name}</Text>
          <Text style={styles.body}>{debt.title}</Text>
        </View>
        <Text
          style={{
            color: status === 'Atrasado' ? colors.red : colors.muted,
            fontWeight: '500',
            fontSize: 12,
          }}
        >
          {status}
        </Text>
      </View>
      <View style={styles.between}>
        <View style={{ gap: 3 }}>
          <Text style={styles.small}>
            {rest === 0
              ? 'Quitado'
              : debt.direction === 'payable'
                ? 'Falta pagar'
                : 'Falta receber'}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '500',
              color: colors.ink,
              fontVariant: ['tabular-nums'],
            }}
          >
            {money(rest)}
          </Text>
        </View>
        <Text style={styles.small}>
          Vence em{'\n'}
          {displayDate(debt.dueDate)}
        </Text>
      </View>
      <View
        style={{ height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.line }}
      >
        <View
          style={{
            height: '100%',
            width: `${Math.round(((debt.amount - rest) / debt.amount) * 100)}%`,
            borderRadius: 8,
            backgroundColor: colors.mintDark,
          }}
        />
      </View>
    </Pressable>
  );
}
