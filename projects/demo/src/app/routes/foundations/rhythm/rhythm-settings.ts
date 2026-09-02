import type { TwSize } from '@cdevhub/ngx-tw/core';

/**
 * The toolbar state, passed whole to every panel.
 *
 * One object rather than six inputs: panels forward it verbatim to
 * `<app-rhythm-paper>` and read only `size` themselves, so a single binding
 * removes the chance of a panel wiring five of six knobs correctly.
 */
export interface RhythmSettings {
  /** Size fed to every component in the panel. */
  readonly size: TwSize;
  /** Baseline unit heights are checked against, in px. */
  readonly unit: number;
  /** Major (row) ruling pitch, in px. */
  readonly rowUnit: number;
  /** Whether the ruling is painted at all. */
  readonly gridOn: boolean;
  /** Horizontal ruling only — vertical lines are noise when auditing heights. */
  readonly axisY: boolean;
  /** Outline slots whose height misses the baseline. */
  readonly flagOffGrid: boolean;
}
