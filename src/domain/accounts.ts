import { FinanceData, id, text, today, validateData } from './finance';
import type { CashAccount } from './models';
function ensure(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function accountBalance(data: FinanceData, accountId: string): number {
  const account = data.cashAccounts.find((a) => a.id === accountId);
  ensure(account, 'Conta não encontrada.');
  return (
    account.openingBalance +
    data.transactions
      .filter((t) => t.account !== 'credit' && t.cashAccountId === accountId)
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
  );
}
export function saveAccount(
  data: FinanceData,
  input: Omit<CashAccount, 'id'>,
  editId?: string,
): FinanceData {
  ensure(!editId || data.cashAccounts.some((a) => a.id === editId), 'Conta não encontrada.');
  return validateData({
    ...data,
    cashAccounts: editId
      ? data.cashAccounts.map((a) =>
          a.id === editId ? { ...input, name: text(input.name, 'Nome da conta'), id: editId } : a,
        )
      : [...data.cashAccounts, { ...input, id: id(), name: text(input.name, 'Nome da conta') }],
  });
}
export function removeAccount(data: FinanceData, accountId: string): FinanceData {
  ensure(data.cashAccounts.length > 1, 'Mantenha pelo menos uma conta cadastrada.');
  ensure(
    accountBalance(data, accountId) === 0,
    'A conta precisa ter saldo zero para ser excluída.',
  );
  ensure(
    !data.transactions.some((t) => t.cashAccountId === accountId) &&
      !data.recurrences.some((r) => r.cashAccountId === accountId),
    'Esta conta possui histórico ou recorrências. Mantenha-a para preservar seus registros.',
  );
  return validateData({
    ...data,
    cashAccounts: data.cashAccounts.filter((a) => a.id !== accountId),
  });
}
export function transferBetweenAccounts(
  data: FinanceData,
  fromId: string,
  toId: string,
  amount: number,
  date = today(),
): FinanceData {
  const from = data.cashAccounts.find((a) => a.id === fromId),
    to = data.cashAccounts.find((a) => a.id === toId);
  ensure(from && to && fromId !== toId, 'Selecione duas contas diferentes.');
  const transferId = id();
  return validateData({
    ...data,
    transactions: [
      ...data.transactions,
      {
        id: id(),
        title: `Transferência para ${to.name}`.slice(0, 100),
        type: 'expense',
        categoryId: 'expense-general',
        amount,
        date,
        account: 'cash',
        cashAccountId: fromId,
        transferId,
      },
      {
        id: id(),
        title: `Transferência de ${from.name}`.slice(0, 100),
        type: 'income',
        categoryId: 'income-general',
        amount,
        date,
        account: 'cash',
        cashAccountId: toId,
        transferId,
      },
    ],
  });
}
