import { expect, test } from '../../fixtures/base';
import { FIXME_REGISTRY, expectedTitle, expiredEntries } from '../../support/fixme-registry';

test.describe.configure({ mode: 'parallel' });

/**
 * Expiry gate for `test.fixme` suppressions — the half of the mechanism that
 * `A11Y_BACKLOG` gets for free (axe keeps running, so a stale allowance shows
 * up as debt that no longer exists) and a fixme cannot get at all, because its
 * body never executes.
 *
 * These are pure data checks: no page, no browser. They live under `00-smoke`
 * so they run in the required PR check rather than only in the nightly sweep.
 * The other half of the mechanism — that every call site carries a registry id
 * and every id is used — is a source scan, and lives in `.github/workflows/e2e.yml`
 * because `@types/node` is not a dependency here and a spec cannot read files.
 */
test.describe('@smoke test.fixme registry', () => {
  test('every entry is still within its review window', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expired = expiredEntries(today);
    expect(
      expired.map((e) => `${e.id} (reviewBy ${e.reviewBy}) — blocked on ${e.blockedOn}`),
      'Suppressed tests are past their review date. Delete the entry and un-suppress the ' +
        'test if its blocker is gone (flip the call site to a plain `test()` and run it), ' +
        'or move `reviewBy` deliberately with a re-checked reason. Do not bulk-postpone.',
    ).toEqual([]);
  });

  test('ids are unique and well formed', () => {
    const ids = FIXME_REGISTRY.map((e) => e.id);
    expect(new Set(ids).size, 'duplicate fixme ids').toBe(ids.length);
    expect(
      ids.filter((id) => !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)),
      'fixme ids must be `<area>/<slug>`, lowercase and hyphenated',
    ).toEqual([]);
  });

  test('every entry carries a reason, a blocker and an ISO review date', () => {
    const malformed = FIXME_REGISTRY.filter(
      (e) =>
        e.title.trim().length === 0 ||
        e.reason.trim().length === 0 ||
        e.blockedOn.trim().length === 0 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(e.reviewBy),
    ).map((e) => e.id);
    expect(malformed, 'incomplete registry entries').toEqual([]);
  });

  test('the title format the CI guard parses is the one entries produce', () => {
    // The guard in `.github/workflows/e2e.yml` matches `[fixme:<id>]` at the
    // start of a suppressed test's title. If that shape ever drifts from
    // `expectedTitle`, the guard silently stops finding call sites and reports
    // every registry row as an orphan — so pin the format here.
    for (const entry of FIXME_REGISTRY) {
      expect(expectedTitle(entry)).toBe(`[fixme:${entry.id}] ${entry.title}`);
    }
  });
});
