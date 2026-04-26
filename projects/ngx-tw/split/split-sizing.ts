/** Constraints declared by a single pane. */
export interface PaneConstraints {
  defaultSize: number | undefined;
  minSize: number;
  maxSize: number;
}

const EPSILON = 0.01;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function clampSize(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Available space for pane content after subtracting gutters.
 * For percent mode this is used only when we need a px reference (e.g., pixel
 * unit sizing or overflow detection); percent sizes are always relative to this
 * space but expressed as 0-100 sums.
 */
export function availableSpace(containerPx: number, numPanes: number, gutterSize: number): number {
  return Math.max(0, containerPx - Math.max(0, numPanes - 1) * gutterSize);
}

/**
 * CSS flex-basis string for a pane.
 *
 * Percent mode: sizes represent percentages of the available space (container
 * minus gutters). Since CSS `%` is relative to the flex container (which
 * includes gutter space), we subtract each pane's proportional share of total
 * gutter space via `calc()`. This requires no knowledge of the container's
 * pixel size at render time.
 *
 * Pixel mode: a simple pixel value.
 */
export function computeBasis(
  size: number,
  unit: 'percent' | 'pixel',
  numPanes: number,
  gutterSize: number,
): string {
  if (unit === 'pixel') return `${size}px`;
  const totalGutterPx = Math.max(0, numPanes - 1) * gutterSize;
  const gutterShare = (size / 100) * totalGutterPx;
  // Round to 4 decimal places so the CSS string is deterministic and readable.
  const pct = +size.toFixed(4);
  const gutter = +gutterShare.toFixed(4);
  return `calc(${pct}% - ${gutter}px)`;
}

// ── Constraint resolver ───────────────────────────────────────────────────────

/**
 * Resolve initial sizes from pane configs.
 * Priority (§4.2): defaultSize → even distribution.
 * Results are clamped against minSize/maxSize.
 */
export function resolveInitialSizes(
  panes: PaneConstraints[],
  unit: 'percent' | 'pixel',
  availablePx: number,
): number[] {
  const n = panes.length;
  if (n === 0) return [];

  // Pixel mode with unknown container: use declared defaults directly.
  // ResizeObserver will scale them once the real container size is known.
  if (unit === 'pixel' && availablePx <= 0) {
    return panes.map(p => clampSize(p.defaultSize ?? 0, p.minSize, p.maxSize));
  }

  const totalUnit = unit === 'percent' ? 100 : availablePx;

  const declaredSum = panes.reduce((acc, p) => acc + (p.defaultSize ?? 0), 0);
  const undeclaredCount = panes.filter(p => p.defaultSize === undefined).length;
  const remaining = Math.max(0, totalUnit - declaredSum);
  const undeclaredShare = undeclaredCount > 0 ? remaining / undeclaredCount : 0;

  const raw = panes.map(p => p.defaultSize ?? undeclaredShare);
  return redistributeWithConstraints(raw, panes, totalUnit);
}

/**
 * Clamp sizes against per-pane min/max, redistributing slack proportionally
 * among unclamped panes until the target total is satisfied (§4.2).
 *
 * Iterates up to `n + 1` times — sufficient for any acyclic constraint graph.
 */
export function redistributeWithConstraints(
  sizes: number[],
  panes: PaneConstraints[],
  totalUnit: number,
): number[] {
  const n = sizes.length;
  // Start with all values clamped to their feasible range.
  const result = sizes.map((s, i) => clampSize(s, panes[i].minSize, panes[i].maxSize));

  for (let iter = 0; iter <= n; iter++) {
    const currentSum = result.reduce((a, b) => a + b, 0);
    if (Math.abs(currentSum - totalUnit) < EPSILON) break;

    // Find panes that can flex in the direction needed to reach the target.
    const flex: number[] = [];
    if (currentSum < totalUnit) {
      for (let i = 0; i < n; i++) {
        if (result[i] < panes[i].maxSize - EPSILON) flex.push(i);
      }
    } else {
      for (let i = 0; i < n; i++) {
        if (result[i] > panes[i].minSize + EPSILON) flex.push(i);
      }
    }
    if (flex.length === 0) break; // constraints infeasible — best-effort result

    const flexSet = new Set(flex);
    const fixedSum = result.reduce((acc, s, i) => (flexSet.has(i) ? acc : acc + s), 0);
    const flexTarget = totalUnit - fixedSum;
    const flexCurrent = flex.reduce((acc, i) => acc + result[i], 0);

    if (Math.abs(flexCurrent - flexTarget) < EPSILON) break;

    if (flexCurrent <= EPSILON) {
      const share = flexTarget / flex.length;
      for (const i of flex) result[i] = clampSize(share, panes[i].minSize, panes[i].maxSize);
    } else {
      const scale = flexTarget / flexCurrent;
      for (const i of flex) result[i] = clampSize(result[i] * scale, panes[i].minSize, panes[i].maxSize);
    }
  }

  return result;
}

// ── Container resize rescaling (§4.3) ─────────────────────────────────────────

/**
 * Rescale sizes after a container resize event.
 *
 * - Percent mode: proportions (percentages) are preserved; re-clamp only.
 * - Pixel mode: scale sizes proportionally to the new available space, then
 *   re-clamp.
 *
 * Returns the new sizes and a flag indicating whether any pane was clamped
 * beyond its proportional share (used to decide whether to fire sizesChange).
 */
export function rescaleForContainerResize(
  currentSizes: number[],
  panes: PaneConstraints[],
  unit: 'percent' | 'pixel',
  oldAvailablePx: number,
  newAvailablePx: number,
): { sizes: number[]; clamped: boolean } {
  const n = currentSizes.length;
  if (n === 0) return { sizes: [], clamped: false };

  const totalUnit = unit === 'percent' ? 100 : newAvailablePx;

  let proposed: number[];
  if (unit === 'percent') {
    proposed = [...currentSizes];
  } else {
    const ratio = oldAvailablePx > EPSILON ? newAvailablePx / oldAvailablePx : 1;
    proposed = currentSizes.map(s => s * ratio);
  }

  const clamped = redistributeWithConstraints(proposed, panes, totalUnit);
  const wasClamped = clamped.some((s, i) => Math.abs(s - proposed[i]) > EPSILON);
  return { sizes: clamped, clamped: wasClamped };
}

// ── Pane add / remove (§4.4) ──────────────────────────────────────────────────

/**
 * Compute sizes after a new pane is inserted at `newPaneIndex`.
 * The new pane enters at its defaultSize (or an equal share if unset);
 * existing panes shrink proportionally to accommodate it.
 */
export function redistributeOnPaneAdded(
  currentSizes: number[],
  newPaneIndex: number,
  newPaneConfig: PaneConstraints,
  allPaneConfigs: PaneConstraints[],
  unit: 'percent' | 'pixel',
  availablePx: number,
): number[] {
  const n = allPaneConfigs.length;
  const totalUnit = unit === 'percent' ? 100 : availablePx;

  const newSize = clampSize(
    newPaneConfig.defaultSize ?? totalUnit / n,
    newPaneConfig.minSize,
    newPaneConfig.maxSize,
  );

  const existingTarget = Math.max(0, totalUnit - newSize);
  const existingSum = currentSizes.reduce((a, b) => a + b, 0);

  const scaled =
    existingSum > EPSILON
      ? currentSizes.map(s => (s / existingSum) * existingTarget)
      : currentSizes.map(() => existingTarget / Math.max(1, currentSizes.length));

  const result = [...scaled];
  result.splice(newPaneIndex, 0, newSize);

  return redistributeWithConstraints(result, allPaneConfigs, totalUnit);
}

/**
 * Compute sizes after the pane at `removedIndex` is removed.
 * Its space is redistributed proportionally to remaining panes.
 */
export function redistributeOnPaneRemoved(
  currentSizes: number[],
  removedIndex: number,
  remainingPaneConfigs: PaneConstraints[],
  unit: 'percent' | 'pixel',
  availablePx: number,
): number[] {
  const remaining = currentSizes.filter((_, i) => i !== removedIndex);
  if (remaining.length === 0) return [];

  const totalUnit = unit === 'percent' ? 100 : availablePx;
  const remainingSum = remaining.reduce((a, b) => a + b, 0);

  const scaled =
    remainingSum > EPSILON
      ? remaining.map(s => (s / remainingSum) * totalUnit)
      : remaining.map(() => totalUnit / remaining.length);

  return redistributeWithConstraints(scaled, remainingPaneConfigs, totalUnit);
}

// ── Overflow check (§4.2) ─────────────────────────────────────────────────────

/** Returns true when the sum of all minSizes exceeds the available space. */
export function hasMinSizeOverflow(
  panes: PaneConstraints[],
  unit: 'percent' | 'pixel',
  availablePx: number,
): boolean {
  const totalUnit = unit === 'percent' ? 100 : availablePx;
  const minSum = panes.reduce((acc, p) => acc + p.minSize, 0);
  return minSum > totalUnit + EPSILON;
}
