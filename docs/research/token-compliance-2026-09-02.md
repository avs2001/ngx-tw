# ngx-tw — token & design-system compliance audit

**Scope:** read-only. Branch `feat/vertical-rhythm`, HEAD `e2b5135`. No file under
`projects/`, `e2e/` or `.claude/` was written. No build/test command was run.

**Normative sources read in full:** `.claude/CLAUDE.md`, `docs/vertical-rhythm.md`,
`docs/audit-2026-09-register.md`, `projects/ngx-tw/theme/_semantic.css`,
`projects/ngx-tw/theme/_typography.css`, `projects/ngx-tw/theme/index.css`,
`projects/ngx-tw/theme/_dark.css`, `projects/ngx-tw/theme/_high-contrast.css` (header + machine diff).

**Policy applied per the user's ruling in this session:** CLAUDE.md's trigger font-size table
(xs `text-xs`, sm–md `text-sm`, lg–xl `text-base`) is authoritative; the "`text-base` only for
`tw-item` lg / `tw-stat` lg-xl" clause is the stale half. Colour *contrast ratios* and *palette
values* are out of scope throughout.

**No BLOCKERs found.** The highest tier below is HIGH. Saying so is more useful than padding the tier.

---

## 1. What already holds — with the commands that prove it

Every command is run from the repo root. `grep -v '\.spec\.ts'` excludes test fixtures, which
legitimately contain forbidden classes to prove consumer overrides win.

### 1.1 Zero raw Tailwind palette colours in shipped source — **register claim CONFIRMED, and stronger than stated** [verified: I read every hit]

```bash
# library, all colour-bearing utility positions, all 20 palettes — 0 hits
grep -rnE '\b(bg|text|border|ring|outline|from|to|via|fill|stroke|divide|shadow|accent|caret|decoration)-(blue|red|green|indigo|slate|gray|zinc|stone|amber|emerald|sky|rose|violet|teal|orange|lime|cyan|fuchsia|pink|purple|yellow)-[0-9]{2,3}\b' \
  projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts'

# same sweep across the DEMO app — also 0 hits
grep -rnE '<same pattern>' projects/demo/src --include='*.ts' --include='*.html' --include='*.css'
```

Result: **0 in library, 0 in demo.** Widening to *any* `palette-shade` token regardless of
position returns exactly 3 hits, all inside explanatory comments:
`paginator.ts:166`, `badge.ts:102`, `badge.ts:103`.

The only real palette classes anywhere are 4 lines in two spec files
(`alert.spec.ts:82,518`, `empty-state.spec.ts:86,446` — `bg-purple-500` as a twMerge-override
fixture). Legitimate. The register understated this: the rule holds in the demo too.

### 1.2 No `transition-all`, no forbidden shadows, no forbidden radii — **CONFIRMED** [verified]

```bash
grep -rn 'transition-all' projects/ngx-tw projects/demo/src                     # 0
grep -rnE 'shadow-(lg|xl|2xl)' projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts'  # 0
grep -rnE '\brounded([^-a-zA-Z]|$)' projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts'
```

- `transition-all`: **0** anywhere, library and demo.
- Forbidden shadows: **0** in library source. `shadow-2xl` appears only in `CHANGELOG.md` and
  `segmented-control.spec.ts:451,454` (override fixture).
- Forbidden radii in the **library**: the bare-`rounded` grep returns 7 tokens across 6 files,
  and I read every one — all are TypeScript identifiers or prose, not classes:
  `avatar.ts:62,80,150,182,199,280` / `badge.ts:215` / `segmented-control.ts:54,148,222,277,278,299,306`
  (a `rounded` **input name** and variant key), `number-input.ts:303-304` (a local `const rounded`),
  `calendar-cell.ts:39` and `table.ts:68` (prose). **Genuine violations: 0.**
  *(Demo is a different story — see M-6.)*

### 1.3 Neutral misuse — effectively zero [verified]

```bash
grep -rnE '(bg|text|border|ring|outline|fill|stroke|divide|placeholder)-neutral-[0-9]{2,3}' \
  projects/ngx-tw projects/demo/src --include='*.ts' --include='*.html'
```

**1 hit, and it is a comment** (`stat.ts:179`, which explicitly says *don't* use `text-neutral-700`).
44 library files use `text-fg-muted`. The surface/fg/border-token rule holds library-wide.

### 1.4 The two dark-mode activation blocks are in perfect lock-step [measured]

`_dark.css`'s own header warns the `[data-theme="dark"]` selector block and the
`@media (prefers-color-scheme: dark)` block are duplicated by hand and must be kept in sync.
Nothing enforced it. I diffed them mechanically:

```bash
python3 - <<'PY'
import re
src = open('projects/ngx-tw/theme/_dark.css').read()
i = src.index('[data-theme="dark"] {'); j = src.index('@media (prefers-color-scheme: dark)', i)
t = lambda s: dict(re.findall(r'^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);', s, re.M))
a, b = t(src[i:j]), t(src[j:])
print(len(a), len(b), sorted(set(a)^set(b)),
      [k for k in a if k in b and a[k].strip()!=b[k].strip()])
PY
```

**195 tokens each, zero set difference, zero value mismatch.** A consumer on OS-driven dark mode
gets byte-identical tokens to one who called `provideTheme('dark')`. This is worth a regression
test, because nothing but this diff protects it.

### 1.5 High-contrast theme covers every semantic slot [measured]

Same script against `_semantic.css` vs `_high-contrast.css`: **195 of 202** semantic tokens are
overridden. The 7 that are not are correctly not overridable — `--shadow-table-sticky*`
(they resolve *through* `--color-border`, which is overridden), `--text-2xs{,--line-height}`,
and `--color-overlay-control{,-hover}` (fixed by design; its comment explains the contract is
against consumer content, not against `--color-surface`).

Note for the record, since it changes how the raw-shade finding reads: `_dark.css` **inverts** the
`{role}-{shade}` ramp (`--color-primary-50` → `blue-950`), while `_high-contrast.css` **shifts**
it one step darker in the same direction as light (`--color-primary-50` → `blue-100`,
`--color-primary-500` → `blue-600`). Both are internally consistent.

### 1.6 `text-2xs` is genuinely defined at 0.6875rem [verified: I read it]

`projects/ngx-tw/theme/_semantic.css:41-42` — `--text-2xs: 0.6875rem; --text-2xs--line-height: 1rem;`
Tailwind v4 auto-generates the `text-2xs` utility from that pair.

```bash
grep -rn 'text-\[' projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts'   # 0
grep -rnE '\btext-(lg|xl|2xl|3xl|4xl)\b' projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts'
```

**0 arbitrary font sizes** and **0 `text-lg`-or-larger** class usages in library source (the single
`text-lg` grep hit is prose in `breadcrumbs.ts:101`). Also **0** arbitrary padding/gap:
`grep -rnE '\b(p|px|py|pt|pb|pl|pr|gap|gap-x|gap-y)-\[' …` → 0.

### 1.7 Every `size-3.5` half-step carries the mandated justification comment [verified: read all 15 sites]

`alert.ts:80,175` · `checkbox.ts:64,80` · `radio.ts:69,99` · `date-range-picker.ts:183` ·
`sort-header.ts:75` · `tags-input.ts:88` · `combobox.ts:132` · `date-picker.ts:186` ·
`select.ts:183` · `select-overlay.ts:222` · `paginator.ts:293` · `badge.ts:65,70`. Zero unjustified.

### 1.8 Every `animate.enter` / `animate.leave` class is defined and reduced-motion-guarded [verified]

All classes referenced (`fade-in/out`, `scale-in/out`, `collapsible-enter/leave`, `check-in`,
`step-panel-enter-forward/backward`, `timeline-item-enter{,-horizontal}`, `toast-enter/leave-*`)
are defined in `theme/_base.css:45-337` and every one appears in one of the three
`@media (prefers-reduced-motion: reduce)` blocks at `_base.css:339,348,384`.

### 1.9 Every template-literal class is covered by the Tailwind safelist [verified]

The only interpolated colour classes in library source are in `alert.ts:40-64` and
`toast-component.ts:45-56` (`bg-${role}-soft`, `text-${role}-soft-fg-muted`,
`hover:bg-${role}-soft-hover`, `border-${role}-border`, `text-${role}-solid-fg`, …). **All are
enumerated in the `@source inline(...)` safelist at `theme/index.css:41-45`.** No silently
un-generated utility. Command:

```bash
grep -rnoE "(bg|text|border|ring|outline|fill|stroke|divide|from|to|via|shadow)(-[a-z]+)?:?-?\\\$\{[a-zA-Z.()]+\}[a-z0-9-]*" \
  projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts' | sort -u
```

### 1.10 Pinned-height migration is clean [measured — this is section 4's headline]

Across the whole library exactly **one** file retains vertical padding next to a hard `h-*` pin,
and it is benign. Details and command in **section 4**.

---

## 2. Findings by severity

### HIGH

---

**H-1 — `file-upload` drag-over states double-invert in dark mode. NEW.**
`projects/ngx-tw/file-upload/file-upload.ts:159` and `:162`

```ts
draggingValid:   { dropzone: 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01]' },
draggingInvalid: { dropzone: 'border-error-500 bg-error-50 dark:bg-error-900/20' },
```

These are the **only two `dark:` utilities in the entire library** (`grep -rnoE 'dark:[a-z0-9:/\[\]().-]+' projects/ngx-tw … | grep -v spec` → exactly 2 hits). They are wrong, because
`_dark.css:31-41` already inverts the ramp: in dark mode `--color-primary-50` **is** `blue-950`,
i.e. the un-prefixed class is already the dark wash. The `dark:` override then swaps in
`--color-primary-900`, which in dark mode resolves to `blue-100` — a *near-white* wash at 20%
alpha, over a `gray-950` dropzone. The drag-over affordance inverts to a bright flash.

Why it survived: the library has no dark-mode visual test, and `dark:` appears nowhere else, so
there is no consistent pattern to compare against.

**Fix:** delete both `dark:` variants. `bg-primary-50` / `bg-error-50` already adapt.
Better still, move to the slot pair `bg-primary-soft` / `bg-error-soft`, which is what
`_semantic.css:170-180` instructs.

**Read this together with S-2.** They are one defect at two altitudes: CLAUDE.md *instructs*
authors to write explicit `dark:` overrides on colour-specific variants; the theme architecture
makes that harmful; and the only two `dark:` utilities anyone ever wrote are this bug. Fixing
H-1 alone patches an instance. Fixing S-2 — rewriting the rule to "never write `dark:` in a
component" — makes it a one-line lint rule (`no dark: variant in projects/ngx-tw`) that can never
recur. Do both, in the same change.

---

**H-2 — `tree` rows have no `min-h-*` floor, so xs rows render at 20px. Measurement KNOWN (register Tier 2, "target size"); the cause is NEW.**
`projects/ngx-tw/tree/tree.ts:134-139`

```ts
size: { xs: { content: 'py-0' }, sm: { content: 'py-0.5' }, md: { content: 'py-1' },
        lg: { content: 'py-1.5' }, xl: { content: 'py-2' } },
```

`docs/vertical-rhythm.md` §2 lists `tree` node in the `min-h-*` cohort. It has no `min-h` anywhere
(`grep -n 'min-h' projects/ngx-tw/tree/tree.ts` → 0). The node base at `:129` also hardcodes
`text-sm`, so the row height at xs is *exactly* one `text-sm` line box = **20px** — which is
precisely the 20px the register measured, and 4px under the WCAG 2.2 SC 2.5.8 floor the rhythm doc
calls non-negotiable. The register recorded the symptom; this is the mechanism.

**Fix:** add `min-h-6 / min-h-8 / min-h-9 / min-h-11 / min-h-12` to the size variants, exactly as
`menu.ts:61-65` does. Keep the `py-*` (the doc says the `min-h` set keeps its padding).

---

**H-3 — `command-palette` item rows have no floor and, unlike `select`, do not land on the scale by arithmetic. NEW.**
`projects/ngx-tw/command-palette/command-palette.ts:96-121`

```ts
xs: { item: 'py-1  text-xs' }, sm: { item: 'py-1.5 text-xs' }, md: { item: 'py-2 text-sm' },
lg: { item: 'py-2.5 text-sm' }, xl: { item: 'py-3 text-base' }
```

`vertical-rhythm.md` §2 lists option rows in the `min-h-*` cohort. With `_typography.css`'s pinned
line boxes this computes to **24 / 28 / 36 / 40 / 48** — sm is 4px under its 32px step and lg is
4px under its 44px step. Two dead-ish steps, and every value emergent rather than declared. Same
class of defect as H-2, but no size falls under the 24px WCAG floor and there is no independent
measurement behind it (see §5 caveat 2), so it sits below `tree`.

**Fix:** add `min-h-6 / min-h-8 / min-h-9 / min-h-11 / min-h-12` to the size variants, as
`menu.ts:61-65` does. Keep the padding.

---

**H-4 — `table` has only two cell densities against the library's five-size axis. NEW.**
`projects/ngx-tw/table/table.ts:389-396`

```ts
/* default  */ th/td/footerTd: 'px-4 py-3'
/* compact  */ th/td/footerTd: 'px-3 py-1.5'
```

Two densities, no `min-h-*`, and no mapping onto `xs…xl` at all — so a `tw-table` cannot be
size-matched to the controls beside it, and `vertical-rhythm.md` §2's "table cell" entry in the
`min-h` cohort has nothing to point at. This is a different defect from H-2/H-3: not a missing
floor on an existing axis, but a missing axis. It also intersects the register's Tier 4 item 2
(the `table` data-primitive input-cap exception has self-expired) — both point at the same
unfinished reshape.

**Fix:** decide first whether `table` gets the five-size axis. If yes, the floor comes with it.
Not a mechanical edit.

---

**H-5 — `time-picker` meridiem buttons pin a background that does not change between themes while their foreground does. NEW.**
`projects/ngx-tw/time-picker/time-picker.ts:271-278`

```ts
primary: 'bg-primary-500 text-on-primary hover:bg-primary-600', … (×8 roles)
```

Shade **500 is the ramp's unique fixed point**: `--color-primary-500: var(--color-blue-500)` in
*both* `_semantic.css:56` and `_dark.css:35`. Every other step maps to its complement. So the
background is identical in light and dark, while `text-on-primary` → `--color-primary-solid-fg`
resolves to `white` in light and `blue-950` in dark. Same fill, opposite text. That asymmetry is
almost certainly unintended — every other solid surface in the library moves together.

`progress-bar.ts:69` (`bg-info-500`) has the same fixed-point background but no paired foreground,
so it is cosmetic only. `radio.ts:159,181` and `checkbox.ts:135` use shade **600**, which does
invert, so those are symmetric.

**Fix:** `bg-{role}-solid text-{role}-solid-fg hover:bg-{role}-solid-hover` — the exact pairing
`_semantic.css:170-180` instructs, and what `button.ts:65-114` already does.

---

### MEDIUM

---

**M-0 — `select` option rows and `toast` derive their height from padding instead of declaring it. NEW.**
`select.ts:769-786` (`optionSizeClass`) · `toast-component.ts:18`

Both are named in `vertical-rhythm.md` §2's `min-h-*` cohort and neither has a `min-h` anywhere
(`grep -n 'min-h' projects/ngx-tw/select/select.ts` → 0).

- `select`: `px-2 py-1 text-xs` … `px-4 py-3 text-base`. This **does** compute to exactly
  24 / 32 / 36 / 44 / 48 — so it is correct today and wrong in principle. It is correct only because
  `_typography.css` pins line boxes in `rem`; it is one `leading-*` override or one nested
  `text-*` from drifting, silently, with no floor to catch it. That is verbatim the failure mode
  §3 was written to end. (Filed at MEDIUM rather than HIGH precisely because the arithmetic lands —
  and I note in §5 that arithmetic is what missed `select`'s 27px anomaly last time.)
- `toast`: `p-4` on the root, content-sized. Arguably a container rather than a control row, in
  which case §2's list is what should change. Either way the doc and the code disagree.

**Fix:** add the `min-h-*` floor to `select`'s option rows; decide whether `toast` belongs in the
cohort at all and correct whichever of the two is wrong.

---

**M-1 — Roughly 30 components reach past the slot tokens into the raw `{role}-{shade}` ramp, which `_semantic.css` explicitly says is not for library code. NEW (architecture drift, not a rendering bug).**

`_semantic.css:170-180` states the contract verbatim: *"Components consume these slots directly
(`bg-info-soft text-info-soft-fg`) and **never pick `{role}-{shade}` values themselves** … the
`{role}-{shade}` scale below is preserved for consumer escape hatches but is no longer the
recommended surface."*

```bash
grep -rnoE '(bg|text|border|border-[trblxyse])-(primary|secondary|accent|neutral|info|success|warning|error)-[0-9]{2,3}(/[0-9]+)?' \
  projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts' \
  | awk -F: '{split($1,a,"/"); print a[3]}' | sort | uniq -c | sort -rn
```

Top offenders (raw counts include the mandated `focus-visible:outline-primary-500`, so treat as an
upper bound): `button` 63, `collapsible` 42, `badge` 35, `radio` 32, `checkbox` 29, `slider` 28,
`form-field` 26, `time-picker` 22, `paginator` 21, `avatar` 17, `tooltip` 14, `switch` 10 … 31 files total.

Because `_dark.css` inverts the ramp and `_high-contrast.css` shifts it, **these do not render
wrong today**. The cost is different: every raw shade is a contrast decision made ad-hoc that the
slot layer was created to centralise, and a consumer who retunes a slot (the documented lever) does
not move them.

**Fix (incremental, not one diff):** migrate per component, highest-traffic first, to
`{soft, soft-hover, soft-fg, soft-fg-muted, solid, solid-hover, solid-fg, border, border-strong, fg, icon}`.
Keep `outline-primary-500` / `ring-primary-500` — the focus-ring spec mandates those literally.

---

**M-2 — The `--color-on-*` legacy aliases are still load-bearing in 6 components, despite `_semantic.css` saying to remove them. NEW.**
`_semantic.css:296-306`: *"New code MUST use the slot tokens. Remove this block once every consumer in the library has migrated."*

Still consuming them: `button.ts:65,72,79,93,100,107,114` · `checkbox.ts:142-149` ·
`switch.ts:141-148` · `paginator.ts:173-180` · `tooltip.ts:57,61,65,74,78,82,86` ·
`time-picker.ts:271-278`. `text-on-{role}` is byte-identical to `text-{role}-solid-fg`; the alias
buys nothing and blocks deleting the block.

**Fix:** mechanical rename `text-on-{role}` → `text-{role}-solid-fg` (already safelisted at
`theme/index.css:42`), then delete `_semantic.css:296-306` and its twins in `_dark.css` /
`_high-contrast.css`.

---

**M-3 — `flip-card`'s public JSDoc points consumers at a stylesheet that does not exist. NEW.**
`projects/ngx-tw/flip-card/flip-card.ts:100`

> *"…declared in `projects/ngx-tw/theme/_base.css` and re-exported via `ngx-tw/theme/default.css`."*

There is **no `default.css`** in the repo (`find . -name default.css -not -path '*/node_modules/*'`
→ nothing) and `package.json:28` only exports `./theme/*.css`, so
`@cdevhub/ngx-tw/theme/default.css` resolves to a 404. `README.md:49,141,330` correctly say
`@cdevhub/ngx-tw/theme/index.css`. This JSDoc is rendered into the demo's Compodoc API table, so a
consumer reads it and follows it.

The same stale filename survives in `.claude/CLAUDE.md:232`, `.claude/agents/prompt-architect.md:260,275`,
`.claude/agents/code-reviewer.md:409` and `.claude/skills/implement-component/SKILL.md:162,357`.
`docs/prompts/tw-carousel.md:62,838` and `docs/prompts/tw-timeline.md:13,55` already document that
the file does not exist — the correction never propagated back. Register **F7** fixed six CLAUDE.md
factual errors; this one is a seventh. (I did not edit any of these — read-only audit.)

**Fix:** change the one shipped JSDoc line to `@cdevhub/ngx-tw/theme/index.css`. The `.claude/*`
copies are the session owner's call.

---

**M-4 — `separator` `weight="thick"` uses a 3px arbitrary structural border. NEW.**
`projects/ngx-tw/separator/separator.ts:57` (`border-t-[3px]`) and `:60` (`border-l-[3px]`)

CLAUDE.md: *"Do not use `border-2` or thicker for structural borders. Reserve 2px borders for
active state indicators only."* A separator is the most structural element in the library. It is
also the only arbitrary-value border in the codebase and carries no justification comment, whereas
comparable off-scale values elsewhere (`avatar.ts:44`, `timeline.ts:236`, `date-picker.ts:210`) all do.

**Fix:** either cap `thick` at `border-t-2` / `border-l-2`, or keep 3px and add the one-line
justification the other off-scale values carry.

Adjacent, same rule, lower confidence (each is arguably an indicator rather than structure — flagging
for a decision, not asserting a defect): `file-upload.ts:143` `border-2 border-dashed` on the
dropzone, `timeline.ts:329` `border-2 border-border` on a pending marker, `slider.ts:145`
`border-2` on the thumb.

---

**M-5 — `carousel`'s slide-gap axis runs past the `gap-3` ceiling with no justification, while `timeline`'s identical extension has a 12-line one. NEW.**
`projects/ngx-tw/carousel/carousel.ts:315-317, 320-322` — `gap-x-4/6/8`, `gap-y-4/6/8`

`timeline.ts:158-177` extends the same ceiling for the same kind of reason (a gutter measured
against a scaling column, not against a glyph) and documents it thoroughly — that is why the
register logged timeline under **F16**. Carousel's is the same shape and undocumented, so the next
mechanical sweep will re-flag it.

```bash
grep -rnE '\bgap(-x|-y)?-(0\.5|4|5|6|7|8|9|10|11|12)\b' projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts'
```
→ 10 hits: 6 carousel (undocumented), 4 timeline (documented). Nothing else in the library.

**Fix:** add the justification comment. The values themselves are defensible — inter-slide spacing
is not intra-element spacing.

---

**M-6 — Demo app: 3,335 bare-`rounded` class tokens across 141 files. NEW, demo tier.**

One inline-`<code>` chip pattern, copy-pasted through every doc page:

```html
<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">…</code>
```

Counted precisely (splitting class attributes into tokens, not line-grepping):

```bash
python3 -c "
import re,pathlib
pat=re.compile(r'class=\"([^\"]*)\"'); n=0; f=set()
for p in pathlib.Path('projects/demo/src').rglob('*'):
    if p.suffix not in ('.ts','.html'): continue
    for m in pat.finditer(p.read_text(errors='ignore')):
        for c in m.group(1).split():
            if c in ('rounded','rounded-sm','rounded-2xl','rounded-3xl'): n+=1; f.add(str(p))
print(n,'tokens in',len(f),'files')"
```

The demo is the library's shop window and its own doc pages violate the radius scale everywhere.
Otherwise the demo is clean: 0 palette colours, 0 `transition-all`, 0 forbidden shadows, 1 bare
`focus:` (`card-overview.component.ts:175`). `text-lg`+ in demo prose is fine — the rule binds
library components, not consumer content.

**Fix:** one search/replace `rounded"` → `rounded-md"` inside the chip pattern.

---

### LOW

**L-1a (KNOWN by design) / L-1b (NEW) — `slider`.**
**L-1a:** retains `py-*` beside a pinned `h-*`. `vertical-rhythm.md` §4 explicitly places slider in
neither cohort, so this is documented, not drift — and the mechanism check below shows it cannot break.
**L-1b:** the off-scale `h-7` / `h-10` / `size-10` with no justification comment. That part is new.
`slider.ts:162` `region: 'h-6 py-1'` · `:174` `'h-8 py-1.5'` · `:180` `'h-9 py-2'`
(plus `:168` `'h-7 py-1'`, `:186` `'h-10 py-2'`)

Letter-of-the-law violation of `vertical-rhythm.md` §3. **Mechanism check: it is safe.** The
region's only in-flow child is the rail (`h-1`…`h-3`); the thumb and marks are absolutely
positioned. Nothing can push the box past the pin, so the height is not a lie here. Reported for
completeness, not as a regression.

The real slider finding is adjacent and is a genuine gap: `region: h-7` / `h-10` and
`thumb: size-10` (`:186`) sit off **both** the control-height scale (24/32/36/44/48) and the
square-interactive scale (which stops at `size-9`), with **no justification comment** — while
`date-picker.ts:210` and `timeline.ts:236` carry exactly such a comment for exactly this kind of
one-step extension.

**L-2 — `stepper` step indicator uses `size-12`, off the square-interactive scale, uncommented. NEW.**
`stepper.ts:98` (`size-12 text-base`), and `:94` `size-10`. The scale is xs–lg = 6/7/8/9, with a
codified saturation note for reusing `size-9`. Compare `date-picker.ts:210`, which extends by one
step *and explains why*.

**L-3 — `avatar` lg/xl use `size-12` / `size-16`. NEW.**
`avatar.ts:56,60`. CLAUDE.md's glyph scale tops out at `size-10` and names avatars as its example.
A 64px avatar is obviously legitimate; the scale simply doesn't cover it. Either extend the
documented scale or add the one-line note.

**L-4 — `radio`'s inner dot is `size-1.5` (6px), under the 8px dot floor. Same defect class as the register's `badge-dot` finding (Tier 3b) — that one is KNOWN, this instance is NEW.**
`radio.ts:71` (`dot: 'size-1.5'`). The comment two lines above (`:69`) justifies the *circle*'s
`size-3.5`, not the dot. `badge-dot.ts:29-30` has the same value at xs/sm — register Tier 3b already
records it as "6/6/8/10/10 against a documented 8/10/12 scale".

**L-5 — Two stale justification comments now cite the half of CLAUDE.md the user just ruled stale. NEW.**
- `timeline.ts:175-176`: *"`xl` density holds at text-sm — `text-base` is reserved for the codified tw-item lg exception"*
- `empty-state.ts:27`: *"`text-base` is permitted only for the codified tw-item lg …"*
- `breadcrumbs.ts:101`: *"`text-lg` is forbidden by CLAUDE.md, so `sm`/`md` both resolve to …"* — still
  true, but the surrounding reasoning is built on the same clause.

Under the ruling these comments now argue from a superseded rule. The *code* is fine either way;
the comments will mislead the next maintainer.

**L-6 — `tooltip`'s size axis skips a font step. NEW.**
`tooltip.ts:95-104`: xs `text-xs`, md `text-sm`, **lg `text-sm`**, xl `text-base`. Under the
authoritative trigger table lg should be `text-base`. Two adjacent sizes render identical type.
(Same dead-step shape the rhythm pass fixed in `time-picker` and `date-range-picker`.)

**L-7 — One placeholder transition has no `motion-reduce` guard. NEW.**
`form-field.ts:117` — `[&_input::placeholder]:transition-opacity [&_input::placeholder]:duration-normal`
with no `motion-reduce:transition-none`. It is the **only** unguarded transition in the library:

```bash
grep -rnE 'transition-(colors|shadow|opacity|transform|all|\[)' projects/ngx-tw \
  --include='*.ts' --include='*.html' | grep -v '\.spec\.ts' | grep -v 'motion-reduce'
```
→ 2 hits, one of which is a comment (`dialog-container.ts:34`).

**L-8 — Duration is spelled three ways for two values. NEW.**
`duration-normal` ×70 (37 files) vs literal `duration-200` ×13 (11 files) — same 200ms.
`duration-fast` ×2 vs literal `duration-150` ×1 — same 150ms. `duration-300` ×1
(`flip-card.ts:36`) is off the documented 150/200 scale entirely.
CLAUDE.md's transitions table still describes `duration-normal` as used by "tabs, tab-nav,
paginator, menu, command-palette, progress-bar" — six components; it is now 37. Spec lags code.
This interacts with **section 3**: `duration-200` is consumer-overridable, `duration-normal` is not.

**L-9 — Two undocumented opacity steps. NEW.**
`disabled:opacity-40` at `time-picker.ts:137,142`, `number-stepper.ts:35`, `timeline.ts:492`; and
`opacity-60` at `stepper.html:21`, `stepper.ts:161`, `table.ts:431,847`. CLAUDE.md documents
`opacity-50` / `opacity-70` / `disabled:opacity-30` only. Either widen the table or normalise.

**L-10 — One bare `focus:` in the library. NEW, benign.**
`input.ts:79` — `focus:outline-none focus-visible:outline-none` on the `inFormField: true` branch.
It is a *reset*, paired with its `focus-visible:` twin, and the wrapper owns the ring. It is
nonetheless the only bare `focus:` in `projects/ngx-tw` and a lint rule keyed on "never bare
`focus:`" would catch it. Verified by:
```bash
grep -rnoE '(^|[^-])\bfocus:[a-z0-9:/\[\]().-]+' projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts'
```
→ 1 hit. **Focus carve-outs are both correctly scoped:** `focus-visible:bg-*` appears only in
`menu.ts:52,70-77` (role `menuitem*`, codified) and — as `outline-none` + an active-state background
— in `command-palette.ts:80,126` (the `aria-activedescendant` listbox, codified, with the comment
at `:126` explaining it). No claimed carve-out on `tab`, `treeitem`, or a focus-managed option.

**L-11 — `number-stepper` has dead width steps. NEW.**
`number-stepper.ts:43-46`: `w-7` at both sm and md, `w-8` at both lg and xl. Two pairs of adjacent
sizes render identical — the same "dead step" defect the register logged for `checkbox`/`radio`
(Tier 3b) and that the rhythm pass fixed in `time-picker`.

**L-12 — Seven SVG glyphs carry a `size-*` class but no `shrink-0`. NEW, cosmetic.**
`select.ts:419` · `combobox.ts:320` · `date-range-picker.ts:370` · `time-picker.ts:488` ·
`date-picker.ts:387` · `alert.ts:176` · `toast-component.ts:189`.
CLAUDE.md: *"Always add `shrink-0` to icons in flex containers."*
**Not verified:** I did not check whether each parent is in fact a flex container under squeeze
pressure — this is a rule-text match on the class string, not a demonstrated collapse. Treat as a
consistency sweep, not a defect claim.
Found with:
```bash
grep -rnoE '<svg[^>]*class="[^"]*"' projects/ngx-tw --include='*.ts' --include='*.html' \
  | grep -v '\.spec\.ts' | grep -v 'shrink-0'
```
(`size-full` glyphs inside an already-sized square button — `toast-component.ts:149-164`,
`menu.ts:286,346` — are correctly excluded from the concern.)

---

### Spec inconsistencies (no code change implied)

**S-1 — CLAUDE.md's Typography table still prescribes `text-neutral-500` for subtitles. NEW.**
The table row reads *"Subtitles, descriptions | `text-sm` | normal + `text-neutral-500`"*, which
directly contradicts the Surface/Foreground/Border section three headings above it (*"use
surface/fg/border tokens … they handle dark mode automatically"*). **Zero components follow the
table**; 44 files use `text-fg-muted`. The code is right and the table is stale.
**Fix:** change that cell to `text-fg-muted`.

**S-2 — CLAUDE.md's dark-mode rule is stale relative to the theme architecture. NEW.**
CLAUDE.md: *"For color-specific variants … use `{color}-{shade}` tokens with **explicit `dark:`
overrides**."* The theme layer makes that both unnecessary and harmful — `_dark.css` inverts the
ramp and redefines every slot, and `_semantic.css:170-180` says so explicitly (*"removes the need
for `dark:` overrides on a per-component basis"*). The library follows the theme, not CLAUDE.md:
**2 `dark:` utilities exist library-wide and both are the bug in H-1.**
**Fix:** rewrite that rule to "never write `dark:` in a component; use slot tokens." Doing so turns
H-1 from a one-off into something a lint rule can catch.

**S-3 — `theme/default.css` referenced in 8 places, exists in none.** See M-3.

---

## 3. Complete custom-token / twMerge-blindness list (audit item 8)

`docs/vertical-rhythm.md:50-53` records `duration-normal` as the known case and asks for the full
set to size the deferred `createTV` + `twMergeConfig` work. **Here it is, measured** — not inferred —
against the installed `tailwind-merge@2.5.4`:

```bash
node -e "
const {twMerge}=require('tailwind-merge');
for (const c of ['duration-normal duration-500','duration-fast duration-500',
  'shadow-table-sticky shadow-md','shadow-table-sticky-cell-start shadow-sm',
  'animate-progress-bar-indeterminate animate-none','text-2xs text-lg',
  'bg-surface-muted bg-red-500','text-fg-muted text-red-500','bg-primary-soft bg-red-500',
  'text-primary-solid-fg text-red-500','text-on-primary text-red-500',
  'border-border-strong border-red-500','ring-primary-border-strong ring-red-500',
  'outline-primary-500 outline-red-500','divide-border divide-red-500',
  'bg-overlay-control bg-red-500','font-sans font-mono','h-9 h-11'])
  console.log((twMerge(c).split(' ').length>1?'BLIND  ':'merges '), JSON.stringify(c),'->',JSON.stringify(twMerge(c)));"
```

### The complete blind set — 6 classes, 91 use-sites, 3 conflict groups

| Class | Defined at | Uses / files | Tailwind group | Why blind |
|---|---|---:|---|---|
| `duration-normal` | `_typography.css:24` | **70 / 37** | `transition-duration` | validator is `isNumber \| isArbitrary`; `normal` is neither |
| `duration-fast` | `_typography.css:23` | **2 / 1** (`slider.ts:145,147`) | `transition-duration` | same |
| `shadow-table-sticky` | `_semantic.css:31` | **3 / 1** (`table.ts:445`) | `box-shadow` | validator is `'' \| none \| isTshirtSize \| isArbitraryShadow` |
| `shadow-table-sticky-cell-start` | `_semantic.css:32` | **3 / 1** (`table.ts:506`) | `box-shadow` | same |
| `shadow-table-sticky-cell-end` | `_semantic.css:33` | **3 / 1** (`table.ts:507`) | `box-shadow` | same |
| `animate-progress-bar-indeterminate` | `_base.css:208` (plain class, **not** a `@theme` token) | **4 / 1** (`progress-bar.ts:99`) | `animation` | validator is the 5 stock keywords + arbitrary |

**Consequence, concretely:** a consumer writing
`<tw-button class="duration-500">` gets `class="… duration-normal duration-500"` — both survive,
CSS source order decides, and the library usually wins. The same for
`<tw-table class="shadow-lg">` on sticky headers and
`<tw-progress-bar class="animate-none">` (which cannot stop the indeterminate animation at all).

### Confirmed NOT blind — every one of these merges correctly [measured]

This is the important half, because it bounds the work:

- **All colour tokens.** `bg-surface{,-raised,-overlay,-sunken,-muted}`, `text-fg{,-muted,-subtle}`,
  `border-border{,-muted,-strong}`, `bg-overlay-control{,-hover}`, every role slot
  (`bg-{role}-{soft,soft-hover,solid,solid-hover}`, `text-{role}-{soft-fg,soft-fg-muted,solid-fg,fg,icon}`,
  `border-/ring-{role}-{border,border-strong}`), and the legacy `text-on-{role}`.
  tailwind-merge's colour groups validate with `isAny`, so custom names collapse normally.
- **`text-2xs`.** `2xs` matches tailwind-merge's t-shirt-size regex, so it is classified as
  `font-size` and collapses against `text-lg` / `text-2xl` correctly.
- **`font-sans` / `font-mono`.** Stock names; unaffected by the custom values.
- **`h-6`…`h-12`.** Which is the whole point of `vertical-rhythm.md` §1's decision to reject
  `--height-control-*`. That decision is vindicated by measurement.

**Sizing the deferred work:** the `twMergeConfig` needs exactly **three** `classGroups` extensions —
`transition-duration` += `['normal','fast']`, `box-shadow` += the three `table-sticky*` names,
`animation` += `progress-bar-indeterminate`. Not 55 call sites' worth of analysis; one shared
`createTV` and a ~10-line config. The blast radius is 91 sites across 40 files but the *decision*
surface is three lines. Worth reprioritising — the doc defers this as if it were large.

---

## 4. Pinned height with surviving `py-*` — the full list (audit item 4's highest-value check)

```bash
# hard pins that still carry vertical padding on the same line
grep -rnE "\bh-(6|8|9|11|12)\b" projects/ngx-tw --include='*.ts' --include='*.html' \
  | grep -v '\.spec\.ts' | grep -E "\bpy-"

# and the complement, to catch off-scale pins the first sweep can't see
grep -rnE "\bh-(5|7|10|13|14|16)\b" projects/ngx-tw --include='*.ts' --include='*.html' | grep -v '\.spec\.ts'
```

### The list is exactly one component

| File:line | Class | Verdict |
|---|---|---|
| `slider.ts:162` | `region: 'h-6 py-1'` | **Benign** — see below |
| `slider.ts:168` | `region: 'h-7 py-1'` | Benign padding; `h-7` off-scale (L-1b) |
| `slider.ts:174` | `region: 'h-8 py-1.5'` | Benign |
| `slider.ts:180` | `region: 'h-9 py-2'` | Benign |
| `slider.ts:186` | `region: 'h-10 py-2'` | Benign padding; `h-10` off-scale (L-1b) |

**Why benign, explicitly:** the region is `relative flex items-center` (`slider.ts:135`) and its only
in-flow child is the rail (`h-1`…`h-3`). Thumb, marks and bubble are all `absolute`. Nothing can
grow past the pin, so `padding + content` never exceeds `height` and the border-box value stands.
`vertical-rhythm.md` §4 also places slider in neither cohort.

### Everything else is correct [verified: I read all 143 `h-*` sites]

- **Hard pins with vertical padding deleted, as §3 requires:** `button.ts:43-47` ·
  `input.ts:119-123` · `select.ts:185-189` · `combobox.ts:135-139` · `sort-header.ts:74-92` ·
  `core/tab-trigger-variants.ts:49-53` (shared by `tabs` + `tab-nav`) · `paginator.ts:289-322` ·
  `segmented-control.ts:103-116` · `date-picker.ts:255-259` · `date-range-picker.ts:239-243` ·
  `time-picker.ts:239-243` · `calendar-cell.ts:56-58` · `calendar-header.ts:18`.
- **`min-h-*` with padding retained, also as §3 requires:** `textarea.ts:53-57` ·
  `tags-input.ts:129-133` · `form-field.ts:157-161` · `item.ts:53,60,68` · `menu.ts:61-65` ·
  `collapsible.ts:81-85` · `breadcrumbs.ts:114-154` · `checkbox.ts:95-124` · `radio.ts:104-132`.
- **Documented non-participants behave as documented:** `date-picker.ts:263`
  (`customTrigger: true` → `py-2`, the consumer owns that box, §6) · `button.ts:123`
  (`variant="link"`, no pin, with the comment) · `segmented-control.ts:103` (`h-6 p-0` at xs — the
  one accessibility trade-off §6 records).
- `calendar-header.ts:16,20` carries `py-1` / `py-1.5` on a **non-pinned** nav row; the nav buttons
  themselves are `h-9 w-9` at `:18`. Consistent.

**Conclusion:** the pinned-height migration is clean. Section 4 has one entry, and that entry cannot
regress. The residual risk in this area is not padding — it is the four components with **no floor
at all** (H-2, H-3), which the pinned-vs-padding sweep by construction cannot see.

---

## 5. What I could not verify without rendering

These are the honest gaps. Each needs a browser or a build, both of which were out of bounds.

1. **Dark and high-contrast appearance.** I verified token *definitions* and *lock-step*
   mechanically, and I traced H-1 and H-5 through the cascade by hand. I did not see a pixel.
   H-1's severity in particular rests on `--color-primary-900 → blue-100` at 20% alpha over
   `gray-950`; that is arithmetic on the files, not an observation. The register notes
   (Tier 2, coverage gap 3) that high-contrast has **zero** verification today, which is the same gap.
2. **The computed height of every component with no `min-h-*` floor (H-2, H-3, M-0).**
   `tree` at xs is the only one corroborated independently — the register measured 20px, matching my
   reading of `tree.ts:129,135`. For `command-palette` (H-3) and `select` / `toast` (M-0) I computed
   from padding + the `rem`-pinned line boxes; computed style could differ (a `border`, a `leading-*`
   override, an inherited font strut). The register's own `select` 27px anomaly — caused by
   `inline-flex` vs `flex`, not by padding — is exactly the kind of thing this arithmetic misses.
   Measure these on `/foundations/rhythm` before acting on H-3 or M-0.
3. **Whether any Tailwind utility fails to generate.** I verified every interpolated class against
   the safelist by reading, but the real check is `verify:package` against a clean consumer install
   (register says it passes) — and that only covers what existed at the last build.
4. **Whether `shrink-0` is genuinely needed at each L-12 site.** That depends on flex-basis and
   sibling content at runtime.
5. **twMerge behaviour under `tailwind-variants`' own merge path.** My section-3 numbers come from
   calling `twMerge` directly at the installed version. `tv()` with `{ twMerge: true }` routes
   through the same function, so the result should hold, but I did not exercise a real `tv()` config.
6. **Anything about colour values or contrast** — excluded by instruction, and deliberately absent
   above. Where a finding touches a pairing (H-5), I describe the *asymmetry across themes*, not the
   ratio.

---

## Appendix — KNOWN vs NEW at a glance

| ID | Finding | Status |
|---|---|---|
| H-1 | `file-upload` dark double-inversion | **NEW** |
| H-2 | `tree` missing `min-h` floor | symptom KNOWN (register Tier 2, target size); **cause NEW** |
| H-3 | `command-palette` item rows off-scale, no floor | **NEW** |
| H-4 | `table` has 2 cell densities, not 5 | **NEW** (touches register Tier 4 item 2, KNOWN) |
| H-5 | `time-picker` fixed-point background pairing | **NEW** |
| M-0 | `select` / `toast` heights emergent, not declared | **NEW** |
| M-1 | ~30 components on the raw `{role}-{shade}` ramp | **NEW** |
| M-2 | `--color-on-*` legacy aliases still in use | **NEW** |
| M-3 | `flip-card` JSDoc → nonexistent `default.css` | **NEW** (adjacent to register F7) |
| M-4 | `separator` 3px structural border | **NEW** |
| M-5 | `carousel` gap ceiling undocumented | **NEW** (timeline's equivalent is KNOWN, F16) |
| M-6 | demo: 3,335 bare `rounded` | **NEW** |
| L-1a | `slider` keeps `py-*` beside a hard `h-*` pin | **KNOWN by design** — `vertical-rhythm.md` §4 places slider in neither cohort; verified harmless |
| L-1b | `slider` `h-7` / `h-10` / `thumb: size-10` off both scales, uncommented | **NEW** |
| L-4 | `radio` 6px dot | class KNOWN (Tier 3b, `badge-dot`); **this instance NEW** |
| L-5 | stale `text-base` justification comments | **NEW** (created by today's ruling) |
| L-8 | duration spelled three ways | **NEW** |
| L-11 | `number-stepper` dead width steps | class KNOWN (Tier 3b dead steps); **instance NEW** |
| S-1 | CLAUDE.md typography table says `text-neutral-500` | **NEW** |
| S-2 | CLAUDE.md `dark:` override rule is stale | **NEW** |
| §3 | complete twMerge-blind list | extends KNOWN (Tier 3 / `vertical-rhythm.md:50-53`) from 1 class to **6, measured** |

**Verification results — not findings.** These are checks that passed; they belong in §1, and are
listed here only so the register's spot-check requests are visibly answered:

| Check | Result |
|---|---|
| §1.1 register claim: no raw palette colours in shipped source | **CONFIRMED**, and extended — the demo is clean too |
| §1.2 register claim: no `transition-all`, no forbidden shadows, no forbidden radii | **CONFIRMED** for the library (demo radii are a separate finding, M-6) |
| §1.4 `_dark.css` two activation blocks in lock-step | **PASS** — 195/195, zero divergence. Previously unchecked; worth a CI guard |
| §1.5 `_high-contrast.css` covers every semantic slot | **PASS** — 195/202, the 7 gaps all correct by construction |
| §1.7 every `size-3.5` justified · §1.8 every keyframe defined + reduced-motion-guarded · §1.9 every interpolated class safelisted | **PASS** |
