import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import {
  StatComponent,
  StatDeltaComponent,
  StatDescriptionDirective,
  StatFooterDirective,
  StatIconDirective,
  StatLabelDirective,
  StatValueDirective,
} from './stat';
import type { StatDeltaDirection, StatDeltaVariant, StatVariant } from './stat';

// ── Test host components ───────────────────────────────────────────────

@Component({
  imports: [StatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-stat />`,
})
class BareHost {}

@Component({
  imports: [StatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stat
      [variant]="variant()"
      [size]="size()"
      [loading]="loading()"
    />
  `,
})
class InputsHost {
  readonly variant = signal<StatVariant>('outline');
  readonly size = signal<TwSize>('md');
  readonly loading = signal(false);
}

@Component({
  imports: [
    StatComponent,
    StatLabelDirective,
    StatValueDirective,
    StatDescriptionDirective,
    StatFooterDirective,
    StatDeltaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stat>
      <span twStatLabel data-testid="label">Revenue</span>
      <span twStatValue data-testid="value">$24,580</span>
      <span twStatDescription data-testid="description">Daily total</span>
      <tw-stat-delta data-testid="delta" direction="up" comparisonLabel="vs last week">+12.5%</tw-stat-delta>
      <div twStatFooter data-testid="footer">footer content</div>
    </tw-stat>
  `,
})
class FullSlotsHost {}

@Component({
  imports: [StatComponent, StatIconDirective, StatLabelDirective, StatValueDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stat>
      <svg twStatIcon data-testid="icon" viewBox="0 0 16 16"></svg>
      <span twStatLabel>Orders</span>
      <span twStatValue>1,284</span>
    </tw-stat>
  `,
})
class IconLeadingHost {}

@Component({
  imports: [
    StatComponent,
    StatLabelDirective,
    StatValueDirective,
    StatDeltaComponent,
    StatFooterDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stat [loading]="loading()">
      <span twStatLabel>Conversion</span>
      <span twStatValue data-testid="value">42%</span>
      <tw-stat-delta data-testid="delta" direction="up">+1.4pp</tw-stat-delta>
      <div twStatFooter data-testid="footer">footer always renders</div>
    </tw-stat>
  `,
})
class LoadingHost {
  readonly loading = signal(true);
}

@Component({
  imports: [StatDeltaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stat-delta
      [direction]="direction()"
      [inverted]="inverted()"
      [variant]="variant()"
      [comparisonLabel]="comparisonLabel()"
      [aria-label]="ariaLabel()"
    >{{ text() }}</tw-stat-delta>
  `,
})
class DeltaInputsHost {
  readonly direction = signal<StatDeltaDirection>('up');
  readonly inverted = signal(false);
  readonly variant = signal<StatDeltaVariant>('badge');
  readonly comparisonLabel = signal<string | undefined>(undefined);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly text = signal('+12.5%');
}

@Component({
  imports: [StatDeltaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-stat-delta direction="down">−3.2%</tw-stat-delta>`,
})
class StandaloneDeltaHost {}

// ── StatComponent tests ────────────────────────────────────────────────

describe('StatComponent', () => {
  describe('default render', () => {
    let fixture: ComponentFixture<BareHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [BareHost] }).compileComponents();
      fixture = TestBed.createComponent(BareHost);
      fixture.detectChanges();
    });

    it('mounts without errors when no slots are projected', () => {
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat).toBeTruthy();
    });

    it('renders a <dl> element internally', () => {
      const dl = fixture.nativeElement.querySelector('dl');
      expect(dl).toBeTruthy();
    });

    it('does not render <dt> when no label slot is present', () => {
      const dt = fixture.nativeElement.querySelector('dt');
      expect(dt).toBeNull();
    });

    it('host has aria-live="polite"', () => {
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.getAttribute('aria-live')).toBe('polite');
    });

    it('host does not have aria-busy when not loading', () => {
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.hasAttribute('aria-busy')).toBe(false);
    });
  });

  describe('inputs', () => {
    let fixture: ComponentFixture<InputsHost>;
    let host: InputsHost;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [InputsHost] }).compileComponents();
      fixture = TestBed.createComponent(InputsHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('applies outline surface classes by default', () => {
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.className).toContain('border');
      expect(stat.className).toContain('bg-surface');
      expect(stat.className).toContain('rounded-lg');
    });

    it('applies elevated surface classes when variant="elevated"', () => {
      host.variant.set('elevated');
      fixture.detectChanges();
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.className).toContain('shadow');
      expect(stat.className).toContain('bg-surface-raised');
    });

    it('applies solid surface classes when variant="solid"', () => {
      host.variant.set('solid');
      fixture.detectChanges();
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.className).toContain('bg-surface-muted');
    });

    it('applies ghost surface classes when variant="ghost"', () => {
      host.variant.set('ghost');
      fixture.detectChanges();
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.className).toContain('bg-transparent');
    });

    // ── Deprecated variant aliases ──
    //
    // `'plain'` → `'ghost'`, `'outlined'` → `'outline'`, `'filled'` → `'solid'`.
    // Every old string must keep rendering byte-identical classes: `tv()`
    // returns base classes only for an unrecognised variant value — no throw,
    // no warning, just a silently unstyled tile. String equality is the literal
    // encoding of that promise.
    //
    // Non-vacuous: drop any entry from `VARIANT_ALIASES` and that legacy
    // string reaches `tv()` unrecognised, so the variant's `bg-*` / `border-*`
    // / `rounded-lg` root classes vanish and the compared strings diverge.
    const VARIANT_ALIAS_PAIRS = [
      ['plain', 'ghost'],
      ['outlined', 'outline'],
      ['filled', 'solid'],
    ] as const;

    for (const [legacy, canonical] of VARIANT_ALIAS_PAIRS) {
      it(`"${legacy}" resolves to exactly the same classes as "${canonical}"`, () => {
        host.variant.set(canonical);
        fixture.detectChanges();
        const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
        const canonicalClasses = stat.className;

        host.variant.set(legacy);
        fixture.detectChanges();
        expect(stat.className).toBe(canonicalClasses);
        // Guards against both strings collapsing to the bare base classes.
        expect(stat.className).toMatch(/\bbg-\S+/);
      });
    }

    it('changes padding when size changes', () => {
      host.size.set('xs');
      fixture.detectChanges();
      let stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.className).toContain('p-2');

      host.size.set('xl');
      fixture.detectChanges();
      stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.className).toContain('p-8');
    });

    it('toggles aria-busy when loading is true', () => {
      host.loading.set(true);
      fixture.detectChanges();
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.getAttribute('aria-busy')).toBe('true');
    });

    it('keeps aria-live="polite" permanently on the host', () => {
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.getAttribute('aria-live')).toBe('polite');
      host.loading.set(true);
      fixture.detectChanges();
      expect(stat.getAttribute('aria-live')).toBe('polite');
      host.loading.set(false);
      fixture.detectChanges();
      expect(stat.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('content projection', () => {
    let fixture: ComponentFixture<FullSlotsHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [FullSlotsHost] }).compileComponents();
      fixture = TestBed.createComponent(FullSlotsHost);
      fixture.detectChanges();
    });

    it('renders label inside <dt>', () => {
      const dt = fixture.nativeElement.querySelector('dt');
      expect(dt).toBeTruthy();
      expect(dt!.querySelector('[data-testid="label"]')).toBeTruthy();
    });

    it('renders value inside the first <dd>', () => {
      const dds = fixture.nativeElement.querySelectorAll('dd');
      expect(dds.length).toBeGreaterThan(0);
      expect(dds[0].querySelector('[data-testid="value"]')).toBeTruthy();
    });

    it('renders description inside a separate <dd>', () => {
      const dds = fixture.nativeElement.querySelectorAll('dd');
      expect(dds.length).toBe(2);
      expect(dds[1].querySelector('[data-testid="description"]')).toBeTruthy();
    });

    it('renders the projected tw-stat-delta inside the value <dd>', () => {
      const dds = fixture.nativeElement.querySelectorAll('dd');
      expect(dds[0].querySelector('tw-stat-delta')).toBeTruthy();
    });

    it('renders the footer', () => {
      const footer = fixture.nativeElement.querySelector('[data-testid="footer"]');
      expect(footer).toBeTruthy();
    });
  });

  describe('icon-leading layout', () => {
    let fixture: ComponentFixture<IconLeadingHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [IconLeadingHost] }).compileComponents();
      fixture = TestBed.createComponent(IconLeadingHost);
      fixture.detectChanges();
    });

    it('renders the projected icon', () => {
      const icon = fixture.nativeElement.querySelector('[data-testid="icon"]');
      expect(icon).toBeTruthy();
    });

    it('places icon and content stack inside a flex wrapper', () => {
      const flex = fixture.nativeElement.querySelector('.flex.items-start');
      expect(flex).toBeTruthy();
      expect(flex!.querySelector('[data-testid="icon"]')).toBeTruthy();
      expect(flex!.querySelector('dl')).toBeTruthy();
    });
  });

  describe('loading state', () => {
    let fixture: ComponentFixture<LoadingHost>;
    let host: LoadingHost;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [LoadingHost] }).compileComponents();
      fixture = TestBed.createComponent(LoadingHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('replaces value with a <tw-skeleton> when loading', () => {
      const value = fixture.nativeElement.querySelector('[data-testid="value"]');
      expect(value).toBeNull();
      const skeletons = fixture.nativeElement.querySelectorAll('tw-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides projected delta when loading and renders a delta-shaped skeleton', () => {
      const delta = fixture.nativeElement.querySelector('[data-testid="delta"]');
      expect(delta).toBeNull();
      const skeletons = fixture.nativeElement.querySelectorAll('tw-skeleton');
      // expect at least: label skeleton + value skeleton + delta skeleton
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('still renders the footer during loading', () => {
      const footer = fixture.nativeElement.querySelector('[data-testid="footer"]');
      expect(footer).toBeTruthy();
    });

    it('restores projected content when loading flips to false', () => {
      host.loading.set(false);
      fixture.detectChanges();
      const value = fixture.nativeElement.querySelector('[data-testid="value"]');
      expect(value).toBeTruthy();
      const delta = fixture.nativeElement.querySelector('[data-testid="delta"]');
      expect(delta).toBeTruthy();
    });

    it('clears aria-busy when loading flips to false', () => {
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.getAttribute('aria-busy')).toBe('true');
      host.loading.set(false);
      fixture.detectChanges();
      expect(stat.hasAttribute('aria-busy')).toBe(false);
    });
  });

  describe('accessibility', () => {
    let fixture: ComponentFixture<FullSlotsHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [FullSlotsHost] }).compileComponents();
      fixture = TestBed.createComponent(FullSlotsHost);
      fixture.detectChanges();
    });

    it('does not register a host role by default', () => {
      const stat = fixture.nativeElement.querySelector('tw-stat') as HTMLElement;
      expect(stat.hasAttribute('role')).toBe(false);
    });

    it('renders semantic <dl>/<dt>/<dd> structure', () => {
      const dl = fixture.nativeElement.querySelector('dl');
      expect(dl).toBeTruthy();
      expect(dl!.querySelector('dt')).toBeTruthy();
      expect(dl!.querySelector('dd')).toBeTruthy();
    });
  });
});

// ── StatDeltaComponent tests ───────────────────────────────────────────

describe('StatDeltaComponent', () => {
  describe('default render', () => {
    let fixture: ComponentFixture<StandaloneDeltaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [StandaloneDeltaHost] }).compileComponents();
      fixture = TestBed.createComponent(StandaloneDeltaHost);
      fixture.detectChanges();
    });

    it('renders standalone outside a tw-stat', () => {
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta).toBeTruthy();
      expect(delta.getAttribute('role')).toBe('img');
    });

    it('renders a chevron SVG with aria-hidden', () => {
      const svg = fixture.nativeElement.querySelector('tw-stat-delta svg');
      expect(svg).toBeTruthy();
      expect(svg!.getAttribute('aria-hidden')).toBe('true');
    });

    it('composes an aria-label from direction + projected text', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      const label = delta.getAttribute('aria-label') ?? '';
      expect(label).toContain('decreased');
      expect(label).toContain('−3.2%');
    });
  });

  describe('direction + inverted', () => {
    let fixture: ComponentFixture<DeltaInputsHost>;
    let host: DeltaInputsHost;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [DeltaInputsHost] }).compileComponents();
      fixture = TestBed.createComponent(DeltaInputsHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('uses success colors for up + not inverted', () => {
      host.direction.set('up');
      host.inverted.set(false);
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.className).toContain('bg-success-soft');
    });

    it('uses error colors for down + not inverted', () => {
      host.direction.set('down');
      host.inverted.set(false);
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.className).toContain('bg-error-soft');
    });

    it('flips colors when inverted is true (up → error)', () => {
      host.direction.set('up');
      host.inverted.set(true);
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.className).toContain('bg-error-soft');
    });

    it('flips colors when inverted is true (down → success)', () => {
      host.direction.set('down');
      host.inverted.set(true);
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.className).toContain('bg-success-soft');
    });

    it('uses surface tokens for neutral direction regardless of inverted', () => {
      host.direction.set('neutral');
      host.inverted.set(false);
      fixture.detectChanges();
      let delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.className).toContain('bg-surface-muted');

      host.inverted.set(true);
      fixture.detectChanges();
      delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.className).toContain('bg-surface-muted');
    });

    it('does NOT flip the ARIA verb when inverted (literal direction is preserved)', async () => {
      host.direction.set('down');
      host.inverted.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      const label = delta.getAttribute('aria-label') ?? '';
      expect(label).toContain('decreased');
      expect(label).not.toContain('increased');
    });
  });

  describe('variant', () => {
    let fixture: ComponentFixture<DeltaInputsHost>;
    let host: DeltaInputsHost;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [DeltaInputsHost] }).compileComponents();
      fixture = TestBed.createComponent(DeltaInputsHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('applies badge chip classes by default', () => {
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.className).toContain('rounded-md');
      expect(delta.className).toContain('px-2');
    });

    it('applies inline classes (no chip background) for variant="inline"', () => {
      host.variant.set('inline');
      host.direction.set('up');
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.className).toContain('text-success-700');
      expect(delta.className).not.toContain('bg-success-soft');
    });

    it('visually hides text and comparison for variant="icon-only" but keeps them in the aria-label', async () => {
      host.variant.set('icon-only');
      host.direction.set('up');
      host.text.set('+12.5%');
      host.comparisonLabel.set('vs last week');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      // No visually-rendered text spans (sr-only removes them from layout).
      const visibleSpans = Array.from(delta.querySelectorAll('span')).filter(
        (s) => !s.className.includes('sr-only'),
      );
      expect(visibleSpans.length).toBe(0);
      // Composed aria-label still surfaces the projected text + comparison.
      const label = delta.getAttribute('aria-label') ?? '';
      expect(label).toContain('+12.5%');
      expect(label).toContain('vs last week');
    });
  });

  describe('comparisonLabel', () => {
    let fixture: ComponentFixture<DeltaInputsHost>;
    let host: DeltaInputsHost;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [DeltaInputsHost] }).compileComponents();
      fixture = TestBed.createComponent(DeltaInputsHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders the comparison label when provided', () => {
      host.comparisonLabel.set('vs last week');
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.textContent).toContain('vs last week');
    });

    it('includes the comparison label in the composed aria-label', async () => {
      host.comparisonLabel.set('vs last week');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      const label = delta.getAttribute('aria-label') ?? '';
      expect(label).toContain('vs last week');
    });
  });

  describe('explicit ariaLabel', () => {
    let fixture: ComponentFixture<DeltaInputsHost>;
    let host: DeltaInputsHost;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [DeltaInputsHost] }).compileComponents();
      fixture = TestBed.createComponent(DeltaInputsHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('overrides the composed label when ariaLabel is set', () => {
      host.ariaLabel.set('Custom label override');
      fixture.detectChanges();
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.getAttribute('aria-label')).toBe('Custom label override');
    });
  });

  // A consumer writing the plain `aria-label` attribute. Unless the input is
  // aliased to `aria-label`, the host binding overwrites it with the composed
  // "increased by …" sentence and the consumer's name is silently lost. The
  // static attribute is the load-bearing shape here — driving the input
  // directly skips the attribute path and would have passed with the bug
  // present.
  describe('consumer-written aria-label attribute', () => {
    it('wins over the composed delta sentence', async () => {
      @Component({
        imports: [StatDeltaComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-stat-delta direction="up" aria-label="Revenue up sharply">+12.5%</tw-stat-delta>`,
      })
      class StaticAriaLabelHost {}

      await TestBed.configureTestingModule({ imports: [StaticAriaLabelHost] }).compileComponents();
      const fixture = TestBed.createComponent(StaticAriaLabelHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.getAttribute('aria-label')).toBe('Revenue up sharply');
      expect(delta.getAttribute('aria-label')).not.toContain('increased');
    });
  });

  // Regression guard for the frozen accessible name (pass-4 IDIOM H1). Every
  // other aria-label assertion in this file projects a *static* string, so all
  // of them passed while the label was sampled once and never updated again.
  // Mutating the projected text after mount is the load-bearing shape.
  describe('projected text mutated after mount', () => {
    let fixture: ComponentFixture<DeltaInputsHost>;
    let host: DeltaInputsHost;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [DeltaInputsHost] }).compileComponents();
      fixture = TestBed.createComponent(DeltaInputsHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('recomposes the aria-label when the projected value changes', async () => {
      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.getAttribute('aria-label')).toBe('increased by +12.5%');

      host.text.set('+34.0%');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(delta.textContent).toContain('+34.0%');
      expect(delta.getAttribute('aria-label')).toBe('increased by +34.0%');
      expect(delta.getAttribute('aria-label')).not.toContain('+12.5%');
    });

    it('keeps an explicit aria-label authoritative while projected text changes', async () => {
      host.ariaLabel.set('Revenue trend');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      host.text.set('+99%');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const delta = fixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.getAttribute('aria-label')).toBe('Revenue trend');
    });
  });

  describe('projected text that arrives after first render', () => {
    it('picks up projected text that was empty at first render', async () => {
      @Component({
        imports: [StatDeltaComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <tw-stat-delta direction="up">
            @if (loaded()) {
              <span>+7%</span>
            }
          </tw-stat-delta>
        `,
      })
      class LateContentHost {
        readonly loaded = signal(false);
      }

      await TestBed.configureTestingModule({ imports: [LateContentHost] }).compileComponents();
      const lateFixture = TestBed.createComponent(LateContentHost);
      lateFixture.detectChanges();
      await lateFixture.whenStable();
      lateFixture.detectChanges();

      const delta = lateFixture.nativeElement.querySelector('tw-stat-delta') as HTMLElement;
      expect(delta.getAttribute('aria-label')).toBe('increased');

      lateFixture.componentInstance.loaded.set(true);
      lateFixture.detectChanges();
      await lateFixture.whenStable();
      lateFixture.detectChanges();

      expect(delta.getAttribute('aria-label')).toBe('increased by +7%');
    });
  });
});
