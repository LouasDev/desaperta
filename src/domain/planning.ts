import { cardBills, recognized, transactionMonth } from './billing';
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
  accountName = 'Conta principal',
): FinanceData {
  ensure(!data.settings.completed, 'A configuração inicial já foi concluída.');
  return validateData({
    ...data,
    settings: { completed: true },
    cashAccounts: data.cashAccounts.map((a, index) =>
      index === 0 ? { ...a, openingBalance, name: text(accountName, 'Nome da conta') } : a,
    ),
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
    cards: editId
      ? data.cards.map((c) =>
          c.id === editId
            ? { ...c, ...input, id: editId, name: text(input.name, 'Nome do cartão') }
            : c,
        )
      : [...data.cards, { ...input, id: id(), name: text(input.name, 'Nome do cartão') }],
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
  const percentage = (outstanding / card.limit) * 100;
  return {
    purchases,
    paid,
    outstanding,
    available: card.limit - outstanding,
    percentage,
    progress: Math.min(100, Math.max(0, percentage)),
    exceeded: Math.max(0, outstanding - card.limit),
  };
}
export function payCard(
  data: FinanceData,
  cardId: string,
  amount: number,
  date: string,
  cashAccountId = data.cashAccounts[0].id,
  billMonth?: string,
): FinanceData {
  const card = data.cards.find((c) => c.id === cardId);
  ensure(
    card && amount > 0 && amount <= cardTotals(data, cardId).outstanding,
    'O pagamento deve ser positivo e não pode ultrapassar os gastos pendentes.',
  );
  if (billMonth) {
    const bill = cardBills(data, cardId, today()).find((b) => b.month === billMonth);
    ensure(bill && amount <= bill.balance, 'O pagamento ultrapassa o saldo desta fatura.');
  }
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
        cashAccountId,
        categoryId: 'expense-general',
        cardPaymentFor: cardId,
        billMonth,
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
        !t.transferId &&
        t.type === goal.type &&
        t.categoryId === goal.categoryId &&
        transactionMonth(t) === goal.month &&
        recognized(t, today()),
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
      {
        ...input,
        cashAccountId:
          input.account === 'cash' ? (input.cashAccountId ?? data.cashAccounts[0].id) : undefined,
        title: text(input.title, 'Descrição'),
        id: editId ?? id(),
      },
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
            ...(recurrence.cashAccountId ? { cashAccountId: recurrence.cashAccountId } : {}),
            recurrenceId,
            occurrence: date,
          },
        ],
  });
}
export function personSummary(data: FinanceData, personId: string): string {
  const person = data.people.find((p) => p.id === personId);
  ensure(person, 'Pessoa não encontrada.');
  const clean = (value: string) =>
    value
      .replace(/[*_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const debts = data.debts
    .filter((d) => d.personId === personId && remaining(data, d) > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title, 'pt-BR'));
  const lines = [
    '*Desaperta · Resumo de pendências*',
    '',
    `Oi, ${clean(person.name)}! Segue nosso resumo para conferir.`,
    `Atualizado em ${displayDate(today())}`,
    '',
  ];
  let receivable = 0,
    payable = 0;
  for (const direction of ['receivable', 'payable'] as const) {
    const group = debts.filter((d) => d.direction === direction);
    if (!group.length) continue;
    lines.push(direction === 'receivable' ? '*VOCÊ ME DEVE*' : '*EU TE DEVO*');
    for (const debt of group) {
      const rest = remaining(data, debt),
        paid = debt.amount - rest;
      lines.push(
        `• ${clean(debt.title)} — *${money(rest)}*`,
        `  Vencimento: ${displayDate(debt.dueDate)}`,
      );
      if (paid > 0)
        lines.push(
          `  Original: ${money(debt.amount)} · ${direction === 'receivable' ? 'já recebido' : 'já pago'}: ${money(paid)}`,
        );
    }
    const subtotal = group.reduce((sum, d) => sum + remaining(data, d), 0);
    lines.push(`*Subtotal: ${money(subtotal)}*`, '');
    if (direction === 'receivable') receivable = subtotal;
    else payable = subtotal;
  }
  if (!debts.length) lines.push('Não temos valores em aberto.', '');
  const net = receivable - payable;
  lines.push('────────────────────');
  if (receivable && payable)
    lines.push(
      `A receber: ${money(receivable)}`,
      `A pagar: ${money(payable)}`,
      'Compensando os valores acima:',
    );
  lines.push(
    net > 0
      ? `*Saldo final: você me deve ${money(net)}.*`
      : net < 0
        ? `*Saldo final: eu te devo ${money(-net)}.*`
        : debts.length
          ? '*Saldo final: os valores se compensam.*'
          : '*Saldo final: estamos em dia.*',
    '────────────────────',
  );
  if (debts.length)
    lines.push(
      '',
      'Os pagamentos já registrados estão descontados.',
      'Confere os itens e me avisa se precisar ajustar alguma coisa.',
    );
  return lines.join('\n');
}
export function whatsappURL(phone: string, message: string): string {
  ensure(
    /^\d{10,15}$/.test(phone) && !phone.startsWith('0'),
    'Cadastre um telefone com DDD e código do país.',
  );
  ensure(
    message.length <= 8000,
    'Este resumo é longo demais para abrir direto. Use Compartilhar resumo para enviar o texto completo.',
  );
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
