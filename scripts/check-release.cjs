const { spawnSync } = require('child_process');

const commands = [
  ['node', ['scripts/check-mojibake.cjs']],
  ['node', ['scripts/check-tajweed.cjs']],
  ['node', ['scripts/check-prayer-parity.cjs']],
  ['node', ['scripts/check-azan-native.cjs']],
  ['node', ['scripts/check-apk-update.cjs']],
  ['node', ['scripts/check-search.cjs']],
  ['node', ['node_modules/typescript/bin/tsc', '--noEmit']],
];

for (const [command, args] of commands) {
  const label = [command, ...args].join(' ');
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\nRelease checks passed.');
