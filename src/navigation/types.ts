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
  TransactionForm: { id?: string; type?: Flow } | undefined;
  DebtForm: { id?: string; direction?: Direction } | undefined;
  DebtDetail: { id: string };
};
