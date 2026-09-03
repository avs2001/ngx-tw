import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync(
  "find projects/ngx-tw -name '*.ts' ! -name '*.spec.ts' ! -name '*.meta.ts'",
  { encoding: 'utf8' },
).trim().split('\n');

const rows = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // match input(true), input<boolean...>(true, model(true, input(true, {...
    if (!/\b(input|model)\s*(<[^>]*>)?\s*\(\s*true\b/.test(l)) continue;
    // capture the declaring name: search backwards up to 3 lines for "name ="
    let name = null;
    for (let k = i; k >= Math.max(0, i - 3); k--) {
      const m = lines[k].match(/(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*=\s*(?:input|model)/);
      if (m) { name = m[1]; break; }
    }
    // look upward for the doc comment / bare comment immediately preceding the declaration
    // find the line where the declaration starts
    let declStart = i;
    for (let k = i; k >= Math.max(0, i - 3); k--) {
      if (/(?:readonly\s+)?[A-Za-z_$][\w$]*\s*=\s*(?:input|model)/.test(lines[k])) { declStart = k; break; }
    }
    // walk up over preceding comment lines
    let j = declStart - 1;
    const above = [];
    while (j >= 0 && (lines[j].trim().startsWith('*') || lines[j].trim().startsWith('/**') || lines[j].trim().startsWith('//') || lines[j].trim().startsWith('*/'))) {
      above.unshift(lines[j].trim());
      j--;
    }
    const joined = above.join('\n');
    const hasJsdoc = /\*\//.test(joined) || /^\/\*\*/.test(above[0] ?? '');
    const hasSlash = above.some((x) => x.startsWith('//'));
    rows.push({
      file: f,
      line: declStart + 1,
      name,
      style: hasJsdoc && hasSlash ? 'JSDOC+//' : hasJsdoc ? 'JSDOC' : hasSlash ? '//' : 'NONE',
      comment: joined.replace(/\n/g, ' ⏎ ').slice(0, 300),
    });
  }
}
rows.sort((a,b)=> a.file.localeCompare(b.file) || a.line-b.line);
console.log('TOTAL', rows.length);
for (const r of rows) console.log(`${r.style}\t${r.file}:${r.line}\t${r.name}`);
console.log('---counts---');
const c = {};
for (const r of rows) c[r.style] = (c[r.style]||0)+1;
console.log(JSON.stringify(c));
