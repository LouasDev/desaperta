import type { Flow } from './finance';
export interface Settings {
  completed: boolean;
  billReminders?: boolean;
}
export interface CashAccount {
  id: string;
  name: string;
  openingBalance: number;
}
export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  openingUsed: number;
  cycleConfigured?: boolean;
  closingDay?: number;
  dueDay?: number;
  openingBillMonth?: string;
}
export interface Goal {
  id: string;
  type: Flow;
  categoryId: string;
  amount: number;
  month: string;
}
export interface Recurrence {
  id: string;
  title: string;
  amount: number;
  type: Flow;
  categoryId: string;
  account: 'cash' | 'credit';
  cardId?: string;
  cashAccountId?: string;
  startDate: string;
  active: boolean;
}
export interface RecurrenceEvent {
  id: string;
  recurrenceId: string;
  date: string;
  status: 'posted' | 'skipped';
  transactionId?: string;
}
