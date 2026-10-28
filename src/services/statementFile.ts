import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { latin1FromBase64 } from '../domain/textEncoding';
export async function pickStatement(): Promise<{ name: string; raw: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const file = result.assets[0];
  if (!/\.(csv|ofx)$/i.test(file.name))
    throw new Error('Selecione um arquivo CSV ou OFX. PDF não é suportado.');
  if (file.size && file.size > 2_000_000) throw new Error('O extrato deve ter até 2 MB.');
  let raw = '';
  try {
    raw = await FileSystem.readAsStringAsync(file.uri);
  } catch {
    /* Try the legacy bank encoding below. */
  }
  if (!raw || raw.includes('\uFFFD'))
    raw = latin1FromBase64(
      await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 }),
    );
  return { name: file.name, raw };
}
