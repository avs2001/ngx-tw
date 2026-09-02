import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import {
  CommandPaletteComponent,
  type CommandPaletteItem,
} from '@cdevhub/ngx-tw/command-palette';
import {
  DialogActionsDirective,
  DialogCloseDirective,
  DialogContentDirective,
  DialogSubtitleDirective,
  DialogTitleDirective,
  TwDialog,
} from '@cdevhub/ngx-tw/dialog';
import { MenuComponent, MenuItemDirective, MenuTriggerDirective } from '@cdevhub/ngx-tw/menu';
import { PopoverCloseDirective, PopoverDirective } from '@cdevhub/ngx-tw/popover';
import {
  Sheet,
  SheetActionsDirective,
  SheetCloseDirective,
  SheetContentDirective,
  SheetHeaderDirective,
  SheetTitleDirective,
} from '@cdevhub/ngx-tw/sheet';
import { ToastService } from '@cdevhub/ngx-tw/toast';
import { TooltipDirective } from '@cdevhub/ngx-tw/tooltip';
import { RhythmCell } from '../rhythm-cell';
import { RhythmPaper } from '../rhythm-paper';
import type { RhythmSettings } from '../rhythm-settings';

/**
 * Overlay-bearing components on the rhythm grid.
 *
 * The odd panel of the set, deliberately. Every other family has a resting box
 * to measure; these do not — they exist only once a CDK overlay is attached.
 * What a consumer actually places in a layout is the *trigger*, and a trigger
 * is an ordinary control that has to line up with the plain button next to it
 * in a toolbar. So each component gets two slots: the trigger, measured and
 * grouped into `form-row`, and the surface, marked `n/a` and described in
 * words rather than opened. Nothing here opens on mount — a page that trapped
 * focus or blocked scrolling the moment it loaded would be useless as an
 * instrument.
 *
 * Every trigger is a default-variant `twButton`, deliberately. `outline` adds a
 * `border` the `tv()` base does not carry, so an outline trigger measures 2px
 * taller than a solid one at the same size — mixing variants here would post a
 * non-zero `form-row` spread caused by this panel's own styling rather than by
 * the library. Variant carries no diagnostic meaning in this panel; height
 * parity with the page's plain Button cell does.
 */
@Component({
  selector: 'app-overlay-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [
    RhythmPaper,
    RhythmCell,
    ButtonDirective,
    TooltipDirective,
    PopoverDirective,
    PopoverCloseDirective,
    MenuComponent,
    MenuTriggerDirective,
    MenuItemDirective,
    CommandPaletteComponent,
    DialogTitleDirective,
    DialogSubtitleDirective,
    DialogContentDirective,
    DialogActionsDirective,
    DialogCloseDirective,
    SheetHeaderDirective,
    SheetTitleDirective,
    SheetContentDirective,
    SheetActionsDirective,
    SheetCloseDirective,
  ],
  template: `
    <app-rhythm-paper
      heading="Overlay-bearing components"
      lede="These components have no resting inline box. They render into a CDK overlay on demand, so
            until something opens them there is nothing on the page to measure. What a consumer does
            place in a layout is the trigger — an ordinary control that has to sit on the grid beside
            a plain button in a toolbar — so the trigger is what this panel measures. Each surface
            gets a slot too, marked n/a and described in words rather than opened: several of these
            trap focus or block scrolling, and a page that did that on mount would be unusable."
      columns="sm:grid-cols-2"
      [settings]="settings()"
    >
      <!-- ===================== Dialog ===================== -->
      <app-rhythm-cell
        label="Dialog · trigger"
        group="form-row"
        note="Ordinary twButton — the Dialog service adds no markup of its own to the page."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton [size]="settings().size" (click)="openDialog()">Open dialog</button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Dialog · surface"
        na="renders into a CDK overlay on open — no resting inline box"
      >
        <p class="text-sm text-fg-muted">
          Centred modal panel: title, subtitle, content, and a right-aligned actions row.
        </p>
      </app-rhythm-cell>

      <!-- ===================== Sheet ===================== -->
      <app-rhythm-cell
        label="Sheet · trigger"
        group="form-row"
        note="Ordinary twButton — the Sheet service adds no markup of its own to the page."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton [size]="settings().size" (click)="openSheet()">Open sheet</button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Sheet · surface"
        na="renders into a CDK overlay on open — no resting inline box"
      >
        <p class="text-sm text-fg-muted">
          Edge-anchored panel (top, right, bottom or left) with header, content and actions.
        </p>
      </app-rhythm-cell>

      <!-- ===================== Toast ===================== -->
      <app-rhythm-cell
        label="Toast · trigger"
        group="form-row"
        note="Ordinary twButton — the Toast service adds no markup of its own to the page."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton [size]="settings().size" (click)="showToast()">Show toast</button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Toast · surface"
        na="opened into a corner overlay by the service — never in page flow"
      >
        <p class="text-sm text-fg-muted">
          Corner-stacked status card: icon, title, description, optional action and dismiss.
        </p>
      </app-rhythm-cell>

      <!-- ===================== Tooltip ===================== -->
      <app-rhythm-cell
        label="Tooltip · trigger"
        group="form-row"
        note="[twTooltip] adds no box of its own — the host button is the whole inline presence."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button
          twButton
          twTooltip="Measured: the trigger, not the tooltip"
          [twTooltipSize]="settings().size"
          [size]="settings().size"
        >
          Hover me
        </button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Tooltip · surface"
        na="renders into a CDK overlay on hover or focus — no resting inline box"
      >
        <p class="text-sm text-fg-muted">
          Small non-interactive label with an arrow, positioned against the trigger.
        </p>
      </app-rhythm-cell>

      <!-- ===================== Popover ===================== -->
      <app-rhythm-cell
        label="Popover · trigger"
        group="form-row"
        note="[twPopover] adds no box of its own — the host button is the whole inline presence."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button
          twButton
          [twPopover]="popoverTpl"
          [twPopoverSize]="settings().size"
          [size]="settings().size"
        >
          Open popover
        </button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Popover · surface"
        na="renders into a CDK overlay on open — no resting inline box"
      >
        <p class="text-sm text-fg-muted">
          Focus-trapped <code class="font-mono text-xs">role="dialog"</code> panel holding arbitrary
          interactive content.
        </p>
      </app-rhythm-cell>

      <!-- ===================== Menu ===================== -->
      <app-rhythm-cell
        label="Menu · trigger"
        group="form-row"
        note="[twMenuTrigger] adds no box of its own — the host button is the whole inline presence."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton [twMenuTrigger]="menuTpl" [size]="settings().size">
          Options
        </button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Menu · surface"
        na="renders into a CDK overlay on open — no resting inline box"
      >
        <p class="text-sm text-fg-muted">
          <code class="font-mono text-xs">role="menu"</code> list of menuitem buttons, with
          separators, icons and shortcut hints.
        </p>
      </app-rhythm-cell>

      <!-- ===================== Command palette ===================== -->
      <app-rhythm-cell
        label="Command palette · trigger"
        group="form-row"
        note="&lt;tw-command-palette&gt; is display:none until opened; this button is the affordance."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <button twButton [size]="settings().size" (click)="openPalette()">
          Open palette
        </button>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Command palette · surface"
        na="renders into a CDK overlay on open — no resting inline box"
      >
        <p class="text-sm text-fg-muted">
          Modal combobox over a listbox: a search field above grouped, filtered commands.
        </p>
      </app-rhythm-cell>
    </app-rhythm-paper>

    <!--
      Overlay content lives outside the paper so it can never be mistaken for a
      measured slot. Templates render nothing until a trigger attaches them, and
      the palette host is display:none while closed — so none of this occupies
      the page, and none of it opens on mount.
    -->
    <ng-template #dialogTpl>
      <div twDialogContent>
        <h2 twDialogTitle>Opened from the rhythm grid</h2>
        <p twDialogSubtitle class="mt-1">
          The grid measured the button that opened this, not this panel.
        </p>
      </div>
      <div twDialogActions>
        <button twButton variant="ghost" twDialogClose>Close</button>
      </div>
    </ng-template>

    <ng-template #sheetTpl>
      <div twSheetHeader>
        <h2 twSheetTitle>Opened from the rhythm grid</h2>
      </div>
      <div twSheetContent>
        <p class="text-sm text-fg-muted">
          Anchored to the right edge of the viewport, outside the document flow.
        </p>
      </div>
      <div twSheetActions>
        <button twButton variant="ghost" twSheetClose>Close</button>
      </div>
    </ng-template>

    <ng-template #popoverTpl>
      <p class="text-sm text-fg">Interactive content lives here.</p>
      <div class="mt-3 flex justify-end">
        <button twButton variant="ghost" size="sm" twPopoverClose>Close</button>
      </div>
    </ng-template>

    <ng-template #menuTpl>
      <tw-menu [size]="settings().size">
        <button twMenuItem>Edit</button>
        <button twMenuItem>Duplicate</button>
        <button twMenuItem color="error">Delete</button>
      </tw-menu>
    </ng-template>

    <tw-command-palette
      [(open)]="paletteOpen"
      [size]="settings().size"
      [commands]="paletteCommands"
    />
  `,
})
export class OverlayPanel {
  /** Toolbar state forwarded from the rhythm page. */
  readonly settings = input.required<RhythmSettings>();

  private readonly dialog = inject(TwDialog);
  private readonly sheet = inject(Sheet);
  private readonly toast = inject(ToastService);

  private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
  private readonly sheetTpl = viewChild.required<TemplateRef<unknown>>('sheetTpl');

  /** Open state of the demo command palette. Never set outside a click handler. */
  protected readonly paletteOpen = signal(false);

  protected readonly paletteCommands: readonly CommandPaletteItem[] = [
    { id: 'new', label: 'New file', shortcut: ['⌘', 'N'] },
    { id: 'open', label: 'Open file', shortcut: ['⌘', 'O'] },
    { id: 'save', label: 'Save', shortcut: ['⌘', 'S'] },
  ];

  protected openDialog(): void {
    this.dialog.open(this.dialogTpl());
  }

  protected openSheet(): void {
    this.sheet.open(this.sheetTpl(), { side: 'right', size: 'md' });
  }

  protected showToast(): void {
    this.toast.info('Opened from the rhythm grid.');
  }

  protected openPalette(): void {
    this.paletteOpen.set(true);
  }
}
