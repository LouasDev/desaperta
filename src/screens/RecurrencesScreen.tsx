import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  Chips,
  Empty,
  ErrorText,
  messageOf,
  Page,
  useFeedback,
} from '../components/ui';
import { displayDate, Flow, money } from '../domain/finance';
import { dueOccurrences, resolveOccurrence, saveRecurrence } from '../domain/planning';
import { RootParams } from '../navigation/types';
import { useFinance } from '../state/FinanceContext';
import { useTheme } from '../state/ThemeContext';
export default function RecurrencesScreen({
  navigation,
}: NativeStackScreenProps<RootParams, 'Recurrences'>) {
  const { data, commit, saving } = useFinance();
  const { styles } = useTheme();
  const { confirm, notify } = useFeedback();
  const [error, setError] = useState('');
  const [type, setType] = useState<'all' | Flow>('all');
  const [limit, setLimit] = useState(10);
  const due = dueOccurrences(data).filter((o) => type === 'all' || o.recurrence.type === type);
  const items = data.recurrences.filter((r) => type === 'all' || r.type === type);
  const resolve = async (recurrenceId: string, date: string, skip: boolean) => {
    setError('');
    try {
      const r = data.recurrences.find((r) => r.id === recurrenceId)!;
      if (
        !(await confirm({
          title: skip
            ? 'Pular esta ocorrência?'
            : r.type === 'income'
              ? 'Confirmar entrada recebida?'
              : 'Confirmar gasto realizado?',
          message: skip
            ? `A ocorrência de ${displayDate(date)} não será lançada. O histórico das outras será mantido.`
            : `${r.title}: ${money(r.amount)} em ${displayDate(date)}. ${r.account === 'credit' ? 'Este gasto consumirá o limite do cartão.' : 'O saldo em conta será atualizado.'}`,
          accept: skip ? 'Pular ocorrência' : 'Confirmar lançamento',
        }))
      )
        return;
      await commit((current) => resolveOccurrence(current, recurrenceId, date, skip));
      notify(skip ? 'Ocorrência pulada.' : 'Ocorrência registrada.');
    } catch (e) {
      setError(messageOf(e));
    }
  };
  return (
    <Page
      title="Recorrências"
      subtitle="Entradas e gastos que se repetem todo mês."
      back={() => navigation.goBack()}
    >
      <Button label="+ Nova recorrência" onPress={() => navigation.navigate('RecurrenceForm')} />
      <Chips
        value={type}
        onChange={setType}
        options={[
          { value: 'all', label: 'Todas' },
          { value: 'expense', label: 'Gastos' },
          { value: 'income', label: 'Entradas' },
        ]}
      />
      <ErrorText message={error} />
      <Text style={styles.subtitle}>A confirmar ({due.length})</Text>
      <Text style={styles.body}>
        Previsões não entram no saldo nem nas metas. Confirme cada ocorrência quando o dinheiro
        realmente entrar ou o gasto acontecer.
      </Text>
      {due.slice(0, limit).map((o) => (
        <Card key={o.key}>
          <View style={styles.between}>
            <Text style={[styles.subtitle, { flex: 1 }]}>{o.recurrence.title}</Text>
            <Text style={styles.subtitle}>{money(o.recurrence.amount)}</Text>
          </View>
          <Text style={styles.small}>
            {o.recurrence.type === 'income' ? 'Entrada' : 'Saída'} · {displayDate(o.date)}
            {o.recurrence.account === 'credit' ? ' · Crédito' : ''}
          </Text>
          <Button
            label={o.recurrence.type === 'income' ? 'Confirmar recebimento' : 'Confirmar gasto'}
            disabled={saving}
            onPress={() => resolve(o.recurrence.id, o.date, false)}
          />
          <Button
            label="Pular este mês"
            variant="secondary"
            disabled={saving}
            onPress={() => resolve(o.recurrence.id, o.date, true)}
          />
        </Card>
      ))}
      {due.length > limit && (
        <Button
          label="Mostrar mais previsões"
          variant="secondary"
          onPress={() => setLimit((v) => v + 10)}
        />
      )}
      <Text style={styles.subtitle}>Cadastros mensais</Text>
      {items.length ? (
        items.map((r) => (
          <Card key={r.id}>
            <View style={styles.between}>
              <Text style={[styles.subtitle, { flex: 1 }]}>{r.title}</Text>
              <Text style={styles.small}>{r.active ? 'Ativa' : 'Pausada'}</Text>
            </View>
            <Text style={styles.body}>
              {money(r.amount)} · {r.type === 'income' ? 'Entrada' : 'Saída'} · Dia{' '}
              {Number(r.startDate.slice(8))}
            </Text>
            <Text style={styles.small}>
              Início: {displayDate(r.startDate)}. Em meses curtos, usa o último dia disponível.
            </Text>
            <Button
              label="Editar recorrência"
              variant="secondary"
              onPress={() => navigation.navigate('RecurrenceForm', { id: r.id })}
            />
            <Button
              label={r.active ? 'Pausar recorrência' : 'Retomar recorrência'}
              variant="secondary"
              disabled={saving}
              onPress={async () => {
                try {
                  await commit((current) =>
                    saveRecurrence(current, { ...r, active: !r.active }, r.id),
                  );
                  notify(
                    r.active
                      ? 'Recorrência pausada.'
                      : 'Recorrência retomada. Meses ainda não resolvidos voltam a aparecer.',
                  );
                } catch (e) {
                  setError(messageOf(e));
                }
              }}
            />
          </Card>
        ))
      ) : (
        <Empty
          title="Nenhuma recorrência"
          body="Cadastre assinaturas, mesada, salário ou outros valores mensais."
        />
      )}
    </Page>
  );
}
