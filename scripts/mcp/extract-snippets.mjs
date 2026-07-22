// Usage-example extraction for the MCP index.
//
// The `demo-doc-page` skill mandates the `{section}Snippet` naming convention,
// so the extraction target is stable: pull the string literals themselves, and
// read the template only to pair each snippet with its `<tw-code-block>`
// language and its nearest preceding `<h2>` for a title.

import ts from 'typescript';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Every `.ts` file under a demo route directory. */
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith('.ts') && !full.endsWith('.spec.ts') ? [full] : [];
  });
}

/** Unwrap `` `...`.trim() `` and plain string/template initializers. */
function literalValue(node) {
  if (!node) return null;
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    if (node.expression.name.getText() !== 'trim') return null;
    const inner = literalValue(node.expression.expression);
    return inner === null ? null : inner.trim();
  }
  if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) return node.text;
  return null;
}

/** `dismissibleHtmlSnippet` → `Dismissible Html`. Only a fallback title. */
function titleFromName(name) {
  return name
    .replace(/Snippet$/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** Strip markup and Angular interpolations out of an `<h2>` body. */
function plainText(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The `template:` string of a component decorator, if it has an inline one. */
function inlineTemplate(sourceFile) {
  let found = '';
  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && node.name.getText() === 'template') {
      const value = literalValue(node.initializer);
      if (value) found += `\n${value}`;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return found;
}

/**
 * Locate each snippet's `<tw-code-block>` binding in the template and read the
 * language off it plus the nearest `<h2>` above it.
 */
function templateContext(template) {
  const headings = [...template.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)]
    .map((m) => ({ index: m.index, title: plainText(m[1]) }));

  const context = new Map();
  const bindings = /\[code\]\s*=\s*"([A-Za-z0-9_]+)"/g;
  for (const match of template.matchAll(bindings)) {
    const name = match[1];
    if (context.has(name)) continue; // first occurrence wins

    // The language attribute sits on the *same* <tw-code-block> element, so
    // scope the search to the enclosing tag. A fixed-size window instead reads
    // the neighbouring code-block's language when two are stacked.
    const open = template.lastIndexOf('<', match.index);
    const close = template.indexOf('>', match.index);
    const tag = template.slice(open, close === -1 ? template.length : close);
    const lang = tag.match(/language\s*=\s*"([a-z]+)"/);

    const heading = headings.filter((h) => h.index < match.index).pop();
    context.set(name, { language: lang?.[1], title: heading?.title });
  }
  return context;
}

/** All `*Snippet` class properties in a file, in declaration order. */
function snippetProperties(sourceFile) {
  const found = [];
  const visit = (node) => {
    if (ts.isPropertyDeclaration(node) && node.name && /Snippet$/.test(node.name.getText())) {
      const code = literalValue(node.initializer);
      if (code) found.push({ name: node.name.getText(), code });
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return found;
}

/**
 * Extract every usage snippet for one entry point from its demo route.
 * Returns `[]` when the component has no demo page — the caller warns, it does
 * not fail: missing documentation is debt, not a broken release.
 */
export function extractSnippets(routeDir) {
  const snippets = [];

  for (const file of walk(routeDir)) {
    const text = readFileSync(file, 'utf8');
    if (!/Snippet\b/.test(text)) continue;

    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const context = templateContext(inlineTemplate(sf));

    for (const { name, code } of snippetProperties(sf)) {
      const ctx = context.get(name) ?? {};
      snippets.push({
        id: name,
        title: ctx.title || titleFromName(name),
        // `.ts` snippets sit under an `html`-defaulted sibling often enough
        // that guessing from content beats guessing from the file.
        language: ctx.language ?? (/^\s*</.test(code) ? 'html' : 'ts'),
        code,
      });
    }
  }

  return snippets;
}
