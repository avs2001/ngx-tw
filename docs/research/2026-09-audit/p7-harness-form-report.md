# P7 — form-control harnesses (`tags-input`, `transfer`, `file-upload`)

Three new entry points, each modelled on `select/testing/`: a parent harness + a per-item
harness, `ng-package.json`, an `index.ts` with named re-exports, and one spec that drives the
component **through the harness only**.

    projects/ngx-tw/tags-input/testing/{ng-package.json,index.ts,tags-input-harness.ts,tags-input-tag-harness.ts,tags-input-harness.spec.ts}
    projects/ngx-tw/transfer/testing/{ng-package.json,index.ts,transfer-harness.ts,transfer-item-harness.ts,transfer-harness.spec.ts}
    projects/ngx-tw/file-upload/testing/{ng-package.json,index.ts,file-upload-harness.ts,file-upload-file-harness.ts,file-upload-harness.spec.ts}

**No existing library file was modified.** No `data-*` attribute was added. `angular.json` and
`tsconfig.spec.json`/`tsconfig.lib.json` already cover these directories via `<component>/**/*.ts`
globs, so nothing there needed touching either.

---

## Public surface

### `@cdevhub/ngx-tw/tags-input/testing`

`TagsInputHarness` (`tw-tags-input`) — `with({label, disabled})`, `getLabel`, `isDisabled`,
`isRequired`, `isInvalid`, `getTags`, `getTagTexts`, `getInputValue`, `addTag`, `typeInput`,
`removeTag`, `clearInput`, `focus`, `blur`.

`TagsInputTagHarness` (`[twBadge]`) — `with({text})`, `getText`, `getRemoveLabel`, `remove`.

### `@cdevhub/ngx-tw/transfer/testing`

`TransferHarness` (`tw-transfer`) — `with({label, disabled})`, `getLabel`, `isDisabled`,
`getTitle`, `getItems`, `getItemTexts`, `getItemCount`, `checkItem`, `setAllChecked`,
`moveToTarget`, `moveToSource`. Plus the exported type `TransferHarnessSide`.

`TransferItemHarness` (`[role="option"]`) — `with({text, checked, disabled})`, `getText`,
`isChecked`, `isDisabled`, `check`, `uncheck`.

### `@cdevhub/ngx-tw/file-upload/testing`

`FileUploadHarness` (`tw-file-upload`) — `with({label, disabled})`, `getLabel`, `isDisabled`,
`isRequired`, `isInvalid`, `getFiles`, `getFileNames`, `removeFile`.

`FileUploadFileHarness` (`ul[role="list"] > li`) — `with({name})`, `getName`, `getText`,
`getMetaText`, `remove`.

---

## The `file-upload` judgement call: **no `attach()`**

`attach(files)` is **not** exposed, and this is a hard "cannot", not a preference.

Selecting a file means populating `HTMLInputElement.files`, which is read-only to script. The
component's own spec does it with `Object.defineProperty(input, 'files', { get })` on the raw
node — the only way. CDK's `TestElement` has no operation that can express it: `setInputValue`
assigns `.value`, `sendKeys` types characters, and `dispatchEvent(name, data)` can only carry
JSON-ish `EventData`, so a real `File` cannot cross into a WebDriver environment either. An
`attach()` built on `UnitTestElement.element` would work in Testbed and silently do nothing
anywhere else — a harness that lies about being environment-agnostic, frozen forever.

The harness documents the supported path instead: seed through the bound form control
(`writeValue` accepts `File[]`), then use the harness for everything downstream. The spec does
exactly that, so the "attach" gap is visible in the test rather than hidden.

**Consequence worth flagging:** a consumer cannot harness-test their *own* "user picks a file"
flow. That is a CDK/DOM limitation, not a missing ngx-tw hook — no `data-*` attribute would fix
it.

---

## Does `@angular/cdk/listbox` ship harnesses to compose? — **No.** (evidence)

Checked against the installed `@angular/cdk@22.0.5` (the package uses an `exports` map, not
directories, so the check is on the map and the emitted typings):

    $ node -e "const p=require('@angular/cdk/package.json');
    >   console.log(Object.keys(p.exports).filter(k=>/listbox|testing/.test(k)))"
    [ './listbox', './testing', './testing/selenium-webdriver', './testing/testbed' ]

    $ node -e "console.log(require('@angular/cdk/package.json').exports['./listbox'])"
    { types: './types/listbox.d.ts', default: './fesm2022/listbox.mjs' }

    $ grep -c Harness node_modules/@angular/cdk/types/listbox.d.ts
    0

There is no `./listbox/testing` subpath, and the listbox typings contain the substring `Harness`
zero times. The three `./testing*` subpaths are the generic *infrastructure* —
`ComponentHarness`, `HarnessPredicate`, `TestElement`, and the Testbed / Selenium environments —
not component harnesses. Component harnesses ship from `@angular/material/<component>/testing`,
and `@angular/material` is not a dependency of this repo (`ls node_modules/@angular` →
`build cdk cli common compiler compiler-cli core forms platform-browser router`). CDK's behaviour
primitives (`CdkListbox`, `CdkMenu`, `CdkTree`, `CdkDialog`) publish no harnesses in v22.0.5.

So there is nothing to compose. What `TransferItemHarness` does instead is read the ARIA that
`CdkListbox`/`CdkOption` own — `aria-selected` for the ticked state, `aria-disabled` for the
per-item predicate — rather than anything ngx-tw renders. That is the composition available: the
contract, not a class.

---

## Missing stable hooks (the useful part)

### 1. `transfer` has no per-panel marker — **highest-value gap**

The two panels are one `ng-template` instantiated twice. Nothing on the panel element, its
header, or its list says which side it is. The only per-side hook in the DOM is the
auto-generated title id, `tw-transfer-N-{source,target}-title`, which the listbox references via
`aria-labelledby`. The harness matches on that suffix — as `transfer.ts`'s own
`focusDestination()` already does, for the same reason.

Ordering is *not* a workable substitute: a panel that empties drops its listbox entirely (an
empty `role="listbox"` violates `aria-required-children`), so `listboxes[1]` is not reliably the
target. The spec pins this case.

The select-all checkbox is worse: it sits in the header, outside the listbox, so it cannot be
reached through the `aria-labelledby` hook at all. The harness falls back to
`div:has(> [id$="-source-title"]) > [role="checkbox"]` — a *structural* selector, the one place
in these three harnesses that would break if the header markup were re-nested.

**Suggested fix (needs maintainer approval, it is public API):** `data-tw-transfer-panel="source"`
/ `"target"` on the panel element. One attribute retires both workarounds.

### 2. `file-upload` drag-over state cannot be read at all

`isDragging` / `dragHasInvalidFiles` drive only the `stateVariant` → Tailwind classes on the
dropzone. There is no attribute, no ARIA, no text. A harness can *trigger* a drag
(`dispatchEvent('dragenter', { dataTransfer: { types: ['Files'] } })` type-checks as `EventData`)
but has no way to observe the result without asserting class names, which is exactly what the
testing guidance forbids. **No drag surface is exposed.** A `data-dragging` / `data-drag-invalid`
attribute on the host would make it expressible.

### 3. `file-upload` per-item status has no hook

`FileUploadItem.status` reaches the DOM only inside the meta string (`10 B · Failed — <error>`)
and in `progressColorFor`'s classes. `getMetaText()` recovers it by subtracting the file name
(taken from the remove button's `aria-label`) from the row text — deliberate, and documented in
place. A `data-status` on the row `<li>` would make it a first-class read.

### 4. `file-upload` row name/meta run together

`<span>{{name}}</span><span>{{meta}}</span>` with only a whitespace-only text node between them,
which Angular strips. `li.textContent` is therefore `notes.txt10 B`. Pinned in the spec so the
`getMetaText()` subtraction stays honest.

### 5. CDK's synthetic typing cannot drive the separator-key commit faithfully

`typeInElement` appends every character to `input.value` regardless of the `preventDefault()`
`tags-input` calls on the separator keydown. So `typeInput('beta,')` commits `beta` **and**
leaves a stray `,` in the input, where a real browser swallows it. Documented on `typeInput`,
pinned in the spec (so the assertion fails loudly if CDK ever starts honouring
`preventDefault`), and `addTag()` is offered as the commit path that behaves.

### 6. Observation, not a blocker: `transfer` sets `aria-invalid` on `role="group"`

`transfer.ts` host binds `'[attr.aria-invalid]': 'errorState() || null'` on a `role="group"`
host. ARIA 1.2 removed `aria-invalid` from the global set, so this is the same class of finding
as pass 1's F9 — which is why `tags-input` and `file-upload` had *both* `aria-required` and
`aria-invalid` moved onto their inner value-owning control. `transfer` looks like it was missed.

I did not fix it (not my file) and, importantly, **`TransferHarness` deliberately exposes no
`isInvalid()`** — freezing a harness method onto an attribute that should move would cement the
bug. `TagsInputHarness.isInvalid()` and `FileUploadHarness.isInvalid()` do exist, reading the
inner input, and both specs assert they are *not* reading the group.

---

## Deliberately left out

- **`transfer`**: `isMoveToTargetDisabled()` / `isMoveToSourceDisabled()` (a move that does
  nothing is observable through `getItemTexts`); per-panel `search(query)` (`showSearch` is
  off by default, and the checked-set pruning it exercises is component-internal);
  `getCountText()` (the header count is `getItemCount()` by another name — same number).
- **`tags-input`**: `removeTagAt(index)` — `(await h.getTags())[i].remove()` already says it,
  and the component's own `removeTag(tag | number)` overload is ambiguous for numeric tags;
  the harness does not inherit that trap. No `clear()`: there is no clear-all control in the DOM.
- **`file-upload`**: `attach()` (above); `clear()` (no DOM control — `clear()` is API-only);
  `openPicker()` (a click that cannot produce a selection in any test environment);
  `getHeadlineText()` / `getTriggerText()` (presentational, no consumer test needs them yet).
- **All three**: no class-name reads, no `size`/`variant`/`color` getters.

---

## Gate results

| Gate | Result |
|---|---|
| `ng test ngx-tw` — the three new harness specs (11 + 14 + 9) | **34/34 green** |
| `ng test ngx-tw` — the three components in full, harnesses included | **189/189 green, 6 files** |
| `npm run build:lib` | **exit 0**; `✔ Built @cdevhub/ngx-tw/{tags-input,transfer,file-upload}/testing` |
| `npm run verify:package` | **PASS**, 73 entry points exported, 177 KB compiled from a clean consumer install |
| `npx eslint` over the three new `testing/` dirs | **clean, exit 0** |
| `tsc --noEmit` over the three components + their new `testing/` dirs | **clean, exit 0** |

Emitted bundles import exactly one package each — `@angular/cdk/testing` — which is already a
declared peer dependency in both `package.json` files, so the CLAUDE.md undeclared-peer trap does
not apply here.

**Honest note on the shared runner.** `ng test ngx-tw` type-checks the whole library program, so
sibling agents' half-written files repeatedly failed my runs with errors that were never mine:
`date-picker/testing/date-picker-harness.ts` (TS2801), `date-range-picker/testing/…` (TS2801),
`tooltip/testing/tooltip-harness.spec.ts` (unterminated template literal), `table/table.spec.ts`
(NG1010), and a stretch where a concurrent `build:lib` left `dist/ngx-tw/{calendar,collapsible}`
missing. While that was true I kept an independent signal by type-checking my three components in
isolation against a scratchpad tsconfig. Every number in the table above is from a run where the
whole program compiled, after those settled.

Two bugs the specs caught, both now fixed and pinned:

1. `TransferHarness.setAllChecked(side, false)` from the tri-state `mixed` state **selected
   everything** instead of clearing it — one click on an indeterminate `tw-checkbox` resolves to
   *checked* (`checkbox.ts:561`, `wasIndeterminate ? true : !checked`). It now issues the second
   click, and `'clears the select-all from the tri-state middle'` fails if that is removed.
2. The `file-upload` row whitespace finding (#4 above), which the first run surfaced as
   `notes.txt10 B`.
