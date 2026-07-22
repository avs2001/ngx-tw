export const meta = {
  name: 'treeshake-audit',
  description: 'Deep tree-shakeability audit of ngx-tw: prove sideEffects:false holds, map import closures, find leaks/retention',
  whenToUse: 'Auditing the ngx-tw library for tree-shaking problems, leaks, and gaps across all entry points',
  phases: [
    { title: 'Explore', detail: 'shard the library + specialists (core hub, closure graph, new components, dist forensics)' },
    { title: 'Verify', detail: 'adversarially verify every material finding — name the consumer import or it is not a finding' },
  ],
}

const ROOT = '/Users/ciprianiuga/dev/sandbox/ngx-tw'
const SRC = ROOT + '/projects/ngx-tw'
const DIST = ROOT + '/dist/ngx-tw'

const CALIBRATION = `
WHAT COUNTS as a real tree-shaking finding:
- Module-SCOPE (top-level, OUTSIDE any class/function body) executable code with observable side effects: a function call whose result is discarded or that mutates state; mutation of an imported or global object at load time; registration into a shared mutable registry; \`console.*\`; eager \`new\` of a service/singleton at module scope; bare side-effect imports (\`import 'x'\`).
- A cross-entry-point VALUE import (\`import { X }\`) that is used ONLY as a type — it should be \`import type\` — creating a needless runtime module edge.
- A component importing a HEAVIER sibling entry point than its purpose warrants (so importing the light component drags unrelated code into the consumer bundle).
- A barrel/index re-exporting code from OUTSIDE its own entry point, or an \`export *\` that needlessly widens/couples the surface.
- Anything that makes \`sideEffects:false\` a LIE for a given entry point.

WHAT DOES NOT COUNT — never report these; they are correct and tree-shake fine under sideEffects:false:
- \`const X = tv({...})\` at module scope (tailwind-variants config — pure).
- \`new InjectionToken(...)\` at module scope (pure token creation).
- \`Record<...>\`/lookup-table consts; top-level \`export const\` arrays/objects/strings/frozen maps.
- \`@Component\`/\`@Directive\`/\`@Pipe\`/\`@Injectable\` decorators (Angular marks these pure).
- \`signal()\`/\`computed()\`/\`linkedSignal()\`/\`inject()\` used as CLASS FIELD initializers (instance-level — run only on instantiation, NOT at module scope).
- Type/interface/union-type declarations; \`import type\` edges (they fully erase).
- Pure const expressions.

For EACH real finding: concrete evidence (file:line + the actual code), the EXACT consumer import statement under which it manifests, severity, recommendation, confidence. Prefer FEW high-signal findings over padding. List clean checks in clean[] so the report can show verified-clean coverage.`

const LEAD_BASELINE = `
ALREADY VERIFIED CLEAN BY THE LEAD — re-confirm within your scope if relevant, but do NOT re-report these as new findings:
- No TS enums; no @NgModule; no \`declare global\`/\`declare module\`; no APP_INITIALIZER/ENVIRONMENT_INITIALIZER.
- No root-barrel imports (\`from '@cdevhub/ngx-tw'\` with no subpath) anywhere in the lib.
- No cross-entry \`../sibling/\` relative imports — cross-entry deps go through package paths (correct for ng-packagr).
- Only ONE internal \`export *\`: calendar/index.ts re-exports ./selection (named exports beneath, intra-entry).
- luxon imported ONLY in calendar/luxon; lucide-angular ONLY in icon/lucide (leaf adapter entry points).
- Build exited 0 → no circular entry-point deps. Root dist sideEffects:false; per-entry FESM; exports map complete (61 subpaths, 0 missing).
- The lone providedIn:'root' is core/error-state-matcher.ts (TW_ERROR_STATE_MATCHER) — an InjectionToken factory, the IDEAL tree-shakeable pattern, explicitly documented/allowed.
Your value-add is what greps CANNOT see: module-scope side effects in real code, needless value-vs-type import edges, heavy/surprising closures, retention via DI, and subtle barrel coupling.`

const TOOLING = `
TOOLING: this machine's \`grep\` is ugrep and SILENTLY fails with some flag combos — ALWAYS use \`rg\` (ripgrep). Read files with the file reader. Source root: ${SRC} (exclude *.spec.ts — tests are not shipped). dist: ${DIST} (freshly built, exit 0). This is READ-ONLY analysis: do NOT run any build/install or write any file.`

const FINDER_PREAMBLE = `You are auditing the ngx-tw Angular component library for TREE-SHAKEABILITY problems. It publishes ~60 secondary entry points — each component is its own entry point \`@cdevhub/ngx-tw/<name>\`, with one root package.json carrying \`sideEffects:false\` and an exports map routing each subpath to its own FESM bundle. Goal: find anything that LEAKS code into consumer bundles or DEFEATS per-entry-point tree-shaking.
${TOOLING}
${CALIBRATION}
${LEAD_BASELINE}`

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['scope', 'findings', 'clean'],
  properties: {
    scope: { type: 'string' },
    clean: { type: 'array', items: { type: 'string' }, description: 'checks performed that came back clean (for verified-clean coverage)' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'severity', 'category', 'entryPoints', 'evidence', 'impact', 'recommendation', 'confidence'],
        properties: {
          title: { type: 'string' },
          severity: { enum: ['high', 'medium', 'low', 'info'] },
          category: { enum: ['side-effect', 'leak', 'retention', 'registration', 'barrel', 'heavy-dep', 'type-import', 'doc-mismatch', 'build-output', 'other'] },
          entryPoints: { type: 'array', items: { type: 'string' } },
          evidence: { type: 'string', description: 'concrete file:line or dist path + the actual code there' },
          impact: { type: 'string', description: 'the EXACT consumer import statement under which the problem manifests' },
          recommendation: { type: 'string' },
          confidence: { enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'verdict', 'reasoning', 'correctedSeverity'],
  properties: {
    title: { type: 'string' },
    verdict: { enum: ['confirmed', 'false-positive', 'needs-user-decision'] },
    reasoning: { type: 'string', description: 'MUST name the consumer import under which unused code is retained, or explain why benign' },
    correctedSeverity: { enum: ['high', 'medium', 'low', 'info', 'none'] },
  },
}

// ── Shards: cover every shipped entry point EXCEPT core/transfer/tree (owned by specialists) ──
const shards = [
  { label: 'shard:calendar', dirs: ['calendar'] },
  { label: 'shard:a-button', dirs: ['accordion', 'alert', 'aspect-ratio', 'avatar', 'badge', 'breadcrumbs', 'button'] },
  { label: 'shard:card-cmd', dirs: ['card', 'carousel', 'checkbox', 'code-block', 'collapsible', 'combobox', 'command-palette'] },
  { label: 'shard:date-flip', dirs: ['date-picker', 'date-range-picker', 'dialog', 'empty-state', 'file-upload', 'flip-card'] },
  { label: 'shard:form-pag', dirs: ['form-field', 'icon', 'input', 'item', 'menu', 'number-input', 'paginator'] },
  { label: 'shard:pop-sheet', dirs: ['popover', 'progress-bar', 'radio', 'segmented-control', 'select', 'separator', 'sheet'] },
  { label: 'shard:skel-step', dirs: ['skeleton', 'slider', 'sort', 'spinner', 'split', 'stat', 'stepper'] },
  { label: 'shard:switch-theme', dirs: ['switch', 'tab-nav', 'table', 'tabs', 'tags-input', 'textarea', 'theme'] },
  { label: 'shard:time-tooltip', dirs: ['time-picker', 'timeline', 'toast', 'tooltip'] },
]

const shardTasks = shards.map((s) => ({
  label: s.label,
  phase: 'Explore',
  prompt: `${FINDER_PREAMBLE}

YOUR SCOPE: these entry-point directories under ${SRC}:
${s.dirs.map((d) => '  - ' + d + '/').join('\n')}

For every non-spec .ts file under each dir, examine the MODULE SCOPE (everything outside class/function bodies) and the import block. Hunt for the "WHAT COUNTS" list. Be surgical: open files, look at the top-level statements and the imports. Return structured findings + a clean[] list of what you verified clean in this shard.`,
}))

const specialists = [
  {
    label: 'spec:core-hub',
    phase: 'Explore',
    prompt: `${FINDER_PREAMBLE}

YOU OWN THE \`core/\` ENTRY POINT — \`@cdevhub/ngx-tw/core\`, imported by 57 other entry points, so any defect amplifies 57×. Read every file under ${SRC}/core/ (incl. core/overlay/*, error-state-matcher, sort-handle, tab-trigger-variants, time-utils, types).
Specifically determine:
1. core/index.ts is named re-exports with zero module-scope side effects — re-verify by reading it and each re-exported file's module scope.
2. THE KEY QUESTION: the overlay coordinator CLASSES (PickerOverlayCoordinator, OverlayContainerCoordinator, and helpers under core/overlay/*) are exported from the SAME barrel as tiny values like TW_ERROR_STATE_MATCHER. Confirm that a consumer doing \`import { TW_ERROR_STATE_MATCHER } from '@cdevhub/ngx-tw/core'\` does NOT transitively force-bundle those coordinators. Reason concretely about whether named re-exports + sideEffects:false let the bundler drop unreferenced exports, OR whether any module-scope coupling (a top-level const that references multiple modules, a shared instance, re-export side effects) defeats it. This is the highest-stakes question for the hub.
3. Of the 57 importers, which import a core VALUE vs \`import type\`? Run: \`rg -n --type ts -g '!*.spec.ts' "ngx-tw/core" ${SRC}\`. Flag any VALUE import (\`import { X }\`) where X is used only as a type (should be \`import type\`).
Return findings + clean[].`,
  },
  {
    label: 'spec:closure-graph',
    phase: 'Explore',
    prompt: `${FINDER_PREAMBLE}

YOU OWN THE DEPENDENCY-CLOSURE MAP. Build the cross-entry import graph and compute, per entry point, the TRANSITIVE closure of sibling ngx-tw entry points a consumer bundles when importing it.
Method: \`rg -n --type ts -g '!*.spec.ts' "from '@cdevhub/ngx-tw/" ${SRC}\` → for each hit, map (source file's entry-point dir) → (imported subpath). CRITICAL: treat \`import type\` edges as NON-bundling (they erase at runtime) — distinguish type-only from value edges by reading the import statement. Compute transitive closures over VALUE edges only.
Report:
(a) closure size per entry point (how many sibling entry points each one transitively bundles);
(b) SURPRISING closures — a conceptually light component that drags in a heavy chain (overlay/CDK-overlay, calendar, luxon, lucide, form-field);
(c) CONFIRM calendar/luxon and icon/lucide are leaf adapters imported by NOTHING else in the lib (so luxon/lucide never enter a consumer bundle unless explicitly imported);
(d) any entry point whose VALUE closure exceeds ~5 siblings — list the chain.
Findings should flag genuinely surprising/heavy coupling (heavy-dep/leak category). Put the full per-entry closure table in scope/clean so the lead can include it. Return findings + clean[].`,
  },
  {
    label: 'spec:new-transfer-tree',
    phase: 'Explore',
    prompt: `${FINDER_PREAMBLE}

YOU OWN THE TWO NEW, UNTRACKED ENTRY POINTS — highest churn, highest risk: \`transfer/\` and \`tree/\` under ${SRC}. Read every non-spec .ts in both.
Check: (1) module-scope side effects; (2) DI/retention — forwardRef, providers arrays, inject() chains, ControlValueAccessor wiring (transfer is a form control; tree is NOT) that could force-retain code or create circular DI; (3) their cross-entry import CLOSURES — what does importing \`@cdevhub/ngx-tw/transfer\` or \`/tree\` drag in? list the chain; (4) every type-only import uses \`import type\`; (5) confirm sideEffects:false holds for both (no module-scope executable side effects). Also sanity-check the index.ts of each re-exports only its own public API.
Return findings + clean[].`,
  },
  {
    label: 'spec:dist-forensics',
    phase: 'Explore',
    prompt: `You are doing READ-ONLY forensics on the freshly-built ${DIST} (do NOT rebuild/install/write anything). ${TOOLING}
Verify the tree-shaking-critical build OUTPUT:
1. Root ${DIST}/package.json: sideEffects:false (confirmed) + exports map with per-subpath FESM. Spot-check 3 subpath entries resolve to existing fesm2022/*.mjs.
2. THE HIGHEST-STAKES QUESTION: the 59 secondary package.json files (e.g. ${DIST}/button/package.json) have NO sideEffects field and their \`module\` points to \`../fesm2022/<name>.mjs\`. The lead believes this is BENIGN because every FESM bundle physically lives in ${DIST}/fesm2022/, so the NEAREST package.json to each bundle is the ROOT one (sideEffects:false), and webpack/rollup determine sideEffects from the resolved file's on-disk location, not the subpath's package.json. CONFIRM or REFUTE this reasoning with specifics — is there ANY bundler/resolution path where the missing per-entry sideEffects causes an entry point to lose tree-shaking? This single answer is the spine of the audit.
3. FESM cross-entry inlining: for button, select, date-picker, transfer — \`rg "from '@cdevhub" ${DIST}/fesm2022/cdevhub-ngx-tw-<name>.mjs\`. Partial-compilation FESM should IMPORT siblings (e.g. core), not INLINE/duplicate them. Flag any bundle that inlines a sibling's code (duplication bloat).
4. theme entry: it ships BOTH a CSS asset (root ng-package assets glob) AND a TS entry (ThemeService/provideTheme). Confirm both are present in dist and the TS entry tree-shakes. Note theme is ABSENT from src/public-api.ts (root barrel) — record as a low-severity registration gap / intent question.
5. Bundle sizes: \`ls -la ${DIST}/fesm2022/*.mjs\` — flag any surprisingly large single-component bundle (possible accidental inlining).
Use rg/node/ls/cat. Return structured findings (category build-output) + a clean[] of what you verified.
${CALIBRATION}`,
  },
]

const tasks = [...shardTasks, ...specialists]
log(`Fanning out ${tasks.length} finders across the library (${shards.length} shards + ${specialists.length} specialists), then adversarial verify.`)

function verifyPrompt(f) {
  return `Adversarially verify this tree-shaking audit finding. DEFAULT to false-positive unless the evidence is airtight.
${TOOLING}

FINDING:
${JSON.stringify(f, null, 2)}

RULES:
- Read the ACTUAL code/dist at the cited location before ruling.
- To CONFIRM a side-effect/leak/retention finding you MUST name the exact consumer import statement under which unused code is RETAINED in the consumer bundle, and explain the mechanism. If you cannot, it is a FALSE-POSITIVE.
- Apply the calibration: tv({...}), new InjectionToken(...), Record/lookup consts, top-level export const data, Angular decorators, and signal()/computed()/inject() as CLASS-FIELD initializers are ALL correct and tree-shake under sideEffects:false — never confirm a finding that rests on these.
- For registration/doc-mismatch findings that are intent questions (e.g. theme absent from public-api), use verdict 'needs-user-decision'.
Return verdict + reasoning (name the consumer import, or the reason it is benign) + correctedSeverity.`
}

const results = await pipeline(
  tasks,
  (t) => agent(t.prompt, { label: t.label, phase: 'Explore', schema: FINDINGS_SCHEMA }),
  (res, t) => {
    if (!res) return { task: t.label, scope: '', clean: [], findings: [] }
    const material = (res.findings || []).filter((f) => f.severity !== 'info')
    const infos = (res.findings || []).filter((f) => f.severity === 'info')
    return parallel(
      material.map((f) => () =>
        agent(verifyPrompt(f), { label: 'verify:' + f.title.slice(0, 28), phase: 'Verify', schema: VERDICT_SCHEMA })
          .then((v) => ({ ...f, verdict: v }))
          .catch(() => ({ ...f, verdict: { title: f.title, verdict: 'confirmed', reasoning: 'verifier errored — left unverified', correctedSeverity: f.severity } }))
      )
    ).then((verified) => ({
      task: t.label,
      scope: res.scope || '',
      clean: res.clean || [],
      findings: [
        ...verified,
        ...infos.map((f) => ({ ...f, verdict: { title: f.title, verdict: 'info', reasoning: 'info-level, not verified', correctedSeverity: 'info' } })),
      ],
    }))
  }
)

const allFindings = results.flatMap((r) => (r ? r.findings : []))
const confirmed = allFindings.filter((f) => f.verdict && f.verdict.verdict === 'confirmed')
const decisions = allFindings.filter((f) => f.verdict && f.verdict.verdict === 'needs-user-decision')
const falsePos = allFindings.filter((f) => f.verdict && f.verdict.verdict === 'false-positive')
log(`Done. confirmed=${confirmed.length} needs-decision=${decisions.length} false-positive=${falsePos.length} across ${results.length} finders.`)

return {
  summary: { finders: results.length, confirmed: confirmed.length, needsDecision: decisions.length, falsePositive: falsePos.length },
  confirmed,
  decisions,
  falsePositive: falsePos,
  cleanCoverage: results.map((r) => ({ task: r.task, scope: r.scope, clean: r.clean })),
}
