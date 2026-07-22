// Lexical search over the entry-point index.
//
// ~56 entry points does not justify embeddings. What actually decides whether
// search works is the `aliases` field in each `*.meta.ts`: "dropdown" has to
// reach menu, select, and combobox, none of which contain the word.

/**
 * Words that carry no intent. Without this, "dropdown of actions" scores every
 * component whose prose contains "of" — which is most of them.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'to', 'in', 'on', 'at', 'by', 'with', 'and',
  'or', 'is', 'it', 'as', 'that', 'this', 'my', 'i', 'we', 'want', 'need',
  'component', 'angular', 'ngx', 'tw',
]);

/** Split a query or field into comparable lowercase tokens. */
function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOPWORDS.has(t));
}

// Weighted by how strongly a hit in that field predicts intent. An alias match
// is worth nearly as much as a name match — that is the whole point of aliases.
const FIELDS = [
  { weight: 100, of: (e) => [e.name] },
  { weight: 80, of: (e) => e.aliases ?? [] },
  { weight: 30, of: (e) => [e.summary ?? ''] },
  { weight: 20, of: (e) => e.whenToUse ?? [] },
  { weight: 12, of: (e) => (e.symbols ?? []).flatMap((s) => [s.name, s.selector ?? '']) },
  { weight: 6, of: (e) => (e.whenNotToUse ?? []).map((w) => w.because) },
];

/**
 * Score one entry point against the query's tokens. Exact token equality beats
 * prefix, which beats substring — so "tab" ranks `tabs` and `tab-nav` above
 * anything merely containing the letters.
 */
function score(entry, queryTokens, rawQuery) {
  let total = 0;

  for (const { weight, of } of FIELDS) {
    for (const value of of(entry)) {
      const valueTokens = tokenize(value);
      if (!valueTokens.length) continue;

      for (const q of queryTokens) {
        for (const token of valueTokens) {
          if (token === q) total += weight;
          else if (token.startsWith(q) && q.length >= 3) total += weight * 0.6;
          else if (token.includes(q) && q.length >= 4) total += weight * 0.3;
        }
      }
    }
  }

  // Whole-phrase hits on the name or an alias: "date range picker" should land
  // on `date-range-picker` rather than spreading across three components.
  const phrase = rawQuery.toLowerCase().trim();
  if (phrase) {
    if (entry.name.replace(/-/g, ' ') === phrase) total += 250;
    if ((entry.aliases ?? []).some((a) => a.toLowerCase() === phrase)) total += 200;
  }

  // A component nobody documented is a weaker answer than one with examples.
  if (entry.snippets?.length) total += 3;

  return total;
}

/** Ranked entry points for a free-text query. */
export function searchComponents(index, query, limit = 10) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  return index.entryPoints
    .map((entry) => ({ entry, score: score(entry, queryTokens, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, limit)
    .map(({ entry, score: s }) => ({
      name: entry.name,
      importPath: entry.importPath,
      summary: entry.summary ?? null,
      whenToUse: entry.whenToUse ?? [],
      aliases: entry.aliases ?? [],
      selectors: [...new Set(
        (entry.symbols ?? []).filter((sym) => sym.selector).map((sym) => sym.selector),
      )],
      relevance: Math.round(s),
    }));
}
