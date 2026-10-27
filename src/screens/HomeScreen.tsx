import type { Palette, AppTheme } from '../styles/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Page } from '../components/ui';
import { Icon } from '../components/Icon';
import { DebtCard, TransactionRow } from '../components/FinanceRows';
import { money, remaining, today, totals, Direction } from '../domain/finance';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
import { cardTotals, dueOccurrences, goalProgress } from '../domain/planning';

export default function HomeScreen() {
  const { colors, styles, clay } = useTheme();
  const home = makeHomeStyles(colors, clay);
  const navigation = useNavigation<NativeStackNavigationProp<RootParams>>();
  const { data } = useFinance();
  const summary = totals(data);
  const dueCount = dueOccurrences(data).length;
  const currentGoals = data.goals.filter((g) => g.month === today().slice(0, 7));
  const cardUsed = data.cards.reduce((sum, c) => sum + cardTotals(data, c.id).outstanding, 0);
  const creditAvailable = data.cards.reduce((sum, c) => sum + cardTotals(data, c.id).available, 0);
  const recent = [...data.transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 4);
  const upcoming = data.debts
    .filter((d) => remaining(data, d) > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 2);
  const expenses = data.transactions.filter(
    (t) => t.type === 'expense' && !t.cardPaymentFor && t.date.startsWith(today().slice(0, 7)),
  );
  const monthTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const categories = data.categories
    .filter((c) => c.type === 'expense')
    .map((c) => ({
      ...c,
      total: expenses.filter((t) => t.categoryId === c.id).reduce((sum, t) => sum + t.amount, 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
  const openDebtList = (direction: Direction) =>
    navigation.navigate('Main', { screen: 'Debts', params: { direction } });
  const openTransaction = (transaction: (typeof data.transactions)[number]) => {
    const payment = data.payments.find((p) => p.id === transaction.paymentId);
    if (payment) navigation.navigate('DebtDetail', { id: payment.debtId });
    else navigation.navigate('TransactionForm', { id: transaction.id });
  };
  return (
    <Page
      title="Desaperta"
      action={
        <Text style={styles.small}>
          {new Date()
            .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            .replace('.', '')}
        </Text>
      }
    >
      <View style={home.balance}>
        <View style={styles.between}>
          <Text style={styles.body}>Saldo registrado</Text>
          <Text style={styles.small}>Todo o período</Text>
        </View>
        <Text style={home.amount} numberOfLines={1} adjustsFontSizeToFit>
          {money(summary.balance)}
        </Text>
        <View style={home.totals}>
          <View style={home.total}>
            <Text style={styles.small}>Entradas</Text>
            <Text style={[home.totalValue, { color: colors.green }]}>
              + {money(summary.income)}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.line }} />
          <View style={home.total}>
            <Text style={styles.small}>Gastos registrados</Text>
            <Text style={home.totalValue}>− {money(summary.expense)}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.row, { gap: 10 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar entrada"
          onPress={() => navigation.navigate('TransactionForm', { type: 'income' })}
          style={({ pressed }) => [home.quickAction, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Icon name="in" size={18} color={colors.green} />
          <Text style={home.actionText}>Entrada</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar saída"
          onPress={() => navigation.navigate('TransactionForm', { type: 'expense' })}
          style={({ pressed }) => [home.quickAction, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Icon name="out" size={18} />
          <Text style={home.actionText}>Saída</Text>
        </Pressable>
      </View>
      <View style={{ gap: 10 }}>
        <View style={styles.wrap}>
          <Button
            label="Cartões"
            compact
            variant="secondary"
            onPress={() => navigation.navigate('Cards')}
          />
          <Button
            label="Metas"
            compact
            variant="secondary"
            onPress={() => navigation.navigate('Goals')}
          />
          <Button
            label={dueCount ? `Recorrências (${dueCount})` : 'Recorrências'}
            compact
            variant="secondary"
            onPress={() => navigation.navigate('Recurrences')}
          />
        </View>
        {!!data.cards.length && (
          <Card>
            <View style={styles.between}>
              <View style={{ gap: 5 }}>
                <Text style={styles.small}>Crédito disponível</Text>
                <Text style={styles.subtitle}>{money(creditAvailable)}</Text>
              </View>
              <View style={{ gap: 5 }}>
                <Text style={styles.small}>Cartão a pagar</Text>
                <Text style={styles.subtitle}>{money(cardUsed)}</Text>
              </View>
            </View>
            <Text style={styles.small}>Crédito não faz parte do saldo em conta.</Text>
          </Card>
        )}
      </View>
      {!!currentGoals.length && (
        <View style={{ gap: 12 }}>
          <Text style={styles.subtitle}>Metas deste mês</Text>
          {currentGoals.slice(0, 3).map((goal) => {
            const progress = goalProgress(data, goal);
            return (
              <Pressable
                key={goal.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('Goals')}
                style={[styles.card, { gap: 9 }]}
              >
                <View style={styles.between}>
                  <Text style={styles.body}>
                    {data.categories.find((c) => c.id === goal.categoryId)?.name} ·{' '}
                    {goal.type === 'expense' ? 'Gastos' : 'Entradas'}
                  </Text>
                  <Text style={styles.small}>{Math.round(progress.percentage)}%</Text>
                </View>
                <Text style={styles.subtitle}>
                  {money(progress.actual)} / {money(goal.amount)}
                </Text>
                <View style={{ height: 4, backgroundColor: colors.line }}>
                  <View
                    style={{
                      height: 4,
                      width: `${Math.min(100, progress.percentage)}%`,
                      backgroundColor:
                        goal.type === 'expense' && progress.exceeded ? colors.red : colors.accent,
                    }}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={{ gap: 14 }}>
        <Text style={styles.subtitle}>Pendências</Text>
        <Card style={{ gap: 0, paddingVertical: 0 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver valores a pagar"
            onPress={() => openDebtList('payable')}
            style={home.debtRow}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={home.rowTitle}>Eu devo</Text>
              <Text style={styles.small}>A pagar</Text>
            </View>
            <Text style={home.debtValue}>{money(summary.payable)}</Text>
            <Icon name="chevron" size={17} color={colors.muted} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver valores a receber"
            onPress={() => openDebtList('receivable')}
            style={home.debtRow}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={home.rowTitle}>Me devem</Text>
              <Text style={styles.small}>A receber</Text>
            </View>
            <Text style={home.debtValue}>{money(summary.receivable)}</Text>
            <Icon name="chevron" size={17} color={colors.muted} />
          </Pressable>
        </Card>
      </View>
      <View style={{ gap: 12 }}>
        <View style={styles.between}>
          <Text style={styles.subtitle}>Últimas movimentações</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Main', { screen: 'Transactions' })}
            style={{ paddingVertical: 8 }}
          >
            <Text style={home.link}>Ver extrato</Text>
          </Pressable>
        </View>
        {recent.length ? (
          <View>
            {recent.map((item) => (
              <View key={item.id}>
                <View style={styles.divider} />
                <TransactionRow
                  item={item}
                  category={data.categories.find((c) => c.id === item.categoryId)?.name ?? ''}
                  onPress={() => openTransaction(item)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={home.empty}>
            <Text style={home.rowTitle}>Nenhuma movimentação</Text>
            <Text style={styles.body}>Suas entradas e saídas vão aparecer aqui.</Text>
          </View>
        )}
      </View>
      {!!upcoming.length && (
        <View style={{ gap: 12 }}>
          <Text style={styles.subtitle}>Próximos vencimentos</Text>
          {upcoming.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              data={data}
              onPress={() => navigation.navigate('DebtDetail', { id: debt.id })}
            />
          ))}
        </View>
      )}
      {!!categories.length && (
        <View style={{ gap: 16 }}>
          <View style={styles.between}>
            <Text style={styles.subtitle}>Despesas por categoria</Text>
            <Text style={styles.small}>Este mês</Text>
          </View>
          {categories.map((c) => (
            <View key={c.id} style={{ gap: 9 }}>
              <View style={styles.between}>
                <Text style={styles.body}>{c.name}</Text>
                <Text style={home.rowTitle}>{money(c.total)}</Text>
              </View>
              <View style={{ height: 4, backgroundColor: colors.line }}>
                <View
                  style={{
                    width: `${(c.total / monthTotal) * 100}%`,
                    height: 4,
                    backgroundColor: colors.accent,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}
const makeHomeStyles = (colors: Palette, clay: AppTheme['clay']) =>
  StyleSheet.create({
    balance: { gap: 14, paddingTop: 10 },
    amount: {
      fontSize: 48,
      fontWeight: '500',
      color: colors.ink,
      letterSpacing: -2,
      fontVariant: ['tabular-nums'],
    },
    totals: { flexDirection: 'row', gap: 22, marginTop: 8 },
    total: { flex: 1, gap: 7 },
    totalValue: {
      color: colors.ink,
      fontWeight: '500',
      fontSize: 16,
      fontVariant: ['tabular-nums'],
    },
    quickAction: {
      flex: 1,
      minHeight: 48,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      ...clay,
    },
    actionText: { color: colors.ink, fontWeight: '500', fontSize: 14 },
    debtRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 17 },
    rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '500' },
    debtValue: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: '500',
      fontVariant: ['tabular-nums'],
      flexShrink: 1,
    },
    link: { color: colors.accent, fontSize: 12, fontWeight: '500' },
    empty: {
      gap: 8,
      paddingTop: 20,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
  });
