const { test } = require('node:test');
const assert = require('node:assert/strict');
const f = require('../.expo/test-build/domain/finance.js');
const p = require('../.expo/test-build/domain/planning.js');
const a = require('../.expo/test-build/domain/accounts.js');
const twoAccounts = () =>
  a.saveAccount(p.configure(f.emptyData(), 70000), { name: 'Carteira', openingBalance: 10000 });
test('contas separadas e total preservado com entradas e saídas em cada conta', () => {
  let data = twoAccounts();
  const [bank, wallet] = data.cashAccounts;
  data = f.saveTransaction(data, {
    title: 'Lanche',
    type: 'expense',
    amount: 1000,
    date: f.today(),
    categoryId: 'food',
    cashAccountId: wallet.id,
  });
  data = f.saveTransaction(data, {
    title: 'Trabalho',
    type: 'income',
    amount: 2000,
    date: f.today(),
    categoryId: 'work',
    cashAccountId: bank.id,
  });
  assert.equal(a.accountBalance(data, bank.id), 72000);
  assert.equal(a.accountBalance(data, wallet.id), 9000);
  assert.equal(f.totals(data).balance, 81000);
  assert.throws(() =>
    f.saveTransaction(data, {
      title: 'Inválido',
      type: 'expense',
      amount: 1,
      date: f.today(),
      categoryId: 'food',
      cashAccountId: 'missing',
    }),
  );
});
test('fatura sai apenas da conta escolhida e recebimento de dívida entra na conta correta', () => {
  let data = p.saveCard(twoAccounts(), { name: 'Cartão', limit: 280000, openingUsed: 140000 });
  const [bank, wallet] = data.cashAccounts;
  data = p.payCard(data, data.cards[0].id, 5000, f.today(), bank.id);
  assert.equal(a.accountBalance(data, bank.id), 65000);
  assert.equal(a.accountBalance(data, wallet.id), 10000);
  data = f.saveDebt(data, {
    title: 'Livro',
    personName: 'Ana',
    direction: 'receivable',
    amount: 2000,
    dueDate: f.today(),
  });
  data = f.addPayment(data, data.debts[0].id, 2000, f.today(), wallet.id);
  assert.equal(a.accountBalance(data, wallet.id), 12000);
});
test('transferência muda duas contas sem duplicar receitas, despesas ou metas; estorno é conjunto', () => {
  let data = twoAccounts();
  const [from, to] = data.cashAccounts;
  data = p.saveGoal(data, {
    type: 'expense',
    categoryId: 'expense-general',
    month: f.today().slice(0, 7),
    amount: 20000,
  });
  data = a.transferBetweenAccounts(data, from.id, to.id, 5000, f.today());
  assert.equal(a.accountBalance(data, from.id), 65000);
  assert.equal(a.accountBalance(data, to.id), 15000);
  assert.equal(f.totals(data).balance, 80000);
  assert.equal(f.totals(data).income, 0);
  assert.equal(f.totals(data).expense, 0);
  assert.equal(p.goalProgress(data, data.goals[0]).actual, 0);
  assert.throws(() => a.transferBetweenAccounts(data, from.id, from.id, 100));
  const corrupt = structuredClone(data);
  corrupt.transactions.pop();
  assert.throws(() => f.validateData(corrupt));
  data = f.deleteTransaction(data, data.transactions[0].id);
  assert.equal(data.transactions.length, 0);
  assert.equal(a.accountBalance(data, from.id), 70000);
  assert.equal(a.accountBalance(data, to.id), 10000);
});
test('recorrências mantêm conta selecionada e crédito não ganha vínculo de conta corrente', () => {
  let data = twoAccounts();
  const wallet = data.cashAccounts[1];
  data = p.saveRecurrence(data, {
    title: 'Mesada',
    amount: 2000,
    type: 'income',
    categoryId: 'allowance',
    account: 'cash',
    cashAccountId: wallet.id,
    startDate: f.today(),
    active: true,
  });
  data = p.resolveOccurrence(data, data.recurrences[0].id, f.today());
  assert.equal(a.accountBalance(data, wallet.id), 12000);
  data = p.saveCard(data, { name: 'Cartão', limit: 10000, openingUsed: 0 });
  data = f.saveTransaction(data, {
    title: 'Compra',
    amount: 1000,
    type: 'expense',
    categoryId: 'food',
    date: f.today(),
    account: 'credit',
    cardId: data.cards[0].id,
    cashAccountId: wallet.id,
  });
  assert.equal(data.transactions.at(-1).cashAccountId, undefined);
});
test('migração v2 mantém saldo, cartões e baixas sem duplicar abertura', () => {
  let data = p.configure(f.emptyData(), 70000, {
    name: 'Cartão',
    limit: 280000,
    openingUsed: 140000,
  });
  data = f.saveTransaction(data, {
    title: 'Lanche',
    type: 'expense',
    amount: 2000,
    date: f.today(),
    categoryId: 'food',
  });
  const previous = { ...data, version: 2, settings: { completed: true, openingBalance: 70000 } };
  delete previous.cashAccounts;
  previous.transactions = previous.transactions.map(({ cashAccountId, ...t }) => t);
  const migrated = f.parseBackup(JSON.stringify(previous));
  assert.equal(migrated.version, 3);
  assert.equal(migrated.cashAccounts.length, 1);
  assert.equal(a.accountBalance(migrated, migrated.cashAccounts[0].id), 68000);
  assert.equal(f.totals(migrated).balance, 68000);
  assert.equal(p.cardTotals(migrated, migrated.cards[0].id).outstanding, 140000);
  assert.equal(migrated.settings.completed, true);
  assert.deepEqual(f.parseBackup(JSON.stringify(migrated)), migrated);
});
test('vários cartões têm barras independentes e o percentual nunca passa da largura máxima', () => {
  let data = p.saveCard(f.emptyData(), { name: 'Um', limit: 280000, openingUsed: 140000 });
  data = p.saveCard(data, { name: 'Dois', limit: 100000, openingUsed: 20000 });
  assert.equal(p.cardTotals(data, data.cards[0].id).progress, 50);
  assert.equal(p.cardTotals(data, data.cards[1].id).progress, 20);
  data = p.saveCard(data, { ...data.cards[0], openingUsed: 300000 }, data.cards[0].id);
  const result = p.cardTotals(data, data.cards[0].id);
  assert.equal(result.progress, 100);
  assert.equal(result.exceeded, 20000);
  assert(result.percentage > 100);
});
test('conta com histórico não é excluída; saldo negativo e renomeação são preservados', () => {
  let data = a.saveAccount(f.emptyData(), { name: 'Outra', openingBalance: 0 });
  const other = data.cashAccounts[1];
  data = a.saveAccount(data, { name: 'Carteira', openingBalance: -1000 }, other.id);
  assert.equal(a.accountBalance(data, other.id), -1000);
  assert.throws(() => a.removeAccount(data, other.id));
  data = a.saveAccount(data, { name: 'Carteira', openingBalance: 0 }, other.id);
  data = a.removeAccount(data, other.id);
  assert.equal(data.cashAccounts.length, 1);
  assert.throws(() => a.removeAccount(data, data.cashAccounts[0].id));
});
