import {
  FinanceData,
  id,
  text,
  validateData,
  today,
  money,
  displayDate,
  remaining,
} from './finance';
import type { CreditCard, Goal, Recurrence } from './models';
function ensure(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function configure(
  data: FinanceData,
  openingBalance: number,
  card?: Omit<CreditCard, 'id'>,
): FinanceData {
  ensure(!data.settings.completed, 'A configuração inicial já foi concluída.');
  return validateData({
    ...data,
    settings: { completed: true, openingBalance },
    cards: card
      ? [...data.cards, { ...card, name: text(card.name, 'Nome do cartão'), id: id() }]
      : data.cards,
  });
}
export function saveCard(
  data: FinanceData,
  input: Omit<CreditCard, 'id'>,
  editId?: string,
): FinanceData {
  ensure(!editId || data.cards.some((c) => c.id === editId), 'Cartão não encontrado.');
  return validateData({
    ...data,
    cards: [
      ...data.cards.filter((c) => c.id !== editId),
      { ...input, id: editId ?? id(), name: text(input.name, 'Nome do cartão') },
    ],
  });
}
export function cardTotals(data: FinanceData, cardId: string) {
  const card = data.cards.find((c) => c.id === cardId);
  ensure(card, 'Cartão não encontrado.');
  const purchases = data.transactions
    .filter((t) => t.account === 'credit' && t.cardId === cardId)
    .reduce((s, t) => s + t.amount, 0);
  const paid = data.transactions
    .filter((t) => t.cardPaymentFor === cardId)
    .reduce((s, t) => s + t.amount, 0);
  const outstanding = card.openingUsed + purchases - paid;
  return { purchases, paid, outstanding, available: card.limit - outstanding };
}
export function payCard(
  data: FinanceData,
  cardId: string,
  amount: number,
  date: string,
): FinanceData {
  const card = data.cards.find((c) => c.id === cardId);
  ensure(
    card && amount > 0 && amount <= cardTotals(data, cardId).outstanding,
    'O pagamento deve ser positivo e não pode ultrapassar os gastos pendentes.',
  );
  return validateData({
    ...data,
    transactions: [
      ...data.transactions,
      {
        id: id(),
        title: `Fatura · ${card.name}`.slice(0, 100),
        type: 'expense',
        amount,
        date,
        account: 'cash',
        categoryId: 'expense-general',
        cardPaymentFor: cardId,
      },
    ],
  });
}
export function removeCard(data: FinanceData, cardId: string): FinanceData {
  ensure(
    !data.transactions.some((t) => t.cardId === cardId || t.cardPaymentFor === cardId) &&
      !data.recurrences.some((r) => r.cardId === cardId),
    'Este cartão tem histórico. Mantenha-o para preservar seus registros.',
  );
  ensure(
    cardTotals(data, cardId).outstanding === 0,
    'Quite ou corrija os gastos iniciais antes de excluir o cartão.',
  );
  return validateData({ ...data, cards: data.cards.filter((c) => c.id !== cardId) });
}
export function saveGoal(data: FinanceData, input: Omit<Goal, 'id'>, editId?: string) {
  ensure(!editId || data.goals.some((g) => g.id === editId), 'Meta não encontrada.');
  return validateData({
    ...data,
    goals: [...data.goals.filter((g) => g.id !== editId), { ...input, id: editId ?? id() }],
  });
}
export function goalProgress(data: FinanceData, goal: Goal) {
  const actual = data.transactions
    .filter(
      (t) =>
        !t.cardPaymentFor &&
        t.type === goal.type &&
        t.categoryId === goal.categoryId &&
        t.date.startsWith(goal.month),
    )
    .reduce((sum, t) => sum + t.amount, 0);
  return {
    actual,
    percentage: (actual / goal.amount) * 100,
    remaining: Math.max(0, goal.amount - actual),
    exceeded: Math.max(0, actual - goal.amount),
  };
}
export function saveRecurrence(data: FinanceData, input: Omit<Recurrence, 'id'>, editId?: string) {
  ensure(!editId || data.recurrences.some((r) => r.id === editId), 'Recorrência não encontrada.');
  return validateData({
    ...data,
    recurrences: [
      ...data.recurrences.filter((r) => r.id !== editId),
      { ...input, title: text(input.title, 'Descrição'), id: editId ?? id() },
    ],
  });
}
export function occurrenceDate(start: string, month: string): string {
  const [year, m] = month.split('-').map(Number);
  const day = Math.min(Number(start.slice(8)), new Date(year, m, 0).getDate());
  return `${month}-${String(day).padStart(2, '0')}`;
}
export function dueOccurrences(data: FinanceData, asOf = today()) {
  const result: { recurrence: Recurrence; date: string; key: string }[] = [];
  const recorded = new Set(data.recurrenceEvents.map((e) => e.id));
  for (const recurrence of data.recurrences.filter((r) => r.active)) {
    let month = recurrence.startDate.slice(0, 7);
    while (month <= asOf.slice(0, 7)) {
      const date = occurrenceDate(recurrence.startDate, month),
        key = `${recurrence.id}:${month}`;
      if (date >= recurrence.startDate && date <= asOf && !recorded.has(key))
        result.push({ recurrence, date, key });
      const [y, m] = month.split('-').map(Number);
      month = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}
export function resolveOccurrence(
  data: FinanceData,
  recurrenceId: string,
  date: string,
  skip = false,
): FinanceData {
  const recurrence = data.recurrences.find((r) => r.id === recurrenceId);
  ensure(
    recurrence &&
      dueOccurrences(data).some((o) => o.recurrence.id === recurrenceId && o.date === date),
    'Esta ocorrência já foi resolvida ou ainda não está disponível.',
  );
  const eventId = `${recurrenceId}:${date.slice(0, 7)}`,
    transactionId = id();
  return validateData({
    ...data,
    recurrenceEvents: [
      ...data.recurrenceEvents,
      {
        id: eventId,
        recurrenceId,
        date,
        status: skip ? 'skipped' : 'posted',
        ...(skip ? {} : { transactionId }),
      },
    ],
    transactions: skip
      ? data.transactions
      : [
          ...data.transactions,
          {
            id: transactionId,
            title: recurrence.title,
            amount: recurrence.amount,
            type: recurrence.type,
            date,
            categoryId: recurrence.categoryId,
            account: recurrence.account,
            ...(recurrence.cardId ? { cardId: recurrence.cardId } : {}),
            recurrenceId,
            occurrence: date,
          },
        ],
  });
}
export function personSummary(data: FinanceData, personId: string): string {
  const person = data.people.find((p) => p.id === personId);
  ensure(person, 'Pessoa não encontrada.');
  const debts = data.debts
    .filter((d) => d.personId === personId && remaining(data, d) > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const sections: string[] = [
    `Desaperta — Resumo de pendências`,
    `Olá, ${person.name}! Segue o resumo dos valores em aberto:`,
  ];
  let receivable = 0,
    payable = 0;
  for (const direction of ['receivable', 'payable'] as const) {
    const group = debts.filter((d) => d.direction === direction);
    if (!group.length) continue;
    sections.push(direction === 'receivable' ? 'Você me deve:' : 'Eu te devo:');
    sections.push(
      group
        .map(
          (d) =>
            `${d.title} · venc. ${displayDate(d.dueDate)} — ${money(remaining(data, d))}${remaining(data, d) !== d.amount ? ` (restante de ${money(d.amount)})` : ''}`,
        )
        .join('\n'),
    );
    const subtotal = group.reduce((sum, d) => sum + remaining(data, d), 0);
    sections.push(`Subtotal: ${money(subtotal)}`);
    if (direction === 'receivable') receivable = subtotal;
    else payable = subtotal;
  }
  const net = receivable - payable;
  sections.push(
    '----------------------------',
    net > 0
      ? `Saldo final: você me deve ${money(net)}.`
      : net < 0
        ? `Saldo final: eu te devo ${money(-net)}.`
        : 'Saldo final: estamos em dia.',
    '----------------------------',
  );
  return sections.join('\n\n');
}
export function whatsappURL(phone: string, message: string): string {
  ensure(
    /^\d{10,15}$/.test(phone) && !phone.startsWith('0'),
    'Cadastre um telefone com DDD e código do país.',
  );
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
