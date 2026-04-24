import { type ComponentRef, signal, type Signal } from '@angular/core';
import { type DialogRef as CdkDialogRef } from '@angular/cdk/dialog';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';
import { filter, merge, type Observable, ReplaySubject, take } from 'rxjs';
import type { FocusOrigin } from '@angular/cdk/a11y';
import type { TwDialogConfig } from './dialog-config';
import type { TwDialogContainer, TwDialogState } from './dialog-container';

/**
 * Reference to a dialog opened via {@link TwDialog.open}. Drives the dialog
 * lifecycle (close, state, observables) and forwards useful overlay streams.
 */
export class TwDialogRef<R = unknown, C = unknown> {
  /** Unique ID of the dialog. */
  readonly id: string;

  /** Instance of the component rendered inside the dialog, or `null` for template dialogs. */
  componentInstance: C | null = null;

  /** `ComponentRef` of the content component, or `null` for template dialogs. */
  readonly componentRef: ComponentRef<C> | null = null;

  /** Current lifecycle state. Reactively readable. */
  readonly state: Signal<TwDialogState>;

  /** When `true`, close-via-escape and close-via-backdrop are disabled. */
  disableClose: boolean | undefined;

  private readonly stateSignal = signal<TwDialogState>('opening');
  private readonly afterOpenedSubject = new ReplaySubject<void>(1);
  private readonly beforeClosedSubject = new ReplaySubject<R | undefined>(1);
  private readonly afterClosedSubject = new ReplaySubject<R | undefined>(1);

  private pendingResult: R | undefined;
  private closeFocusOrigin: FocusOrigin | undefined;
  private closeFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly cdkRef: CdkDialogRef<R, C>,
    readonly config: TwDialogConfig<unknown, R>,
    readonly containerInstance: TwDialogContainer,
  ) {
    this.id = cdkRef.id;
    this.disableClose = config.disableClose;
    this.state = this.stateSignal.asReadonly();

    cdkRef.addPanelClass('tw-dialog-panel');

    const animationChanges = containerInstance.animationStateChanged;

    animationChanges
      .pipe(
        filter((event) => event.state === 'open'),
        take(1),
      )
      .subscribe(() => {
        this.stateSignal.set('open');
        this.afterOpenedSubject.next();
        this.afterOpenedSubject.complete();
      });

    animationChanges
      .pipe(
        filter((event) => event.state === 'closed'),
        take(1),
      )
      .subscribe(() => {
        if (this.closeFallbackTimer) {
          clearTimeout(this.closeFallbackTimer);
          this.closeFallbackTimer = null;
        }
        this.finishClose();
      });

    cdkRef.overlayRef.detachments().subscribe(() => {
      if (this.stateSignal() !== 'closed') {
        this.beforeClosedSubject.next(this.pendingResult);
        this.beforeClosedSubject.complete();
        this.finishClose();
      }
    });

    merge(
      cdkRef.backdropClick,
      cdkRef.keydownEvents.pipe(
        filter(
          (event) => event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event),
        ),
      ),
    ).subscribe((event) => {
      if (this.disableClose) return;
      event.preventDefault();
      this.closeWithOrigin(event.type === 'keydown' ? 'keyboard' : 'mouse');
    });
  }

  /**
   * Closes the dialog. The exit animation runs before the overlay is disposed.
   * @param result Value forwarded to `afterClosed()` subscribers.
   */
  close(result?: R): void {
    this.closeWithOrigin('program', result);
  }

  /** Observable that emits once after the enter animation finishes. */
  afterOpened(): Observable<void> {
    return this.afterOpenedSubject.asObservable();
  }

  /** Observable that emits once when the close animation starts. */
  beforeClosed(): Observable<R | undefined> {
    return this.beforeClosedSubject.asObservable();
  }

  /** Observable that emits once after the dialog has fully closed and the overlay is disposed. */
  afterClosed(): Observable<R | undefined> {
    return this.afterClosedSubject.asObservable();
  }

  /** Backdrop click stream (emits even when `disableClose` is set). */
  backdropClick(): Observable<MouseEvent> {
    return this.cdkRef.backdropClick;
  }

  /** Keydown event stream for the overlay. */
  keydownEvents(): Observable<KeyboardEvent> {
    return this.cdkRef.keydownEvents;
  }

  /** Updates the dialog's width/height. Pass empty string to reset a dimension. */
  updateSize(width: string | number = '', height: string | number = ''): this {
    this.cdkRef.updateSize(width, height);
    return this;
  }

  /** Adds CSS classes to the overlay panel. */
  addPanelClass(classes: string | string[]): this {
    this.cdkRef.addPanelClass(classes);
    return this;
  }

  /** Removes CSS classes from the overlay panel. */
  removePanelClass(classes: string | string[]): this {
    this.cdkRef.removePanelClass(classes);
    return this;
  }

  private closeWithOrigin(origin: FocusOrigin, result?: R): void {
    if (this.stateSignal() === 'closing' || this.stateSignal() === 'closed') return;

    const predicate = this.config.closePredicate;
    if (
      predicate &&
      !predicate(
        result,
        this.config as unknown as Parameters<typeof predicate>[1],
        this.componentInstance,
      )
    ) {
      return;
    }

    this.pendingResult = result;
    this.closeFocusOrigin = origin;
    this.stateSignal.set('closing');

    this.beforeClosedSubject.next(result);
    this.beforeClosedSubject.complete();

    this.cdkRef.overlayRef.detachBackdrop();
    this.containerInstance._startExitAnimation();

    // Fallback timer ensures we clean up even if `animationStateChanged` is missed
    // (e.g. the host view is destroyed mid-animation).
    this.closeFallbackTimer = setTimeout(
      () => this.finishClose(),
      this.containerInstance.exitAnimationDuration + 100,
    );
  }

  private finishClose(): void {
    if (this.stateSignal() === 'closed') return;
    this.stateSignal.set('closed');

    if (this.closeFallbackTimer) {
      clearTimeout(this.closeFallbackTimer);
      this.closeFallbackTimer = null;
    }

    this.afterClosedSubject.next(this.pendingResult);
    this.afterClosedSubject.complete();

    if (this.cdkRef.containerInstance) {
      this.cdkRef.close(this.pendingResult, { focusOrigin: this.closeFocusOrigin });
    }

    this.componentInstance = null;
  }
}
