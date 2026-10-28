const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const args of [
  [
    'node_modules/typescript/bin/tsc',
    'src/domain/finance.ts',
    'src/domain/planning.ts',
    'src/domain/accounts.ts',
    'src/domain/purchases.ts',
    'src/domain/statements.ts',
    'src/domain/reminders.ts',
    'src/domain/textEncoding.ts',
    'src/storage/snapshotRepository.ts',
    '--outDir',
    '.expo/test-build',
    '--module',
    'commonjs',
    '--target',
    'ES2022',
    '--skipLibCheck',
  ],
  [
    '--test',
    'tests/finance.test.cjs',
    'tests/planning.test.cjs',
    'tests/accounts.test.cjs',
    'tests/billing.test.cjs',
  ],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
