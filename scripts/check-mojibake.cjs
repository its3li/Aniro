const fs = require('fs');
const path = require('path');

const roots = ['src', 'android/app/src/main/java', 'android/app/src/main/res', 'scripts'];
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.java', '.xml', '.json', '.md']);
const mojibakePattern = /[\u00C2-\u00FF\uFFFD]/;
const skipDirs = new Set(['.git', '.next', 'node_modules', 'build', '.gradle']);
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(fullPath);
      continue;
    }

    if (!extensions.has(path.extname(entry.name))) continue;

    const text = fs.readFileSync(fullPath, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (mojibakePattern.test(line)) {
        failures.push(`${fullPath}:${index + 1}: ${line.trim().slice(0, 160)}`);
      }
    });
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) walk(root);
}

if (failures.length > 0) {
  console.error('Mojibake-like characters found:');
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Mojibake scan passed.');
