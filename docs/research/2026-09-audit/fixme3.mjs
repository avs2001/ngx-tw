import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const files = execSync("find e2e -type f -name '*.spec.ts'", { encoding: 'utf8' }).trim().split('\n');
for (const f of files) {
  const L = readFileSync(f, 'utf8').split('\n');
  for (let i = 0; i < L.length; i++) {
    if (!/^test\.fixme\(/.test(L[i].trim())) continue;
    if (/test\.fixme\(\s*[A-Za-z_$]/.test(L[i].trim())) continue;
    // find the line containing "=> {" then dump following comment lines
    let k = i;
    while (k < L.length && k < i + 6 && !/=>\s*\{/.test(L[k])) k++;
    const body = [];
    for (let m = k + 1; m < Math.min(L.length, k + 14); m++) {
      const t = L[m].trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) body.push(t);
      else if (t === '' && body.length === 0) continue;
      else break;
    }
    console.log(`\n== ${f}:${i + 1}`);
    for (const b of body) console.log('   ' + b);
  }
}
