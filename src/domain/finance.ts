import type { CreditCard, Goal, Recurrence, RecurrenceEvent, Settings } from './models';
export type Flow = 'income' | 'expense';
export type Direction = 'payable' | 'receivable';
export interface Person {
  id: string;
  name: string;
  phone?: string;
}
export interface Category {
  id: string;
  name: string;
  type: Flow;
}
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: Flow;
  date: string;
  categoryId: string;
  paymentId?: string;
  account?: 'cash' | 'credit';
  cardId?: string;
  cardPaymentFor?: string;
  recurrenceId?: string;
  occurrence?: string;
}
export interface Debt {
  id: string;
  personId: string;
  title: string;
  amount: number;
  direction: Direction;
  dueDate: string;
  createdAt: string;
}
export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  transactionId: string;
}
export interface FinanceData {
  version: 2;
  settings: Settings;
  cards: CreditCard[];
  goals: Goal[];
  recurrences: Recurrence[];
  recurrenceEvents: RecurrenceEvent[];
  people: Person[];
  categories: Category[];
  transactions: Transaction[];
  debts: Debt[];
  payments: Payment[];
}

export const MAX_AMOUNT = 999_999_999;
export const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const money = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const displayDate = (iso: string) => iso.split('-').reverse().join('/');
export const inputMoney = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function parseMoney(input: string): number {
  let value = input.trim().replace(/^R\$\s*/, '');
  ensure(
    /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value) || /^\d+\.\d{1,2}$/.test(value),
    'Use um valor como 150,00, com até duas casas decimais.',
  );
  if (value.includes(',')) value = value.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(?:\.\d{3})+$/.test(value)) value = value.replace(/\./g, '');
  const result = Math.round(Number(value) * 100);
  ensure(
    Number.isSafeInteger(result) && result > 0 && result <= MAX_AMOUNT,
    'Informe um valor entre R$ 0,01 e R$ 9.999.999,99.',
  );
  return result;
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return (
    y >= 2000 &&
    y <= 2100 &&
    parsed.getFullYear() === y &&
    parsed.getMonth() === m - 1 &&
    parsed.getDate() === d
  );
}
export function parseDate(value: string, allowFuture = true): string {
  ensure(/^\d{2}\/\d{2}\/\d{4}$/.test(value), 'Use a data no formato DD/MM/AAAA.');
  const iso = value.split('/').reverse().join('-');
  ensure(validDate(iso), 'Informe uma data válida entre 2000 e 2100.');
  ensure(allowFuture || iso <= today(), 'Um lançamento realizado não pode ter data futura.');
  return iso;
}
export function text(value: string, label: string): string {
  const result = value.trim();
  ensure(result.length > 0 && result.length <= 100, `${label}: preencha entre 1 e 100 caracteres.`);
  return result;
}
export function emptyData(): FinanceData {
  return {
    version: 2,
    settings: { completed: false, openingBalance: 0 },
    cards: [],
    goals: [],
    recurrences: [],
    recurrenceEvents: [],
    people: [],
    transactions: [],
    debts: [],
    payments: [],
    categories: [
      { id: 'income-general', name: 'Outras entradas', type: 'income' },
      { id: 'allowance', name: 'Mesada', type: 'income' },
      { id: 'work', name: 'Trabalho', type: 'income' },
      { id: 'expense-general', name: 'Outras saídas', type: 'expense' },
      { id: 'food', name: 'Alimentação', type: 'expense' },
      { id: 'transport', name: 'Transporte', type: 'expense' },
      { id: 'leisure', name: 'Lazer', type: 'expense' },
      { id: 'study', name: 'Estudos', type: 'expense' },
      { id: 'subscriptions', name: 'Assinaturas', type: 'expense' },
      { id: 'payment-in', name: 'Recebimento de dívida', type: 'income' },
      { id: 'payment-out', name: 'Pagamento de dívida', type: 'expense' },
    ],
  };
}
export const paidAmount = (data: FinanceData, debtId: string) =>
  data.payments.filter((p) => p.debtId === debtId).reduce((sum, p) => sum + p.amount, 0);
export const remaining = (data: FinanceData, debt: Debt) => debt.amount - paidAmount(data, debt.id);
export function debtStatus(data: FinanceData, debt: Debt) {
  if (remaining(data, debt) === 0) return 'Quitado';
  return debt.dueDate < today() ? 'Atrasado' : 'Pendente';
}
export function totals(data: FinanceData) {
  const income = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expense = data.transactions
    .filter((t) => t.type === 'expense' && !t.cardPaymentFor)
    .reduce((s, t) => s + t.amount, 0);
  return {
    income,
    expense,
    balance:
      data.settings.openingBalance +
      data.transactions.reduce(
        (sum, t) =>
          sum +
          ((t.account ?? 'cash') === 'cash' ? (t.type === 'income' ? t.amount : -t.amount) : 0),
        0,
      ),
    payable: data.debts
      .filter((d) => d.direction === 'payable')
      .reduce((s, d) => s + remaining(data, d), 0),
    receivable: data.debts
      .filter((d) => d.direction === 'receivable')
      .reduce((s, d) => s + remaining(data, d), 0),
  };
}
export type TransactionInput = Omit<Transaction, 'id' | 'paymentId'>;
export function saveTransaction(
  data: FinanceData,
  input: TransactionInput,
  editId?: string,
): FinanceData {
  const existing = data.transactions.find((t) => t.id === editId);
  ensure(!editId || existing, 'Lançamento não encontrado.');
  ensure(
    !existing?.paymentId && !existing?.cardPaymentFor,
    'Desfaça este registro na tela de origem.',
  );
  const transaction = {
    ...existing,
    ...input,
    account: input.account ?? 'cash',
    cardId: input.account === 'credit' ? input.cardId : undefined,
    title: text(input.title, 'Descrição'),
    id: editId ?? id(),
  };
  const next = {
    ...data,
    transactions: [...data.transactions.filter((t) => t.id !== editId), transaction],
  };
  return validateData(next);
}
export function deleteTransaction(data: FinanceData, transactionId: string): FinanceData {
  const existing = data.transactions.find((t) => t.id === transactionId);
  ensure(existing && !existing.paymentId, 'Remova pagamentos pelo histórico da dívida.');
  return validateData({
    ...data,
    transactions: data.transactions.filter((t) => t.id !== transactionId),
    recurrenceEvents: data.recurrenceEvents.map((e) =>
      e.transactionId === transactionId
        ? { ...e, status: 'skipped' as const, transactionId: undefined }
        : e,
    ),
  });
}
export type DebtInput = Pick<Debt, 'title' | 'amount' | 'dueDate' | 'direction'> & {
  personName: string;
  personPhone?: string;
};
export function saveDebt(data: FinanceData, input: DebtInput, editId?: string): FinanceData {
  const existing = data.debts.find((d) => d.id === editId);
  ensure(!editId || existing, 'Registro não encontrado.');
  ensure(
    !existing || input.amount >= paidAmount(data, existing.id),
    'O total não pode ser menor que o valor já pago.',
  );
  ensure(
    !existing || !paidAmount(data, existing.id) || existing.direction === input.direction,
    'Não é possível mudar o tipo após registrar pagamentos.',
  );
  const name = text(input.personName, 'Pessoa');
  const foundPerson = data.people.find(
    (p) => p.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'),
  ) ?? { id: id(), name };
  const person: Person = {
    ...foundPerson,
    ...(input.personPhone !== undefined && (input.personPhone.trim() || editId)
      ? { phone: normalizePhone(input.personPhone) || undefined }
      : {}),
  };
  const debt: Debt = {
    id: editId ?? id(),
    personId: person.id,
    title: text(input.title, 'Descrição'),
    amount: input.amount,
    direction: input.direction,
    dueDate: input.dueDate,
    createdAt: existing?.createdAt ?? today(),
  };
  return validateData({
    ...data,
    people: [...data.people.filter((p) => p.id !== person.id), person],
    debts: [...data.debts.filter((d) => d.id !== editId), debt],
  });
}
export function addPayment(
  data: FinanceData,
  debtId: string,
  amount: number,
  date: string,
): FinanceData {
  const debt = data.debts.find((d) => d.id === debtId);
  ensure(debt, 'Dívida não encontrada.');
  ensure(
    amount > 0 && amount <= remaining(data, debt),
    'O valor não pode ultrapassar o que falta pagar.',
  );
  const paymentId = id(),
    transactionId = id();
  const person = data.people.find((p) => p.id === debt.personId)!;
  const incoming = debt.direction === 'receivable';
  const payment: Payment = { id: paymentId, debtId, amount, date, transactionId };
  const transaction: Transaction = {
    id: transactionId,
    title: `${incoming ? 'Recebimento' : 'Pagamento'} · ${person.name}`.slice(0, 100),
    amount,
    date,
    type: incoming ? 'income' : 'expense',
    categoryId: incoming ? 'payment-in' : 'payment-out',
    paymentId,
  };
  return validateData({
    ...data,
    payments: [...data.payments, payment],
    transactions: [...data.transactions, transaction],
  });
}
export function deletePayment(data: FinanceData, paymentId: string): FinanceData {
  const payment = data.payments.find((p) => p.id === paymentId);
  ensure(payment, 'Pagamento não encontrado.');
  return {
    ...data,
    payments: data.payments.filter((p) => p.id !== paymentId),
    transactions: data.transactions.filter((t) => t.id !== payment.transactionId),
  };
}
export function deleteDebt(data: FinanceData, debtId: string): FinanceData {
  const paymentIds = new Set(data.payments.filter((p) => p.debtId === debtId).map((p) => p.id));
  return {
    ...data,
    debts: data.debts.filter((d) => d.id !== debtId),
    payments: data.payments.filter((p) => p.debtId !== debtId),
    transactions: data.transactions.filter((t) => !t.paymentId || !paymentIds.has(t.paymentId)),
  };
}

// All writes and imports pass through the same invariants, including references.
export function validateData(value: unknown): FinanceData {
  const raw = value as FinanceData;
  ensure(
    raw &&
      typeof raw === 'object' &&
      (raw.version === 2 || (raw as { version: number }).version === 1),
    'Formato ou versão de backup incompatível.',
  );
  const legacy = (raw as { version: number }).version === 1;
  const data: FinanceData = legacy
    ? {
        ...raw,
        version: 2,
        settings: { completed: false, openingBalance: 0 },
        cards: [],
        goals: [],
        recurrences: [],
        recurrenceEvents: [],
        categories: Array.isArray(raw.categories)
          ? [
              ...raw.categories.filter((c) => c?.id !== 'subscriptions'),
              { id: 'subscriptions', name: 'Assinaturas', type: 'expense' },
            ]
          : raw.categories,
      }
    : raw;
  for (const key of [
    'people',
    'categories',
    'transactions',
    'debts',
    'payments',
    'cards',
    'goals',
    'recurrences',
    'recurrenceEvents',
  ] as const) {
    ensure(
      Array.isArray(data[key]) && data[key].length <= 10000,
      'Dados inválidos ou limite de 10 mil registros por tipo excedido.',
    );
    const ids = new Set<string>();
    for (const item of data[key]) {
      ensure(
        item &&
          typeof item.id === 'string' &&
          item.id.length > 0 &&
          item.id.length <= 100 &&
          !ids.has(item.id),
        'Identificadores inválidos ou repetidos.',
      );
      ids.add(item.id);
    }
  }
  const label = (s: unknown) => typeof s === 'string' && s.trim().length > 0 && s.length <= 100;
  const amount = (n: unknown) =>
    Number.isSafeInteger(n) && Number(n) > 0 && Number(n) <= MAX_AMOUNT;
  const flow = (s: unknown) => s === 'income' || s === 'expense';
  for (const p of data.people) {
    ensure(label(p.name), 'Nome de pessoa inválido.');
    ensure(
      p.phone === undefined || (typeof p.phone === 'string' && /^\d{10,15}$/.test(p.phone)),
      'Telefone inválido.',
    );
  }
  for (const c of data.categories) ensure(label(c.name) && flow(c.type), 'Categoria inválida.');
  for (const base of emptyData().categories)
    ensure(
      data.categories.some((c) => c.id === base.id && c.type === base.type),
      'Categorias padrão ausentes.',
    );
  for (const d of data.debts) {
    ensure(
      label(d.title) &&
        amount(d.amount) &&
        validDate(d.dueDate) &&
        validDate(d.createdAt) &&
        d.createdAt <= today() &&
        (d.direction === 'payable' || d.direction === 'receivable') &&
        data.people.some((p) => p.id === d.personId),
      'Dívida inválida ou pessoa ausente.',
    );
    ensure(paidAmount(data, d.id) <= d.amount, 'Pagamentos ultrapassam o total da dívida.');
  }
  for (const t of data.transactions) {
    ensure(
      label(t.title) &&
        amount(t.amount) &&
        flow(t.type) &&
        validDate(t.date) &&
        t.date <= today() &&
        data.categories.some((c) => c.id === t.categoryId && c.type === t.type),
      'Lançamento inválido: confira valor, data e categoria.',
    );
    ensure(
      t.paymentId === undefined ||
        data.payments.some((p) => p.id === t.paymentId && p.transactionId === t.id),
      'Lançamento sem pagamento correspondente.',
    );
  }
  for (const p of data.payments) {
    const debt = data.debts.find((d) => d.id === p.debtId);
    const transaction = data.transactions.find((t) => t.id === p.transactionId);
    ensure(
      amount(p.amount) &&
        validDate(p.date) &&
        p.date <= today() &&
        debt &&
        transaction &&
        transaction.paymentId === p.id &&
        transaction.amount === p.amount &&
        transaction.date === p.date &&
        transaction.type === (debt.direction === 'payable' ? 'expense' : 'income'),
      'Pagamento inconsistente ou sem dívida correspondente.',
    );
  }
  validateExtensions(data);
  // Only known fields are kept, preventing imported metadata from being persisted.
  return {
    version: 2,
    settings: { completed: data.settings.completed, openingBalance: data.settings.openingBalance },
    cards: data.cards.map(({ id, name, limit, openingUsed }) => ({ id, name, limit, openingUsed })),
    goals: data.goals.map(({ id, type, categoryId, amount, month }) => ({
      id,
      type,
      categoryId,
      amount,
      month,
    })),
    recurrences: data.recurrences.map(
      ({ id, title, amount, type, categoryId, account, cardId, startDate, active }) => ({
        id,
        title,
        amount,
        type,
        categoryId,
        account,
        ...(cardId ? { cardId } : {}),
        startDate,
        active,
      }),
    ),
    recurrenceEvents: data.recurrenceEvents.map(
      ({ id, recurrenceId, date, status, transactionId }) => ({
        id,
        recurrenceId,
        date,
        status,
        ...(transactionId ? { transactionId } : {}),
      }),
    ),
    people: data.people.map(({ id, name, phone }) => ({ id, name, ...(phone ? { phone } : {}) })),
    categories: data.categories.map(({ id, name, type }) => ({ id, name, type })),
    debts: data.debts.map(({ id, personId, title, amount, direction, dueDate, createdAt }) => ({
      id,
      personId,
      title,
      amount,
      direction,
      dueDate,
      createdAt,
    })),
    transactions: data.transactions.map(
      ({
        id,
        title,
        amount,
        type,
        date,
        categoryId,
        paymentId,
        account,
        cardId,
        cardPaymentFor,
        recurrenceId,
        occurrence,
      }) => ({
        id,
        title,
        amount,
        type,
        date,
        categoryId,
        ...(paymentId ? { paymentId } : {}),
        account: account ?? 'cash',
        ...(cardId ? { cardId } : {}),
        ...(cardPaymentFor ? { cardPaymentFor } : {}),
        ...(recurrenceId ? { recurrenceId, occurrence } : {}),
      }),
    ),
    payments: data.payments.map(({ id, debtId, amount, date, transactionId }) => ({
      id,
      debtId,
      amount,
      date,
      transactionId,
    })),
  };
}
export function parseBackup(raw: string): FinanceData {
  ensure(raw.length <= 5_000_000, 'O backup deve ter até 5 MB.');
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('O texto não é um backup JSON válido.');
  }
  return validateData(value);
}

export function normalizePhone(value: string): string {
  if (!value.trim()) return '';
  const digits = value.replace(/[^\d]/g, '');
  const normalized =
    /^\d{10,11}$/.test(digits) && !value.trim().startsWith('+') ? `55${digits}` : digits;
  ensure(
    /^\d{10,15}$/.test(normalized) && !normalized.startsWith('0'),
    'Informe DDD e número, ou o número internacional com + e código do país.',
  );
  return normalized;
}
function validateExtensions(data: FinanceData) {
  const amount = (n: number, zero = false) =>
    Number.isSafeInteger(n) && n >= (zero ? 0 : 1) && n <= MAX_AMOUNT;
  const month = (value: string) =>
    typeof value === 'string' && /^\d{4}-\d{2}$/.test(value) && validDate(`${value}-01`);
  ensure(
    data.settings &&
      typeof data.settings.completed === 'boolean' &&
      Number.isSafeInteger(data.settings.openingBalance) &&
      Math.abs(data.settings.openingBalance) <= MAX_AMOUNT,
    'Configuração inicial inválida.',
  );
  const accountValid = (item: { account?: string; cardId?: string; type: string }) =>
    ((item.account === undefined || item.account === 'cash') && item.cardId === undefined) ||
    (item.account === 'credit' &&
      item.type === 'expense' &&
      data.cards.some((c) => c.id === item.cardId));
  for (const card of data.cards) {
    ensure(
      typeof card.name === 'string' &&
        card.name.trim().length > 0 &&
        card.name.length <= 100 &&
        amount(card.limit) &&
        amount(card.openingUsed, true),
      'Cartão inválido.',
    );
    const outstanding =
      card.openingUsed +
      data.transactions.reduce(
        (sum, t) =>
          sum +
          (t.account === 'credit' && t.cardId === card.id
            ? t.amount
            : t.cardPaymentFor === card.id
              ? -t.amount
              : 0),
        0,
      );
    ensure(outstanding >= 0, 'O pagamento ultrapassa os gastos pendentes deste cartão.');
  }
  for (const t of data.transactions) {
    ensure(accountValid(t), 'Selecione um cartão válido para este gasto.');
    ensure(
      !t.cardPaymentFor ||
        (t.account !== 'credit' &&
          t.type === 'expense' &&
          !t.paymentId &&
          !t.recurrenceId &&
          data.cards.some((c) => c.id === t.cardPaymentFor)),
      'Pagamento de cartão inválido.',
    );
    ensure(
      !t.paymentId || (t.account !== 'credit' && !t.recurrenceId),
      'Baixas de dívidas devem movimentar o saldo em conta.',
    );
    ensure(
      !t.recurrenceId ||
        data.recurrenceEvents.some(
          (e) =>
            e.recurrenceId === t.recurrenceId &&
            e.date === t.occurrence &&
            e.transactionId === t.id &&
            e.status === 'posted',
        ),
      'Recorrência sem ocorrência correspondente.',
    );
  }
  const goalKeys = new Set<string>();
  for (const g of data.goals) {
    const key = `${g.type}:${g.categoryId}:${g.month}`;
    ensure(
      amount(g.amount) &&
        month(g.month) &&
        data.categories.some((c) => c.id === g.categoryId && c.type === g.type) &&
        !goalKeys.has(key),
      'Meta inválida ou repetida para a mesma categoria e mês.',
    );
    goalKeys.add(key);
  }
  for (const r of data.recurrences)
    ensure(
      typeof r.title === 'string' &&
        r.title.trim().length > 0 &&
        r.title.length <= 100 &&
        amount(r.amount) &&
        data.categories.some((c) => c.id === r.categoryId && c.type === r.type) &&
        accountValid(r) &&
        validDate(r.startDate) &&
        typeof r.active === 'boolean',
      'Recorrência inválida.',
    );
  for (const e of data.recurrenceEvents) {
    ensure(
      data.recurrences.some((r) => r.id === e.recurrenceId) &&
        validDate(e.date) &&
        e.date <= today() &&
        e.id === `${e.recurrenceId}:${e.date.slice(0, 7)}` &&
        (e.status === 'skipped' || e.status === 'posted'),
      'Ocorrência recorrente inválida.',
    );
    ensure(
      e.status === 'skipped'
        ? !e.transactionId
        : data.transactions.some(
            (t) =>
              t.id === e.transactionId &&
              t.recurrenceId === e.recurrenceId &&
              t.occurrence === e.date,
          ),
      'Ocorrência sem lançamento correspondente.',
    );
  }
}
