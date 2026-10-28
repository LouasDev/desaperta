export async function pickStatement(): Promise<{ name: string; raw: string } | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.ofx';
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
      if (file.size > 2_000_000) {
        reject(new Error('O extrato deve ter até 2 MB.'));
        return;
      }
      try {
        const bytes = await file.arrayBuffer();
        let raw: string;
        try {
          raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch {
          raw = new TextDecoder('windows-1252').decode(bytes);
        }
        resolve({ name: file.name, raw });
      } catch {
        reject(new Error('Não foi possível ler o extrato.'));
      }
    };
    input.click();
  });
}
