/** Surface-vs-surface separation + the neutral-soft hover direction. */
import { readFileSync } from 'node:fs';
const ROOT='/Users/ciprianiuga/dev/sandbox/ngx-tw';
function ok(L,C,H){const h=H*Math.PI/180,a=C*Math.cos(h),b=C*Math.sin(h);
const l_=L+0.3963377774*a+0.2158037573*b,m_=L-0.1055613458*a-0.0638541728*b,s_=L-0.0894841775*a-1.291485548*b;
const l=l_**3,m=m_**3,s=s_**3;
return [4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.707614701*s]
 .map(v=>{const e=v<=0.0031308?12.92*v:1.055*Math.pow(Math.max(v,0),1/2.4)-0.055;return Math.min(1,Math.max(0,e));});}
const lz=c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
const lum=c=>0.2126*lz(c[0])+0.7152*lz(c[1])+0.0722*lz(c[2]);
const ratio=(x,y)=>{const a=lum(x),b=lum(y);const[h,l]=a>b?[a,b]:[b,a];return (h+0.05)/(l+0.05);};
const P=new Map();{const css=readFileSync(`${ROOT}/node_modules/tailwindcss/theme.css`,'utf8');let m;
const re=/--(color-[a-z0-9-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/g;
while((m=re.exec(css))!==null)P.set(m[1],ok(+m[2]/100,+m[3],+m[4]));
const r2=/--(color-[a-z0-9-]+):\s*#([0-9a-fA-F]{3,6})\b/g;
while((m=r2.exec(css))!==null){const h=m[2].length===3?m[2].split('').map(x=>x+x).join(''):m[2];
P.set(m[1],[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255));}}
const c=n=>P.get('color-'+n);
// surface, muted, sunken per scheme
const S={
 'light        ': ['white','gray-100','gray-50'],
 'dark         ': ['gray-950','gray-800','gray-950'],
 'high-contrast': ['white','gray-50','gray-100'],
 'HCD-A mirror ': ['black','gray-950','gray-900'],
 'HCD-B current': ['black','gray-800','gray-950'],
 'HCD-C spread ': ['black','gray-900','gray-800'],
};
console.log('scheme          muted/surf  sunken/surf   hover: soft->soft-hover');
console.log('-'.repeat(74));
for (const [n,[su,mu,sk]] of Object.entries(S)) {
  const dm=ratio(c(mu),c(su)), ds=ratio(c(sk),c(su));
  // neutral-soft = surface-muted, neutral-soft-hover = surface-sunken
  const dir = ds > dm ? 'AWAY from surface  OK' : 'TOWARD surface  INVERTED';
  console.log(`${n}   ${dm.toFixed(2).padStart(6)}      ${ds.toFixed(2).padStart(6)}      ${dir}`);
}
console.log('\nfg(white) on each candidate hc-dark muted/sunken, vs dark baseline 14.07 / 19.28:');
for (const [n,[,mu,sk]] of Object.entries(S)) if (n.startsWith('HCD'))
  console.log(`  ${n}  fg/muted=${ratio(c('white'),c(mu)).toFixed(2)}  fg/sunken=${ratio(c('white'),c(sk)).toFixed(2)}`);
