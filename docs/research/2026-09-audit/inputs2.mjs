import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync(
  "find projects/ngx-tw -type f -name '*.ts' ! -name '*.spec.ts' ! -name '*.meta.ts'",
  { encoding: 'utf8' },
).trim().split('\n');

const decls = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(
      /(?:readonly\s+)?(?:protected\s+|private\s+|public\s+)?([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(input|model)(?:\.required)?\s*(?:<[\s\S]*?>)?\s*\(/,
    );
    if (!m) continue;
    const win = lines.slice(i, i + 9).join('\n');
    const cut = win.indexOf(');');
    const am = (cut === -1 ? win : win.slice(0, cut + 2)).match(/alias\s*:\s*['"`]([^'"`]+)['"`]/);
    decls.push({ file: f, line: i + 1, name: m[1], alias: am ? am[1] : null, ep: f.split('/')[2] });
  }
}

const specFiles = execSync("find projects/ngx-tw -type f -name '*.spec.ts'", { encoding: 'utf8' })
  .trim().split('\n');
const specsByEp = new Map();
const allSpecs = [];
for (const s of specFiles) {
  const t = readFileSync(s, 'utf8');
  allSpecs.push(t);
  const ep = s.split('/')[2];
  specsByEp.set(ep, (specsByEp.get(ep) ?? '') + '\n' + t);
}
const globalSpec = allSpecs.join('\n');

const esc = (t) => t.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
const bare = (c, t) => new RegExp(`\\b${esc(t)}\\b`).test(c);
// "driven": setInput('name'  OR  [name]=  OR  name=" (static template attr)  OR  .name.set(
const driven = (c, t) => new RegExp(
  `setInput\\(\\s*['"\`]${esc(t)}['"\`]|\\[${esc(t)}\\]\\s*=|(?<![\\w-])${esc(t)}\\s*=\\s*["']|\\.${esc(t)}\\.set\\(`,
).test(c);

const modes = {
  'A  bare name, GLOBAL spec corpus, NO alias': (d) => bare(globalSpec, d.name),
  'B  bare name OR alias, GLOBAL spec corpus': (d) => bare(globalSpec, d.name) || (d.alias && bare(globalSpec, d.alias)),
  'C  bare name, OWN entry-point spec only, NO alias': (d) => bare(specsByEp.get(d.ep) ?? '', d.name),
  'D  bare name OR alias, OWN entry-point spec only': (d) => bare(specsByEp.get(d.ep) ?? '', d.name) || (d.alias && bare(specsByEp.get(d.ep) ?? '', d.alias)),
  'E  DRIVEN (setInput/[binding]/attr/.set), own EP, NO alias': (d) => driven(specsByEp.get(d.ep) ?? '', d.name),
  'F  DRIVEN, own EP, WITH alias': (d) => driven(specsByEp.get(d.ep) ?? '', d.name) || (d.alias && driven(specsByEp.get(d.ep) ?? '', d.alias)),
};
console.log('DENOMINATOR:', decls.length, ' (aliased:', decls.filter(d => d.alias).length + ')');
const res = {};
for (const [label, fn] of Object.entries(modes)) {
  const miss = decls.filter((d) => !fn(d));
  res[label] = miss;
  console.log(`${label}  ->  untested ${miss.length}  (${(miss.length / decls.length * 100).toFixed(1)}%)`);
}
console.log('\nALIAS DELTA  A->B (global):', res['A  bare name, GLOBAL spec corpus, NO alias'].length - res['B  bare name OR alias, GLOBAL spec corpus'].length);
console.log('ALIAS DELTA  C->D (own EP):', res['C  bare name, OWN entry-point spec only, NO alias'].length - res['D  bare name OR alias, OWN entry-point spec only'].length);
console.log('ALIAS DELTA  E->F (driven):', res['E  DRIVEN (setInput/[binding]/attr/.set), own EP, NO alias'].length - res['F  DRIVEN, own EP, WITH alias'].length);

const F = res['F  DRIVEN, own EP, WITH alias'];
const tot = {};
for (const d of decls) tot[d.ep] = (tot[d.ep] || 0) + 1;
const byEp = {};
for (const d of F) (byEp[d.ep] ||= []).push(d);
console.log('\n--- mode F, per entry point (worst first) ---');
for (const [ep, arr] of Object.entries(byEp).sort((a,b)=>b[1].length-a[1].length).slice(0, 12))
  console.log(`${ep}: ${arr.length}/${tot[ep]}`);
console.log('\n--- mode F full list ---');
for (const d of F.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line))
  console.log(`${d.file}:${d.line}\t${d.name}${d.alias ? ` [alias ${d.alias}]` : ''}`);

console.log('\n=== MODE D full list (name/alias never appears anywhere in own entry-point specs) ===');
const D = res['D  bare name OR alias, OWN entry-point spec only'];
for (const d of D.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line))
  console.log(`${d.file}:${d.line}\t${d.name}${d.alias ? ` [alias ${d.alias}]` : ''}`);
