import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Chips, Empty, Field, Page } from '../components/ui';
import { TransactionRow } from '../components/FinanceRows';
import { Flow, money, today } from '../domain/finance';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { styles } from '../styles/theme';
export default function TransactionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParams>>();
  const { data } = useFinance();
  const [filter, setFilter] = useState<'all' | Flow>('all');
  const [period, setPeriod] = useState<'all' | 'month'>('all');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(30);
  const items = data.transactions
    .filter(
      (t) =>
        (filter === 'all' || t.type === filter) &&
        (period === 'all' || t.date.startsWith(today().slice(0, 7))) &&
        `${t.title} ${data.categories.find((c) => c.id === t.categoryId)?.name}`
          .toLocaleLowerCase('pt-BR')
          .includes(search.toLocaleLowerCase('pt-BR')),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const resultTotal = items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  return (
    <Page title="Extrato">
      <Button label="+ Novo lançamento" onPress={() => navigation.navigate('TransactionForm')} />
      <Field
        label="Buscar movimentação"
        placeholder="Descrição ou categoria"
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setLimit(30);
        }}
      />
      <Chips
        value={filter}
        onChange={(v) => {
          setFilter(v);
          setLimit(30);
        }}
        options={[
          { value: 'all', label: 'Todas' },
          { value: 'income', label: 'Entradas' },
          { value: 'expense', label: 'Saídas' },
        ]}
      />
      <Chips
        value={period}
        onChange={(v) => {
          setPeriod(v);
          setLimit(30);
        }}
        options={[
          { value: 'all', label: 'Todo o período' },
          { value: 'month', label: 'Este mês' },
        ]}
      />
      <View style={styles.between}>
        <Text style={styles.small}>{items.length} registro(s) encontrado(s)</Text>
        <Text style={styles.small}>Resultado: {money(resultTotal)}</Text>
      </View>
      {items.length ? (
        <Card style={{ gap: 0, paddingVertical: 4 }}>
          {items.slice(0, limit).map((item, index) => (
            <View key={item.id}>
              {index > 0 && <View style={styles.divider} />}
              <TransactionRow
                item={item}
                category={data.categories.find((c) => c.id === item.categoryId)?.name ?? ''}
                onPress={() => {
                  const payment = data.payments.find((p) => p.id === item.paymentId);
                  if (payment) navigation.navigate('DebtDetail', { id: payment.debtId });
                  else navigation.navigate('TransactionForm', { id: item.id });
                }}
              />
            </View>
          ))}
        </Card>
      ) : (
        <Empty
          title={
            data.transactions.length ? 'Nada por aqui com esse filtro' : 'Nenhuma movimentação'
          }
          body={
            data.transactions.length
              ? 'Tente outro termo ou período.'
              : 'Adicione uma receita ou despesa para começar.'
          }
        />
      )}
      {items.length > limit && (
        <Button label="Mostrar mais" variant="secondary" onPress={() => setLimit((v) => v + 30)} />
      )}
    </Page>
  );
}
