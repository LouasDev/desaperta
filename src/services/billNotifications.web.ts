import type { FinanceData } from '../domain/finance';
export async function requestBillPermission() {
  throw new Error('Os lembretes de fatura estão disponíveis no aplicativo Android instalado.');
}
export async function syncBillNotifications(_data: FinanceData) {
  return 0;
}
