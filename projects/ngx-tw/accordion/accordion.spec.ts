import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CollapsibleComponent,
  CollapsibleGroupComponent,
  CollapsibleTriggerDirective,
} from '@cdevhub/ngx-tw/collapsible';
import { AccordionComponent } from './accordion';

// ── Test host: single-mode accordion ──

@Component({
  imports: [AccordionComponent, CollapsibleComponent, CollapsibleTriggerDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <tw-accordion [(value)]="active" [collapsible]="collapsibleFlag()">
      <tw-collapsible value="a">
        <button twCollapsibleTrigger>Panel A</button>
        <p class="content-a">Content A</p>
      </tw-collapsible>
      <tw-collapsible value="b">
        <button twCollapsibleTrigger>Panel B</button>
        <p class="content-b">Content B</p>
      </tw-collapsible>
      <tw-collapsible value="c" [disabled]="true">
        <button twCollapsibleTrigger>Panel C (disabled)</button>
        <p class="content-c">Content C</p>
      </tw-collapsible>
    </tw-accordion>
  `,
})
class SingleHost {
  active = signal<string | string[] | null>(null);
  collapsibleFlag = signal(true);
}

// ── Test host: multiple-mode accordion ──

@Component({
  imports: [AccordionComponent, CollapsibleComponent, CollapsibleTriggerDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <tw-accordion type="multiple" [(value)]="open">
      <tw-collapsible value="x">
        <button twCollapsibleTrigger>Panel X</button>
        <p class="content-x">Content X</p>
      </tw-collapsible>
      <tw-collapsible value="y">
        <button twCollapsibleTrigger>Panel Y</button>
        <p class="content-y">Content Y</p>
      </tw-collapsible>
    </tw-accordion>
  `,
})
class MultipleHost {
  open = signal<string | string[] | null>([]);
}

// ── Test host: variant control ──

@Component({
  imports: [AccordionComponent, CollapsibleComponent, CollapsibleTriggerDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <tw-accordion [variant]="variant()">
      <tw-collapsible value="a">
        <button twCollapsibleTrigger>A</button>
        <p>Content</p>
      </tw-collapsible>
    </tw-accordion>
  `,
})
class VariantHost {
  variant = signal<'default' | 'bordered' | 'ghost'>('default');
}

// ── Test host: ARIA labelling ──

@Component({
  imports: [AccordionComponent, CollapsibleComponent, CollapsibleTriggerDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 id="sections-heading">Sections</h2>
    <tw-accordion [attr.aria-label]="label()" [attr.aria-labelledby]="labelledby()">
      <tw-collapsible value="a">
        <button twCollapsibleTrigger>A</button>
        <p>Content</p>
      </tw-collapsible>
    </tw-accordion>
  `,
})
class AriaHost {
  label = signal<string | null>(null);
  labelledby = signal<string | null>(null);
}

// ── Parity host: <tw-accordion type="single"> + <tw-collapsible-group accordion> in one TestBed ──

@Component({
  imports: [
    AccordionComponent,
    CollapsibleGroupComponent,
    CollapsibleComponent,
    CollapsibleTriggerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <section data-role="acc">
      <tw-accordion type="single" [(value)]="accValue">
        <tw-collapsible value="a">
          <button twCollapsibleTrigger>A</button>
          <p class="content-a">A</p>
        </tw-collapsible>
        <tw-collapsible value="b">
          <button twCollapsibleTrigger>B</button>
          <p class="content-b">B</p>
        </tw-collapsible>
      </tw-accordion>
    </section>
    <section data-role="grp">
      <tw-collapsible-group [accordion]="true" [(value)]="grpValue">
        <tw-collapsible value="a">
          <button twCollapsibleTrigger>A</button>
          <p class="content-a">A</p>
        </tw-collapsible>
        <tw-collapsible value="b">
          <button twCollapsibleTrigger>B</button>
          <p class="content-b">B</p>
        </tw-collapsible>
      </tw-collapsible-group>
    </section>
  `,
})
class ParityHost {
  accValue = signal<string | string[] | null>(null);
  grpValue = signal<string | string[] | null>(null);
}

describe('AccordionComponent', () => {
  let mockAnnouncer: { announce: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAnnouncer = { announce: vi.fn() };
  });

  function createFixture<T>(hostType: new () => T): ComponentFixture<T> {
    TestBed.configureTestingModule({
      imports: [hostType],
      providers: [
        { provide: LiveAnnouncer, useValue: mockAnnouncer },
      ],
    });
    const fixture = TestBed.createComponent(hostType);
    fixture.detectChanges();
    return fixture;
  }

  // ── Rendering ──

  describe('Rendering', () => {
    it('should render without errors with no panels open', () => {
      const fixture = createFixture(SingleHost);
      const accordion = fixture.nativeElement.querySelector('tw-accordion');
      expect(accordion).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.content-a')).toBeNull();
      expect(fixture.nativeElement.querySelector('.content-b')).toBeNull();
    });

    it('should render all variants without error', () => {
      const fixture = createFixture(VariantHost);
      const variants = ['default', 'bordered', 'ghost'] as const;
      for (const variant of variants) {
        fixture.componentInstance.variant.set(variant);
        expect(() => fixture.detectChanges()).not.toThrow();
      }
    });

    it('should apply container classes based on variant', () => {
      const fixture = createFixture(VariantHost);
      const accordion = fixture.nativeElement.querySelector('tw-accordion');

      fixture.componentInstance.variant.set('bordered');
      fixture.detectChanges();
      expect(accordion.className).toContain('border');

      fixture.componentInstance.variant.set('ghost');
      fixture.detectChanges();
      expect(accordion.className).not.toContain('border-border');
    });

    it('should apply divide-y on default and bordered variants', () => {
      const fixture = createFixture(VariantHost);
      const accordion = fixture.nativeElement.querySelector('tw-accordion');

      fixture.componentInstance.variant.set('default');
      fixture.detectChanges();
      expect(accordion.className).toContain('divide-y');

      fixture.componentInstance.variant.set('bordered');
      fixture.detectChanges();
      expect(accordion.className).toContain('divide-y');
    });

    it('should NOT apply divide-y on ghost variant', () => {
      const fixture = createFixture(VariantHost);
      const accordion = fixture.nativeElement.querySelector('tw-accordion');

      fixture.componentInstance.variant.set('ghost');
      fixture.detectChanges();
      expect(accordion.className).not.toContain('divide-y');
    });
  });

  // ── Single mode ──

  describe('Single mode (type="single")', () => {
    it('should open one panel at a time', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.content-a')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.content-b')).toBeNull();

      triggers[1].click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.content-a')).toBeNull();
      expect(fixture.nativeElement.querySelector('.content-b')).toBeTruthy();
    });

    it('should update value to the open panel value', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.active()).toBe('a');
    });

    it('should close the open panel when re-clicked with collapsible=true', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.content-a')).toBeTruthy();

      triggers[0].click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.content-a')).toBeNull();
      expect(fixture.componentInstance.active()).toBeNull();
    });

    it('should NOT close the open panel when re-clicked with collapsible=false', () => {
      const fixture = createFixture(SingleHost);
      fixture.componentInstance.collapsibleFlag.set(false);
      fixture.detectChanges();

      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');
      triggers[0].click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.content-a')).toBeTruthy();

      triggers[0].click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.content-a')).toBeTruthy();
      expect(fixture.componentInstance.active()).toBe('a');
    });

    it('should reflect parent-driven value changes', () => {
      const fixture = createFixture(SingleHost);

      fixture.componentInstance.active.set('b');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.content-a')).toBeNull();
      expect(fixture.nativeElement.querySelector('.content-b')).toBeTruthy();
    });

    it('should not toggle disabled panels', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[2].click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.content-c')).toBeNull();
      expect(fixture.componentInstance.active()).toBeNull();
    });
  });

  // ── Multiple mode ──

  describe('Multiple mode (type="multiple")', () => {
    it('should allow multiple panels open at once', () => {
      const fixture = createFixture(MultipleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      fixture.detectChanges();
      triggers[1].click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.content-x')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.content-y')).toBeTruthy();
    });

    it('should update value as an array of open values', () => {
      const fixture = createFixture(MultipleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.open()).toEqual(['x']);

      triggers[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.open()).toEqual(['x', 'y']);
    });

    it('should remove values from the array when a panel closes', () => {
      const fixture = createFixture(MultipleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      triggers[1].click();
      fixture.detectChanges();

      triggers[0].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.open()).toEqual(['y']);
    });

    it('should reflect parent-driven array value', () => {
      const fixture = createFixture(MultipleHost);

      fixture.componentInstance.open.set(['x', 'y']);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.content-x')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.content-y')).toBeTruthy();
    });
  });

  // ── Keyboard navigation ──

  describe('Keyboard navigation', () => {
    it('should move focus to next trigger on ArrowDown', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      (triggers[0] as HTMLElement).focus();
      triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(triggers[1]);
    });

    it('should move focus to previous trigger on ArrowUp', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      (triggers[1] as HTMLElement).focus();
      triggers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', keyCode: 38, bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(triggers[0]);
    });

    it('should move focus to first trigger on Home', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      (triggers[1] as HTMLElement).focus();
      triggers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', keyCode: 36, bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(triggers[0]);
    });

    it('should move focus to last enabled trigger on End', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      (triggers[0] as HTMLElement).focus();
      triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', keyCode: 35, bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(triggers[1]);
    });

    it('should skip disabled panels in navigation', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      (triggers[1] as HTMLElement).focus();
      triggers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(triggers[0]);
    });
  });

  // ── Accessibility ──

  describe('Accessibility', () => {
    it('should NOT set role="group" on the host (per APG)', () => {
      const fixture = createFixture(SingleHost);
      const accordion = fixture.nativeElement.querySelector('tw-accordion');
      expect(accordion.hasAttribute('role')).toBe(false);
    });

    it('should announce state changes via LiveAnnouncer', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      fixture.detectChanges();

      expect(mockAnnouncer.announce).toHaveBeenCalledWith('Section expanded');
    });

    it('should propagate aria-expanded on trigger', () => {
      const fixture = createFixture(SingleHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');
      expect(triggers[0].getAttribute('aria-expanded')).toBe('false');

      triggers[0].click();
      fixture.detectChanges();

      expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    });

    it('should set aria-multiselectable="false" explicitly in single mode (per APG)', () => {
      const fixture = createFixture(SingleHost);
      const accordion = fixture.nativeElement.querySelector('tw-accordion');
      expect(accordion.getAttribute('aria-multiselectable')).toBe('false');
    });

    it('should set aria-multiselectable="true" in multiple mode', () => {
      const fixture = createFixture(MultipleHost);
      const accordion = fixture.nativeElement.querySelector('tw-accordion');
      expect(accordion.getAttribute('aria-multiselectable')).toBe('true');
    });

    it('should reflect aria-label on the host', () => {
      const fixture = createFixture(AriaHost);
      const accordion = fixture.nativeElement.querySelector('tw-accordion');
      expect(accordion.hasAttribute('aria-label')).toBe(false);

      fixture.componentInstance.label.set('Sidebar sections');
      fixture.detectChanges();
      expect(accordion.getAttribute('aria-label')).toBe('Sidebar sections');
    });

    it('should reflect aria-labelledby on the host', () => {
      const fixture = createFixture(AriaHost);
      const accordion = fixture.nativeElement.querySelector('tw-accordion');
      expect(accordion.hasAttribute('aria-labelledby')).toBe(false);

      fixture.componentInstance.labelledby.set('sections-heading');
      fixture.detectChanges();
      expect(accordion.getAttribute('aria-labelledby')).toBe('sections-heading');
    });
  });

  // ── Value default ──

  describe('Value default', () => {
    it('should default value to null (not empty string) on mount', () => {
      const fixture = createFixture(SingleHost);
      expect(fixture.componentInstance.active()).toBeNull();
    });
  });

  // ── Parity: <tw-accordion type="single"> ≡ <tw-collapsible-group accordion> ──

  describe('Parity with tw-collapsible-group accordion', () => {
    function click(el: Element): void {
      (el as HTMLElement).click();
    }

    function keydown(el: Element, key: string, keyCode: number): void {
      el.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode, bubbles: true }));
    }

    function queryTriggers(
      fixture: ComponentFixture<ParityHost>,
      role: 'acc' | 'grp',
    ): NodeListOf<Element> {
      const section = fixture.nativeElement.querySelector(`section[data-role="${role}"]`);
      return section.querySelectorAll('[twcollapsibletrigger]');
    }

    function queryContent(
      fixture: ComponentFixture<ParityHost>,
      role: 'acc' | 'grp',
      letter: 'a' | 'b',
    ): Element | null {
      const section = fixture.nativeElement.querySelector(`section[data-role="${role}"]`);
      return section.querySelector(`.content-${letter}`);
    }

    it('should produce identical open/close state on click toggling', () => {
      const fixture = createFixture(ParityHost);
      const accTriggers = queryTriggers(fixture, 'acc');
      const grpTriggers = queryTriggers(fixture, 'grp');

      // Open A in both
      click(accTriggers[0]);
      click(grpTriggers[0]);
      fixture.detectChanges();

      expect(!!queryContent(fixture, 'acc', 'a')).toBe(!!queryContent(fixture, 'grp', 'a'));
      expect(fixture.componentInstance.accValue()).toBe(fixture.componentInstance.grpValue());

      // Open B (closes A in both)
      click(accTriggers[1]);
      click(grpTriggers[1]);
      fixture.detectChanges();

      expect(!!queryContent(fixture, 'acc', 'a')).toBe(!!queryContent(fixture, 'grp', 'a'));
      expect(!!queryContent(fixture, 'acc', 'b')).toBe(!!queryContent(fixture, 'grp', 'b'));
      expect(fixture.componentInstance.accValue()).toBe(fixture.componentInstance.grpValue());

      // Re-click B closes it (both groups allow collapse by default)
      click(accTriggers[1]);
      click(grpTriggers[1]);
      fixture.detectChanges();

      expect(fixture.componentInstance.accValue()).toBeNull();
      expect(fixture.componentInstance.grpValue()).toBeNull();
    });

    it('should produce identical aria-expanded propagation on the triggers', () => {
      const fixture = createFixture(ParityHost);
      const accTriggers = queryTriggers(fixture, 'acc');
      const grpTriggers = queryTriggers(fixture, 'grp');

      click(accTriggers[0]);
      click(grpTriggers[0]);
      fixture.detectChanges();

      expect(accTriggers[0].getAttribute('aria-expanded')).toBe(
        grpTriggers[0].getAttribute('aria-expanded'),
      );
      expect(accTriggers[1].getAttribute('aria-expanded')).toBe(
        grpTriggers[1].getAttribute('aria-expanded'),
      );
    });

    it('should produce identical keyboard navigation (ArrowDown)', () => {
      const fixture = createFixture(ParityHost);
      const accTriggers = queryTriggers(fixture, 'acc');
      const grpTriggers = queryTriggers(fixture, 'grp');

      (accTriggers[0] as HTMLElement).focus();
      keydown(accTriggers[0], 'ArrowDown', 40);
      fixture.detectChanges();
      expect(document.activeElement).toBe(accTriggers[1]);

      (grpTriggers[0] as HTMLElement).focus();
      keydown(grpTriggers[0], 'ArrowDown', 40);
      fixture.detectChanges();
      expect(document.activeElement).toBe(grpTriggers[1]);
    });
  });
});
