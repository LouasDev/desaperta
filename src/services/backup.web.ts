import { today } from '../domain/finance';
export async function exportBackup(raw: string): Promise<void> {
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `desaperta-${today()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importBackup(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,text/plain';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.oncancel = () => {
      input.remove();
      resolve(null);
    };
    input.onchange = async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        resolve(null);
        return;
      }
      if (file.size > 5_000_000) {
        reject(new Error('O backup deve ter até 5 MB.'));
        return;
      }
      try {
        resolve(await file.text());
      } catch {
        reject(new Error('Não foi possível ler esse arquivo.'));
      }
    };
    input.click();
  });
}
