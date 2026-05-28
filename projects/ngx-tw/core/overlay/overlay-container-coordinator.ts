import {
  computed,
  DestroyRef,
  EventEmitter,
  inject,
  Injectable,
  signal,
  type Signal,
} from '@angular/core';
import { AriaIdQueue, OVERLAY_ANIMATION_FALLBACK_PADDING } from './overlay-container-helpers';

/** Lifecycle states an overlay container passes through. Shared by dialog and sheet. */
export type OverlayContainerState = 'opening' | 'open' | 'closing' | 'closed';

/** Event emitted on every overlay-container animation-state transition. */
export interface OverlayContainerAnimationEvent {
  /** State that the container just transitioned into. */
  state: OverlayContainerState;
  /** Duration, in ms, of the transition that triggered the event. */
  totalTime: number;
}

/**
 * Component-scoped coordinator that owns the enter/exit animation state
 * machine, ARIA-describedby id queue, and panel-class merge for an overlay
 * container that subclasses `@angular/cdk/dialog`'s `CdkDialogContainer`.
 *
 * Consumed by `DialogContainer` and `SheetContainer`; both register the
 * coordinator at the component level (`providers: [OverlayContainerCoordinator]`)
 * so each container instance owns its own animation state and queue.
 *
 * Per the library "no `providedIn: 'root'` for services" rule (see
 * `.claude/CLAUDE.md` → "What NOT To Do"): the coordinator holds per-overlay
 * state (the current animation timer, the describedby queue, the lifecycle
 * signal) and MUST be component-scoped.
 *
 * Scope of responsibility:
 * - Animation state signal (`state`) and `transitionDuration` computed.
 * - Enter/exit animation timing (`startEnterAnimation`, `startExitAnimation`)
 *   with a `transitionend`-fallback timer.
 * - `animationStateChanged` EventEmitter forwarded to the consuming `Ref`.
 * - ARIA-describedby id queue (the matching labelledby queue is already
 *   owned by CDK's `CdkDialogContainer._ariaLabelledByQueue`).
 *
 * Out of scope (stays on the container subclass):
 * - The `CdkDialogContainer` contract — focus trap, escape key, backdrop
 *   click, overlay attach/detach. The container subclass keeps inheriting
 *   `CdkDialogContainer` directly; this coordinator layers on top.
 * - Tailwind class resolution (`tv()` variant slots) — that's per-container.
 * - Host bindings on the container element — that's per-container.
 */
@Injectable()
export class OverlayContainerCoordinator {
  private readonly destroyRef = inject(DestroyRef);

  private readonly stateSignal = signal<OverlayContainerState>('opening');
  private readonly ariaDescribedByQueue = signal<readonly string[]>([]);
  private readonly queue = new AriaIdQueue();

  private animationTimer: ReturnType<typeof setTimeout> | null = null;
  private enterDuration = 0;
  private exitDuration = 0;

  /** Lifecycle state of the container's enter/exit animation. */
  readonly state: Signal<OverlayContainerState> = this.stateSignal.asReadonly();

  /** Live snapshot of the describedby id queue. */
  readonly describedByIds: Signal<readonly string[]> = this.ariaDescribedByQueue.asReadonly();

  /**
   * Active transition duration for the current state — the enter duration for
   * `opening` / `open`, the exit duration for `closing`, and 0 once `closed`.
   * Drives the container's `[style.transition-duration.ms]` host binding so a
   * one-line `data-[state]` transition rule can run with per-call timing.
   */
  readonly transitionDuration = computed(() => {
    const current = this.stateSignal();
    if (current === 'opening' || current === 'open') return this.enterDuration;
    if (current === 'closing') return this.exitDuration;
    return 0;
  });

  /**
   * Emits whenever the animation state transitions. The container's `Ref`
   * (`TwDialogRef` / `SheetRef`) subscribes to drive its own lifecycle
   * (`afterOpened`, `afterClosed`, exit-animation completion).
   */
  readonly animationStateChanged = new EventEmitter<OverlayContainerAnimationEvent>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearAnimationTimer();
      this.animationStateChanged.complete();
    });
  }

  /**
   * Records the resolved enter/exit durations for the open lifecycle.
   * Called once from the container constructor with values coerced via
   * `coerceOverlayDuration`. Stored on the coordinator so
   * `transitionDuration()` and the timer-driven state transitions read from
   * a single source.
   */
  setDurations(enter: number, exit: number): void {
    this.enterDuration = enter;
    this.exitDuration = exit;
  }

  /**
   * Drives the enter animation: emits `opening` immediately, then defers the
   * state flip to `open` by one frame so the browser applies the initial
   * (hidden / off-screen) styles before transitioning. If `enter` is `0`
   * everything resolves synchronously (no animation).
   */
  startEnterAnimation(): void {
    this.animationStateChanged.emit({ state: 'opening', totalTime: this.enterDuration });

    if (this.enterDuration === 0) {
      this.stateSignal.set('open');
      this.animationStateChanged.emit({ state: 'open', totalTime: 0 });
      return;
    }

    requestAnimationFrame(() => {
      this.stateSignal.set('open');
      this.runAnimationTimer(this.enterDuration, () => {
        this.animationStateChanged.emit({
          state: 'open',
          totalTime: this.enterDuration,
        });
      });
    });
  }

  /**
   * Drives the exit animation: emits `closing` synchronously and schedules
   * the `closed` emission for after the exit duration (+ a small fallback
   * padding) elapses. The consuming `Ref` listens for the `closed` emission
   * to detach the CDK overlay.
   */
  startExitAnimation(): void {
    this.stateSignal.set('closing');
    this.animationStateChanged.emit({ state: 'closing', totalTime: this.exitDuration });

    this.runAnimationTimer(this.exitDuration, () => {
      this.stateSignal.set('closed');
      this.animationStateChanged.emit({ state: 'closed', totalTime: this.exitDuration });
    });
  }

  /** Registers a description id with the `aria-describedby` queue. */
  addAriaDescribedBy(id: string): void {
    this.queue.add(id);
    this.ariaDescribedByQueue.set(this.queue.snapshot());
  }

  /** Removes a previously registered description id. */
  removeAriaDescribedBy(id: string): void {
    this.queue.remove(id);
    this.ariaDescribedByQueue.set(this.queue.snapshot());
  }

  /** First-registered-wins resolution for the `aria-describedby` attribute. */
  firstDescribedBy(): string | null {
    return this.queue.first();
  }

  private runAnimationTimer(duration: number, callback: () => void): void {
    this.clearAnimationTimer();
    if (duration === 0) {
      callback();
      return;
    }
    this.animationTimer = setTimeout(callback, duration + OVERLAY_ANIMATION_FALLBACK_PADDING);
  }

  private clearAnimationTimer(): void {
    if (this.animationTimer !== null) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
  }
}
