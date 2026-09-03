import { readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
const files = execSync("find e2e -type f -name '*.spec.ts'", { encoding: 'utf8' }).trim().split('\n');
const all = [];
for (const f of files) {
  if (statSync(f).isDirectory()) continue;
  const L = readFileSync(f, 'utf8').split('\n');
  for (let i = 0; i < L.length; i++) {
    const t = L[i].trim();
    if (!/^test\.fixme\(/.test(t)) continue;
    const chunk = [L[i], L[i+1] ?? '', L[i+2] ?? ''].join(' ');
    const m = chunk.match(/test\.fixme\(\s*['"`]([^'"`]*)/);
    const cond = /test\.fixme\(\s*[A-Za-z_$]/.test(t);
    all.push({ f, line: i + 1, cond, title: m ? m[1] : chunk.replace(/\s+/g, ' ').slice(0, 120) });
  }
}
console.log('declared test.fixme call sites:', all.length);
console.log('conditional form:', all.filter(a=>a.cond).length);
for (const a of all) console.log(`${a.f}:${a.line}\t${a.cond ? '[COND] ' : ''}${a.title}`);
