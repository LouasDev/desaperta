import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFinance } from './FinanceContext';
import { syncBillNotifications } from '../services/billNotifications';
const ReminderContext = createContext({ status: '', refresh: async () => {} });
export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { data } = useFinance();
  const [status, setStatus] = useState('');
  const queue = useRef(Promise.resolve());
  const latest = useRef(data);
  latest.current = data;
  const refresh = async () => {
    if (Platform.OS === 'web') return;
    queue.current = queue.current.then(async () => {
      try {
        const current = latest.current;
        const count = await syncBillNotifications(current);
        setStatus(
          current.settings.billReminders
            ? `${count} lembrete(s) agendado(s).`
            : 'Lembretes desativados.',
        );
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Não foi possível agendar os lembretes.');
      }
    });
    await queue.current;
  };
  const scheduleKey = JSON.stringify({
    cards: data.cards.map((c) => ({
      id: c.id,
      name: c.name,
      closingDay: c.closingDay,
      dueDay: c.dueDay,
      cycleConfigured: c.cycleConfigured,
    })),
    enabled: data.settings.billReminders,
  });
  useEffect(() => {
    void refresh();
  }, [scheduleKey]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (value) => {
      if (value === 'active') void refresh();
    });
    return () => sub.remove();
  }, []);
  return (
    <ReminderContext.Provider value={{ status, refresh }}>{children}</ReminderContext.Provider>
  );
}
export const useReminders = () => useContext(ReminderContext);
