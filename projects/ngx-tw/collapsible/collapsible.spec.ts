import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CollapsibleComponent,
  CollapsibleGroupComponent,
  CollapsibleTriggerDirective,
  CollapsibleIconDirective,
  type CollapsibleVariant,
} from './collapsible';

// ── Test host for standalone collapsible ──

@Component({
  imports: [CollapsibleComponent, CollapsibleTriggerDirective],
  template: `
    <tw-collapsible
      [disabled]="disabled()"
      [keepAlive]="keepAlive()"
      [variant]="variant()"
      [(open)]="open"
      (toggled)="lastToggled = $event"
    >
      <button twCollapsibleTrigger>Toggle</button>
      <p class="body-content">Body content</p>
    </tw-collapsible>
  `,
})
class StandaloneHost {
  open = signal(false);
  disabled = signal(false);
  keepAlive = signal(false);
  variant = signal<CollapsibleVariant>('default');
  lastToggled: boolean | undefined;
}

// ── Test host for custom icon ──

@Component({
  imports: [CollapsibleComponent, CollapsibleTriggerDirective, CollapsibleIconDirective],
  template: `
    <tw-collapsible>
      <button twCollapsibleTrigger>
        Toggle
        <span twCollapsibleIcon class="custom-icon">+</span>
      </button>
      <p>Body</p>
    </tw-collapsible>
  `,
})
class CustomIconHost {}

// ── Test host for accordion group ──

@Component({
  imports: [CollapsibleComponent, CollapsibleGroupComponent, CollapsibleTriggerDirective],
  template: `
    <tw-collapsible-group [accordion]="true" [(value)]="activePanel">
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
    </tw-collapsible-group>
  `,
})
class AccordionHost {
  activePanel = signal<string | string[]>('');
}

// ── Test host for independent group ──

@Component({
  imports: [CollapsibleComponent, CollapsibleGroupComponent, CollapsibleTriggerDirective],
  template: `
    <tw-collapsible-group [(value)]="openPanels">
      <tw-collapsible value="x">
        <button twCollapsibleTrigger>Panel X</button>
        <p>Content X</p>
      </tw-collapsible>
      <tw-collapsible value="y">
        <button twCollapsibleTrigger>Panel Y</button>
        <p>Content Y</p>
      </tw-collapsible>
    </tw-collapsible-group>
  `,
})
class IndependentGroupHost {
  openPanels = signal<string | string[]>([]);
}

// ── Test host for keepAlive ──

@Component({
  imports: [CollapsibleComponent, CollapsibleTriggerDirective],
  template: `
    <tw-collapsible [keepAlive]="true" [(open)]="open">
      <button twCollapsibleTrigger>Toggle</button>
      <div class="alive-content">Expensive content</div>
    </tw-collapsible>
  `,
})
class KeepAliveHost {
  open = signal(false);
}

describe('CollapsibleComponent', () => {
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
    it('should render with default state (collapsed)', () => {
      const fixture = createFixture(StandaloneHost);
      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');
      expect(trigger).toBeTruthy();

      const body = fixture.nativeElement.querySelector('.body-content');
      expect(body).toBeNull();
    });

    it('should render content when open is true', () => {
      const fixture = createFixture(StandaloneHost);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const body = fixture.nativeElement.querySelector('.body-content');
      expect(body).toBeTruthy();
      expect(body.textContent).toBe('Body content');
    });

    it('should render all variants without error', () => {
      const variants = ['default', 'bordered', 'ghost', 'filled'] as const;
      const fixture = createFixture(StandaloneHost);
      for (const variant of variants) {
        fixture.componentInstance.variant.set(variant);
        expect(() => fixture.detectChanges()).not.toThrow();
      }
    });
  });

  // ── Inputs and outputs ──

  describe('Inputs and outputs', () => {
    it('should emit toggled when clicking the trigger', () => {
      const fixture = createFixture(StandaloneHost);
      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');

      trigger.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.lastToggled).toBe(true);
    });

    it('should support two-way binding on open', () => {
      const fixture = createFixture(StandaloneHost);
      expect(fixture.componentInstance.open()).toBe(false);

      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');
      trigger.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.open()).toBe(true);
    });
  });

  // ── Interactions ──

  describe('Interactions', () => {
    it('should toggle on click', () => {
      const fixture = createFixture(StandaloneHost);
      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');

      trigger.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.body-content')).toBeTruthy();

      trigger.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.body-content')).toBeNull();
    });

    it('should toggle on Enter key', () => {
      const fixture = createFixture(StandaloneHost);
      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.body-content')).toBeTruthy();
    });

    it('should toggle on Space key', () => {
      const fixture = createFixture(StandaloneHost);
      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.body-content')).toBeTruthy();
    });

    it('should not toggle when disabled', () => {
      const fixture = createFixture(StandaloneHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');
      trigger.click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.body-content')).toBeNull();
      expect(fixture.componentInstance.lastToggled).toBeUndefined();
    });
  });

  // ── Accessibility ──

  describe('Accessibility', () => {
    it('should set aria-expanded to false when collapsed', () => {
      const fixture = createFixture(StandaloneHost);
      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should set aria-expanded to true when expanded', () => {
      const fixture = createFixture(StandaloneHost);
      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');

      trigger.click();
      fixture.detectChanges();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should set aria-controls on trigger and matching id on panel', () => {
      const fixture = createFixture(StandaloneHost);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');
      const panel = fixture.nativeElement.querySelector('[role="region"]');

      expect(trigger.getAttribute('aria-controls')).toBe(panel.getAttribute('id'));
    });

    it('should set aria-labelledby on panel matching trigger id', () => {
      const fixture = createFixture(StandaloneHost);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');
      const panel = fixture.nativeElement.querySelector('[role="region"]');

      expect(panel.getAttribute('aria-labelledby')).toBe(trigger.getAttribute('id'));
    });

    it('should set role="button" on trigger', () => {
      const fixture = createFixture(StandaloneHost);
      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');
      expect(trigger.getAttribute('role')).toBe('button');
    });

    it('should set aria-disabled on disabled trigger', () => {
      const fixture = createFixture(StandaloneHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');
      expect(trigger.getAttribute('aria-disabled')).toBe('true');
    });

    it('should announce state change via LiveAnnouncer', () => {
      const fixture = createFixture(StandaloneHost);
      const trigger = fixture.nativeElement.querySelector('[twcollapsibletrigger]');

      trigger.click();
      fixture.detectChanges();

      expect(mockAnnouncer.announce).toHaveBeenCalledWith('Section expanded');
    });

    it('should set role="group" on collapsible-group', () => {
      const fixture = createFixture(AccordionHost);
      const group = fixture.nativeElement.querySelector('tw-collapsible-group');
      expect(group.getAttribute('role')).toBe('group');
    });
  });

  // ── Content projection ──

  describe('Content projection', () => {
    it('should render custom icon when twCollapsibleIcon is provided', () => {
      const fixture = createFixture(CustomIconHost);
      const customIcon = fixture.nativeElement.querySelector('.custom-icon');
      expect(customIcon).toBeTruthy();
      expect(customIcon.textContent).toBe('+');
    });
  });

  // ── Accordion mode ──

  describe('Accordion mode', () => {
    it('should only allow one panel open at a time', () => {
      const fixture = createFixture(AccordionHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      // Open panel A
      triggers[0].click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.content-a')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.content-b')).toBeNull();

      // Open panel B — A should close
      triggers[1].click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.content-a')).toBeNull();
      expect(fixture.nativeElement.querySelector('.content-b')).toBeTruthy();
    });

    it('should update group value on toggle', () => {
      const fixture = createFixture(AccordionHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.activePanel()).toBe('a');
    });

    it('should not toggle disabled panels', () => {
      const fixture = createFixture(AccordionHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[2].click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.content-c')).toBeNull();
    });

    it('should navigate with ArrowDown key', () => {
      const fixture = createFixture(AccordionHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      (triggers[0] as HTMLElement).focus();
      triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(triggers[1]);
    });

    it('should navigate with ArrowUp key', () => {
      const fixture = createFixture(AccordionHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      (triggers[1] as HTMLElement).focus();
      triggers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(triggers[0]);
    });

    it('should navigate to first trigger with Home key', () => {
      const fixture = createFixture(AccordionHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      (triggers[1] as HTMLElement).focus();
      triggers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(triggers[0]);
    });

    it('should navigate to last trigger with End key', () => {
      const fixture = createFixture(AccordionHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      (triggers[0] as HTMLElement).focus();
      // End should go to the last enabled trigger (index 1 since index 2 is disabled)
      triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      fixture.detectChanges();

      // Panel C at index 2 is disabled, so End should skip it
      // findLastEnabledIndex finds index 1
      expect(document.activeElement).toBe(triggers[1]);
    });

    it('should skip disabled panels during keyboard navigation', () => {
      const fixture = createFixture(AccordionHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      // From B (index 1), ArrowDown should skip disabled C (index 2) and wrap to A (index 0)
      (triggers[1] as HTMLElement).focus();
      triggers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(triggers[0]);
    });
  });

  // ── Independent mode ──

  describe('Independent mode', () => {
    it('should allow multiple panels open at once', () => {
      const fixture = createFixture(IndependentGroupHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      fixture.detectChanges();
      triggers[1].click();
      fixture.detectChanges();

      const panels = fixture.nativeElement.querySelectorAll('[role="region"]');
      expect(panels.length).toBe(2);
    });

    it('should update group value as an array', () => {
      const fixture = createFixture(IndependentGroupHost);
      const triggers = fixture.nativeElement.querySelectorAll('[twcollapsibletrigger]');

      triggers[0].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.openPanels()).toEqual(['x']);

      triggers[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.openPanels()).toEqual(['x', 'y']);
    });
  });

  // ── keepAlive ──

  describe('keepAlive', () => {
    it('should keep content in DOM after closing when keepAlive is true', () => {
      const fixture = createFixture(KeepAliveHost);

      // Open
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.alive-content')).toBeTruthy();

      // Close — content should remain in DOM
      fixture.componentInstance.open.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.alive-content')).toBeTruthy();
    });

    it('should destroy content after closing when keepAlive is false', () => {
      const fixture = createFixture(StandaloneHost);

      // Open
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.body-content')).toBeTruthy();

      // Close — content should be removed
      fixture.componentInstance.open.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.body-content')).toBeNull();
    });

    it('should not render content before first open with keepAlive', () => {
      const fixture = createFixture(KeepAliveHost);
      expect(fixture.nativeElement.querySelector('.alive-content')).toBeNull();
    });

    it('should set data-open attribute correctly', () => {
      const fixture = createFixture(KeepAliveHost);

      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector('[role="region"]');
      expect(panel.getAttribute('data-open')).toBe('true');

      fixture.componentInstance.open.set(false);
      fixture.detectChanges();

      expect(panel.getAttribute('data-open')).toBe('false');
    });

    it('should apply collapsible-keep-alive class when keepAlive is true', () => {
      const fixture = createFixture(KeepAliveHost);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector('[role="region"]');
      expect(panel.classList.contains('collapsible-keep-alive')).toBe(true);
    });

    it('should not apply collapsible-keep-alive class when keepAlive is false', () => {
      const fixture = createFixture(StandaloneHost);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector('[role="region"]');
      expect(panel.classList.contains('collapsible-keep-alive')).toBe(false);
    });
  });
});
