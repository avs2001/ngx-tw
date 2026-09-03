#!/usr/bin/env node
/**
 * Pass 8 — the border-contrast failures the THEME fix cannot reach.
 *
 * `theme-contrast.spec.ts` asserts the semantic `--color-{role}-border{,-strong}`
 * tokens, and pass 8 raised the light scheme's until every scheme cleared 3:1.
 * That says nothing about a component that names a palette step directly:
 * `badge.ts`'s outline variant is `border-{role}-300`, which resolves through
 * `--color-{role}-300` and is untouched by the slot change.
 *
 * So this scans the library's own source for raw-scale
 * `border|ring|outline|divide-{role}-{step}` utilities and measures each against
 * the light scheme's `--color-surface` (white), which is the background nearly
 * all of them are painted on. Colour maths is `p6-contrast.mjs`'s, validated
 * there against Tailwind's published hexes.
 *
 * A FAIL row is not automatically a defect: SC 1.4.11 exempts purely decorative
 * boundaries, and `separator`'s coloured rule plausibly qualifies while
 * `badge`'s outline (the badge's only boundary) plausibly does not. The output
 * is the candidate list; the judgment is per-use.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = '/Users/ciprianiuga/dev/sandbox/ngx-tw';
function oklchToSrgb(L,C,H){const h=(H*Math.PI)/180,a=C*Math.cos(h),b=C*Math.sin(h);
 const l=(L+0.3963377774*a+0.2158037573*b)**3,m=(L-0.1055613458*a-0.0638541728*b)**3,s=(L-0.0894841775*a-1.291485548*b)**3;
 return [4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.707614701*s]
   .map(v=>{const e=v<=0.0031308?12.92*v:1.055*Math.pow(Math.max(v,0),1/2.4)-0.055;return Math.min(1,Math.max(0,e));});}
const lin=c=>(c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
const lum=([r,g,b])=>0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
const ratio=(x,y)=>{const a=lum(x),b=lum(y);const[hi,lo]=a>b?[a,b]:[b,a];return (hi+0.05)/(lo+0.05);};
const P=new Map();
{const css=readFileSync(`${ROOT}/node_modules/tailwindcss/theme.css`,'utf8');
 let m;const o=/--(color-[a-z0-9-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/g;
 while((m=o.exec(css))!==null)P.set(m[1],oklchToSrgb(+m[2]/100,+m[3],+m[4]));
 const h=/--(color-[a-z0-9-]+):\s*#([0-9a-fA-F]{3,6})\b/g;
 while((m=h.exec(css))!==null){const x=m[2].length===3?m[2].split('').map(c=>c+c).join(''):m[2];
  P.set(m[1],[0,2,4].map(i=>parseInt(x.slice(i,i+2),16)/255));}}
const HUE={primary:'blue',secondary:'slate',accent:'violet',info:'sky',success:'green',warning:'amber',error:'red'};
const WHITE=P.get('color-white');
const files=[];
(function walk(d){for(const e of readdirSync(d)){const p=join(d,e);
  if(statSync(p).isDirectory()){if(e!=='node_modules')walk(p);}
  else if(/\.(ts|html)$/.test(e)&&!/\.spec\.ts$/.test(e))files.push(p);}})(`${ROOT}/projects/ngx-tw`);
const hits=new Map();
for(const f of files){const src=readFileSync(f,'utf8');
  for(const m of src.matchAll(/\b(border|ring|outline|divide)-(primary|secondary|accent|info|success|warning|error)-(\d{2,3})\b/g)){
    const key=`${m[1]}-${m[2]}-${m[3]}`;
    if(!hits.has(key))hits.set(key,new Set());
    hits.get(key).add(f.replace(ROOT+'/projects/ngx-tw/',''));}}
const rows=[...hits].map(([k,fs])=>{const [,role,step]=k.match(/^[a-z]+-([a-z]+)-(\d+)$/);
  const c=P.get(`color-${HUE[role]}-${step}`);return {k,r:ratio(c,WHITE),files:[...fs]};})
  .sort((a,b)=>a.r-b.r);
console.log('raw-scale border/ring/outline utilities in ngx-tw components, on white (light --color-surface)\n');
for(const {k,r,files} of rows)
  console.log(`${(r<3?'FAIL':'pass').padEnd(5)} ${r.toFixed(2).padStart(5)}  ${k.padEnd(26)} ${files.join(', ')}`);
console.log(`\n${rows.filter(r=>r.r<3).length} of ${rows.length} distinct utilities below 3:1.`);
