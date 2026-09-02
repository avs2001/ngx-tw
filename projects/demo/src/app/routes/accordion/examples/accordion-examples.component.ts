import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { AccordionComponent } from '@cdevhub/ngx-tw/accordion';
import type { AccordionType, AccordionVariant } from '@cdevhub/ngx-tw/accordion';
import {
  CollapsibleComponent,
  CollapsibleTriggerDirective,
} from '@cdevhub/ngx-tw/collapsible';

const VARIANTS: AccordionVariant[] = ['default', 'outline', 'ghost'];
const TYPES: AccordionType[] = ['single', 'multiple'];

@Component({
  selector: 'app-accordion-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AccordionComponent,
    CollapsibleComponent,
    CollapsibleTriggerDirective,
    TitleCasePipe,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-4">
          @for (v of variants; track v) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v | titlecase }}</p>
              <tw-accordion [variant]="v">
                <tw-collapsible value="one">
                  <button twCollapsibleTrigger>First panel</button>
                  <p>Content in the first panel.</p>
                </tw-collapsible>
                <tw-collapsible value="two">
                  <button twCollapsibleTrigger>Second panel</button>
                  <p>Content in the second panel.</p>
                </tw-collapsible>
              </tw-accordion>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Modes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Modes</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-6">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Single (default)</p>
            <tw-accordion variant="outline" [(value)]="singleValue">
              <tw-collapsible value="a">
                <button twCollapsibleTrigger>Panel A</button>
                <p>Opening another panel closes this one automatically.</p>
              </tw-collapsible>
              <tw-collapsible value="b">
                <button twCollapsibleTrigger>Panel B</button>
                <p>Only one panel is open at a time.</p>
              </tw-collapsible>
              <tw-collapsible value="c">
                <button twCollapsibleTrigger>Panel C</button>
                <p>Click again to close.</p>
              </tw-collapsible>
            </tw-accordion>
            <p class="text-xs text-fg-muted mt-4 font-mono">value: {{ singleValueDisplay() }}</p>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Multiple</p>
            <tw-accordion type="multiple" variant="outline" [(value)]="multipleValue">
              <tw-collapsible value="x">
                <button twCollapsibleTrigger>Panel X</button>
                <p>Multiple panels can be open at the same time.</p>
              </tw-collapsible>
              <tw-collapsible value="y">
                <button twCollapsibleTrigger>Panel Y</button>
                <p>Open this one and Panel X stays open.</p>
              </tw-collapsible>
              <tw-collapsible value="z">
                <button twCollapsibleTrigger>Panel Z</button>
                <p>And this one too.</p>
              </tw-collapsible>
            </tw-accordion>
            <p class="text-xs text-fg-muted mt-4 font-mono">value: {{ multipleValueDisplay() }}</p>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Single with forced open</p>
            <tw-accordion variant="outline" [collapsible]="false" [(value)]="forcedValue">
              <tw-collapsible value="overview">
                <button twCollapsibleTrigger>Overview</button>
                <p>Open by default and cannot be closed by re-clicking.</p>
              </tw-collapsible>
              <tw-collapsible value="details">
                <button twCollapsibleTrigger>Details</button>
                <p>Opening this one closes the previous — but one is always visible.</p>
              </tw-collapsible>
              <tw-collapsible value="settings">
                <button twCollapsibleTrigger>Settings</button>
                <p>Same rule: one of these three is always open.</p>
              </tw-collapsible>
            </tw-accordion>
          </div>
        </div>
      </div>
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <p class="text-xs text-fg-muted mb-3">Disabled panels cannot be toggled and are skipped by keyboard navigation.</p>
        <tw-accordion variant="outline">
          <tw-collapsible value="free">
            <button twCollapsibleTrigger>Free plan</button>
            <p>Available to everyone.</p>
          </tw-collapsible>
          <tw-collapsible value="pro" [disabled]="true">
            <button twCollapsibleTrigger>Pro plan (coming soon)</button>
            <p>Hidden while disabled.</p>
          </tw-collapsible>
          <tw-collapsible value="enterprise">
            <button twCollapsibleTrigger>Enterprise plan</button>
            <p>Arrow-down from Free skips Pro and jumps straight here.</p>
          </tw-collapsible>
        </tw-accordion>
      </div>
    </section>

    <!-- Initial value -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Initial value</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <p class="text-xs text-fg-muted mb-3">Bind <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code> to open a panel on load.</p>
        <tw-accordion variant="default" value="q1">
          <tw-collapsible value="q1">
            <button twCollapsibleTrigger>Is the library tree-shakable?</button>
            <p>Yes. Each component is a secondary entry point — import only what you use.</p>
          </tw-collapsible>
          <tw-collapsible value="q2">
            <button twCollapsibleTrigger>Do I need a Tailwind config file?</button>
            <p>No. Tailwind v4 reads <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#64;theme</code> directly from your CSS.</p>
          </tw-collapsible>
          <tw-collapsible value="q3">
            <button twCollapsibleTrigger>Does it support SSR?</button>
            <p>Yes. All components are standalone and SSR-safe.</p>
          </tw-collapsible>
        </tw-accordion>
      </div>
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
            <div class="flex gap-1">
              @for (v of variants; track v) {
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium rounded-md text-fg-muted hover:bg-surface-muted transition-colors duration-normal"
                  [class.!bg-primary-100]="playVariant() === v"
                  [class.!text-primary-700]="playVariant() === v"
                  (click)="playVariant.set(v)"
                >{{ v }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Type</label>
            <div class="flex gap-1">
              @for (t of types; track t) {
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium rounded-md text-fg-muted hover:bg-surface-muted transition-colors duration-normal"
                  [class.!bg-primary-100]="playType() === t"
                  [class.!text-primary-700]="playType() === t"
                  (click)="setType(t)"
                >{{ t }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Collapsible</label>
            <div class="flex gap-1">
              <button
                type="button"
                class="px-2 py-1 text-xs font-medium rounded-md text-fg-muted hover:bg-surface-muted transition-colors duration-normal disabled:opacity-30 disabled:cursor-default"
                [disabled]="playType() === 'multiple'"
                [class.!bg-primary-100]="playCollapsible()"
                [class.!text-primary-700]="playCollapsible()"
                (click)="playCollapsible.set(true)"
              >true</button>
              <button
                type="button"
                class="px-2 py-1 text-xs font-medium rounded-md text-fg-muted hover:bg-surface-muted transition-colors duration-normal disabled:opacity-30 disabled:cursor-default"
                [disabled]="playType() === 'multiple'"
                [class.!bg-primary-100]="!playCollapsible()"
                [class.!text-primary-700]="!playCollapsible()"
                (click)="playCollapsible.set(false)"
              >false</button>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-accordion
            [variant]="playVariant()"
            [type]="playType()"
            [collapsible]="playCollapsible()"
            [(value)]="playValue"
          >
            <tw-collapsible value="one">
              <button twCollapsibleTrigger>First panel</button>
              <p>Playground content for the first panel.</p>
            </tw-collapsible>
            <tw-collapsible value="two">
              <button twCollapsibleTrigger>Second panel</button>
              <p>Playground content for the second panel.</p>
            </tw-collapsible>
            <tw-collapsible value="three">
              <button twCollapsibleTrigger>Third panel</button>
              <p>Playground content for the third panel.</p>
            </tw-collapsible>
          </tw-accordion>
        </div>
        <p class="text-xs text-fg-muted mt-4 font-mono">value: {{ playValueDisplay() }}</p>
      </div>
    </section>
  `,
})
export class AccordionExamples {
  protected readonly variants = VARIANTS;
  protected readonly types = TYPES;

  protected readonly singleValue = signal<string | string[] | null>(null);
  protected readonly multipleValue = signal<string | string[] | null>([]);
  protected readonly forcedValue = signal<string | string[] | null>('overview');

  protected readonly playVariant = signal<AccordionVariant>('outline');
  protected readonly playType = signal<AccordionType>('single');
  protected readonly playCollapsible = signal(true);
  protected readonly playValue = signal<string | string[] | null>(null);

  protected readonly singleValueDisplay = computed(() => this.formatValue(this.singleValue()));
  protected readonly multipleValueDisplay = computed(() => this.formatValue(this.multipleValue()));
  protected readonly playValueDisplay = computed(() => this.formatValue(this.playValue()));

  setType(type: AccordionType): void {
    this.playType.set(type);
    this.playValue.set(type === 'multiple' ? [] : null);
  }

  private formatValue(v: string | string[] | null): string {
    if (v === null) return "'none'";
    return Array.isArray(v) ? JSON.stringify(v) : `'${v}'`;
  }
}
