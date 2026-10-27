import { parseMoney, validDate } from './finance';
export function moneyOrZero(value: string): number {
  return !value.trim() || /^0(?:[,.]0{1,2})?$/.test(value.trim()) ? 0 : parseMoney(value);
}
export function parseMonth(value: string): string {
  if (!/^\d{2}\/\d{4}$/.test(value)) throw new Error('Use o mês no formato MM/AAAA.');
  const [m, y] = value.split('/');
  const month = `${y}-${m}`;
  if (!validDate(`${month}-01`)) throw new Error('Informe um mês válido entre 2000 e 2100.');
  return month;
}
export const displayMonth = (value: string) => value.split('-').reverse().join('/');
