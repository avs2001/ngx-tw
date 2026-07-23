import { type ComponentRef, signal, type Signal } from '@angular/core';
import { type DialogRef as CdkDialogRef } from '@angular/cdk/dialog';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';
import { filter, merge, type Observable, ReplaySubject, Subject, take } from 'rxjs';
import type { FocusOrigin } from '@angular/cdk/a11y';
import type { TwDialogConfig } from './dialog-config';
import type { DialogContainer, DialogState } from './dialog-container';

/**
 * Reference to a dialog opened via {@link TwDialog.open}. Drives the dialog
 * lifecycle (close, state, observables) and forwards useful overlay streams.
 *
 * The ref is returned **synchronously** from `open()`, but the dialog's render
 * layer (`@angular/cdk/dialog` + the Tailwind container) is loaded through a
 * dynamic `import()`. The ref therefore starts *detached*: `id`, `state`,
 * `close()`, the lifecycle observables, and panel/size mutations all work
 * immediately (mutations are buffered and replayed on attach), but the rendered
 * component instance does not exist yet — read it via {@link whenComponentReady}
 * instead of a synchronous `componentInstance` field.
 */
export class TwDialogRef<R = unknown, C = unknown> {
  /** Unique ID of the dialog. Generated eagerly by the service, so it is valid the instant `open()` returns. */
  readonly id: string;

  /** Current lifecycle state. Reactively readable. */
  readonly state: Signal<DialogState>;

  /** When `true`, close-via-escape and close-via-backdrop are disabled. */
  disableClose: boolean | undefined;

  private readonly stateSignal = signal<DialogState>('opening');
  private readonly afterOpenedSubject = new ReplaySubject<void>(1);
  private readonly beforeClosedSubject = new ReplaySubject<R | undefined>(1);
  private readonly afterClosedSubject = new ReplaySubject<R | undefined>(1);
  // Facade-owned pass-throughs for the raw overlay streams, so a consumer that
  // subscribes before the render chunk attaches still receives events once it
  // does — the pre-deferral behaviour when `open()` wrapped a live `cdkRef`.
  private readonly backdropClickSubject = new Subject<MouseEvent>();
  private readonly keydownEventsSubject = new Subject<KeyboardEvent>();

  private cdkRef: CdkDialogRef<R, C> | null = null;
  private container: DialogContainer | null = null;

  private componentInstanceValue: C | null = null;
  private componentRefValue: ComponentRef<C> | null = null;
  private resolveComponentReady!: (value: C | null) => void;
  private readonly componentReadyPromise = new Promise<C | null>((resolve) => {
    this.resolveComponentReady = resolve;
  });

  // Buffered mutations issued before the render chunk attached the CDK backend.
  private readonly pendingPanelAdds: string[] = [];
  private readonly pendingPanelRemoves: string[] = [];
  private pendingSize: [string | number, string | number] | null = null;

  private pendingResult: R | undefined;
  private closeFocusOrigin: FocusOrigin | undefined;

  constructor(id: string, readonly config: TwDialogConfig<unknown, R>) {
    this.id = id;
    this.disableClose = config.disableClose;
    this.state = this.stateSignal.asReadonly();
  }

  /** The Tailwind container instance, or `null` until the dialog has attached. */
  get containerInstance(): DialogContainer | null {
    return this.container;
  }

  /**
   * @internal Wire this facade to its CDK backend. Called from the dialog
   * renderer **inside** `cdkDialog.open()`'s `providers` callback — the same
   * point the constructor ran before deferral — so subscriptions to
   * `animationStateChanged` are in place before the container emits `'open'`.
   */
  _attach(cdkRef: CdkDialogRef<R, C>, container: DialogContainer): void {
    this.cdkRef = cdkRef;
    this.container = container;

    // Forward the raw overlay streams into the facade pass-throughs.
    cdkRef.backdropClick.subscribe(this.backdropClickSubject);
    cdkRef.keydownEvents.subscribe(this.keydownEventsSubject);

    cdkRef.addPanelClass('tw-dialog-panel');
    for (const cls of this.pendingPanelAdds) cdkRef.addPanelClass(cls);
    for (const cls of this.pendingPanelRemoves) cdkRef.removePanelClass(cls);
    if (this.pendingSize) cdkRef.updateSize(this.pendingSize[0], this.pendingSize[1]);
    this.pendingPanelAdds.length = 0;
    this.pendingPanelRemoves.length = 0;
    this.pendingSize = null;

    const animationChanges = container.animationStateChanged;

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

    // The container owns the exit-animation fallback timer (see
    // ANIMATION_FALLBACK_PADDING in dialog-container.ts), so we trust its
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

  /** @internal Record the rendered component after `cdkDialog.open()` returns. */
  _setComponent(instance: C | null, ref: ComponentRef<C> | null): void {
    this.componentInstanceValue = instance;
    this.componentRefValue = ref;
    this.resolveComponentReady(instance);
  }

  /**
   * Resolves with the rendered content-component instance once the dialog's
   * render chunk has loaded and attached. Resolves `null` for template dialogs,
   * and for a dialog closed before it ever opened.
   *
   * Replaces the former synchronous `componentInstance` field, which cannot be
   * populated before the deferred render chunk lands.
   *
   * @example
   * ```ts
   * const ref = dialog.open(EditorDialog);
   * const editor = await ref.whenComponentReady();
   * editor?.focusFirstField();
   * ```
   */
  whenComponentReady(): Promise<C | null> {
    return this.componentReadyPromise;
  }

  /** The rendered component instance, or `null` if not yet attached / a template dialog. Prefer {@link whenComponentReady}. */
  get componentInstance(): C | null {
    return this.componentInstanceValue;
  }

  /** The rendered `ComponentRef`, or `null` if not yet attached / a template dialog. */
  get componentRef(): ComponentRef<C> | null {
    return this.componentRefValue;
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

  /** Backdrop click stream (emits even when `disableClose` is set). Buffered — a subscription made before the dialog attaches receives events once it does. */
  backdropClick(): Observable<MouseEvent> {
    return this.backdropClickSubject.asObservable();
  }

  /** Keydown event stream for the overlay. Buffered — a subscription made before the dialog attaches receives events once it does. */
  keydownEvents(): Observable<KeyboardEvent> {
    return this.keydownEventsSubject.asObservable();
  }

  /** Updates the dialog's width/height. Pass empty string to reset a dimension. Buffered until attach. */
  updateSize(width: string | number = '', height: string | number = ''): this {
    if (this.cdkRef) {
      this.cdkRef.updateSize(width, height);
    } else {
      this.pendingSize = [width, height];
    }
    return this;
  }

  /** Adds CSS classes to the overlay panel. Buffered until attach. */
  addPanelClass(classes: string | string[]): this {
    if (this.cdkRef) {
      this.cdkRef.addPanelClass(classes);
    } else {
      this.pendingPanelAdds.push(...(Array.isArray(classes) ? classes : [classes]));
    }
    return this;
  }

  /** Removes CSS classes from the overlay panel. Buffered until attach. */
  removePanelClass(classes: string | string[]): this {
    if (this.cdkRef) {
      this.cdkRef.removePanelClass(classes);
    } else {
      this.pendingPanelRemoves.push(...(Array.isArray(classes) ? classes : [classes]));
    }
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
        this.componentInstanceValue,
      )
    ) {
      return;
    }

    this.pendingResult = result;
    this.closeFocusOrigin = origin;
    this.stateSignal.set('closing');

    this.beforeClosedSubject.next(result);
    this.beforeClosedSubject.complete();

    if (!this.cdkRef) {
      // Closed before the render chunk attached: the overlay was never created,
      // so there is nothing to animate or dispose. Synthesize the closed state
      // and let the service skip opening entirely (it checks state()).
      this.finishClose();
      return;
    }

    this.cdkRef.overlayRef.detachBackdrop();
    this.container!._startExitAnimation();
  }

  private finishClose(): void {
    if (this.stateSignal() === 'closed') return;
    this.stateSignal.set('closed');

    this.afterClosedSubject.next(this.pendingResult);
    this.afterClosedSubject.complete();

    // Idempotent — a no-op if _setComponent already resolved with an instance.
    this.resolveComponentReady(null);
    this.backdropClickSubject.complete();
    this.keydownEventsSubject.complete();

    if (this.cdkRef?.containerInstance) {
      this.cdkRef.close(this.pendingResult, { focusOrigin: this.closeFocusOrigin });
    }

    this.componentInstanceValue = null;
  }
}
