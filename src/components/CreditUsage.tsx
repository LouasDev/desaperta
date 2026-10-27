import React from 'react';
import { Text, View } from 'react-native';
import type { CreditCard } from '../domain/models';
import { money } from '../domain/finance';
import { useTheme } from '../state/ThemeContext';
export function CreditUsage({ card, used }: { card: CreditCard; used: number }) {
  const { colors, styles } = useTheme();
  const percent = (used / card.limit) * 100,
    progress = Math.min(100, Math.max(0, percent)),
    exceeded = Math.max(0, used - card.limit);
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.between}>
        <Text style={styles.subtitle}>{card.name}</Text>
        <Text style={[styles.small, { color: exceeded ? colors.red : colors.muted }]}>
          {percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% usado
        </Text>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Limite utilizado de ${card.name}`}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: progress,
          text: `${money(used)} usados de ${money(card.limit)}${exceeded ? `, limite excedido em ${money(exceeded)}` : ''}`,
        }}
        style={{ height: 8, borderRadius: 5, backgroundColor: colors.line, overflow: 'hidden' }}
      >
        <View
          style={{
            height: 8,
            width: `${progress}%`,
            backgroundColor: exceeded ? colors.red : colors.accent,
            borderRadius: 5,
          }}
        />
      </View>
      <View style={styles.between}>
        <View style={{ gap: 4, flex: 1 }}>
          <Text style={styles.small}>Utilizado</Text>
          <Text style={[styles.body, { color: colors.ink, fontVariant: ['tabular-nums'] }]}>
            {money(used)}
          </Text>
        </View>
        <View style={{ gap: 4, flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.small}>Limite total</Text>
          <Text style={[styles.body, { color: colors.ink, fontVariant: ['tabular-nums'] }]}>
            {money(card.limit)}
          </Text>
        </View>
      </View>
      <Text style={[styles.small, { color: exceeded ? colors.red : colors.green }]}>
        {exceeded
          ? `Limite excedido em ${money(exceeded)}`
          : `Disponível para compras: ${money(card.limit - used)}`}
      </Text>
    </View>
  );
}
