import 'vitest-axe/extend-expect';
import { beforeAll } from 'vitest';

/**
 * Cross-file guard: a spec that replaces a global timer function and does not
 * put the original back poisons every spec file that runs after it in the same
 * worker, because `isolate: false` shares one jsdom window across a worker's
 * files.
 *
 * The canonical way to trip this is `vi.spyOn(globalThis, 'setTimeout')` called
 * *while* `vi.useFakeTimers()` is installed. The spy captures Sinon's fake as
 * its "original", and Vitest runs `vi.restoreAllMocks()` after every spec file
 * ("mocks should not affect different files"), which re-applies that fake
 * *after* `useRealTimers()` has already uninstalled its clock. What is left
 * behind accepts callbacks and never runs them, while `vi.isFakeTimers()` still
 * reports `false` — so the obvious probe says everything is fine. Angular's
 * zoneless scheduler ticks from `setTimeout`, so `whenStable()` can then never
 * resolve and every test in the *next* spec file times out at the suite budget,
 * naming a component that has nothing to do with it. That signature cost seven
 * audit passes and three wrong diagnoses; this turns it into one named error.
 *
 * The baseline is stashed on `globalThis`, not in module scope: this setup file
 * is re-evaluated once per spec file, so a module-scope capture would re-capture
 * the already-poisoned function and the guard would never fire. It is keyed to
 * the window object so a legitimately fresh test environment re-baselines rather
 * than failing.
 */
const stash = globalThis as typeof globalThis & {
  __twTimerBaseline?: {
    window: unknown;
    setTimeout: typeof globalThis.setTimeout;
    clearTimeout: typeof globalThis.clearTimeout;
  };
};

beforeAll(() => {
  const baseline = stash.__twTimerBaseline;

  if (!baseline || baseline.window !== globalThis.window) {
    stash.__twTimerBaseline = {
      window: globalThis.window,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    };
    return;
  }

  const broken =
    globalThis.setTimeout !== baseline.setTimeout
      ? 'setTimeout'
      : globalThis.clearTimeout !== baseline.clearTimeout
        ? 'clearTimeout'
        : null;

  if (broken) {
    throw new Error(
      `[ngx-tw test-setup] globalThis.${broken} was replaced by an earlier spec ` +
        `file in this worker and never restored, so timers are dead for every ` +
        `file that follows and unrelated specs will hang until the suite budget. ` +
        `The usual cause is \`vi.spyOn(globalThis, '${broken}')\` called while ` +
        `\`vi.useFakeTimers()\` is installed; patch the global by plain ` +
        `assignment instead — see the note in carousel.spec.ts.`,
    );
  }
});
