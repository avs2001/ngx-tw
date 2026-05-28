import {
  type ComponentRef,
  DestroyRef,
  type ElementRef,
  inject,
  Injectable,
  type Injector,
  signal,
  type Signal,
  type ViewContainerRef,
} from '@angular/core';
import {
  _IdGenerator,
  FocusTrapFactory,
} from '@angular/cdk/a11y';
import {
  type ConnectedPosition,
  Overlay,
  type OverlayRef,
  type ScrollStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal, type ComponentType } from '@angular/cdk/portal';
import { Subject, type Observable } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * Enter-animation duration for date-picker / date-range-picker overlays.
 * Matches `theme/_base.css` `.scale-in 140ms` — the keyframe the picker
 * overlays apply via `animate.enter="scale-in"`. The coordinator delays
 * `opened$` emission by this duration so consumers can hook the moment the
 * panel has fully appeared instead of the moment `open()` was called.
 */
export const PICKER_ENTER_DURATION = 140;

/**
 * Leave-animation duration for date-picker / date-range-picker overlays.
 * Matches `theme/_base.css` `.scale-out 120ms` — the keyframe the picker
 * overlays apply via `animate.leave="scale-out"`. The coordinator delays
 * overlay detach by this duration so the leave animation can play through.
 */
export const PICKER_LEAVE_DURATION = 120;

/** Configuration passed to {@link PickerOverlayCoordinator.open}. */
export interface PickerOpenConfig<TOverlay> {
  /** Element used as the connected-overlay origin (typically the picker trigger). */
  readonly origin: ElementRef<HTMLElement>;
  /** Component type to render inside the overlay (e.g. `DatePickerOverlayComponent`). */
  readonly portalComponent: ComponentType<TOverlay>;
  /** View-container that hosts the embedded view; usually the picker's `ViewContainerRef`. */
  readonly viewContainerRef: ViewContainerRef;
  /** Optional injector forwarded to the portal so DI tokens resolve from the picker's tree. */
  readonly injector?: Injector;
  /** Connected-position list — typically the result of `buildSelectLikePositions(offset)`. */
  readonly positions: ConnectedPosition[];
  /** CDK scroll-strategy instance for the overlay. */
  readonly scrollStrategy: ScrollStrategy;
  /** CSS class applied to the CDK overlay-pane element (NOT the panel root). */
  readonly panelClass: string;
  /** Viewport margin forwarded to the CDK position-strategy. Defaults to `8`. */
  readonly viewportMargin?: number;
}

/** Synchronous return shape of {@link PickerOverlayCoordinator.open}. */
export interface PickerOpenResult<TOverlay> {
  /** The CDK `OverlayRef` driving the overlay — exposed for advanced consumers. */
  readonly overlayRef: OverlayRef;
  /** The Angular `ComponentRef` for the attached portal — exposed so consumers may run `detectChanges()` to flush an initial-config push synchronously. */
  readonly componentRef: ComponentRef<TOverlay>;
  /** The instance of the attached portal component. Equivalent to `componentRef.instance`. */
  readonly instance: TOverlay;
  /** Auto-generated id consumers may wire to `aria-controls` / dialog `id`. */
  readonly panelId: string;
}

/**
 * Coordinator that owns the CDK `OverlayRef`, focus trap, panel-id, and
 * animation timing for an overlay-bearing form control. Consumed by
 * `DatePickerComponent` and `DateRangePickerComponent`; both pickers register
 * the coordinator at the component level (`providers: [PickerOverlayCoordinator]`)
 * so each picker instance owns its own coordinator state.
 *
 * Per the library "no `providedIn: 'root'` for services" rule (see
 * `.claude/CLAUDE.md` → "What NOT To Do"): the coordinator holds per-overlay
 * `OverlayRef` / `FocusTrap` state and MUST be component-scoped.
 *
 * Scope of responsibility:
 * - Create / dispose the CDK `OverlayRef`.
 * - Attach a `ComponentPortal` and return the instance.
 * - Set up / tear down a `FocusTrap` around the overlay element.
 * - Emit `opened$` after the enter animation completes (closes the
 *   synchronous-emit bug previously present in both pickers).
 * - Expose `backdropClick$` / `overlayKeydown$` / `escape$` streams scoped
 *   to the current open lifecycle.
 * - Run a leave-animation timer with an `isAttached` guard so close races
 *   never touch a detached `OverlayRef` (mirrors the S14 command-palette
 *   pattern).
 *
 * Out of scope (stays in the consuming picker):
 * - "Restore previous value on close" — semantics differ per picker.
 * - Per-picker portal callbacks (calendar selection, action-bar buttons).
 * - View-mode change-detection nudges (the range-picker calls
 *   `changeDetectorRef.detectChanges()` after pushing its initial overlay
 *   config; the date-picker does not).
 */
@Injectable()
export class PickerOverlayCoordinator {
  private readonly overlay = inject(Overlay);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly destroyRef = inject(DestroyRef);
  private readonly idGenerator = inject(_IdGenerator);

  private overlayRef: OverlayRef | null = null;
  private focusTrap: ReturnType<FocusTrapFactory['create']> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private openedTimer: ReturnType<typeof setTimeout> | null = null;
  private currentPanelId: string | null = null;
  private currentClose$: Subject<void> | null = null;
  private openedSubject: Subject<void> | null = null;

  private readonly attachedSignal = signal(false);
  private readonly openedSignal = signal(false);

  /** Whether the overlay is currently attached (between `open()` and detach). */
  readonly attached: Signal<boolean> = this.attachedSignal.asReadonly();

  /** Whether the enter animation has completed (`opened$` has fired). */
  readonly opened: Signal<boolean> = this.openedSignal.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.disposeImmediate());
  }

  /**
   * Creates and attaches the overlay. Returns the live overlay metadata
   * synchronously; callers should subscribe to {@link opened$} to observe the
   * moment the enter animation completes. Returns `null` if an overlay is
   * already attached.
   */
  open<TOverlay>(config: PickerOpenConfig<TOverlay>): PickerOpenResult<TOverlay> | null {
    if (this.overlayRef) return null;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(config.origin)
      .withPositions(config.positions)
      .withFlexibleDimensions(false)
      .withPush(false)
      .withViewportMargin(config.viewportMargin ?? 8);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: config.scrollStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: config.panelClass,
    });

    const portal = new ComponentPortal<TOverlay>(
      config.portalComponent,
      config.viewContainerRef,
      config.injector,
    );
    const ref = this.overlayRef.attach(portal);
    const instance = ref.instance;

    this.currentPanelId = this.idGenerator.getId('tw-picker-overlay-');
    this.currentClose$ = new Subject<void>();
    this.openedSubject = new Subject<void>();
    this.attachedSignal.set(true);
    this.openedSignal.set(false);

    this.setupFocusTrap();
    this.scheduleOpenedEmission();

    return {
      overlayRef: this.overlayRef,
      componentRef: ref,
      instance,
      panelId: this.currentPanelId,
    };
  }

  /**
   * Starts the close sequence — destroys the focus trap immediately so focus
   * can return to the trigger, then detaches the overlay after the leave
   * animation runs ({@link PICKER_LEAVE_DURATION}). Invokes `onAfterClose`
   * once the overlay is fully detached. No-op if no overlay is open or a
   * close is already in flight.
   *
   * Mirrors the S14 command-palette `isAttached`-guarded close pattern:
   * after the timer fires we re-check `attachedSignal` before touching the
   * overlay so a race (programmatic dispose, double-close) cannot touch a
   * destroyed instance.
   */
  close(onAfterClose: () => void = () => {}): void {
    if (!this.overlayRef || this.closeTimer !== null) return;
    this.destroyFocusTrap();
    this.clearOpenedTimer();

    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      if (!this.attachedSignal()) {
        // Lost race with disposeImmediate / destroyRef.onDestroy.
        return;
      }
      if (this.overlayRef?.hasAttached()) {
        this.overlayRef.detach();
      }
      // Dispose the OverlayRef so the next open() builds a fresh one with the
      // current inputs (offset, scrollStrategy, panelClass). Without this the
      // `if (this.overlayRef) return null;` guard at the top of open() would
      // permanently block re-opens after the first close.
      this.overlayRef?.dispose();
      this.overlayRef = null;
      this.currentClose$?.next();
      this.currentClose$?.complete();
      this.currentClose$ = null;
      this.openedSubject?.complete();
      this.openedSubject = null;
      this.attachedSignal.set(false);
      this.openedSignal.set(false);
      this.currentPanelId = null;
      onAfterClose();
    }, PICKER_LEAVE_DURATION);
  }

  /**
   * Stream of overlay-level backdrop clicks for the current open lifecycle.
   * Completes when the overlay closes.
   */
  backdropClick$(): Observable<MouseEvent> {
    this.assertOpen('backdropClick$');
    return this.overlayRef!.backdropClick().pipe(takeUntil(this.currentClose$!));
  }

  /**
   * Stream of overlay-level keydown events for the current open lifecycle.
   * Completes when the overlay closes.
   */
  overlayKeydown$(): Observable<KeyboardEvent> {
    this.assertOpen('overlayKeydown$');
    return this.overlayRef!.keydownEvents().pipe(takeUntil(this.currentClose$!));
  }

  /**
   * Stream filtered to `Escape` keydowns inside the overlay for the current
   * open lifecycle. Equivalent to `overlayKeydown$().pipe(filter(e => e.key === 'Escape'))`
   * but spelled out so consumers don't import RxJS operators just for the
   * common case.
   */
  escape$(): Observable<KeyboardEvent> {
    return this.overlayKeydown$().pipe(filter((e) => e.key === 'Escape'));
  }

  /**
   * Emits exactly once after the enter animation completes
   * ({@link PICKER_ENTER_DURATION}ms after `open()`). Used by consumers to
   * fire their `opened` output at the moment the overlay panel is actually
   * visible — closes the synchronous-emit bug the pickers carried before
   * this coordinator existed.
   *
   * Completes when the overlay closes.
   */
  opened$(): Observable<void> {
    this.assertOpen('opened$');
    return this.openedSubject!.asObservable().pipe(takeUntil(this.currentClose$!));
  }

  /** Exposes the live `OverlayRef` for advanced consumers (e.g. width sync). */
  ref(): OverlayRef | null {
    return this.overlayRef;
  }

  /**
   * Exposes the current panel id (auto-generated via CDK `_IdGenerator`,
   * stable for the open lifecycle, reset to `null` on close). Neither
   * consuming picker uses this today — both keep their own
   * `${hostId}-dialog` id for `aria-controls` wiring — but the helper is
   * exposed for future consumers (e.g. a picker wrapper that wants its
   * panel id auto-managed).
   */
  panelId(): string | null {
    return this.currentPanelId;
  }

  /**
   * Immediately disposes the overlay and tears down the focus trap without
   * running the leave animation. Called from {@link DestroyRef.onDestroy};
   * consumers should NOT call this — use {@link close} for the user-visible
   * close path.
   */
  private disposeImmediate(): void {
    this.clearCloseTimer();
    this.clearOpenedTimer();
    this.destroyFocusTrap();
    if (this.currentClose$) {
      this.currentClose$.next();
      this.currentClose$.complete();
      this.currentClose$ = null;
    }
    this.openedSubject?.complete();
    this.openedSubject = null;
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.attachedSignal.set(false);
    this.openedSignal.set(false);
    this.currentPanelId = null;
  }

  private setupFocusTrap(): void {
    if (!this.overlayRef) return;
    this.focusTrap = this.focusTrapFactory.create(this.overlayRef.overlayElement);
  }

  private destroyFocusTrap(): void {
    this.focusTrap?.destroy();
    this.focusTrap = null;
  }

  private scheduleOpenedEmission(): void {
    this.clearOpenedTimer();
    if (!this.overlayRef || !this.overlayRef.hasAttached()) return;
    this.openedTimer = setTimeout(() => {
      this.openedTimer = null;
      if (!this.attachedSignal()) return;
      this.openedSignal.set(true);
      this.openedSubject?.next();
    }, PICKER_ENTER_DURATION);
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private clearOpenedTimer(): void {
    if (this.openedTimer !== null) {
      clearTimeout(this.openedTimer);
      this.openedTimer = null;
    }
  }

  private assertOpen(method: string): void {
    if (!this.overlayRef || !this.currentClose$ || !this.openedSubject) {
      throw new Error(
        `PickerOverlayCoordinator.${method}() called before open() — no overlay attached.`,
      );
    }
  }
}
