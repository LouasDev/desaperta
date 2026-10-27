import { NavigatorScreenParams } from '@react-navigation/native';
import { Direction, Flow } from '../domain/finance';
export type TabParams = {
  Home: undefined;
  Transactions: undefined;
  Debts: { direction?: Direction } | undefined;
  Settings: undefined;
};
export type RootParams = {
  Main: NavigatorScreenParams<TabParams> | undefined;
  TransactionForm:
    { id?: string; type?: Flow; cardId?: string; cashAccountId?: string } | undefined;
  DebtForm: { id?: string; direction?: Direction } | undefined;
  DebtDetail: { id: string };
  Cards: undefined;
  Accounts: undefined;
  AccountForm: { id?: string } | undefined;
  AccountDetail: { id: string };
  TransferForm: undefined;
  CardForm: { id?: string } | undefined;
  CardDetail: { id: string };
  Goals: undefined;
  GoalForm: { id?: string } | undefined;
  Recurrences: undefined;
  RecurrenceForm: { id?: string; type?: Flow } | undefined;
};
