import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Chips, Empty, Field, Page } from '../components/ui';
import { DebtCard } from '../components/FinanceRows';
import { Direction, money, remaining } from '../domain/finance';
import { RootParams, TabParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { styles } from '../styles/theme';
export default function DebtsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParams>>();
  const { data } = useFinance();
  const route = useRoute<RouteProp<TabParams, 'Debts'>>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParams, 'Debts'>>();
  const direction = route.params?.direction ?? 'payable';
  const setDirection = (value: Direction) => tabNavigation.setParams({ direction: value });
  const [status, setStatus] = useState<'open' | 'paid' | 'all'>('open');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(20);
  const items = data.debts
    .filter(
      (d) =>
        d.direction === direction &&
        (status === 'all' || (remaining(data, d) === 0 ? status === 'paid' : status === 'open')) &&
        `${d.title} ${data.people.find((p) => p.id === d.personId)?.name}`
          .toLocaleLowerCase('pt-BR')
          .includes(search.toLocaleLowerCase('pt-BR')),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <Page title="Pendências">
      <Chips
        value={direction}
        onChange={(v) => {
          setDirection(v);
          setLimit(20);
        }}
        options={[
          { value: 'payable', label: 'Eu devo' },
          { value: 'receivable', label: 'Me devem' },
        ]}
      />
      <Button
        label={
          direction === 'payable' ? '+ Adicionar valor a pagar' : '+ Adicionar valor a receber'
        }
        onPress={() => navigation.navigate('DebtForm', { direction })}
      />
      <Field
        label="Buscar pessoa ou descrição"
        placeholder="Ex.: Ana, livro…"
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setLimit(20);
        }}
      />
      <Chips
        value={status}
        onChange={(v) => {
          setStatus(v);
          setLimit(20);
        }}
        options={[
          { value: 'open', label: 'Pendentes' },
          { value: 'paid', label: 'Quitados' },
          { value: 'all', label: 'Todos' },
        ]}
      />
      <View style={styles.between}>
        <Text style={styles.small}>{items.length} registro(s)</Text>
        <Text style={styles.small}>
          Falta: {money(items.reduce((s, d) => s + remaining(data, d), 0))}
        </Text>
      </View>
      {items.length ? (
        items
          .slice(0, limit)
          .map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              data={data}
              onPress={() => navigation.navigate('DebtDetail', { id: debt.id })}
            />
          ))
      ) : (
        <Empty
          title="Nenhuma pendência encontrada"
          body="Adicione um valor a pagar ou a receber para acompanhar os pagamentos."
        />
      )}
      {items.length > limit && (
        <Button label="Mostrar mais" variant="secondary" onPress={() => setLimit((v) => v + 20)} />
      )}
      <Text style={styles.small}>
        Cadastrar uma pendência não altera seu saldo. Registre cada pagamento ou recebimento nos
        detalhes.
      </Text>
    </Page>
  );
}
