import {
  type ComponentRef,
  inject,
  Injectable,
  Injector,
  type OnDestroy,
  type Provider,
  type StaticProvider,
  type TemplateRef,
  signal,
  type Signal,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import { Dialog, DialogConfig as CdkDialogConfig } from '@angular/cdk/dialog';
import {
  createBlockScrollStrategy,
  createCloseScrollStrategy,
  createGlobalPositionStrategy,
  createNoopScrollStrategy,
  createRepositionScrollStrategy,
  type GlobalPositionStrategy,
  type ScrollStrategy,
} from '@angular/cdk/overlay';
import type { ComponentType } from '@angular/cdk/portal';
import { defer, type Observable, startWith, Subject } from 'rxjs';
import {
  SHEET_DATA,
  SHEET_DEFAULT_OPTIONS,
  SheetConfig,
  type SheetScrollStrategy,
  type SheetSide,
} from './sheet-config';
import { SheetContainer } from './sheet-container';
import { SheetRef } from './sheet-ref';

/**
 * Opens edge-anchored sheet (drawer) overlays. Composes `@angular/cdk/dialog`
 * for focus trapping, portals, and overlay plumbing — adds a `GlobalPositionStrategy`
 * pinned to the requested viewport edge, a Tailwind container with axis-aware
 * sizing, slide enter/exit animations, and split close-behavior flags.
 *
 * Not `providedIn: 'root'` — register it via {@link provideSheet}.
 */
@Injectable()
export class Sheet implements OnDestroy {
  private readonly cdkDialog = inject(Dialog);
  private readonly injector = inject(Injector);
  private readonly defaultOptions = inject(SHEET_DEFAULT_OPTIONS, { optional: true }) ?? {};
  private readonly parentSheet = inject(Sheet, { optional: true, skipSelf: true });

  private readonly openSheetsAtThisLevel = signal<readonly SheetRef<unknown, unknown>[]>([]);
  private readonly afterOpenedSubject = new Subject<SheetRef<unknown, unknown>>();
  private readonly afterAllClosedSubject = new Subject<void>();

  /** Reactively-readable list of currently-open sheets across the full sheet tree. */
  readonly openSheets: Signal<readonly SheetRef<unknown, unknown>[]> = this.parentSheet
    ? this.parentSheet.openSheets
    : this.openSheetsAtThisLevel.asReadonly();

  /** Emits every time a sheet is opened. */
  readonly afterOpened: Observable<SheetRef<unknown, unknown>> = this.parentSheet
    ? this.parentSheet.afterOpened
    : this.afterOpenedSubject.asObservable();

  /**
   * Emits when every open sheet has closed. Emits immediately on subscribe if
   * there are none open.
   */
  readonly afterAllClosed: Observable<void> = defer(() =>
    this.openSheets().length
      ? this.getAfterAllClosedSource()
      : this.getAfterAllClosedSource().pipe(startWith(undefined as void)),
  );

  /**
   * Opens a sheet using the given component or template.
   * @param content Component class or `TemplateRef`.
   * @param config Options merged over the application defaults.
   * @returns Reference controlling the opened sheet.
   */
  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    config?: SheetConfig<D, R>,
  ): SheetRef<R, C> {
    const merged = this.resolveConfig<D, R>(config);
    let sheetRef!: SheetRef<R, C>;

    const cdkRef = this.cdkDialog.open<R, D, C>(content, {
      id: merged.id,
      role: merged.role,
      data: merged.data,
      panelClass: merged.panelClass,
      backdropClass: merged.backdropClass || 'tw-sheet-backdrop',
      hasBackdrop: merged.hasBackdrop,
      // Sheet sizing happens on the container element (axis-aware width/height
      // utilities). The overlay pane itself is the full-edge bounding box.
      direction: merged.direction,
      ariaDescribedBy: merged.ariaDescribedBy,
      ariaLabelledBy: merged.ariaLabelledBy,
      ariaLabel: merged.ariaLabel,
      ariaModal: merged.ariaModal,
      autoFocus: merged.autoFocus,
      restoreFocus: merged.restoreFocus,
      scrollStrategy: merged.scrollStrategy ?? this.resolveScrollStrategy(merged.scrollBehavior),
      positionStrategy:
        merged.positionStrategy ?? this.resolvePositionStrategy(merged.side ?? 'right'),
      closeOnNavigation: merged.closeOnNavigation,
      viewContainerRef: merged.viewContainerRef,
      injector: merged.injector,
      // We handle close/Escape/backdrop ourselves so we can run the exit slide animation.
      disableClose: true,
      closeOnOverlayDetachments: false,
      container: {
        type: SheetContainer,
        providers: () => [
          { provide: SheetConfig, useValue: merged },
          { provide: CdkDialogConfig, useValue: merged },
        ],
      },
      providers: (_cdkRef, _cdkConfig, container) => {
        sheetRef = new SheetRef<R, C>(
          _cdkRef,
          merged as unknown as SheetConfig<unknown, R>,
          container as SheetContainer,
        );
        const providers: StaticProvider[] = [
          { provide: SheetRef, useValue: sheetRef },
          { provide: SHEET_DATA, useValue: merged.data ?? null },
        ];
        if (Array.isArray(merged.providers)) providers.push(...merged.providers);
        return providers;
      },
    });

    // After CDK attaches the component, copy references onto our ref.
    (sheetRef as { componentRef: ComponentRef<C> | null }).componentRef = cdkRef.componentRef;
    sheetRef.componentInstance = cdkRef.componentInstance as C | null;

    const scope = this.parentSheet ?? this;
    scope.registerOpen(sheetRef as unknown as SheetRef<unknown, unknown>);

    sheetRef.afterClosed().subscribe(() => {
      scope.unregister(sheetRef as unknown as SheetRef<unknown, unknown>);
    });

    return sheetRef;
  }

  /** Closes every open sheet managed by this service (and child services). */
  closeAll(): void {
    const sheets = [...this.openSheets()];
    for (let i = sheets.length - 1; i >= 0; i--) sheets[i].close();
  }

  /** Looks up an open sheet by its id. */
  getSheetById<R = unknown, C = unknown>(id: string): SheetRef<R, C> | undefined {
    return this.openSheets().find((sheet) => sheet.id === id) as SheetRef<R, C> | undefined;
  }

  ngOnDestroy(): void {
    const sheets = [...this.openSheetsAtThisLevel()];
    for (let i = sheets.length - 1; i >= 0; i--) sheets[i].close();
    this.afterOpenedSubject.complete();
    this.afterAllClosedSubject.complete();
  }

  private registerOpen(ref: SheetRef<unknown, unknown>): void {
    if (this.parentSheet) {
      this.parentSheet.registerOpen(ref);
    } else {
      this.openSheetsAtThisLevel.update((list) => [...list, ref]);
      this.afterOpenedSubject.next(ref);
    }
  }

  private unregister(ref: SheetRef<unknown, unknown>): void {
    if (this.parentSheet) {
      this.parentSheet.unregister(ref);
    } else {
      this.openSheetsAtThisLevel.update((list) => list.filter((d) => d !== ref));
      if (this.openSheetsAtThisLevel().length === 0) {
        this.afterAllClosedSubject.next();
      }
    }
  }

  private getAfterAllClosedSource(): Subject<void> {
    return this.parentSheet
      ? this.parentSheet.getAfterAllClosedSource()
      : this.afterAllClosedSubject;
  }

  private resolveConfig<D, R>(config: SheetConfig<D, R> | undefined): SheetConfig<D, R> {
    const merged = new SheetConfig<D, R>();
    Object.assign(merged, this.defaultOptions, config);
    return merged;
  }

  private resolveScrollStrategy(strategy: SheetScrollStrategy | undefined): ScrollStrategy {
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

  private resolvePositionStrategy(side: SheetSide): GlobalPositionStrategy {
    const strategy = createGlobalPositionStrategy(this.injector);
    switch (side) {
      case 'left':
        return strategy.top('0').left('0').bottom('0');
      case 'top':
        return strategy.top('0').left('0').right('0');
      case 'bottom':
        return strategy.bottom('0').left('0').right('0');
      case 'right':
      default:
        return strategy.top('0').right('0').bottom('0');
    }
  }
}

/**
 * Registers the {@link Sheet} service for dependency injection.
 *
 * @param defaultOptions Optional defaults merged into every `open()` call.
 * @example
 * ```ts
 * provideSheet({ side: 'left', size: 'lg' })
 * ```
 */
export function provideSheet(defaultOptions?: Partial<SheetConfig>): EnvironmentProviders {
  const providers: Provider[] = [Sheet];
  if (defaultOptions) {
    providers.push({ provide: SHEET_DEFAULT_OPTIONS, useValue: defaultOptions });
  }
  return makeEnvironmentProviders(providers);
}
