import {
  type ComponentRef,
  inject,
  Injectable,
  Injector,
  type OnDestroy,
  type Provider,
  type StaticProvider,
  type TemplateRef,
  type Type,
  signal,
  type Signal,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import { Dialog, DialogConfig as CdkDialogConfig } from '@angular/cdk/dialog';
import {
  createBlockScrollStrategy,
  createCloseScrollStrategy,
  createNoopScrollStrategy,
  createRepositionScrollStrategy,
  type ScrollStrategy,
} from '@angular/cdk/overlay';
import type { ComponentType } from '@angular/cdk/portal';
import { defer, type Observable, startWith, Subject } from 'rxjs';
import {
  TW_DIALOG_DATA,
  TW_DIALOG_DEFAULT_OPTIONS,
  TwDialogConfig,
  type TwDialogScrollStrategy,
} from './dialog-config';
import { DialogContainer } from './dialog-container';
import { TwDialogRef } from './dialog-ref';

/**
 * Opens Tailwind-styled modal dialogs. Composes `@angular/cdk/dialog` for focus
 * trapping, portals, overlay plumbing, and adds a Tailwind container, richer
 * ref API, and animation lifecycle.
 *
 * Not `providedIn: 'root'` — register it via {@link provideTwDialog}.
 */
@Injectable()
export class TwDialog implements OnDestroy {
  private readonly cdkDialog = inject(Dialog);
  private readonly injector = inject(Injector);
  private readonly defaultOptions = inject(TW_DIALOG_DEFAULT_OPTIONS, { optional: true }) ?? {};
  private readonly parentDialog = inject(TwDialog, { optional: true, skipSelf: true });

  private readonly openDialogsAtThisLevel = signal<readonly TwDialogRef<unknown, unknown>[]>([]);
  private readonly afterOpenedSubject = new Subject<TwDialogRef<unknown, unknown>>();
  private readonly afterAllClosedSubject = new Subject<void>();

  /** Reactively-readable list of currently-open dialogs across the full dialog tree. */
  readonly openDialogs: Signal<readonly TwDialogRef<unknown, unknown>[]> = this.parentDialog
    ? this.parentDialog.openDialogs
    : this.openDialogsAtThisLevel.asReadonly();

  /** Emits every time a dialog is opened. */
  readonly afterOpened: Observable<TwDialogRef<unknown, unknown>> = this.parentDialog
    ? this.parentDialog.afterOpened
    : this.afterOpenedSubject.asObservable();

  /**
   * Emits when every open dialog has closed. Emits immediately on subscribe if
   * there are none open.
   */
  readonly afterAllClosed: Observable<void> = defer(() =>
    this.openDialogs().length
      ? this.getAfterAllClosedSource()
      : this.getAfterAllClosedSource().pipe(startWith(undefined as void)),
  );

  /**
   * Opens a dialog using the given component or template.
   * @param content Component class or `TemplateRef`.
   * @param config Options merged over the application defaults.
   * @returns Reference controlling the opened dialog.
   */
  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    config?: TwDialogConfig<D, R>,
  ): TwDialogRef<R, C> {
    const merged = this.resolveConfig<D, R>(config);
    let twRef!: TwDialogRef<R, C>;

    const cdkRef = this.cdkDialog.open<R, D, C>(content, {
      id: merged.id,
      role: merged.role,
      data: merged.data,
      panelClass: merged.panelClass,
      backdropClass: merged.backdropClass ?? 'tw-dialog-backdrop',
      hasBackdrop: merged.hasBackdrop,
      width: merged.width,
      height: merged.height,
      minWidth: merged.minWidth,
      minHeight: merged.minHeight,
      maxWidth: merged.maxWidth,
      maxHeight: merged.maxHeight,
      direction: merged.direction,
      ariaDescribedBy: merged.ariaDescribedBy,
      ariaLabelledBy: merged.ariaLabelledBy,
      ariaLabel: merged.ariaLabel,
      ariaModal: merged.ariaModal,
      autoFocus: merged.autoFocus,
      restoreFocus: merged.restoreFocus,
      scrollStrategy: merged.scrollStrategy ?? this.resolveScrollStrategy(merged.scrollBehavior),
      closeOnNavigation: merged.closeOnNavigation,
      viewContainerRef: merged.viewContainerRef,
      injector: merged.injector,
      // We handle close/Escape/backdrop ourselves so we can run the exit animation.
      disableClose: true,
      closeOnOverlayDetachments: false,
      container: {
        type: DialogContainer,
        providers: () => [
          { provide: TwDialogConfig, useValue: merged },
          { provide: CdkDialogConfig, useValue: merged },
        ],
      },
      providers: (_cdkRef, _cdkConfig, container) => {
        twRef = new TwDialogRef<R, C>(
          _cdkRef,
          merged as unknown as TwDialogConfig<unknown, R>,
          container as DialogContainer,
        );
        const providers: StaticProvider[] = [
          { provide: TwDialogRef, useValue: twRef },
          { provide: TW_DIALOG_DATA, useValue: merged.data ?? null },
        ];
        if (Array.isArray(merged.providers)) providers.push(...merged.providers);
        return providers;
      },
    });

    // After CDK attaches the component, copy references onto our ref.
    (twRef as { componentRef: ComponentRef<C> | null }).componentRef = cdkRef.componentRef;
    twRef.componentInstance = cdkRef.componentInstance as C | null;

    const scope = this.parentDialog ?? this;
    scope.registerOpen(twRef as unknown as TwDialogRef<unknown, unknown>);

    twRef.afterClosed().subscribe(() => {
      scope.unregister(twRef as unknown as TwDialogRef<unknown, unknown>);
    });

    return twRef;
  }

  /** Closes every open dialog managed by this service (and child services). */
  closeAll(): void {
    const dialogs = [...this.openDialogs()];
    for (let i = dialogs.length - 1; i >= 0; i--) dialogs[i].close();
  }

  /** Looks up an open dialog by its id. */
  getDialogById<R = unknown, C = unknown>(id: string): TwDialogRef<R, C> | undefined {
    return this.openDialogs().find((dialog) => dialog.id === id) as TwDialogRef<R, C> | undefined;
  }

  ngOnDestroy(): void {
    const dialogs = [...this.openDialogsAtThisLevel()];
    for (let i = dialogs.length - 1; i >= 0; i--) dialogs[i].close();
    this.afterOpenedSubject.complete();
    this.afterAllClosedSubject.complete();
  }

  private registerOpen(ref: TwDialogRef<unknown, unknown>): void {
    if (this.parentDialog) {
      this.parentDialog.registerOpen(ref);
    } else {
      this.openDialogsAtThisLevel.update((list) => [...list, ref]);
      this.afterOpenedSubject.next(ref);
    }
  }

  private unregister(ref: TwDialogRef<unknown, unknown>): void {
    if (this.parentDialog) {
      this.parentDialog.unregister(ref);
    } else {
      this.openDialogsAtThisLevel.update((list) => list.filter((d) => d !== ref));
      if (this.openDialogsAtThisLevel().length === 0) {
        this.afterAllClosedSubject.next();
      }
    }
  }

  private getAfterAllClosedSource(): Subject<void> {
    return this.parentDialog
      ? this.parentDialog.getAfterAllClosedSource()
      : this.afterAllClosedSubject;
  }

  private resolveConfig<D, R>(config: TwDialogConfig<D, R> | undefined): TwDialogConfig<D, R> {
    const merged = new TwDialogConfig<D, R>();
    Object.assign(merged, this.defaultOptions, config);
    return merged;
  }

  private resolveScrollStrategy(
    strategy: TwDialogScrollStrategy | undefined,
  ): ScrollStrategy {
    switch (strategy) {
      case 'close':
        return createCloseScrollStrategy(this.injector);
      case 'reposition':
        return createRepositionScrollStrategy(this.injector);
      case 'noop':
        return createNoopScrollStrategy();
      case 'block':
      default:
        return createBlockScrollStrategy(this.injector);
    }
  }
}

/**
 * Registers the {@link TwDialog} service for dependency injection.
 *
 * @param defaultOptions Optional defaults merged into every `open()` call.
 * @example
 * ```ts
 * provideTwDialog({ size: 'lg', hasBackdrop: true })
 * ```
 */
export function provideTwDialog(
  defaultOptions?: Partial<TwDialogConfig>,
): EnvironmentProviders {
  const providers: Provider[] = [TwDialog];
  if (defaultOptions) {
    providers.push({ provide: TW_DIALOG_DEFAULT_OPTIONS, useValue: defaultOptions });
  }
  return makeEnvironmentProviders(providers);
}
