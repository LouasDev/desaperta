const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const nativeConfig = JSON.parse(JSON.stringify(app));
delete nativeConfig.version;
delete nativeConfig.web;
if (nativeConfig.android) delete nativeConfig.android.versionCode;
const assets = [app.icon, app.splash?.image, app.android?.adaptiveIcon?.foregroundImage]
  .filter(Boolean)
  .map((file) => ({
    file,
    hash: crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.resolve(root, file)))
      .digest('hex'),
  }));
const snapshot = {
  installedPackages: Object.fromEntries(
    Object.entries(lock.packages)
      .filter(([key]) => key)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => [key, { version: value.version, integrity: value.integrity }]),
  ),
  dependencies: Object.fromEntries(
    Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)),
  ),
  nativeConfig,
  assets,
};
const signature = crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
const runtimeVersion = app.android?.runtimeVersion ?? app.runtimeVersion;
const file = path.join(root, 'native-runtime.json');
if (process.argv.includes('--prebuild') && fs.existsSync(file)) {
  const previous = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (
    previous.signature !== signature &&
    JSON.stringify(previous.runtimeVersion) === JSON.stringify(runtimeVersion)
  ) {
    process.stderr.write(
      'A parte nativa mudou: incremente runtimeVersion antes de gerar o APK para nao enviar codigo incompativel aos aparelhos antigos.\n',
    );
    process.exit(1);
  }
}
if (process.argv.includes('--write')) {
  fs.writeFileSync(file, JSON.stringify({ runtimeVersion, signature }, null, 2) + '\n');
  process.stdout.write('Compatibilidade nativa registrada.\n');
} else if (process.argv.includes('--check')) {
  const previous = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (
    previous.signature !== signature ||
    JSON.stringify(previous.runtimeVersion) !== JSON.stringify(runtimeVersion)
  ) {
    process.stderr.write(
      'Dependencias ou configuracao nativa mudaram. Gere um novo APK e uma nova versao de runtime antes de publicar.\n',
    );
    process.exit(1);
  }
  process.stdout.write('Atualizacao compativel com o APK registrado.\n');
}
