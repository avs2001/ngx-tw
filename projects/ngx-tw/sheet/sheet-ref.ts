import { type ComponentRef, signal, type Signal } from '@angular/core';
import { type DialogRef as CdkDialogRef } from '@angular/cdk/dialog';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';
import { filter, merge, type Observable, ReplaySubject, take } from 'rxjs';
import type { FocusOrigin } from '@angular/cdk/a11y';
import type { SheetConfig } from './sheet-config';
import type { SheetContainer, SheetState } from './sheet-container';

/**
 * Reference to a sheet opened via {@link Sheet.open}. Drives the sheet
 * lifecycle (close, state, observables) and forwards useful overlay streams.
 */
export class SheetRef<R = unknown, C = unknown> {
  /** Unique ID of the sheet. */
  readonly id: string;

  /** Instance of the component rendered inside the sheet, or `null` for template sheets. */
  componentInstance: C | null = null;

  /** `ComponentRef` of the content component, or `null` for template sheets. */
  readonly componentRef: ComponentRef<C> | null = null;

  /** Current lifecycle state. Reactively readable. */
  readonly state: Signal<SheetState>;

  /** When `true`, close-via-escape AND close-via-backdrop are both disabled. */
  disableClose: boolean | undefined;

  /** When `false`, pressing Escape does not close the sheet. */
  closeOnEscape: boolean | undefined;

  /** When `false`, clicking the backdrop does not close the sheet. */
  closeOnBackdropClick: boolean | undefined;

  private readonly stateSignal = signal<SheetState>('opening');
  private readonly afterOpenedSubject = new ReplaySubject<void>(1);
  private readonly beforeClosedSubject = new ReplaySubject<R | undefined>(1);
  private readonly afterClosedSubject = new ReplaySubject<R | undefined>(1);

  private pendingResult: R | undefined;
  private closeFocusOrigin: FocusOrigin | undefined;

  constructor(
    private readonly cdkRef: CdkDialogRef<R, C>,
    readonly config: SheetConfig<unknown, R>,
    readonly containerInstance: SheetContainer,
  ) {
    this.id = cdkRef.id;
    this.disableClose = config.disableClose;
    this.closeOnEscape = config.closeOnEscape;
    this.closeOnBackdropClick = config.closeOnBackdropClick;
    this.state = this.stateSignal.asReadonly();

    cdkRef.addPanelClass('tw-sheet-panel');

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

    // The container owns the exit-animation fallback timer
    // (ANIMATION_FALLBACK_PADDING in sheet-container.ts), so we trust its
    // `closed` emission and run finishClose exactly once from here.
    animationChanges
      .pipe(
        filter((event) => event.state === 'closed'),
        take(1),
      )
      .subscribe(() => this.finishClose());

    cdkRef.overlayRef.detachments().subscribe(() => {
      if (this.stateSignal() !== 'closed') {
        this.beforeClosedSubject.next(this.pendingResult);
        this.beforeClosedSubject.complete();
        this.finishClose();
      }
    });

    merge(
      cdkRef.backdropClick.pipe(
        filter(() => !this.disableClose && this.closeOnBackdropClick !== false),
      ),
      cdkRef.keydownEvents.pipe(
        filter(
          (event) =>
            event.keyCode === ESCAPE &&
            !this.disableClose &&
            this.closeOnEscape !== false &&
            !hasModifierKey(event),
        ),
      ),
    ).subscribe((event) => {
      event.preventDefault();
      this.closeWithOrigin(event.type === 'keydown' ? 'keyboard' : 'mouse');
    });
  }

  /**
   * Closes the sheet. The exit slide animation runs before the overlay is disposed.
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

  /** Observable that emits once after the sheet has fully closed and the overlay is disposed. */
  afterClosed(): Observable<R | undefined> {
    return this.afterClosedSubject.asObservable();
  }

  /** Backdrop click stream (emits even when `closeOnBackdropClick` / `disableClose` is set). */
  backdropClick(): Observable<MouseEvent> {
    return this.cdkRef.backdropClick;
  }

  /** Keydown event stream for the overlay. */
  keydownEvents(): Observable<KeyboardEvent> {
    return this.cdkRef.keydownEvents;
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
  }

  private finishClose(): void {
    if (this.stateSignal() === 'closed') return;
    this.stateSignal.set('closed');

    this.afterClosedSubject.next(this.pendingResult);
    this.afterClosedSubject.complete();

    if (this.cdkRef.containerInstance) {
      this.cdkRef.close(this.pendingResult, { focusOrigin: this.closeFocusOrigin });
    }

    this.componentInstance = null;
  }
}
