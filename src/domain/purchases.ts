import {
  FinanceData,
  id,
  text,
  TransactionInput,
  validateData,
  MAX_AMOUNT,
  today,
  validDate,
} from './finance';
import { cycleForDate, shiftMonth } from './billing';
import type { CashAccount, CreditCard } from './models';

export function savePurchase(
  data: FinanceData,
  input: TransactionInput,
  count: number,
  firstBillMonth?: string,
) {
  const card = data.cards.find((c) => c.id === input.cardId);
  if (!card || input.account !== 'credit' || input.type !== 'expense')
    throw new Error('Selecione o cartão da compra.');
  if (card.cycleConfigured === false)
    throw new Error(
      'Confirme o fechamento e o vencimento na edição deste cartão antes de registrar a compra.',
    );
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 60 ||
    input.amount < count ||
    input.amount > MAX_AMOUNT
  )
    throw new Error('Use de 1 a 60 parcelas, cada uma com pelo menos R$ 0,01.');
  const month = firstBillMonth || cycleForDate(input.date, card.closingDay);
  if (!validDate(`${month}-01`) || month < cycleForDate(input.date, card.closingDay))
    throw new Error('A primeira fatura não pode ser anterior ao ciclo da compra.');
  const purchaseId = count > 1 ? id() : undefined;
  const base = Math.floor(input.amount / count),
    remainder = input.amount % count;
  const transactions = Array.from({ length: count }, (_, index) => ({
    ...input,
    title: text(input.title, 'Descrição'),
    id: id(),
    cashAccountId: undefined,
    amount: base + (index < remainder ? 1 : 0),
    billMonth: shiftMonth(month, index),
    ...(purchaseId ? { purchaseId, installment: index + 1, installments: count } : {}),
  }));
  return validateData({ ...data, transactions: [...data.transactions, ...transactions] });
}

export function configureMany(data: FinanceData, accounts: CashAccount[], cards: CreditCard[]) {
  if (data.settings.completed) throw new Error('A configuração inicial já foi concluída.');
  if (!accounts.length || accounts.length > 20 || cards.length > 20)
    throw new Error('Cadastre de 1 a 20 contas e até 20 cartões.');
  return validateData({
    ...data,
    settings: { ...data.settings, completed: true },
    cashAccounts: accounts.map((a) => ({ ...a, name: text(a.name, 'Nome da conta') })),
    cards: cards.map((c) => ({
      ...c,
      name: text(c.name, 'Nome do cartão'),
      openingBillMonth: c.openingBillMonth ?? cycleForDate(today(), c.closingDay),
    })),
  });
}
