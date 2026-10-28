const { test } = require('node:test');
const assert = require('node:assert/strict');
const f = require('../.expo/test-build/domain/finance.js');
const { createRepository } = require('../.expo/test-build/storage/snapshotRepository.js');
const newDebt = (direction = 'payable') =>
  f.saveDebt(f.emptyData(), {
    title: 'Livro',
    personName: 'Ana',
    amount: 10000,
    dueDate: f.today(),
    direction,
  });

test('valores brasileiros são calculados em centavos sem arredondar parcelas inválidas', () => {
  assert.equal(f.parseMoney('1.234,56'), 123456);
  assert.equal(f.parseMoney('1.234'), 123400);
  assert.equal(f.parseMoney('0,01'), 1);
  assert.equal(f.parseMoney('25.50'), 2550);
  for (const value of ['', '-1', '0', '1,999', '12abc', '1e3', 'Infinity', '10.000.000,00'])
    assert.throws(() => f.parseMoney(value));
});
test('datas rejeitam dias inexistentes e lançamentos futuros', () => {
  assert.equal(f.parseDate('29/02/2024'), '2024-02-29');
  for (const value of ['31/02/2026', '29/02/2025', '01/13/2026', '2026-10-27'])
    assert.throws(() => f.parseDate(value));
  assert.throws(() => f.parseDate('01/01/2100', false));
});
test('criar dívida não muda saldo e reaproveita pessoas', () => {
  let data = newDebt();
  data = f.saveDebt(data, {
    title: 'Jogo',
    personName: 'ana',
    amount: 1000,
    dueDate: f.today(),
    direction: 'receivable',
  });
  assert.equal(data.people.length, 1);
  assert.deepEqual(f.totals(data), {
    income: 0,
    expense: 0,
    balance: 0,
    payable: 10000,
    receivable: 1000,
  });
});
test('pagamento parcial gera uma única saída e quitação é calculada', () => {
  let data = newDebt();
  const debt = data.debts[0];
  data = f.addPayment(data, debt.id, 2500, f.today());
  assert.equal(f.remaining(data, debt), 7500);
  assert.equal(f.totals(data).balance, -2500);
  assert.equal(data.transactions.length, 1);
  assert.throws(() => f.addPayment(data, debt.id, 7501, f.today()));
  assert.throws(() => f.addPayment(data, debt.id, 0, f.today()));
  data = f.addPayment(data, debt.id, 7500, f.today());
  assert.equal(f.debtStatus(data, debt), 'Quitado');
  assert.equal(f.totals(data).payable, 0);
});
test('recebimento aumenta saldo e estorno desfaz entrada e baixa juntos', () => {
  let data = newDebt('receivable');
  const debt = data.debts[0];
  data = f.addPayment(data, debt.id, 1500, f.today());
  assert.equal(f.totals(data).balance, 1500);
  assert.throws(() => f.deleteTransaction(data, data.transactions[0].id));
  data = f.deletePayment(data, data.payments[0].id);
  assert.equal(f.totals(data).balance, 0);
  assert.equal(f.remaining(data, debt), 10000);
});
test('edição preserva pagamentos e impede inverter direção ou reduzir total abaixo do pago', () => {
  let data = newDebt();
  const debt = data.debts[0];
  data = f.addPayment(data, debt.id, 6000, f.today());
  const input = { ...debt, personName: 'Ana' };
  assert.throws(() => f.saveDebt(data, { ...input, amount: 5999 }, debt.id));
  assert.throws(() => f.saveDebt(data, { ...input, direction: 'receivable' }, debt.id));
  data = f.saveDebt(data, { ...input, title: 'Livro novo' }, debt.id);
  assert.equal(f.remaining(data, data.debts[0]), 4000);
});
test('excluir dívida remove suas baixas e lançamentos vinculados', () => {
  let data = newDebt();
  const debt = data.debts[0];
  data = f.addPayment(data, debt.id, 5000, f.today());
  data = f.deleteDebt(data, debt.id);
  assert.equal(data.debts.length + data.payments.length + data.transactions.length, 0);
});
test('lançamentos podem ser editados e excluídos, com saldo recalculado', () => {
  let data = f.saveTransaction(f.emptyData(), {
    title: 'Mesada',
    amount: 20000,
    type: 'income',
    date: f.today(),
    categoryId: 'allowance',
  });
  data = f.saveTransaction(
    data,
    { title: 'Mesada', amount: 15000, type: 'income', date: f.today(), categoryId: 'allowance' },
    data.transactions[0].id,
  );
  assert.equal(f.totals(data).balance, 15000);
  data = f.deleteTransaction(data, data.transactions[0].id);
  assert.equal(f.totals(data).balance, 0);
});
test('backup faz ida e volta e rejeita dados corrompidos ou inconsistentes', () => {
  let data = newDebt();
  data = f.addPayment(data, data.debts[0].id, 2000, f.today());
  assert.deepEqual(f.parseBackup(JSON.stringify(data)), data);
  for (const value of [
    '{}',
    'null',
    'texto',
    JSON.stringify({ ...data, version: 5 }),
    JSON.stringify({ ...data, people: [] }),
    JSON.stringify({ ...data, transactions: [] }),
    JSON.stringify({ ...data, debts: [...data.debts, ...data.debts] }),
  ])
    assert.throws(() => f.parseBackup(value));
  const corrupt = structuredClone(data);
  corrupt.transactions[0].amount++;
  assert.throws(() => f.validateData(corrupt));
});
test('persistência recupera dados após reabrir e preserva cópia anterior à restauração', async () => {
  const values = new Map();
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
  };
  const repo = createRepository(storage);
  await repo.load();
  const data = newDebt();
  await repo.save(data);
  const reopened = createRepository(storage);
  assert.deepEqual(await reopened.load(), data);
  await reopened.savePrevious(data);
  await reopened.save(f.emptyData());
  assert.deepEqual(await reopened.readPrevious(), data);
});
test('falha de gravação não substitui o snapshot válido', async () => {
  let stored = JSON.stringify(newDebt());
  const repo = createRepository({
    getItem: async () => stored,
    setItem: async () => {
      throw new Error('Disco cheio');
    },
  });
  const original = await repo.load();
  await assert.rejects(repo.save(f.emptyData()), /Disco cheio/);
  assert.deepEqual(await repo.load(), original);
});
test('dados corrompidos não são sobrescritos e janela desatualizada não grava', async () => {
  let stored = 'invalid';
  let writes = 0;
  const storage = {
    getItem: async () => stored,
    setItem: async (_key, value) => {
      writes++;
      stored = value;
    },
  };
  const repo = createRepository(storage);
  await assert.rejects(repo.load());
  await assert.rejects(repo.save(f.emptyData()));
  assert.equal(writes, 0);
  stored = null;
  const a = createRepository(storage),
    b = createRepository(storage);
  await a.load();
  await b.load();
  await a.save(newDebt());
  await assert.rejects(b.save(f.emptyData()), /outra janela/);
  assert.equal(f.parseBackup(stored).debts.length, 1);
});
