import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  Sheet,
  SHEET_DATA,
  SheetActionsDirective,
  SheetCloseDirective,
  SheetContentDirective,
  SheetHeaderDirective,
  SheetSubtitleDirective,
  SheetTitleDirective,
  type SheetSide,
  type SheetSize,
} from 'ngx-tw/sheet';
import { ButtonDirective } from 'ngx-tw/button';
import { InputDirective } from 'ngx-tw/input';
import { FormFieldComponent, LabelDirective } from 'ngx-tw/form-field';
import { CardComponent } from 'ngx-tw/card';

const SIDES: SheetSide[] = ['top', 'right', 'bottom', 'left'];
const SIZES: SheetSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'full'];

/** Form content inside a sheet — demonstrates focus trap and input flow. */
@Component({
  selector: 'app-sheet-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    InputDirective,
    FormFieldComponent,
    LabelDirective,
    SheetHeaderDirective,
    SheetTitleDirective,
    SheetSubtitleDirective,
    SheetContentDirective,
    SheetActionsDirective,
    SheetCloseDirective,
  ],
  template: `
    <div twSheetHeader>
      <div class="flex-1 min-w-0">
        <h2 twSheetTitle>Contact details</h2>
        <p twSheetSubtitle>Update the customer record. Focus moves into the first field automatically.</p>
      </div>
    </div>
    <form twSheetContent class="space-y-4">
      <tw-form-field>
        <label twLabel>Full name</label>
        <input twInput type="text" name="name" placeholder="Ada Lovelace" />
      </tw-form-field>
      <tw-form-field>
        <label twLabel>Email</label>
        <input twInput type="email" name="email" placeholder="ada@example.com" />
      </tw-form-field>
      <tw-form-field>
        <label twLabel>Company</label>
        <input twInput type="text" name="company" placeholder="Acme Corp" />
      </tw-form-field>
      <tw-form-field>
        <label twLabel>Notes</label>
        <input twInput type="text" name="notes" placeholder="Optional remarks…" />
      </tw-form-field>
    </form>
    <div twSheetActions>
      <button twButton variant="ghost" twSheetClose>Cancel</button>
      <button twButton [twSheetClose]="'saved'">Save</button>
    </div>
  `,
})
class SheetFormContent {}

/** Long-content panel used by the scrolling example. */
@Component({
  selector: 'app-sheet-scroll',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    SheetHeaderDirective,
    SheetTitleDirective,
    SheetSubtitleDirective,
    SheetContentDirective,
    SheetActionsDirective,
    SheetCloseDirective,
  ],
  template: `
    <div twSheetHeader>
      <div class="flex-1 min-w-0">
        <h2 twSheetTitle>Activity log</h2>
        <p twSheetSubtitle>Header stays pinned; the body scrolls independently.</p>
      </div>
    </div>
    <div twSheetContent>
      <ul class="space-y-3">
        @for (i of items; track i) {
          <li class="flex items-start gap-3 rounded-md border border-border-muted bg-surface-muted p-3">
            <div class="size-8 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
              {{ i }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-fg">Event #{{ i }}</p>
              <p class="text-xs text-fg-muted">Recorded at 12:0{{ i % 10 }} — body content {{ i }}.</p>
            </div>
          </li>
        }
      </ul>
    </div>
    <div twSheetActions>
      <button twButton twSheetClose>Done</button>
    </div>
  `,
})
class SheetScrollContent {
  protected readonly items = Array.from({ length: 40 }, (_, i) => i + 1);
}

/** Suppress-close demo — Escape and backdrop are no-ops, only the explicit button closes. */
@Component({
  selector: 'app-sheet-suppress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    SheetHeaderDirective,
    SheetTitleDirective,
    SheetSubtitleDirective,
    SheetContentDirective,
    SheetActionsDirective,
    SheetCloseDirective,
  ],
  template: `
    <div twSheetHeader>
      <div class="flex-1 min-w-0">
        <h2 twSheetTitle>Wizard sheet</h2>
        <p twSheetSubtitle>Escape and backdrop click are suppressed. Use the explicit button to dismiss.</p>
      </div>
    </div>
    <div twSheetContent>
      <p>This pattern prevents accidental dismissal of multi-step flows.</p>
    </div>
    <div twSheetActions>
      <button twButton variant="ghost" twSheetClose>Cancel</button>
      <button twButton [twSheetClose]="'confirmed'">Confirm</button>
    </div>
  `,
})
class SheetSuppressContent {}

/** Receives the requested side via SHEET_DATA so one component services all four buttons. */
@Component({
  selector: 'app-sheet-side-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    SheetHeaderDirective,
    SheetTitleDirective,
    SheetSubtitleDirective,
    SheetContentDirective,
    SheetActionsDirective,
    SheetCloseDirective,
  ],
  template: `
    <div twSheetHeader>
      <div class="flex-1 min-w-0">
        <h2 twSheetTitle>Anchored to {{ data.side }}</h2>
        <p twSheetSubtitle>The slide direction follows the configured edge.</p>
      </div>
    </div>
    <div twSheetContent>
      <p>Each side slides in along its docking axis.</p>
    </div>
    <div twSheetActions>
      <button twButton twSheetClose>Close</button>
    </div>
  `,
})
class SheetSideDemoContent {
  protected readonly data = inject<{ side: SheetSide }>(SHEET_DATA);
}

/** Receives the requested size via SHEET_DATA. */
@Component({
  selector: 'app-sheet-size-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    SheetHeaderDirective,
    SheetTitleDirective,
    SheetSubtitleDirective,
    SheetContentDirective,
    SheetActionsDirective,
    SheetCloseDirective,
  ],
  template: `
    <div twSheetHeader>
      <div class="flex-1 min-w-0">
        <h2 twSheetTitle>Size: {{ data.size }}</h2>
        <p twSheetSubtitle>Right-anchored panel — size controls width.</p>
      </div>
    </div>
    <div twSheetContent>
      <p>Resize the viewport to see how the size preset behaves.</p>
    </div>
    <div twSheetActions>
      <button twButton twSheetClose>Close</button>
    </div>
  `,
})
class SheetSizeDemoContent {
  protected readonly data = inject<{ size: SheetSize }>(SHEET_DATA);
}

@Component({
  selector: 'app-sheet-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, CardComponent],
  template: `
    <div class="space-y-10">
      <!-- ── Sides ─────────────────────────────────────────────────── -->
      <section>
        <h2 class="text-sm font-semibold mb-2">Sides</h2>
        <p class="text-sm text-fg-muted mb-4">Each button opens a sheet anchored to that edge.</p>
        <tw-card variant="outlined" class="p-6">
          <div class="flex flex-wrap gap-2">
            @for (side of sides; track side) {
              <button twButton variant="outline" (click)="openSide(side)">{{ labelFor(side) }}</button>
            }
          </div>
        </tw-card>
      </section>

      <!-- ── Sizes (right-anchored) ────────────────────────────────── -->
      <section>
        <h2 class="text-sm font-semibold mb-2">Sizes</h2>
        <p class="text-sm text-fg-muted mb-4">Sizes for right-anchored sheets control width.</p>
        <tw-card variant="outlined" class="p-6">
          <div class="flex flex-wrap gap-2">
            @for (size of sizes; track size) {
              <button twButton variant="outline" (click)="openSize(size)">{{ size }}</button>
            }
          </div>
        </tw-card>
      </section>

      <!-- ── Form content ──────────────────────────────────────────── -->
      <section>
        <h2 class="text-sm font-semibold mb-2">Form content</h2>
        <p class="text-sm text-fg-muted mb-4">
          Focus traps inside the sheet and moves to the first input on open. Tab cycles among
          the form fields; Shift + Tab walks back. Escape closes and returns focus to the trigger.
        </p>
        <tw-card variant="outlined" class="p-6">
          <button twButton (click)="openForm()">Open contact form</button>
        </tw-card>
      </section>

      <!-- ── Footer actions ────────────────────────────────────────── -->
      <section>
        <h2 class="text-sm font-semibold mb-2">Footer actions</h2>
        <p class="text-sm text-fg-muted mb-4">
          Use <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twSheetActions</code>
          to host Cancel / Confirm buttons pinned beneath the scrollable content.
        </p>
        <tw-card variant="outlined" class="p-6">
          <button twButton (click)="openWithActions()">Open with actions</button>
          @if (lastResult()) {
            <p class="mt-3 text-xs text-fg-muted">Last result: <code class="font-mono">{{ lastResult() }}</code></p>
          }
        </tw-card>
      </section>

      <!-- ── Non-modal ─────────────────────────────────────────────── -->
      <section>
        <h2 class="text-sm font-semibold mb-2">Non-modal</h2>
        <p class="text-sm text-fg-muted mb-4">
          Pass <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaModal: false</code>
          and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hasBackdrop: false</code>
          to let the user interact with the page while the sheet is open (no scrim, no inert).
        </p>
        <tw-card variant="outlined" class="p-6">
          <button twButton variant="outline" (click)="openNonModal()">Open non-modal</button>
        </tw-card>
      </section>

      <!-- ── Long content (scroll) ─────────────────────────────────── -->
      <section>
        <h2 class="text-sm font-semibold mb-2">Long content</h2>
        <p class="text-sm text-fg-muted mb-4">
          The body uses <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twSheetContent</code>
          which inherits <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkScrollable</code>
          and scrolls independently of the header and action bar.
        </p>
        <tw-card variant="outlined" class="p-6">
          <button twButton variant="outline" (click)="openScrollable()">Open scrolling sheet</button>
        </tw-card>
      </section>

      <!-- ── Suppress close ────────────────────────────────────────── -->
      <section>
        <h2 class="text-sm font-semibold mb-2">Suppress close</h2>
        <p class="text-sm text-fg-muted mb-4">
          Split close-behavior flags let you disable Escape and backdrop dismissal independently
          while keeping an explicit close button.
        </p>
        <tw-card variant="outlined" class="p-6">
          <button twButton variant="outline" (click)="openSuppress()">Open wizard sheet</button>
        </tw-card>
      </section>
    </div>
  `,
})
export class SheetExamples {
  private readonly sheet = inject(Sheet);

  protected readonly sides = SIDES;
  protected readonly sizes = SIZES;
  protected readonly lastResult = signal<string | undefined>(undefined);

  protected labelFor(side: SheetSide): string {
    return `Open ${side}`;
  }

  protected openSide(side: SheetSide): void {
    this.sheet.open(SheetSideDemoContent, { side, size: 'md', data: { side } });
  }

  protected openSize(size: SheetSize): void {
    this.sheet.open(SheetSizeDemoContent, { side: 'right', size, data: { size } });
  }

  protected openForm(): void {
    this.sheet.open(SheetFormContent, { side: 'right', size: 'md' });
  }

  protected openWithActions(): void {
    const ref = this.sheet.open<string>(SheetSideDemoContent, {
      side: 'right',
      size: 'md',
      data: { side: 'right' as SheetSide },
    });
    ref.afterClosed().subscribe((result) => this.lastResult.set(result ?? 'dismissed'));
  }

  protected openNonModal(): void {
    this.sheet.open(SheetSideDemoContent, {
      side: 'right',
      size: 'sm',
      ariaModal: false,
      hasBackdrop: false,
      scrollBehavior: 'noop',
      data: { side: 'right' as SheetSide },
    });
  }

  protected openScrollable(): void {
    this.sheet.open(SheetScrollContent, { side: 'right', size: 'lg' });
  }

  protected openSuppress(): void {
    this.sheet.open(SheetSuppressContent, {
      side: 'right',
      size: 'md',
      closeOnEscape: false,
      closeOnBackdropClick: false,
    });
  }
}

