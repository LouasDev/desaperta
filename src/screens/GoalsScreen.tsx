import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Chips, Empty, Page } from '../components/ui';
import { Flow, money, today } from '../domain/finance';
import { displayMonth } from '../domain/formValues';
import { goalProgress } from '../domain/planning';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function GoalsScreen({ navigation }: NativeStackScreenProps<RootParams, 'Goals'>) {
  const { data } = useFinance();
  const { styles, colors } = useTheme();
  const [filter, setFilter] = useState<'all' | Flow>('all');
  const [limit, setLimit] = useState(20);
  const items = data.goals
    .filter((g) => filter === 'all' || g.type === filter)
    .sort((a, b) => b.month.localeCompare(a.month));
  return (
    <Page
      title="Metas por categoria"
      subtitle="Limites de gastos e objetivos de entrada, por mês."
      back={() => navigation.goBack()}
    >
      <Button label="+ Nova meta" onPress={() => navigation.navigate('GoalForm')} />
      <Chips
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setLimit(20);
        }}
        options={[
          { value: 'all', label: 'Todas' },
          { value: 'expense', label: 'Gastos' },
          { value: 'income', label: 'Entradas' },
        ]}
      />
      {items.length ? (
        items.slice(0, limit).map((goal) => {
          const p = goalProgress(data, goal);
          const outgoing = goal.type === 'expense';
          const color = outgoing && p.exceeded ? colors.red : colors.accent;
          return (
            <Card key={goal.id}>
              <View style={styles.between}>
                <Text style={styles.subtitle}>
                  {data.categories.find((c) => c.id === goal.categoryId)?.name}
                </Text>
                <Text style={styles.small}>{displayMonth(goal.month)}</Text>
              </View>
              <Text style={styles.small}>
                {outgoing ? 'Limite de gastos' : 'Objetivo de entrada'}
                {goal.month === today().slice(0, 7) ? ' · Este mês' : ''}
              </Text>
              <Text style={styles.subtitle}>
                {money(p.actual)} de {money(goal.amount)}
              </Text>
              <View
                style={{
                  height: 5,
                  backgroundColor: colors.line,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: 5,
                    width: `${Math.min(100, p.percentage)}%`,
                    backgroundColor: color,
                  }}
                />
              </View>
              <Text style={[styles.body, { color }]}>
                {outgoing
                  ? p.exceeded
                    ? `Limite ultrapassado em ${money(p.exceeded)}`
                    : `Ainda pode gastar ${money(p.remaining)}`
                  : p.remaining
                    ? `Faltam ${money(p.remaining)} para o objetivo`
                    : 'Objetivo alcançado'}
              </Text>
              <Button
                label="Editar meta"
                variant="secondary"
                compact
                onPress={() => navigation.navigate('GoalForm', { id: goal.id })}
              />
            </Card>
          );
        })
      ) : (
        <Empty
          title="Nenhuma meta cadastrada"
          body="Defina, por exemplo, gastar até R$ 30 em lazer ou receber R$ 200 de trabalho neste mês."
        />
      )}
      {items.length > limit && (
        <Button
          label="Mostrar mais"
          variant="secondary"
          onPress={() => setLimit((value) => value + 20)}
        />
      )}
      <Text style={styles.small}>
        As metas incluem compras no crédito. O pagamento da fatura não conta novamente. O saldo
        inicial não conta como receita.
      </Text>
    </Page>
  );
}
