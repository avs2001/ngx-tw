#!/usr/bin/env node
// Validates the generated MCP index. Runs inside `release.mjs`'s local
// pre-flight — the gate a human actually has to get past to publish — and as an
// advisory CI job so breakage surfaces on the PR instead of at release time.
//
// An MCP server does not merely go stale, it *amplifies*: every consumer's
// model confidently emits whatever the index says. A wrong index is worse than
// no index. These checks are what make it trustworthy.
//
// Five checks, plus a type-check of the hand-authored guidance layer:
//   0. `tsc -p tsconfig.meta.json`  — ComponentMeta shape violations
//   1. coverage, both directions    — entry point ⇄ *.meta.ts
//   2. link integrity               — `related` / `whenNotToUse[].instead`
//   3. snippet API validation       — selectors + bindings vs the API layer
//   4. import-path validation       — `@cdevhub/ngx-tw/*` in ts snippets
//   5. snippet coverage             — WARN only; docs debt must not block a release
//
// Usage: node scripts/verify-mcp-index.mjs [--index <path>]

import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTemplate, BindingType } from '@angular/compiler';

import { build } from './build-mcp-index.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const libRoot = join(repoRoot, 'projects/ngx-tw');

const errors = [];
const warnings = [];
const fail = (check, message, detail) => errors.push({ check, message, detail });
const warn = (check, message) => warnings.push({ check, message });

// ─── the index ────────────────────────────────────────────────────────────
const indexFlag = process.argv.indexOf('--index');
const index = indexFlag !== -1
  ? JSON.parse(readFileSync(resolve(repoRoot, process.argv[indexFlag + 1]), 'utf8'))
  : await build();

const entryPoints = index.entryPoints;
const names = new Set(entryPoints.map((e) => e.name));

// ─── check 0 — guidance layer type-check ──────────────────────────────────
// `tsconfig.lib.json` nominally includes `*.meta.ts`, but ng-packagr compiles
// only what is reachable from an entry file, and a meta is deliberately not
// exported. Relying on that would be resting a guarantee on an implementation
// detail, so type-check them explicitly.
try {
  execFileSync('npx', ['tsc', '-p', join(libRoot, 'tsconfig.meta.json')], {
    cwd: repoRoot, stdio: 'pipe', encoding: 'utf8',
  });
} catch (err) {
  fail('meta types', 'ComponentMeta shape violation — tsc rejected the guidance layer',
    (err.stdout || err.message).trim());
}

// ─── check 1 — coverage, both directions ──────────────────────────────────
for (const entry of entryPoints) {
  if (!entry.hasMeta) {
    const base = entry.name.split('/').pop();
    fail('coverage', `entry point "${entry.name}" has no guidance`,
      `create projects/ngx-tw/${entry.name}/${base}.meta.ts exporting a \`satisfies ComponentMeta\` literal`);
  }
}

// The reverse direction catches the orphan: a component renamed or removed with
// its meta left behind, still describing something that no longer exists.
for (const dir of readdirSync(libRoot, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  for (const file of readdirSync(join(libRoot, dir.name))) {
    if (!file.endsWith('.meta.ts')) continue;
    if (!names.has(dir.name)) {
      fail('coverage', `orphaned guidance file projects/ngx-tw/${dir.name}/${file}`,
        `"${dir.name}" is not an entry point in src/public-api.ts — delete the meta or restore the export`);
    } else if (file !== `${dir.name}.meta.ts`) {
      fail('coverage', `misnamed guidance file projects/ngx-tw/${dir.name}/${file}`,
        `expected ${dir.name}.meta.ts — the builder looks it up by entry-point name`);
    }
  }
}

// ─── check 2 — link integrity ─────────────────────────────────────────────
// Cross-references are the one part of hand-written guidance that rots
// *mechanically* when a component is renamed, so they are worth checking.
for (const entry of entryPoints) {
  for (const related of entry.related ?? []) {
    if (!names.has(related)) {
      fail('links', `${entry.name}: related "${related}" is not an entry point`, entry.metaPath);
    } else if (related === entry.name) {
      fail('links', `${entry.name}: related lists itself`, entry.metaPath);
    }
  }
  for (const { instead } of entry.whenNotToUse ?? []) {
    if (!names.has(instead)) {
      fail('links', `${entry.name}: whenNotToUse instead "${instead}" is not an entry point`, entry.metaPath);
    } else if (instead === entry.name) {
      fail('links', `${entry.name}: whenNotToUse points back at itself`, entry.metaPath);
    }
  }
}

// ─── the API lookup that checks 3 and 4 resolve against ───────────────────
/** Bindings the framework or the DOM owns — never ours to validate. */
const PASSTHROUGH = new Set([
  'class', 'style', 'id', 'title', 'hidden', 'role', 'tabindex', 'slot', 'name',
  'type', 'value', 'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
  'disabled', 'readonly', 'required', 'placeholder', 'autocomplete', 'for',
  // Native form/content attributes a snippet may legitimately set on a host
  // element that also carries a library directive (`<input twInput maxlength>`).
  'maxlength', 'minlength', 'min', 'max', 'step', 'rows', 'cols', 'checked',
  'multiple', 'accept', 'pattern', 'autofocus', 'spellcheck', 'inputmode',
  'enterkeyhint', 'form', 'list', 'wrap', 'download', 'loading', 'decoding',
  'colspan', 'rowspan', 'scope', 'headers', 'lang', 'dir', 'draggable',
  'contenteditable', 'translate', 'popover', 'open', 'selected', 'label',
  'ngModel', 'ngModelChange', 'ngModelOptions', 'formControl', 'formControlName',
  'formGroup', 'formGroupName', 'formArrayName', 'ngSubmit', 'ngProjectAs',
  // Angular v22 signal forms bind through `[field]` / `[formField]`.
  'field', 'formField',
  // SVG presentation attributes — snippets inline icon markup on elements that
  // also carry a library directive (`<svg twAlertIcon viewBox=… fill=…>`).
  'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'xmlns', 'd', 'points', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'rx', 'ry', 'transform', 'opacity', 'clip-rule', 'fill-rule', 'preserveAspectRatio',
  'ngIf', 'ngFor', 'ngForOf', 'ngTemplateOutlet', 'ngComponentOutlet',
  'cdkTrapFocus', 'cdkMonitorSubtreeFocus', 'routerLink', 'routerLinkActive',
]);

const isPassthrough = (name) =>
  PASSTHROUGH.has(name) ||
  name.startsWith('aria-') || name.startsWith('data-') || name.startsWith('attr.') ||
  name.startsWith('animate.') || name.startsWith('class.') || name.startsWith('style.') ||
  name.startsWith('@') || name.startsWith('#') ||
  // Native DOM events; the library never declares an output with these names.
  /^(click|input|change|focus|blur|key|mouse|pointer|touch|drag|drop|submit|scroll|wheel|context|paste|copy|cut|load|error)/.test(name);

/** Every binding name a symbol accepts, including aliases. */
function bindingNames(symbol) {
  const out = new Set();
  for (const member of [...(symbol.inputs ?? []), ...(symbol.outputs ?? []), ...(symbol.models ?? [])]) {
    out.add(member.alias ?? member.name);
    out.add(member.name);
    // `model()` compiles to a `foo` input plus a `fooChange` output, which is
    // what makes `[(foo)]` work — and what a snippet may bind directly. When
    // the model is aliased the pair is named off the *alias*
    // (`[(twSortActive)]` / `(twSortActiveChange)`), not the property.
    if (symbol.models?.includes(member)) {
      out.add(`${member.name}Change`);
      if (member.alias) out.add(`${member.alias}Change`);
    }
  }
  return out;
}

/** Attribute markers matched by a component's `ng-content select="[twFoo]"`. */
const projectionMarkers = new Set(
  entryPoints.flatMap((e) => e.symbols).flatMap((s) =>
    (s.contentSlots ?? []).flatMap(({ select }) =>
      [...(select ?? '').matchAll(/\[([\w-]+)\]/g)].map((m) => m[1]))),
);

/** Every symbol the index declares, by class name — used to follow `extends`. */
const symbolsByName = new Map(
  entryPoints.flatMap((e) => e.symbols.map((s) => [s.name, s])),
);

/** Base classes the index can actually see through; anything else is external. */
const resolvedBases = new Set([...symbolsByName.keys()]);

/** Walk an `extends` chain that stays inside the library and collect its API. */
function inheritedBindingNames(symbol, seen = new Set()) {
  const out = new Set();
  let base = symbol.extends;
  while (base && symbolsByName.has(base) && !seen.has(base)) {
    seen.add(base);
    const parent = symbolsByName.get(base);
    for (const n of bindingNames(parent)) out.add(n);
    base = parent.extends;
  }
  return out;
}

const elementSymbols = new Map();   // 'tw-card'  → [symbol, …]
const attributeSymbols = new Map(); // 'twBadge'  → [symbol, …]

for (const entry of entryPoints) {
  for (const symbol of entry.symbols) {
    for (const usage of symbol.usage ?? []) {
      const bucket = usage.form === 'attribute' ? attributeSymbols : elementSymbols;
      if (!bucket.has(usage.name)) bucket.set(usage.name, []);
      bucket.get(usage.name).push({ ...symbol, entryPoint: entry.name });
      // `tw-calendar[mode="single"]` also constrains the bare element, and its
      // inputs are legitimately bound on a plain <tw-calendar>.
      if (usage.form === 'element-with-attribute') {
        const compound = usage.selector.match(/\[([\w-]+)/);
        if (compound && /^tw[A-Z]/.test(compound[1])) {
          if (!attributeSymbols.has(compound[1])) attributeSymbols.set(compound[1], []);
          attributeSymbols.get(compound[1]).push({ ...symbol, entryPoint: entry.name });
        }
      }
    }
  }
}

// ─── check 3 — snippet API validation ─────────────────────────────────────
// Demo snippets are template literals: nothing compiles them, nothing
// type-checks them, and the demo-doc-page convention has them duplicating the
// live markup rendered right above. Remove an input and the snippet keeps
// advertising it — in the demo *and* in the index.
//
// Parsed with Angular's own `parseTemplate`, so `@for` / `@if` blocks and
// control flow parse correctly rather than being regex-guessed.

/** Depth-first walk over a parsed template, yielding every element-like node. */
function* elements(node, seen = new Set()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);

  if (Array.isArray(node)) {
    for (const child of node) yield* elements(child, seen);
    return;
  }

  const tag = node.name ?? node.tagName;
  if (typeof tag === 'string' && Array.isArray(node.attributes)) yield node;

  // Recurse structurally rather than by node type, so new block kinds
  // (`@defer`, `@let`, …) are covered without touching this walker.
  for (const key of ['children', 'branches', 'cases', 'loading', 'placeholder',
    'error', 'empty', 'templateAttrs', 'contents']) {
    if (node[key]) yield* elements(node[key], seen);
  }
}

/**
 * The names bound on an element, tagged with how they were written.
 *
 * Only property and two-way bindings name a directive member. `[class.foo]`
 * and `[style.x]` parse as bound attributes whose `name` is the *class* —
 * validating those reports `rotate-90` as a missing input.
 */
function boundNames(el) {
  const bindable = (a) => a.type === BindingType.Property || a.type === BindingType.TwoWay;
  const all = [
    ...(el.attributes ?? []).map((a) => ({ name: a.name, written: a.name, valueless: a.value === '' })),
    ...(el.inputs ?? []).filter(bindable).map((a) => ({ name: a.name, written: `[${a.name}]` })),
    ...(el.outputs ?? []).map((a) => ({ name: a.name, written: `(${a.name})` })),
  ];

  // A valueless bare attribute outside the `tw` namespace is a directive
  // *selector* the consumer wrote, not an input being set — `<input twInput
  // uppercaseValue />` demonstrates pairing our directive with one of theirs.
  // Flagging it would be a false positive on good docs. Anything `tw`-prefixed
  // is ours and stays fully checked.
  //
  // `all` is still used to resolve which directives apply, so dropping these
  // never hides a directive from the lookup.
  const checked = all.filter((a) => !a.valueless || isLibraryName(a.name));
  return { all, checked };
}

/** Names inside the library's own namespace — `twBadge`, `tw-sort-header`. */
const isLibraryName = (name) => /^tw[A-Z-]/.test(name);

for (const entry of entryPoints) {
  for (const snippet of entry.snippets) {
    if (snippet.language !== 'html') continue;

    const where = `${entry.name} › ${snippet.id}`;
    const parsed = parseTemplate(snippet.code, `${entry.name}/${snippet.id}`, {
      preserveWhitespaces: true,
    });

    // Several `html`-labelled snippets deliberately mix a TS fragment above the
    // markup to show the wiring. Those cannot parse as a pure template, and
    // they are good documentation — warn, never fail. This check exists to
    // catch API drift, not to police snippet formatting.
    if (parsed.errors?.length) {
      warn('snippets', `${where}: not parseable as a pure Angular template ` +
        `(likely a mixed TS+HTML snippet) — skipped API validation`);
      continue;
    }

    for (const el of elements(parsed.nodes)) {
      const tag = el.name ?? el.tagName;
      const { all, checked } = boundNames(el);

      // Which library symbols apply here: the element selector, plus every
      // library attribute directive written on this element.
      const applicable = [...(elementSymbols.get(tag) ?? [])];
      for (const { name } of all) {
        if (attributeSymbols.has(name)) applicable.push(...attributeSymbols.get(name));
      }

      if (tag?.startsWith('tw-') && !elementSymbols.has(tag)) {
        fail('snippets', `${where}: <${tag}> is not a library element selector`, entry.metaPath);
        continue;
      }

      for (const { name, written } of checked) {
        if (isLibraryName(name) && !attributeSymbols.has(name) &&
            !projectionMarkers.has(name) &&
            !applicable.some((s) => bindingNames(s).has(name))) {
          fail('snippets', `${where}: "${written}" is not a library directive or input`,
            `no exported symbol declares it — check for a rename`);
        }
      }

      // Exhaustive binding validation applies wherever a library symbol owns
      // the element — including attribute directives on native hosts
      // (`<span twBadge [pill]>`, `<button twButton color>`), which is where
      // most of the library's surface actually lives. Skipping those would
      // blind the check to a renamed input on every directive in the library.
      if (!applicable.length) continue;

      // Likewise, skip when any applicable symbol extends a base the extractor
      // could not resolve: its inherited inputs are real but invisible here.
      if (applicable.some((s) => s.extends && !resolvedBases.has(s.extends))) continue;

      const allowed = new Set();
      for (const symbol of applicable) {
        for (const n of bindingNames(symbol)) allowed.add(n);
        for (const n of inheritedBindingNames(symbol)) allowed.add(n);
      }
      // A directive attribute written on the element is its own selector, not a
      // stray binding.
      for (const name of attributeSymbols.keys()) allowed.add(name);
      for (const name of projectionMarkers) allowed.add(name);

      for (const { name, written } of checked) {
        if (isPassthrough(name) || allowed.has(name)) continue;
        fail('snippets', `${where}: <${tag}> has no "${name}" binding — written as ${written}`,
          `declared by: ${[...new Set(applicable.map((s) => s.name))].join(', ')}`);
      }
    }
  }
}

// ─── check 4 — import-path validation ─────────────────────────────────────
// The single most damaging error class: a model emitting an import that does
// not resolve.
const SUB_ENTRIES = new Set(
  entryPoints.flatMap((e) => {
    const dir = join(libRoot, e.name);
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'ng-package.json')))
      .map((d) => `${e.name}/${d.name}`);
  }),
);

for (const entry of entryPoints) {
  for (const snippet of entry.snippets) {
    for (const match of snippet.code.matchAll(/@cdevhub\/ngx-tw(\/[\w/-]+)?/g)) {
      const path = match[1]?.slice(1);
      if (!path) continue; // the root barrel is always valid
      if (path.startsWith('theme/') && path.endsWith('.css')) continue; // CSS asset
      if (names.has(path) || SUB_ENTRIES.has(path)) continue;
      fail('imports', `${entry.name} › ${snippet.id}: "@cdevhub/ngx-tw/${path}" is not an entry point`,
        'a consumer copying this snippet would get an unresolved import');
    }
  }
}

// ─── check 5 — snippet coverage (warning only) ────────────────────────────
for (const entry of entryPoints) {
  if (!entry.snippets.length) {
    warn('snippets', `entry point "${entry.name}" has no usage snippets — ` +
      `missing or renamed demo page at projects/demo/src/app/routes/${entry.name}`);
  }
}

// ─── report ───────────────────────────────────────────────────────────────
console.log(`\nverify-mcp-index — ${entryPoints.length} entry points, ` +
  `${entryPoints.reduce((n, e) => n + e.snippets.length, 0)} snippets, ` +
  `library ${index.libraryVersion}`);

for (const { check, message } of warnings) console.log(`  WARN  [${check}] ${message}`);

if (errors.length) {
  const byCheck = new Map();
  for (const error of errors) {
    if (!byCheck.has(error.check)) byCheck.set(error.check, []);
    byCheck.get(error.check).push(error);
  }
  for (const [check, list] of byCheck) {
    console.error(`\n  ✖ ${check} — ${list.length} problem${list.length === 1 ? '' : 's'}`);
    for (const { message, detail } of list.slice(0, 40)) {
      console.error(`      ${message}`);
      if (detail) console.error(`        ↳ ${detail}`);
    }
    if (list.length > 40) console.error(`      … and ${list.length - 40} more`);
  }
  console.error(`\n✖ MCP index invalid — ${errors.length} problem${errors.length === 1 ? '' : 's'}.\n`);
  process.exit(1);
}

console.log(`  ✓ all checks passed${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})` : ''}\n`);
