import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, ScrollView, Text, View } from 'react-native';
import { FinanceData } from '../domain/finance';
import { repository } from '../storage/repository';
import { Button } from '../components/ui';
import { colors, styles } from '../styles/theme';

interface FinanceContextValue {
  data: FinanceData;
  saving: boolean;
  commit: (
    change: (current: FinanceData) => FinanceData,
    preservePrevious?: boolean,
  ) => Promise<void>;
}
const FinanceContext = createContext<FinanceContextValue | null>(null);
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData | null>(null);
  const [error, setError] = useState('');
  const [raw, setRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [, refresh] = useState(0);
  const current = useRef<FinanceData | null>(null);
  const locked = useRef(false);
  const load = async () => {
    setError('');
    try {
      const loaded = await repository.load();
      current.current = loaded;
      setData(loaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler os dados.');
      try {
        setRaw((await repository.readRaw()) ?? '');
      } catch {
        /* Keep the original read error. */
      }
    }
  };
  useEffect(() => {
    void load();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh((v) => v + 1);
    });
    return () => sub.remove();
  }, []);
  const commit = async (change: (value: FinanceData) => FinanceData, preservePrevious = false) => {
    if (locked.current || !current.current) throw new Error('Aguarde a operação atual terminar.');
    locked.current = true;
    setSaving(true);
    try {
      const next = change(current.current);
      if (preservePrevious) await repository.savePrevious(current.current);
      await repository.save(next);
      current.current = next;
      setData(next);
    } catch (e) {
      if (e instanceof Error && !/quota|storage|disk/i.test(e.message)) throw e;
      throw new Error(
        'Não foi possível salvar no aparelho. Confira o espaço disponível e tente novamente.',
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };
  if (error)
    return (
      <ScrollView contentContainerStyle={[styles.page, { paddingTop: 72 }]}>
        <Text style={styles.title}>Seus dados precisam de atenção</Text>
        <Text style={styles.body}>{error}</Text>
        <Text style={styles.body}>
          Nenhum registro foi substituído. Tente ler novamente. Se houver dados abaixo, copie e
          guarde antes de fazer qualquer alteração.
        </Text>
        <Button label="Tentar novamente" onPress={load} />
        {!!raw && (
          <Text selectable style={styles.small}>
            {raw}
          </Text>
        )}
      </ScrollView>
    );
  if (!data)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.body}>Abrindo seu Desaperta…</Text>
      </View>
    );
  return (
    <FinanceContext.Provider value={{ data, saving, commit }}>{children}</FinanceContext.Provider>
  );
}
export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('FinanceProvider ausente.');
  return value;
}
