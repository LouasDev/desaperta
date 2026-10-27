import { emptyData, FinanceData, parseBackup, validateData } from '../domain/finance';
export const STORAGE_KEY = '@desaperta/finance/v1';
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export function createRepository(storage: StorageAdapter) {
  let lastRead: string | null | undefined;
  return {
    async load(): Promise<FinanceData> {
      const raw = await storage.getItem(STORAGE_KEY);
      const loaded = raw === null ? emptyData() : parseBackup(raw);
      lastRead = raw;
      return loaded;
    },
    async save(data: FinanceData): Promise<void> {
      const raw = JSON.stringify(validateData(data));
      if (raw.length > 5_000_000)
        throw new Error(
          'O armazenamento atingiu o limite de 5 MB. Exporte um backup antes de reorganizar seus registros.',
        );
      if (lastRead === undefined) throw new Error('Leia os dados antes de salvar.');
      if ((await storage.getItem(STORAGE_KEY)) !== lastRead)
        throw new Error('Os dados mudaram em outra janela. Reabra o app antes de continuar.');
      // A single snapshot keeps the payment and cash entry together.
      await storage.setItem(STORAGE_KEY, raw);
      lastRead = raw;
    },
    async readRaw(): Promise<string | null> {
      return storage.getItem(STORAGE_KEY);
    },
    async savePrevious(data: FinanceData): Promise<void> {
      await storage.setItem(`${STORAGE_KEY}/before-restore`, JSON.stringify(validateData(data)));
    },
    async readPrevious(): Promise<FinanceData | null> {
      const raw = await storage.getItem(`${STORAGE_KEY}/before-restore`);
      return raw ? parseBackup(raw) : null;
    },
  };
}
