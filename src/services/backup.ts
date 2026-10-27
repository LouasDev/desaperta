import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { today } from '../domain/finance';

export async function exportBackup(raw: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(
      'O compartilhamento não está disponível. Use a opção de copiar o texto do backup.',
    );
  if (!FileSystem.cacheDirectory) throw new Error('Não foi possível acessar a pasta temporária.');
  const file = `${FileSystem.cacheDirectory}desaperta-${today()}.json`;
  await FileSystem.writeAsStringAsync(file, raw);
  await Sharing.shareAsync(file, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Guardar backup do Desaperta',
  });
}
export async function importBackup(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const file = result.assets[0];
  if (file.size && file.size > 5_000_000) throw new Error('O backup deve ter até 5 MB.');
  return FileSystem.readAsStringAsync(file.uri);
}
