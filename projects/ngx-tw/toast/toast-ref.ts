import { signal, type Signal, type WritableSignal } from '@angular/core';
import type { Portal } from '@angular/cdk/portal';
import { type Observable, ReplaySubject, Subject } from 'rxjs';
import type {
  ToastAction,
  ToastConfig,
  ToastContent,
  ToastDismissReason,
  ToastDismissal,
  ToastSeverity,
  ToastState,
} from './toast-config';

/** Duration (ms) of the toast enter / leave animation. Must match `_base.css` toast-slide keyframes. */
export const TOAST_ANIMATION_DURATION = 150;

/** Padding added to animation fallback timers to guarantee cleanup if the CSS event is swallowed. */
export const TOAST_ANIMATION_FALLBACK_PADDING = 50;

/** Patch accepted by {@link ToastRef.update}. Mirrors the subset of `ToastConfig` that is safe to mutate live. */
export interface ToastUpdatePatch {
  /** New severity — updates color, default icon, and (for `'error'`) live-region politeness. */
  severity?: ToastSeverity;
  /** New auto-dismiss duration in ms. Restarts the timer if the toast is visible. `0` disables auto-dismiss. */
  duration?: number;
  /** Replace or clear the action button. Pass `null` to remove. */
  action?: ToastAction | null;
  /** Override the icon slot. */
  icon?: string | false | undefined;
  /** Replace the `TW_TOAST_DATA` payload. */
  data?: unknown;
  /** Replace the aria-label applied to the toast wrapper. */
  ariaLabel?: string;
  /** Replace the toast's content (string, template, or component). */
  content?: ToastContent;
  /** Whether the close button is shown. */
  dismissible?: boolean;
}

/**
 * Reference to a toast opened via {@link ToastService}. Use to dismiss the
 * toast, pause / resume its auto-dismiss timer, or observe its lifecycle.
 *
 * The service returns a ref synchronously from every open method; the toast
 * itself is attached asynchronously inside the CDK overlay.
 */
export class ToastRef<C = unknown, R = unknown> {
  /** Unique id. Generated if `config.id` was not provided. */
  readonly id: string;

  /** Instance of the component rendered inside the toast (only for component-class content). */
  componentInstance: C | null = null;

  /** Resolved static config for this toast (defaults merged, severity shorthand applied). */
  readonly config: Readonly<ToastConfig<unknown, R>>;

  /** Reactive lifecycle state. */
  readonly state: Signal<ToastState>;

  /** Reactive severity — may change after `update()` (used by the `promise()` helper). */
  readonly severity: Signal<ToastSeverity>;

  /** Reactive dismissibility. */
  readonly dismissible: Signal<boolean>;

  /** Reactive icon override. */
  readonly icon: Signal<string | false | undefined>;

  /** Reactive content (the source of truth for what gets rendered). */
  readonly content: Signal<ToastContent>;

  /** Reactive action button configuration. */
  readonly action: Signal<ToastAction | undefined>;

  /** Reactive accessible label. */
  readonly ariaLabel: Signal<string | undefined>;

  /** Reactive data payload — re-read by the container to update `TW_TOAST_DATA`. */
  readonly data: Signal<unknown>;

  /** @internal Reactive "transient" class applied by swipe gestures (e.g. `translate3d(...)`). */
  readonly swipeTransform = signal<string | null>(null);

  /** @internal Reactive opacity applied during swipe gestures. */
  readonly swipeOpacity = signal<number | null>(null);

  /** @internal Leave-animation class override. When non-null, container uses this instead of the position default. */
  readonly leaveAnimationOverride = signal<string | null>(null);

  /** @internal Portal for component-class content. Set by the service; null for string / template content. */
  _portal: Portal<unknown> | null = null;

  /** @internal True while the pointer hovers this toast. */
  _hovered = false;

  /** @internal True while focus is within this toast. */
  _focused = false;

  /** @internal Set by the service so the ref can reach the CDK-owned OverlayRef if it needs to. */
  _overlayPanelElement: HTMLElement | null = null;

  private readonly stateSignal = signal<ToastState>('entering');
  private readonly severitySignal: WritableSignal<ToastSeverity>;
  private readonly dismissibleSignal: WritableSignal<boolean>;
  private readonly iconSignal: WritableSignal<string | false | undefined>;
  private readonly contentSignal: WritableSignal<ToastContent>;
  private readonly actionSignal: WritableSignal<ToastAction | undefined>;
  private readonly ariaLabelSignal: WritableSignal<string | undefined>;
  private readonly dataSignal: WritableSignal<unknown>;

  private readonly afterOpenedSubject = new ReplaySubject<void>(1);
  private readonly beforeDismissedSubject = new ReplaySubject<R | undefined>(1);
  private readonly afterDismissedSubject = new ReplaySubject<ToastDismissal<R>>(1);
  private readonly updatedSubject = new Subject<ToastUpdatePatch>();

  private dismissReason: ToastDismissReason = 'programmatic';
  private dismissResult: R | undefined;
  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private autoDismissStartedAt = 0;
  private autoDismissRemaining = 0;
  private paused = false;
  private enterTimer: ReturnType<typeof setTimeout> | null = null;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    id: string,
    content: ToastContent,
    config: ToastConfig<unknown, R>,
    private readonly dismissCallback: (ref: ToastRef) => void,
  ) {
    this.id = id;
    this.config = config;
    this.severitySignal = signal(config.severity ?? 'info');
    this.dismissibleSignal = signal(config.dismissible ?? true);
    this.iconSignal = signal<string | false | undefined>(
      typeof config.icon === 'string' || config.icon === false ? config.icon : undefined,
    );
    this.contentSignal = signal(content);
    this.actionSignal = signal(config.action);
    this.ariaLabelSignal = signal(config.ariaLabel);
    this.dataSignal = signal(config.data ?? null);

    this.state = this.stateSignal.asReadonly();
    this.severity = this.severitySignal.asReadonly();
    this.dismissible = this.dismissibleSignal.asReadonly();
    this.icon = this.iconSignal.asReadonly();
    this.content = this.contentSignal.asReadonly();
    this.action = this.actionSignal.asReadonly();
    this.ariaLabel = this.ariaLabelSignal.asReadonly();
    this.data = this.dataSignal.asReadonly();

    this.autoDismissRemaining = config.duration ?? 0;
  }

  /**
   * @internal Start the enter animation clock. Called by the service once the
   * toast has actually been attached to its container.
   *
   * This deliberately does NOT run from the constructor. The renderer is loaded
   * through a dynamic `import()`, so a ref can exist for an arbitrary stretch
   * before anything is on screen — starting the clock at construction would let
   * a toast burn part (or all) of its auto-dismiss duration while still
   * invisible on a slow connection. Idempotent and safe to call after dismissal.
   */
  _startEnterSequence(): void {
    if (this.enterTimer !== null) return;
    if (this.stateSignal() !== 'entering') return;
    this.enterTimer = setTimeout(
      () => this._markVisible(),
      TOAST_ANIMATION_DURATION + TOAST_ANIMATION_FALLBACK_PADDING,
    );
  }

  /**
   * Dismiss the toast programmatically. The leave animation plays before the
   * element is removed and subscribers are notified. Safe to call multiple times.
   */
  dismiss(result?: R): void {
    this._dismissWith('programmatic', result);
  }

  /** Pause the auto-dismiss timer (if any). Called automatically on hover / focus when `pauseOnInteraction` is true. */
  pause(): void {
    if (this.paused) return;
    this.paused = true;
    if (this.autoDismissTimer !== null) {
      const elapsed = Date.now() - this.autoDismissStartedAt;
      this.autoDismissRemaining = Math.max(0, this.autoDismissRemaining - elapsed);
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
    const current = this.stateSignal();
    if (current === 'visible') this.stateSignal.set('paused');
  }

  /** Resume the auto-dismiss timer with the remaining time. */
  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    if (this.stateSignal() === 'paused') this.stateSignal.set('visible');
    if (this.config.duration && this.config.duration > 0) {
      if (this.autoDismissRemaining <= 0) {
        this._dismissWith('timeout');
        return;
      }
      this._startAutoDismissTimer();
    }
  }

  /**
   * @internal Update the hover state. When `pauseOnInteraction` is set and
   * either hover or focus is active, the auto-dismiss timer is paused.
   */
  _setHovered(hovered: boolean): void {
    this._hovered = hovered;
    this._syncInteractionPause();
  }

  /** @internal Update the focus-within state. See `_setHovered`. */
  _setFocused(focused: boolean): void {
    this._focused = focused;
    this._syncInteractionPause();
  }

  private _syncInteractionPause(): void {
    if (!this.config.pauseOnInteraction) return;
    if (this._hovered || this._focused) {
      this.pause();
    } else {
      this.resume();
    }
  }

  /** Invoke the configured action handler (or dismiss with reason `'action'` if none is set). */
  triggerAction(): void {
    const action = this.actionSignal();
    if (!action) return;
    if (action.handler) {
      action.handler(this as unknown as ToastRef);
    } else {
      this._dismissWith('action');
    }
  }

  /** Mutate the live toast in place. Used by the `promise()` helper to swap loading → success / error. */
  update(patch: ToastUpdatePatch): void {
    const currentState = this.stateSignal();
    if (currentState === 'dismissing' || currentState === 'dismissed') return;

    if (patch.severity !== undefined) this.severitySignal.set(patch.severity);
    if (patch.dismissible !== undefined) this.dismissibleSignal.set(patch.dismissible);
    if (patch.icon !== undefined) this.iconSignal.set(patch.icon);
    if (patch.content !== undefined) this.contentSignal.set(patch.content);
    if (patch.action !== undefined) this.actionSignal.set(patch.action ?? undefined);
    if (patch.ariaLabel !== undefined) this.ariaLabelSignal.set(patch.ariaLabel);
    if (patch.data !== undefined) this.dataSignal.set(patch.data);

    if (patch.duration !== undefined) {
      (this.config as { duration?: number }).duration = patch.duration;
      this.autoDismissRemaining = patch.duration;
      if (this.autoDismissTimer !== null) {
        clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = null;
      }
      if (!this.paused && (currentState === 'visible' || currentState === 'paused')) {
        this._startAutoDismissTimer();
      }
    }

    this.updatedSubject.next(patch);
  }

  /** Observable that emits once after the enter animation completes. */
  afterOpened(): Observable<void> {
    return this.afterOpenedSubject.asObservable();
  }

  /** Observable that emits once when the dismiss sequence starts. */
  beforeDismissed(): Observable<R | undefined> {
    return this.beforeDismissedSubject.asObservable();
  }

  /** Observable that emits once after the leave animation completes and the ref is cleaned up. */
  afterDismissed(): Observable<ToastDismissal<R>> {
    return this.afterDismissedSubject.asObservable();
  }

  /** @internal Observable of `update()` calls. The container subscribes to re-announce to `LiveAnnouncer`. */
  _updates(): Observable<ToastUpdatePatch> {
    return this.updatedSubject.asObservable();
  }

  /** @internal Called by the service when the max-visible cap is exceeded. */
  _dismissAsMaxExceeded(): void {
    this._dismissWith('max-exceeded');
  }

  /** @internal Start the dismiss sequence with the given reason. */
  _dismissWith(reason: ToastDismissReason, result?: R): void {
    const currentState = this.stateSignal();
    if (currentState === 'dismissing' || currentState === 'dismissed') return;

    this.dismissReason = reason;
    this.dismissResult = result;
    this.stateSignal.set('dismissing');

    if (this.autoDismissTimer !== null) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
    if (this.enterTimer !== null) {
      clearTimeout(this.enterTimer);
      this.enterTimer = null;
    }

    this.beforeDismissedSubject.next(result);
    this.beforeDismissedSubject.complete();

    this.leaveTimer = setTimeout(
      () => this._finishDismiss(),
      TOAST_ANIMATION_DURATION + TOAST_ANIMATION_FALLBACK_PADDING,
    );
  }

  /** @internal Finalise dismissal — clears timers, emits `afterDismissed`, and hands control back to the service. */
  _finishDismiss(): void {
    if (this.stateSignal() === 'dismissed') return;
    this.stateSignal.set('dismissed');

    if (this.leaveTimer !== null) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }

    const dismissal: ToastDismissal<R> = {
      reason: this.dismissReason,
      result: this.dismissResult,
    };
    this.afterDismissedSubject.next(dismissal);
    this.afterDismissedSubject.complete();
    this.updatedSubject.complete();

    this.dismissCallback(this as unknown as ToastRef);
  }

  private _markVisible(): void {
    if (this.enterTimer !== null) {
      clearTimeout(this.enterTimer);
      this.enterTimer = null;
    }
    const current = this.stateSignal();
    if (current !== 'entering') return;
    this.stateSignal.set('visible');
    this.afterOpenedSubject.next();
    this.afterOpenedSubject.complete();
    if (this.config.duration && this.config.duration > 0 && !this.paused) {
      this._startAutoDismissTimer();
    }
  }

  private _startAutoDismissTimer(): void {
    if (this.autoDismissRemaining <= 0) return;
    if (this.autoDismissTimer !== null) clearTimeout(this.autoDismissTimer);
    this.autoDismissStartedAt = Date.now();
    this.autoDismissTimer = setTimeout(
      () => this._dismissWith('timeout'),
      this.autoDismissRemaining,
    );
  }
}
