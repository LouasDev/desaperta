import type { FinanceData } from './finance';
import { cycleDates, shiftMonth } from './billing';
export function reminderPlan(data: FinanceData, now = new Date()) {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const result: { key: string; cardId: string; title: string; body: string; at: Date }[] = [];
  for (const card of data.cards.filter((c) => c.cycleConfigured !== false))
    for (let i = -1; i < 12; i++) {
      const cycle = shiftMonth(month, i),
        dates = cycleDates(card, cycle);
      for (const kind of ['closing', 'due'] as const) {
        const iso = kind === 'closing' ? dates.closingDate : dates.dueDate;
        const [y, m, d] = iso.split('-').map(Number);
        const at = new Date(y, m - 1, d, 9, 0, 0);
        if (at <= now) continue;
        result.push({
          key: `bill:${card.id}:${cycle}:${kind}`,
          cardId: card.id,
          at,
          title: kind === 'closing' ? 'Sua fatura fecha hoje' : 'Lembrete de vencimento',
          body: `${card.name}: ${kind === 'closing' ? 'novas compras entram no próximo ciclo. Confira a fatura.' : 'confira no banco se a fatura foi paga.'}`,
        });
      }
    }
  return result.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 60);
}
