import { Injectable, type Signal, computed, signal } from '@angular/core';

/** The slice of a rhythm cell the page-level summary needs. */
export interface RhythmEntry {
  readonly label: Signal<string>;
  readonly group: Signal<string>;
  readonly na: Signal<string>;
  readonly height: Signal<number>;
  readonly onGrid: Signal<boolean>;
  readonly drift: Signal<number>;
}

/**
 * Aggregates every measured cell on the page.
 *
 * Angular view queries do not cross component boundaries, and the cells live
 * inside per-family panel components — so the panels cannot be reached from the
 * page's own template. Cells self-register here instead. Provided by the page,
 * never `providedIn: 'root'`.
 */
@Injectable()
export class RhythmReport {
  private readonly registry = signal<readonly RhythmEntry[]>([]);

  /** Every cell currently mounted, in registration order. */
  readonly cells = this.registry.asReadonly();

  /** Cells that produced a real measurement (excludes overlay-only `n/a` slots). */
  readonly measured = computed(() => this.cells().filter(c => !c.na() && c.height() > 0));

  /** Measured cells whose height misses the baseline grid. */
  readonly offGrid = computed(() => this.measured().filter(c => !c.onGrid()));

  /** Cells declared unmeasurable, with the stated reason. */
  readonly skipped = computed(() => this.cells().filter(c => !!c.na()));

  register(entry: RhythmEntry): void {
    this.registry.update(list => [...list, entry]);
  }

  unregister(entry: RhythmEntry): void {
    this.registry.update(list => list.filter(e => e !== entry));
  }

  /**
   * Distinct heights within a named group, ascending. A group whose components
   * are meant to sit side by side in a form row should collapse to one value —
   * anything longer is the misalignment, quantified.
   */
  heightsIn(group: string): number[] {
    const heights = this.measured()
      .filter(c => c.group() === group)
      .map(c => c.height());
    return [...new Set(heights)].sort((a, b) => a - b);
  }

  /** Peak-to-peak height spread within a group, in CSS pixels. */
  spreadIn(group: string): number {
    const heights = this.heightsIn(group);
    return heights.length ? Math.round((heights[heights.length - 1] - heights[0]) * 100) / 100 : 0;
  }
}
