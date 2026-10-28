// Older bank exports use Latin-1. Native file reading falls back only when UTF-8 fails.
export function latin1FromBase64(base64: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bits = 0,
    value = 0,
    result = '';
  for (const char of base64) {
    if (char === '=' || /\s/.test(char)) continue;
    const n = alphabet.indexOf(char);
    if (n < 0) throw new Error('Arquivo com codificação inválida.');
    value = (value << 6) | n;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      result += String.fromCharCode((value >> bits) & 255);
    }
  }
  return result;
}
