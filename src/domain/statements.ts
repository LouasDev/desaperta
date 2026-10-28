import {
  FinanceData,
  id,
  MAX_AMOUNT,
  today,
  Transaction,
  validDate,
  validateData,
} from './finance';
import { payCard } from './planning';
import { cycleForDate } from './billing';
export interface StatementRow {
  key: string;
  date: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
}
export interface ImportChoice {
  row: StatementRow;
  action: 'normal' | 'ignore' | 'invoice';
  categoryId?: string;
  cardId?: string;
  billMonth?: string;
}
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
function hash(value: string) {
  let a = 2166136261,
    b = 5381;
  for (let i = 0; i < value.length; i++) {
    a = Math.imul(a ^ value.charCodeAt(i), 16777619);
    b = Math.imul(b, 33) ^ value.charCodeAt(i);
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
}
function dateOf(value: string) {
  const s = value.trim();
  const iso = /^\d{4}-\d{2}-\d{2}/.test(s)
    ? s.slice(0, 10)
    : /^\d{2}\/\d{2}\/\d{4}$/.test(s)
      ? s.split('/').reverse().join('-')
      : /^\d{8}/.test(s)
        ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
        : '';
  if (!validDate(iso) || iso > today())
    throw new Error(`Data inválida ou futura no extrato: ${s.slice(0, 30)}.`);
  return iso;
}
function centsOf(value: string) {
  let s = value.trim().replace(/R\$|\s/g, '');
  const negative = s.startsWith('-') || /^\(.*\)$/.test(s);
  s = s.replace(/^[-+]|[()]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(s))
    throw new Error(
      'Valor inválido no extrato. Use valores em reais, com até duas casas decimais.',
    );
  const cents = Math.round(Number(s) * 100);
  if (!Number.isSafeInteger(cents) || cents > MAX_AMOUNT)
    throw new Error('Valor do extrato fora do limite suportado.');
  return negative ? -cents : cents;
}
function csvRows(raw: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (quoted && raw[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || !cell) quoted = !quoted;
      else cell += c;
    } else if (!quoted && c === delimiter) {
      row.push(cell);
      cell = '';
    } else if (!quoted && (c === '\n' || c === '\r')) {
      if (c === '\r' && raw[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('CSV com aspas não fechadas. Exporte o arquivo novamente.');
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  if (rows.length > 10050) throw new Error('Importe até 10 mil linhas por arquivo.');
  return rows;
}
const decode = (s: string) =>
  s
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
export function parseStatement(
  raw: string,
  destinationKey: string,
  mode: 'cash' | 'credit',
): StatementRow[] {
  if (raw.length > 2_000_000) throw new Error('O extrato deve ter até 2 MB.');
  const source = raw.replace(/^\uFEFF/, '');
  const entries: { date: string; title: string; value: number; external?: string }[] = [];
  if (/<OFX[>\s]/i.test(source)) {
    const currency = source.match(/<CURDEF>\s*([^<\r\n]+)/i)?.[1].trim();
    if (currency && currency.toUpperCase() !== 'BRL')
      throw new Error('Importe um extrato em reais (BRL).');
    for (const block of source.matchAll(
      /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|(?=<\/BANKTRANLIST>))/gi,
    )) {
      const get = (tag: string) =>
        decode(block[1].match(new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, 'i'))?.[1].trim() ?? '');
      entries.push({
        date: dateOf(get('DTPOSTED')),
        title: get('MEMO') || get('NAME') || 'Movimentação importada',
        value: centsOf(get('TRNAMT')),
        external: get('FITID') || undefined,
      });
    }
  } else {
    let rows: string[][] = [],
      headerIndex = -1,
      dateIndex = -1,
      titleIndex = -1,
      amountIndex = -1;
    let csvError: unknown;
    for (const delimiter of [';', ',', '\t']) {
      let candidate: string[][];
      try {
        candidate = csvRows(source, delimiter);
      } catch (e) {
        csvError = e;
        continue;
      }
      for (let i = 0; i < Math.min(30, candidate.length); i++) {
        const header = candidate[i].map(normalize);
        const d = header.findIndex((s) =>
          ['data', 'date', 'data lancamento', 'data de lancamento', 'data de lançamento'].includes(
            s,
          ),
        );
        const a = header.findIndex((s) =>
          ['valor', 'amount', 'valor (r$)', 'valor(r$)', 'valor em reais'].includes(s),
        );
        const t = header.findIndex((s) =>
          ['descricao', 'description', 'title', 'titulo', 'historico', 'lancamento'].includes(s),
        );
        if (d >= 0 && a >= 0 && t >= 0) {
          rows = candidate;
          headerIndex = i;
          dateIndex = d;
          titleIndex = t;
          amountIndex = a;
          break;
        }
      }
      if (headerIndex >= 0) break;
    }
    if (headerIndex < 0 && csvError) throw csvError;
    if (headerIndex < 0)
      throw new Error(
        'Cabeçalho não reconhecido. Use CSV com Data, Descrição e Valor, ou um arquivo OFX.',
      );
    const header = rows[headerIndex].map(normalize);
    const externalIndex = header.findIndex((s) =>
      ['identificador', 'identificador da transacao', 'fitid', 'id'].includes(s),
    );
    for (const row of rows.slice(headerIndex + 1)) {
      if (!row[dateIndex]?.trim()) continue;
      if (!row[amountIndex]?.trim()) throw new Error('Há uma linha sem valor. Revise o CSV.');
      const signed = centsOf(row[amountIndex]);
      entries.push({
        date: dateOf(row[dateIndex]),
        title: row[titleIndex]?.trim() || 'Movimentação importada',
        value: mode === 'credit' ? -signed : signed,
        external: externalIndex >= 0 ? row[externalIndex]?.trim() : undefined,
      });
    }
  }
  if (!entries.length) throw new Error('Nenhuma movimentação reconhecida neste arquivo.');
  if (entries.length > 10000) throw new Error('Importe até 10 mil movimentações por vez.');
  const occurrences = new Map<string, number>();
  const seenKeys = new Set<string>();
  return entries
    .filter((e) => e.value !== 0)
    .map<StatementRow>((e) => {
      const canonical = `${e.date}|${normalize(e.title)}|${e.value}`;
      const index = occurrences.get(canonical) ?? 0;
      occurrences.set(canonical, index + 1);
      return {
        key: `statement:${hash(destinationKey)}:${hash(e.external ? `id:${e.external}` : `${canonical}|${index}`)}`,
        date: e.date,
        title: e.title.slice(0, 100),
        amount: Math.abs(e.value),
        type: e.value > 0 ? 'income' : 'expense',
      };
    })
    .filter((row) => {
      if (seenKeys.has(row.key)) return false;
      seenKeys.add(row.key);
      return true;
    });
}
export function importStatement(
  data: FinanceData,
  choices: ImportChoice[],
  destination: { account: 'cash' | 'credit'; id: string; billMonth?: string },
) {
  let next = data;
  let added = 0,
    duplicates = 0;
  for (const choice of choices) {
    const row = choice.row;
    if (choice.action === 'ignore') continue;
    if (next.transactions.some((t) => t.importKey === row.key)) {
      duplicates++;
      continue;
    }
    if (choice.action === 'invoice') {
      if (destination.account !== 'cash' || row.type !== 'expense' || !choice.cardId)
        throw new Error('Selecione a conta, o cartão e o mês para o pagamento da fatura.');
      const updated = payCard(
        next,
        choice.cardId,
        row.amount,
        row.date,
        destination.id,
        choice.billMonth || undefined,
      );
      next = {
        ...updated,
        transactions: updated.transactions.map((t, index) =>
          index === updated.transactions.length - 1 ? { ...t, importKey: row.key } : t,
        ),
      };
    } else {
      if (destination.account === 'credit' && row.type === 'income')
        throw new Error(
          'Estornos e pagamentos do CSV do cartão precisam ser ignorados nesta importação. Registre pagamentos pela fatura para não duplicar saldos.',
        );
      const card = next.cards.find((c) => c.id === destination.id);
      const transaction: Transaction = {
        id: id(),
        title: row.title,
        amount: row.amount,
        date: row.date,
        type: row.type,
        importKey: row.key,
        categoryId:
          choice.categoryId ?? (row.type === 'income' ? 'income-general' : 'expense-general'),
        account: destination.account,
        ...(destination.account === 'credit'
          ? {
              cardId: destination.id,
              billMonth: destination.billMonth || cycleForDate(row.date, card?.closingDay),
            }
          : { cashAccountId: destination.id }),
      };
      next = { ...next, transactions: [...next.transactions, transaction] };
    }
    added++;
  }
  return { data: validateData(next), added, duplicates };
}
