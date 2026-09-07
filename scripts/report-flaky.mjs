#!/usr/bin/env node
// Surface flaky tests from a Playwright JSON report.
//
// WHY THIS EXISTS
// ---------------
// Playwright retries a failed test (`retries: 1` on CI, deliberately — see
// playwright.config.ts). A test that fails and then passes on retry is reported
// as "N flaky": a `##[notice]`, not an error. The job concludes `success` and
// the PR check goes green, so a genuine race is invisible to anyone who does
// not open the log. That silently defeated the merge gate twice in one day
// (a split RTL keyboard race and a toast snap-back race), and a third flake
// was only spotted by grepping job logs by hand.
//
// This step makes the flake legible without changing the gate: it writes the
// flaky list to the job summary and emits a workflow warning. It deliberately
// EXITS 0 — retries still absorb transient infra blips, which is what the
// config comment asks for. Flip to `--fail-on-flaky-tests` on the Playwright
// invocation once the flake inventory reliably comes back empty; that is a
// gate change and wants its own decision.
import { readFileSync, appendFileSync } from 'node:fs';

const reportPath = process.argv[2] ?? 'test-results/results.json';
const label = process.argv[3] ?? 'e2e';

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch {
  // No report (job failed before Playwright ran, or the path moved). Silence is
  // correct here — this step must never be the reason a run looks broken.
  process.exit(0);
}

/** Playwright nests suites arbitrarily deep; collect every spec at any level. */
function collectSpecs(node, out = []) {
  for (const spec of node.specs ?? []) out.push(spec);
  for (const child of node.suites ?? []) collectSpecs(child, out);
  return out;
}

const specs = (report.suites ?? []).flatMap((s) => collectSpecs(s));
const flaky = [];
for (const spec of specs) {
  for (const test of spec.tests ?? []) {
    // Playwright marks a spec's test `flaky` when an earlier attempt failed and
    // a later one passed. `results.length > 1` alone would also catch a genuine
    // failure that exhausted its retries, so key off the status.
    if (test.status === 'flaky') {
      flaky.push(`${test.projectName} › ${spec.file}:${spec.line} › ${spec.title}`);
    }
  }
}

if (flaky.length === 0) process.exit(0);

const lines = flaky.map((f) => `- \`${f}\``).join('\n');
console.log(`::warning title=Flaky tests in ${label}::${flaky.length} test(s) passed only on retry`);
for (const f of flaky) console.log(`  flaky: ${f}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `\n### ⚠️ Flaky in \`${label}\` — ${flaky.length} test(s) passed only on retry\n\n${lines}\n\nThese did **not** fail the run. A test that fails then passes is almost always a race in the test, not an infra blip.\n`,
  );
}
process.exit(0);
