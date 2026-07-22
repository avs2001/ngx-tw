// API extraction for the MCP index.
//
// Reads component *source* (not `.d.ts`) with the TypeScript compiler API,
// because `.d.ts` erases the default in `input<BadgeVariant>('soft')` — which
// is precisely the fact a consumer needs.
//
// The unit is the entry point, not the class: `badge/index.ts` exports
// BadgeComponent *and* BadgeDotDirective *and* the BadgeVariant type, so an
// entry point is modelled as a set of exported symbols, each with its own
// kind, selector, and usage form.

import ts from 'typescript';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

// ─── source-file cache ────────────────────────────────────────────────────
const sourceCache = new Map();

function parse(filePath) {
  if (sourceCache.has(filePath)) return sourceCache.get(filePath);
  const text = readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, /* setParentNodes */ true);
  sourceCache.set(filePath, sf);
  return sf;
}

/** Resolve a relative module specifier to an on-disk `.ts` file. */
function resolveModule(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [`${base}.ts`, join(base, 'index.ts')]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

// ─── JSDoc ────────────────────────────────────────────────────────────────
function jsDocOf(node) {
  const docs = node.jsDoc;
  if (!docs?.length) return { description: '', tags: [] };
  const last = docs[docs.length - 1];
  const comment = typeof last.comment === 'string'
    ? last.comment
    : (last.comment ?? []).map((c) => c.text ?? '').join('');
  const tags = (last.tags ?? []).map((t) => ({
    name: t.tagName.getText(),
    text: typeof t.comment === 'string'
      ? t.comment
      : (t.comment ?? []).map((c) => c.text ?? '').join(''),
  }));
  return { description: normalizeDoc(comment), tags };
}

/** Collapse a JSDoc body to single-spaced prose; MCP responses are read, not rendered. */
function normalizeDoc(text) {
  return String(text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const isInternal = (doc) => doc.tags.some((t) => t.name === 'internal');

// ─── signal-API member detection ──────────────────────────────────────────
/**
 * Classify a property initializer as one of Angular's signal factories.
 * Returns `{ factory, required, typeArgs, args }` or null.
 */
function signalFactory(init) {
  if (!init || !ts.isCallExpression(init)) return null;

  let callee = init.expression;
  let required = false;

  // `input.required<T>()` / `model.required<T>()`
  if (ts.isPropertyAccessExpression(callee) && callee.name.getText() === 'required') {
    required = true;
    callee = callee.expression;
  }
  if (!ts.isIdentifier(callee)) return null;

  const factory = callee.getText();
  if (!['input', 'output', 'model'].includes(factory)) return null;

  return {
    factory,
    required,
    typeArgs: (init.typeArguments ?? []).map((t) => t.getText()),
    args: init.arguments ?? [],
  };
}

/** Infer a readable type when no explicit type argument was given. */
function inferType(defaultText) {
  if (defaultText === undefined) return 'unknown';
  if (defaultText === 'true' || defaultText === 'false') return 'boolean';
  if (/^-?\d+(\.\d+)?$/.test(defaultText)) return 'number';
  if (/^['"`]/.test(defaultText)) return 'string';
  if (defaultText === 'null') return 'null';
  if (defaultText === 'undefined') return 'undefined';
  return 'unknown';
}

/** Pull `{ alias, transform }` out of an input/model options object literal. */
function readOptions(arg) {
  const out = {};
  if (!arg || !ts.isObjectLiteralExpression(arg)) return out;
  for (const prop of arg.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = prop.name.getText().replace(/['"]/g, '');
    if (key === 'alias') out.alias = prop.initializer.getText().replace(/['"]/g, '');
    if (key === 'transform') out.transform = prop.initializer.getText();
  }
  return out;
}

function readMember(member) {
  if (!ts.isPropertyDeclaration(member) || !member.initializer) return null;
  const sig = signalFactory(member.initializer);
  if (!sig) return null;

  const doc = jsDocOf(member);
  if (isInternal(doc)) return null;

  const name = member.name.getText();
  const { factory, required, typeArgs, args } = sig;

  if (factory === 'output') {
    return {
      kind: 'output',
      name,
      payloadType: typeArgs[0] ?? 'void',
      description: doc.description,
      ...readOptions(args[0]),
    };
  }

  // input / model — first arg is the initial value unless the factory is
  // `.required`, in which case the first arg is the options object.
  const defaultArg = required ? undefined : args[0];
  const optionsArg = required ? args[0] : args[1];
  const defaultText = defaultArg ? defaultArg.getText() : undefined;

  return {
    kind: factory,
    name,
    type: typeArgs[0] ?? inferType(defaultText),
    default: required ? undefined : defaultText,
    required,
    description: doc.description,
    ...readOptions(optionsArg),
  };
}

/** Public, documented, non-lifecycle methods — the imperative half of the API. */
const LIFECYCLE = new Set([
  'ngOnInit', 'ngOnDestroy', 'ngOnChanges', 'ngAfterViewInit', 'ngAfterViewChecked',
  'ngAfterContentInit', 'ngAfterContentChecked', 'ngDoCheck',
  'writeValue', 'registerOnChange', 'registerOnTouched', 'setDisabledState', 'validate',
]);

function readMethod(member) {
  if (!ts.isMethodDeclaration(member)) return null;
  const name = member.name.getText();
  if (name.startsWith('_') || LIFECYCLE.has(name)) return null;

  const mods = ts.getModifiers(member) ?? [];
  if (mods.some((m) =>
    m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword)) {
    return null;
  }

  const doc = jsDocOf(member);
  if (isInternal(doc) || !doc.description) return null; // undocumented ⇒ not public API

  const params = member.parameters.map((p) => p.getText()).join(', ');
  const ret = member.type ? member.type.getText() : 'void';
  return { name, signature: `${name}(${params}): ${ret}`, description: doc.description };
}

// ─── decorator reading ────────────────────────────────────────────────────
function decoratorOf(node, names) {
  for (const dec of ts.getDecorators(node) ?? []) {
    if (!ts.isCallExpression(dec.expression)) continue;
    const id = dec.expression.expression;
    if (ts.isIdentifier(id) && names.includes(id.getText())) {
      return { name: id.getText(), arg: dec.expression.arguments[0] };
    }
  }
  return null;
}

function decoratorProp(arg, key) {
  if (!arg || !ts.isObjectLiteralExpression(arg)) return undefined;
  for (const prop of arg.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (prop.name.getText().replace(/['"]/g, '') === key) {
      const text = prop.initializer.getText();
      return /^['"`]/.test(text) ? text.slice(1, -1) : text;
    }
  }
  return undefined;
}

/**
 * Split an Angular selector into usage forms. `[twBadge]` is applied as an
 * attribute; `tw-card` as an element. A selector list yields several forms.
 */
function usageForms(selector) {
  if (!selector) return [];
  return selector.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
    const attr = s.match(/^\[([^\]]+)\]$/);
    if (attr) return { form: 'attribute', selector: s, name: attr[1] };
    const compound = s.match(/^([a-z][\w-]*)\[([^\]]+)\]$/i);
    if (compound) return { form: 'element-with-attribute', selector: s, name: compound[1] };
    return { form: 'element', selector: s, name: s };
  });
}

// ─── declaration readers ──────────────────────────────────────────────────
/**
 * The `ng-content` slots a component projects into. These are part of its
 * public shape — `<svg twSortHeaderIcon>` is valid markup even though no
 * directive declares `twSortHeaderIcon`; it is a projection marker matched by
 * `<ng-content select="[twSortHeaderIcon]">`. Without this, the verifier would
 * report every projection marker in the demo as a nonexistent directive.
 */
function readContentSlots(dec, filePath) {
  let template = decoratorProp(dec.arg, 'template');
  if (template === undefined) {
    const url = decoratorProp(dec.arg, 'templateUrl');
    if (!url) return [];
    const resolved = resolve(dirname(filePath), url);
    if (!existsSync(resolved)) return [];
    template = readFileSync(resolved, 'utf8');
  }

  const slots = [];
  for (const match of template.matchAll(/<ng-content\b([^>]*)>/g)) {
    const select = match[1].match(/select\s*=\s*["']([^"']+)["']/);
    slots.push({ select: select ? select[1] : null });
  }
  return slots;
}

/**
 * Bindings a component re-exposes from its `hostDirectives`. These are as
 * public as any declared `input()` — `[twMenuItemCheckbox]` gets its `checked`
 * input and `triggered` output entirely from `CdkMenuItemCheckbox` — so an
 * extractor that skips them under-reports the real binding surface.
 */
function readHostDirectives(arg) {
  const inputs = [], outputs = [];
  if (!arg || !ts.isObjectLiteralExpression(arg)) return { inputs, outputs };

  const prop = arg.properties.find(
    (p) => ts.isPropertyAssignment(p) && p.name.getText() === 'hostDirectives',
  );
  if (!prop || !ts.isArrayLiteralExpression(prop.initializer)) return { inputs, outputs };

  for (const item of prop.initializer.elements) {
    if (!ts.isObjectLiteralExpression(item)) continue; // bare `CdkMenuItem` exposes nothing

    const from = decoratorProp(item, 'directive') ?? 'host directive';
    for (const key of ['inputs', 'outputs']) {
      const listProp = item.properties.find(
        (p) => ts.isPropertyAssignment(p) && p.name.getText() === key,
      );
      if (!listProp || !ts.isArrayLiteralExpression(listProp.initializer)) continue;

      for (const entry of listProp.initializer.elements) {
        // `'cdkMenuItemChecked: checked'` — the public name is after the colon.
        const [source, alias] = entry.getText().replace(/['"]/g, '').split(':').map((s) => s.trim());
        const name = alias || source;
        const target = key === 'inputs' ? inputs : outputs;
        target.push({
          name,
          ...(key === 'inputs' ? { type: 'unknown' } : { payloadType: 'unknown' }),
          description: `Re-exposed from the \`${from}\` host directive.`,
          from,
        });
      }
    }
  }
  return { inputs, outputs };
}

function readClass(node, filePath) {
  const doc = jsDocOf(node);
  const dec = decoratorOf(node, ['Component', 'Directive', 'Injectable', 'Pipe']);

  const kind = !dec ? 'class'
    : dec.name === 'Component' ? 'component'
    : dec.name === 'Directive' ? 'directive'
    : dec.name === 'Pipe' ? 'pipe'
    : 'service';

  const symbol = {
    name: node.name.getText(),
    kind,
    description: doc.description,
  };

  if (dec) {
    const selector = decoratorProp(dec.arg, kind === 'pipe' ? 'name' : 'selector');
    const exportAs = decoratorProp(dec.arg, 'exportAs');
    if (selector) {
      symbol.selector = selector;
      symbol.usage = usageForms(selector);
    }
    if (exportAs) symbol.exportAs = exportAs;
    const slots = readContentSlots(dec, filePath);
    if (slots.length) symbol.contentSlots = slots;
  }

  const host = dec ? readHostDirectives(dec.arg) : { inputs: [], outputs: [] };
  const inputs = [...host.inputs], outputs = [...host.outputs], models = [], methods = [];
  for (const member of node.members) {
    const api = readMember(member);
    if (api) {
      if (api.kind === 'input') inputs.push(strip(api));
      else if (api.kind === 'output') outputs.push(strip(api));
      else models.push(strip(api));
      continue;
    }
    const method = readMethod(member);
    if (method) methods.push(method);
  }

  if (inputs.length) symbol.inputs = inputs;
  if (outputs.length) symbol.outputs = outputs;
  if (models.length) symbol.models = models;
  if (methods.length) symbol.methods = methods;

  const implemented = (node.heritageClauses ?? [])
    .filter((h) => h.token === ts.SyntaxKind.ImplementsKeyword)
    .flatMap((h) => h.types.map((t) => t.getText()));
  if (implemented.includes('ControlValueAccessor')) symbol.formControl = true;

  // A base class contributes bindings this extractor cannot always see —
  // `StepperComponent extends CdkStepper` inherits a decorator-declared
  // `selectedIndex` input that lives in node_modules. Record the base so the
  // verifier knows when its view of a symbol's API is incomplete rather than
  // reporting an inherited binding as a nonexistent one.
  const base = (node.heritageClauses ?? [])
    .find((h) => h.token === ts.SyntaxKind.ExtendsKeyword)?.types[0];
  if (base) symbol.extends = base.expression.getText();

  return symbol;
}

/** Drop the discriminator and undefined-valued keys before emitting. */
function strip({ kind: _kind, ...rest }) {
  return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined && v !== false));
}

function readDeclaration(node, filePath) {
  if (ts.isClassDeclaration(node) && node.name) return readClass(node, filePath);

  if (ts.isTypeAliasDeclaration(node)) {
    return {
      name: node.name.getText(),
      kind: 'type',
      description: jsDocOf(node).description,
      definition: node.type.getText().replace(/\s+/g, ' '),
    };
  }

  if (ts.isInterfaceDeclaration(node)) {
    const doc = jsDocOf(node);
    return {
      name: node.name.getText(),
      kind: 'interface',
      description: doc.description,
      members: node.members.map((m) => ({
        name: m.name ? m.name.getText() : '(index)',
        type: m.type ? m.type.getText().replace(/\s+/g, ' ') : 'unknown',
        optional: !!m.questionToken,
        description: jsDocOf(m).description,
      })),
    };
  }

  if (ts.isEnumDeclaration(node)) {
    return {
      name: node.name.getText(),
      kind: 'enum',
      description: jsDocOf(node).description,
      members: node.members.map((m) => m.name.getText()),
    };
  }

  if (ts.isFunctionDeclaration(node) && node.name) {
    const params = node.parameters.map((p) => p.getText()).join(', ');
    const ret = node.type ? node.type.getText() : 'unknown';
    return {
      name: node.name.getText(),
      kind: 'function',
      description: jsDocOf(node).description,
      signature: `${node.name.getText()}(${params.replace(/\s+/g, ' ')}): ${ret.replace(/\s+/g, ' ')}`,
    };
  }

  if (ts.isVariableStatement(node)) {
    const doc = jsDocOf(node);
    return node.declarationList.declarations
      .filter((d) => ts.isIdentifier(d.name))
      .map((d) => ({
        name: d.name.getText(),
        // InjectionToken constants are the library's policy/provider surface.
        kind: d.initializer && /^new InjectionToken/.test(d.initializer.getText())
          ? 'token' : 'const',
        description: doc.description,
        type: d.type ? d.type.getText().replace(/\s+/g, ' ') : undefined,
      }));
  }

  return null;
}

/** Index every top-level declaration in a file by its declared name. */
function declarationsIn(filePath) {
  const sf = parse(filePath);
  const map = new Map();
  for (const stmt of sf.statements) {
    const read = readDeclaration(stmt, filePath);
    if (!read) continue;
    for (const decl of Array.isArray(read) ? read : [read]) {
      map.set(decl.name, decl);
    }
  }
  return map;
}

// ─── entry-point walking ──────────────────────────────────────────────────
/**
 * Walk an entry point's `index.ts`, following re-exports, and return the set
 * of symbols it publishes. Named re-exports keep their exported (aliased)
 * name; `export *` pulls in everything the target file declares.
 */
export function extractEntryPoint(indexPath) {
  const sf = parse(indexPath);
  const symbols = [];
  const seen = new Set();

  const push = (decl, exportedName) => {
    if (!decl || seen.has(exportedName)) return;
    seen.add(exportedName);
    symbols.push(exportedName === decl.name ? decl : { ...decl, name: exportedName });
  };

  for (const stmt of sf.statements) {
    if (!ts.isExportDeclaration(stmt) || !stmt.moduleSpecifier) continue;
    const target = resolveModule(indexPath, stmt.moduleSpecifier.text.replace(/['"]/g, ''));
    if (!target) continue;
    const decls = declarationsIn(target);

    if (!stmt.exportClause) {
      for (const [name, decl] of decls) push(decl, name);
      continue;
    }
    if (!ts.isNamedExports(stmt.exportClause)) continue;
    for (const spec of stmt.exportClause.elements) {
      const local = (spec.propertyName ?? spec.name).getText();
      push(decls.get(local), spec.name.getText());
    }
  }

  return symbols;
}

export { normalizeDoc, usageForms };
