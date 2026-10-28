const { test } = require('node:test');
const assert = require('node:assert/strict');
const f = require('../.expo/test-build/domain/finance.js');
const p = require('../.expo/test-build/domain/planning.js');
const cardData = () =>
  p.configure(f.emptyData(), 20000, { name: 'Cartão', limit: 10000, openingUsed: 5000 });
const recurringData = (type = 'expense') =>
  p.saveRecurrence(f.emptyData(), {
    title: 'Mensalidade',
    amount: 3000,
    type,
    categoryId: type === 'income' ? 'allowance' : 'subscriptions',
    account: 'cash',
    startDate: '2026-01-31',
    active: true,
  });
test('configuração separa saldo, limite e gastos iniciais e só executa uma vez', () => {
  const data = cardData();
  assert.equal(f.totals(data).balance, 20000);
  assert.equal(p.cardTotals(data, data.cards[0].id).available, 5000);
  assert.throws(() => p.configure(data, 0));
  assert.throws(() => p.configure(f.emptyData(), NaN));
});
test('compra no crédito consome limite sem sair do saldo; pagar fatura não duplica despesa/meta', () => {
  let data = cardData();
  const cardId = data.cards[0].id;
  data = f.saveTransaction(data, {
    title: 'Lanche',
    amount: 2000,
    type: 'expense',
    date: `${f.today().slice(0, 7)}-01`,
    categoryId: 'food',
    account: 'credit',
    cardId,
  });
  data = p.saveGoal(data, {
    type: 'expense',
    amount: 3000,
    categoryId: 'food',
    month: f.today().slice(0, 7),
  });
  assert.equal(f.totals(data).balance, 20000);
  assert.equal(f.totals(data).expense, 2000);
  assert.equal(p.cardTotals(data, cardId).available, 3000);
  data = p.payCard(data, cardId, 7000, f.today());
  assert.equal(f.totals(data).balance, 13000);
  assert.equal(f.totals(data).expense, 2000);
  assert.equal(p.goalProgress(data, data.goals[0]).actual, 2000);
  assert.equal(p.cardTotals(data, cardId).outstanding, 0);
  assert.throws(() => p.payCard(data, cardId, 1, f.today()));
  assert.throws(() => f.deleteTransaction(data, data.transactions.find((t) => t.cardId).id));
  data = f.deleteTransaction(data, data.transactions.find((t) => t.cardPaymentFor).id);
  assert.equal(p.cardTotals(data, cardId).outstanding, 7000);
});
test('cartão inválido, entrada no crédito e pagamentos maiores são rejeitados', () => {
  const data = cardData();
  const input = {
    title: 'x',
    amount: 1,
    type: 'income',
    date: f.today(),
    categoryId: 'allowance',
    account: 'credit',
    cardId: data.cards[0].id,
  };
  assert.throws(() => f.saveTransaction(data, input));
  assert.throws(() => p.payCard(data, data.cards[0].id, 5001, f.today()));
  assert.throws(() =>
    f.saveTransaction(data, { ...input, type: 'expense', categoryId: 'food', cardId: 'missing' }),
  );
});
test('metas mensais somam categorias e distinguem teto de saída e objetivo de entrada', () => {
  let data = f.saveTransaction(f.emptyData(), {
    title: 'Lanche',
    amount: 4000,
    type: 'expense',
    date: f.today(),
    categoryId: 'food',
  });
  data = p.saveGoal(data, {
    type: 'expense',
    amount: 3000,
    categoryId: 'food',
    month: f.today().slice(0, 7),
  });
  assert.equal(p.goalProgress(data, data.goals[0]).exceeded, 1000);
  assert.throws(() => p.saveGoal(data, { ...data.goals[0] }));
  data = p.saveGoal(data, {
    type: 'income',
    amount: 10000,
    categoryId: 'allowance',
    month: f.today().slice(0, 7),
  });
  assert.equal(p.goalProgress(data, data.goals[1]).remaining, 10000);
});
test('recorrências mensais ajustam dia 31 ao fim do mês e não lançam dinheiro previsto', () => {
  const data = recurringData();
  const due = p.dueOccurrences(data, '2026-03-31');
  assert.deepEqual(
    due.map((o) => o.date),
    ['2026-01-31', '2026-02-28', '2026-03-31'],
  );
  assert.equal(p.occurrenceDate('2024-01-31', '2024-02'), '2024-02-29');
  assert.equal(f.totals(data).balance, 0);
});
test('confirmar ou pular ocorrência não duplica; exclusão não recria recorrência baixada', () => {
  let data = recurringData('income');
  const r = data.recurrences[0];
  data = p.resolveOccurrence(data, r.id, '2026-01-31');
  assert.equal(f.totals(data).balance, 3000);
  assert.throws(() => p.resolveOccurrence(data, r.id, '2026-01-31'));
  data = f.deleteTransaction(data, data.transactions[0].id);
  assert.equal(f.totals(data).balance, 0);
  assert(!p.dueOccurrences(data).some((o) => o.date === '2026-01-31'));
  data = p.resolveOccurrence(data, r.id, '2026-02-28', true);
  assert.equal(data.transactions.length, 0);
  data = p.saveRecurrence(data, { ...r, active: false }, r.id);
  assert.equal(p.dueOccurrences(data).length, 0);
});
test('migração v1 preserva caixa e dívidas sem reiniciar os dados', () => {
  const old = f.saveDebt(f.emptyData(), {
    title: 'Livro',
    personName: 'Ana',
    amount: 10000,
    direction: 'receivable',
    dueDate: f.today(),
  });
  old.version = 1;
  delete old.settings;
  delete old.cards;
  delete old.goals;
  delete old.recurrences;
  delete old.recurrenceEvents;
  old.categories = old.categories.filter((c) => c.id !== 'subscriptions');
  const migrated = f.parseBackup(JSON.stringify(old));
  assert.equal(migrated.version, 4);
  assert.equal(migrated.debts.length, 1);
  assert.equal(f.totals(migrated).receivable, 10000);
});
test('WhatsApp usa telefone normalizado, restante e saldo líquido entre as duas direções', () => {
  let data = f.saveDebt(f.emptyData(), {
    title: 'Uber',
    personName: 'Ana',
    personPhone: '(11) 99999-9999',
    amount: 10000,
    direction: 'receivable',
    dueDate: f.today(),
  });
  data = f.addPayment(data, data.debts[0].id, 2500, f.today());
  data = f.saveDebt(data, {
    title: 'Lanche',
    personName: 'Ana',
    amount: 2000,
    direction: 'payable',
    dueDate: f.today(),
  });
  const message = p.personSummary(data, data.people[0].id);
  assert(message.includes('Ana'));
  assert(message.includes(f.money(7500)));
  assert(message.includes(`você me deve ${f.money(5500)}`));
  assert.equal(data.people[0].phone, '5511999999999');
  assert(p.whatsappURL(data.people[0].phone, message).includes(encodeURIComponent(message)));
  assert.throws(() => f.normalizePhone('123'));
  assert.throws(() => p.whatsappURL('00000000000', message));
});
test('nova pendência não apaga telefone cadastrado e edição permite limpar', () => {
  let data = f.saveDebt(f.emptyData(), {
    title: 'Um',
    personName: 'Ana',
    personPhone: '11999999999',
    amount: 100,
    direction: 'receivable',
    dueDate: f.today(),
  });
  data = f.saveDebt(data, {
    title: 'Dois',
    personName: 'Ana',
    personPhone: '',
    amount: 200,
    direction: 'receivable',
    dueDate: f.today(),
  });
  assert.equal(data.people[0].phone, '5511999999999');
  data = f.saveDebt(
    data,
    { ...data.debts[0], personName: 'Ana', personPhone: '' },
    data.debts[0].id,
  );
  assert.equal(data.people[0].phone, undefined);
});
test('meta de entrada atualiza com receitas reais e ignora outras categorias', () => {
  let data = p.saveGoal(f.emptyData(), {
    type: 'income',
    categoryId: 'allowance',
    amount: 10000,
    month: f.today().slice(0, 7),
  });
  data = f.saveTransaction(data, {
    title: 'Mesada',
    amount: 5000,
    type: 'income',
    categoryId: 'allowance',
    date: f.today(),
  });
  data = f.saveTransaction(data, {
    title: 'Trabalho',
    amount: 5000,
    type: 'income',
    categoryId: 'work',
    date: f.today(),
  });
  assert.equal(p.goalProgress(data, data.goals[0]).percentage, 50);
  assert.equal(p.goalProgress(data, data.goals[0]).remaining, 5000);
});
test('editar crédito para saldo remove o vínculo do cartão', () => {
  let data = cardData();
  data = f.saveTransaction(data, {
    title: 'Lanche',
    amount: 1000,
    type: 'expense',
    categoryId: 'food',
    date: f.today(),
    account: 'credit',
    cardId: data.cards[0].id,
  });
  const t = data.transactions[0];
  data = f.saveTransaction(data, { ...t, account: 'cash', cardId: undefined }, t.id);
  assert.equal(data.transactions[0].cardId, undefined);
  assert.equal(p.cardTotals(data, data.cards[0].id).outstanding, 5000);
  assert.equal(f.totals(data).balance, 19000);
});
test('backup atual preserva cartões, metas e ocorrências e rejeita vínculos corrompidos', () => {
  let data = cardData();
  data = p.saveRecurrence(data, {
    title: 'Assinatura',
    amount: 1000,
    type: 'expense',
    account: 'credit',
    cardId: data.cards[0].id,
    categoryId: 'subscriptions',
    startDate: f.today(),
    active: true,
  });
  data = p.resolveOccurrence(data, data.recurrences[0].id, f.today());
  data = p.saveGoal(data, {
    type: 'expense',
    categoryId: 'subscriptions',
    amount: 2000,
    month: f.today().slice(0, 7),
  });
  assert.deepEqual(f.parseBackup(JSON.stringify(data)), data);
  const corrupt = structuredClone(data);
  corrupt.cards = [];
  assert.throws(() => f.validateData(corrupt));
  const missing = structuredClone(data);
  missing.recurrenceEvents = [];
  assert.throws(() => f.validateData(missing));
});
