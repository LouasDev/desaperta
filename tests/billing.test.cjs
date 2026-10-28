const { test } = require('node:test');
const assert = require('node:assert/strict');
const f = require('../.expo/test-build/domain/finance.js');
const p = require('../.expo/test-build/domain/planning.js');
const b = require('../.expo/test-build/domain/billing.js');
const u = require('../.expo/test-build/domain/purchases.js');
const s = require('../.expo/test-build/domain/statements.js');
const r = require('../.expo/test-build/domain/reminders.js');
const encoding = require('../.expo/test-build/domain/textEncoding.js');
function setup() {
  let d = p.configure(f.emptyData(), 200000);
  return p.saveCard(d, {
    name: 'Nubank',
    limit: 280000,
    openingUsed: 0,
    closingDay: 25,
    dueDay: 5,
    openingBillMonth: '2026-01',
  });
}
function purchase(d, amount = 120000, count = 12) {
  return u.savePurchase(
    d,
    {
      title: 'Notebook',
      type: 'expense',
      amount,
      date: '2026-01-10',
      categoryId: 'study',
      account: 'credit',
      cardId: d.cards[0].id,
    },
    count,
  );
}
test('ciclos respeitam fechamento, ano novo e fim de fevereiro', () => {
  assert.equal(b.cycleForDate('2026-01-24', 25), '2026-01');
  assert.equal(b.cycleForDate('2026-01-25', 25), '2026-02');
  assert.equal(b.cycleForDate('2026-12-31', 31), '2027-01');
  assert.equal(b.cycleForDate('2028-02-28', 31), '2028-02');
  assert.equal(b.cycleForDate('2028-02-29', 31), '2028-03');
  assert.deepEqual(b.cycleDates({ closingDay: 25, dueDay: 5 }, '2026-01'), {
    closingDate: '2026-01-25',
    dueDate: '2026-02-05',
  });
  assert.deepEqual(b.cycleDates({ closingDay: 10, dueDay: 20 }, '2026-01'), {
    closingDate: '2026-01-10',
    dueDate: '2026-01-20',
  });
});
test('12 parcelas aparecem em 12 faturas e o limite considera toda a dívida', () => {
  const d = purchase(setup());
  const bills = b.cardBills(d, d.cards[0].id, '2026-01-20');
  assert.equal(d.transactions.length, 12);
  assert.equal(bills.find((x) => x.month === '2026-01').balance, 10000);
  assert.equal(bills.find((x) => x.month === '2026-12').balance, 10000);
  assert.equal(p.cardTotals(d, d.cards[0].id).outstanding, 120000);
  assert.equal(bills.find((x) => x.month === '2026-02').status, 'Futura');
  assert.equal(b.cardBills(d, d.cards[0].id, '2026-01-25')[0].status, 'Fechada');
  assert.equal(b.cardBills(d, d.cards[0].id, '2026-02-06')[0].status, 'Vencida');
  assert.equal(b.recognized(d.transactions[1], '2026-01-31'), false);
});
test('centavos preservados, carência, parcelamento inválido e remoção conjunta', () => {
  let d = purchase(setup(), 10000, 3);
  assert.deepEqual(
    d.transactions.map((t) => t.amount),
    [3334, 3333, 3333],
  );
  const one = d.transactions[0];
  assert.throws(() => f.saveTransaction(d, { ...one, title: 'Alteração parcial' }, one.id));
  assert.throws(() => f.validateData({ ...d, transactions: d.transactions.slice(1) }));
  d = f.deleteTransaction(d, one.id);
  assert.equal(d.transactions.length, 0);
  assert.throws(() => purchase(setup(), 2, 3));
  assert.throws(() => purchase(setup(), 100, 61));
  const base = setup();
  const input = {
    title: 'Compra',
    amount: 5000,
    type: 'expense',
    date: '2026-01-25',
    account: 'credit',
    cardId: base.cards[0].id,
    categoryId: 'food',
  };
  assert.throws(() => u.savePurchase(base, input, 2, '2026-01'));
  const deferred = u.savePurchase(base, input, 2, '2026-03');
  assert.equal(deferred.transactions[0].billMonth, '2026-03');
  assert.equal(deferred.transactions[1].billMonth, '2026-04');
});
test('pagamento libera limite, sai da conta e não duplica os gastos; fatura não aceita excesso', () => {
  let d = purchase(setup());
  const card = d.cards[0].id;
  d = p.payCard(d, card, 10000, '2026-02-01', d.cashAccounts[0].id, '2026-01');
  assert.equal(
    b.cardBills(d, card, '2026-02-01').find((x) => x.month === '2026-01').status,
    'Paga',
  );
  assert.equal(p.cardTotals(d, card).outstanding, 110000);
  assert.equal(f.totals(d).balance, 190000);
  assert.throws(() => p.payCard(d, card, 1, '2026-02-01', d.cashAccounts[0].id, '2026-01'));
  assert.throws(() => f.deleteTransaction(d, d.transactions[0].id));
});
test('múltiplas contas e cartões na configuração são salvos juntos', () => {
  const d = u.configureMany(
    f.emptyData(),
    [
      { id: 'a', name: 'Nubank', openingBalance: 10000 },
      { id: 'b', name: 'Inter', openingBalance: -5000 },
    ],
    [
      { id: 'c', name: 'Nu', limit: 280000, openingUsed: 0, closingDay: 25, dueDay: 5 },
      { id: 'd', name: 'Inter', limit: 100000, openingUsed: 5000, closingDay: 10, dueDay: 20 },
    ],
  );
  assert.equal(d.cashAccounts.length, 2);
  assert.equal(d.cards.length, 2);
  assert.equal(f.totals(d).balance, 5000);
  assert.throws(() => u.configureMany(d, d.cashAccounts, d.cards));
});
test('migração da versão 3 mantém saldos, compras e pagamentos legados', () => {
  let d = setup();
  d = f.saveTransaction(d, {
    title: 'Compra antiga',
    amount: 10000,
    type: 'expense',
    date: '2026-01-10',
    categoryId: 'food',
    account: 'credit',
    cardId: d.cards[0].id,
  });
  d = p.payCard(d, d.cards[0].id, 4000, '2026-01-11');
  const old = JSON.parse(JSON.stringify(d));
  old.version = 3;
  old.cards.forEach((c) => {
    delete c.closingDay;
    delete c.dueDay;
    delete c.openingBillMonth;
  });
  old.transactions.forEach((t) => delete t.billMonth);
  const migrated = f.validateData(old);
  assert.equal(migrated.version, 4);
  assert.equal(p.cardTotals(migrated, migrated.cards[0].id).outstanding, 6000);
  assert.equal(f.totals(migrated).balance, 196000);
  assert.equal(f.parseBackup(JSON.stringify(migrated)).transactions.length, 2);
});
test('CSV Nubank: vírgulas e aspas em descrições, identificadores e importação idempotente', () => {
  const raw =
    'Data,Valor,Identificador,Descrição\n10/01/2026,100.00,a,"Pix recebido, teste"\n11/01/2026,-20.50,b,"Mercado ""X"""';
  const rows = s.parseStatement(raw, 'cash:default-cash', 'cash');
  assert.equal(rows.length, 2);
  assert.equal(rows[1].amount, 2050);
  assert.equal(rows[1].type, 'expense');
  const choices = rows.map((row) => ({ row, action: 'normal' }));
  let result = s.importStatement(setup(), choices, { account: 'cash', id: 'default-cash' });
  assert.equal(result.added, 2);
  assert.equal(f.totals(result.data).balance, 207950);
  result = s.importStatement(result.data, choices, { account: 'cash', id: 'default-cash' });
  assert.equal(result.added, 0);
  assert.equal(result.duplicates, 2);
});
test('CSV Inter semicolons e OFX SGML/XML preservam valores e recusam arquivo inválido', () => {
  const rows = s.parseStatement(
    'Data Lançamento;Histórico;Valor;Saldo\r\n10/01/2026;Pix;-1.234,56;0,00',
    'cash:a',
    'cash',
  );
  assert.equal(rows[0].amount, 123456);
  const ofx =
    '<OFX><CURDEF>BRL<BANKTRANLIST><STMTTRN><DTPOSTED>20260110120000[-3:BRT]<TRNAMT>-20.50<FITID>abc<MEMO>A &amp; B</STMTTRN></BANKTRANLIST></OFX>';
  const parsed = s.parseStatement(ofx, 'cash:a', 'cash');
  assert.equal(parsed[0].title, 'A & B');
  assert.equal(parsed[0].amount, 2050);
  assert.throws(() => s.parseStatement(ofx.replace('BRL', 'USD'), 'cash:a', 'cash'));
  assert.throws(() => s.parseStatement('data,descricao,valor\n32/01/2026,x,3', 'cash:a', 'cash'));
  assert.throws(() => s.parseStatement('data,descricao,valor\n10/01/2026,"x,3', 'cash:a', 'cash'));
});
test('importação de pagamento abate a fatura e falha de uma linha não altera a base', () => {
  let d = purchase(setup(), 10000, 1);
  const row = {
    key: 'payment-test',
    title: 'Pagamento',
    amount: 10000,
    date: '2026-01-20',
    type: 'expense',
  };
  const result = s.importStatement(
    d,
    [{ row, action: 'invoice', cardId: d.cards[0].id, billMonth: '2026-01' }],
    { account: 'cash', id: d.cashAccounts[0].id },
  );
  assert.equal(p.cardTotals(result.data, d.cards[0].id).outstanding, 0);
  assert.throws(() =>
    s.importStatement(
      d,
      [
        { row, action: 'normal' },
        { row: { ...row, key: 'bad', amount: -1 }, action: 'normal' },
      ],
      { account: 'cash', id: d.cashAccounts[0].id },
    ),
  );
  assert.equal(d.transactions.length, 1);
});
test('lembretes só têm datas futuras, ajustam o fim do mês e não expõem valores', () => {
  const d = setup();
  const plan = r.reminderPlan(d, new Date(2026, 0, 24, 10));
  assert.equal(plan[0].at.getDate(), 25);
  assert.equal(plan[0].at.getHours(), 9);
  assert.ok(plan.length <= 60);
  assert.ok(plan.every((item) => item.at > new Date(2026, 0, 24, 10)));
  assert.ok(plan.every((item) => !item.body.includes('R$')));
});

test('parcelas futuras não viram gasto atual nem progresso antecipado de meta', () => {
  const base = setup();
  const card = base.cards[0].id;
  const d = u.savePurchase(
    base,
    {
      title: 'Planejada',
      amount: 120000,
      type: 'expense',
      date: '2026-01-10',
      categoryId: 'study',
      account: 'credit',
      cardId: card,
    },
    12,
    '2099-01',
  );
  assert.equal(f.totals(d).expense, 0);
  assert.equal(p.cardTotals(d, card).outstanding, 120000);
  assert.equal(
    p.goalProgress(d, {
      id: 'goal',
      type: 'expense',
      categoryId: 'study',
      amount: 50000,
      month: '2099-01',
    }).actual,
    0,
  );
});
test('CSV do cartão usa o mês informado, evita importar pagamento como compra e distingue faturas', () => {
  const d = setup(),
    card = d.cards[0].id;
  const raw = 'date,title,amount\n2026-01-10,Loja parcela,20.00\n2026-01-11,Pagamento,-20.00';
  const rows = s.parseStatement(raw, `credit:${card}:2026-02`, 'credit');
  assert.equal(rows[0].type, 'expense');
  assert.equal(rows[1].type, 'income');
  assert.throws(() =>
    s.importStatement(
      d,
      rows.map((row) => ({ row, action: 'normal' })),
      { account: 'credit', id: card, billMonth: '2026-02' },
    ),
  );
  const result = s.importStatement(
    d,
    [
      { row: rows[0], action: 'normal' },
      { row: rows[1], action: 'ignore' },
    ],
    { account: 'credit', id: card, billMonth: '2026-02' },
  );
  assert.equal(result.data.transactions[0].billMonth, '2026-02');
  assert.notEqual(s.parseStatement(raw, `credit:${card}:2026-03`, 'credit')[0].key, rows[0].key);
});
test('FITID repetido é único e compras iguais sem identificador continuam distintas', () => {
  const ofx =
    '<OFX><BANKTRANLIST>' +
    '<STMTTRN><DTPOSTED>20260110<TRNAMT>-10<FITID>same<MEMO>Loja</STMTTRN>'.repeat(2) +
    '</BANKTRANLIST></OFX>';
  assert.equal(s.parseStatement(ofx, 'cash:a', 'cash').length, 1);
  const csv = 'Data,Descrição,Valor\n10/01/2026,Loja,-10\n10/01/2026,Loja,-10';
  const rows = s.parseStatement(csv, 'cash:a', 'cash');
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].key, rows[1].key);
});
test('CSV multilinha e texto Latin-1 de extrato são lidos sem perder acentos', () => {
  const rows = s.parseStatement(
    'Data,Descrição,Valor\n10/01/2026,"Mercado\nPadaria",-12.30',
    'cash:a',
    'cash',
  );
  assert.equal(rows[0].amount, 1230);
  assert.equal(rows[0].title, 'Mercado\nPadaria');
  const raw = 'Data;Descrição;Valor\n10/01/2026;Pão;-5,00';
  const decoded = encoding.latin1FromBase64(Buffer.from(raw, 'latin1').toString('base64'));
  assert.equal(decoded, raw);
  assert.equal(s.parseStatement(decoded, 'cash:a', 'cash')[0].title, 'Pão');
});
test('cartão migrado exige confirmar dias antes de parcelar e não gera lembretes errados', () => {
  const d = setup();
  const old = JSON.parse(JSON.stringify(d));
  old.version = 3;
  old.cards.forEach((c) => {
    delete c.closingDay;
    delete c.dueDay;
    delete c.cycleConfigured;
  });
  const migrated = f.validateData(old);
  assert.equal(migrated.cards[0].cycleConfigured, false);
  assert.equal(r.reminderPlan(migrated).length, 0);
  assert.throws(() => purchase(migrated));
});

test('resumo WhatsApp separa direções, parcelas pagas e destaca o saldo líquido', () => {
  let d = f.saveDebt(f.emptyData(), {
    title: 'Uber\nVôlei',
    personName: 'Ana *Teste*',
    amount: 10000,
    direction: 'receivable',
    dueDate: '2026-01-20',
  });
  const person = d.people[0].id;
  d = f.addPayment(d, d.debts[0].id, 2500, '2026-01-15');
  d = f.saveDebt(d, {
    title: 'Lanche',
    personName: 'Ana *Teste*',
    amount: 2000,
    direction: 'payable',
    dueDate: '2026-01-21',
  });
  const message = p.personSummary(d, person);
  assert.ok(message.includes('*VOCÊ ME DEVE*'));
  assert.ok(message.includes('*EU TE DEVO*'));
  assert.ok(message.includes('já recebido: ' + f.money(2500)));
  assert.ok(message.includes('você me deve ' + f.money(5500)));
  assert.ok(message.includes('Uber Vôlei'));
  assert.ok(message.includes('Oi, Ana Teste!'));
  assert.ok(message.includes('Atualizado em'));
  assert.ok(message.includes('pagamentos já registrados'));
});
test('resumo diferencia compensação de quitação e considera valores a pagar', () => {
  let d = f.saveDebt(f.emptyData(), {
    title: 'A',
    personName: 'Bia',
    amount: 1000,
    direction: 'receivable',
    dueDate: '2026-01-20',
  });
  const person = d.people[0].id;
  d = f.saveDebt(d, {
    title: 'B',
    personName: 'Bia',
    amount: 1000,
    direction: 'payable',
    dueDate: '2026-01-20',
  });
  assert.ok(p.personSummary(d, person).includes('valores se compensam'));
  d = f.saveDebt(d, {
    title: 'C',
    personName: 'Bia',
    amount: 500,
    direction: 'payable',
    dueDate: '2026-01-20',
  });
  assert.ok(p.personSummary(d, person).includes('eu te devo ' + f.money(500)));
});
test('resumo não repete pendência quitada e protege URL longa', () => {
  let d = f.saveDebt(f.emptyData(), {
    title: 'Quitada',
    personName: 'Ana',
    amount: 1000,
    direction: 'receivable',
    dueDate: '2026-01-20',
  });
  const person = d.people[0].id;
  d = f.addPayment(d, d.debts[0].id, 1000, '2026-01-20');
  const message = p.personSummary(d, person);
  assert.ok(!message.includes('Quitada'));
  assert.ok(message.includes('estamos em dia'));
  assert.throws(() => p.whatsappURL('5511999999999', 'x'.repeat(8001)), /Compartilhar resumo/);
});
