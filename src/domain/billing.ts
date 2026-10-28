import type { FinanceData, Transaction } from './finance';
import type { CreditCard } from './models';

export function shiftMonth(month: string, offset: number) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
export function monthDate(month: string, day: number) {
  const [year, m] = month.split('-').map(Number);
  return `${month}-${String(Math.min(day, new Date(year, m, 0).getDate())).padStart(2, '0')}`;
}
// The closing day is the first day of the next cycle; banks may process a purchase later.
export function cycleForDate(date: string, closingDay = 25) {
  return date >= monthDate(date.slice(0, 7), closingDay)
    ? shiftMonth(date.slice(0, 7), 1)
    : date.slice(0, 7);
}
export function cycleDates(card: CreditCard, month: string) {
  const closingDate = monthDate(month, card.closingDay ?? 25);
  const dueMonth = (card.dueDay ?? 5) > (card.closingDay ?? 25) ? month : shiftMonth(month, 1);
  return { closingDate, dueDate: monthDate(dueMonth, card.dueDay ?? 5) };
}
export const transactionMonth = (item: Transaction) => item.billMonth ?? item.date.slice(0, 7);
export const recognized = (item: Transaction, asOf: string) =>
  item.account !== 'credit' || transactionMonth(item) <= asOf.slice(0, 7);

export function cardBills(data: FinanceData, cardId: string, asOf: string) {
  const card = data.cards.find((c) => c.id === cardId);
  if (!card) throw new Error('Cartão não encontrado.');
  const months = new Set<string>([cycleForDate(asOf, card.closingDay)]);
  const openingMonth = card.openingBillMonth ?? cycleForDate(asOf, card.closingDay);
  if (card.openingUsed) months.add(openingMonth);
  for (const t of data.transactions) {
    if (t.cardId === cardId || t.cardPaymentFor === cardId) {
      if (t.billMonth) months.add(t.billMonth);
      else if (t.account === 'credit') months.add(cycleForDate(t.date, card.closingDay));
    }
  }
  let unallocated = data.transactions
    .filter((t) => t.cardPaymentFor === cardId && !t.billMonth)
    .reduce((sum, t) => sum + t.amount, 0);
  return [...months].sort().map((month) => {
    const items = data.transactions.filter(
      (t) =>
        t.cardId === cardId && (t.billMonth ?? cycleForDate(t.date, card.closingDay)) === month,
    );
    const opening = month === openingMonth ? card.openingUsed : 0;
    const charges = opening + items.reduce((sum, t) => sum + t.amount, 0);
    const targeted = data.transactions
      .filter((t) => t.cardPaymentFor === cardId && t.billMonth === month)
      .reduce((sum, t) => sum + t.amount, 0);
    const allocated = Math.min(Math.max(0, charges - targeted), unallocated);
    unallocated -= allocated;
    const paid = targeted + allocated;
    const balance = charges - paid;
    const dates = cycleDates(card, month);
    const status =
      balance === 0 && charges > 0
        ? 'Paga'
        : asOf > dates.dueDate && balance > 0
          ? 'Vencida'
          : asOf >= dates.closingDate
            ? 'Fechada'
            : month > cycleForDate(asOf, card.closingDay)
              ? 'Futura'
              : 'Aberta';
    return { month, opening, charges, paid, balance, ...dates, status, items };
  });
}
