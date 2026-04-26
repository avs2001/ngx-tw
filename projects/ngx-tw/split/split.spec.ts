import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { TwSplit } from './split';
import { TwSplitPane } from './split-pane';

// ── Host components ──────────────────────────────────────────────────────────

@Component({
  imports: [TwSplit, TwSplitPane],
  template: `<tw-split><tw-split-pane>A</tw-split-pane><tw-split-pane>B</tw-split-pane></tw-split>`,
})
class TwoPaneHost {}

@Component({
  imports: [TwSplit, TwSplitPane],
  template: `
    <tw-split>
      <tw-split-pane>A</tw-split-pane>
      <tw-split-pane>B</tw-split-pane>
      <tw-split-pane>C</tw-split-pane>
    </tw-split>
  `,
})
class ThreePaneHost {}

@Component({
  imports: [TwSplit],
  template: `<tw-split></tw-split>`,
})
class NoPanesHost {}

@Component({
  imports: [TwSplit, TwSplitPane],
  template: `<tw-split><tw-split-pane>Solo</tw-split-pane></tw-split>`,
})
class OnePaneHost {}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPanes(fixture: ComponentFixture<unknown>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('tw-split-pane'));
}

function getSplit(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-split') as HTMLElement;
}

// ── Specs ─────────────────────────────────────────────────────────────────────

describe('TwSplit (Phase 1 scaffold)', () => {
  describe('rendering', () => {
    it('mounts without errors with two panes and no inputs', async () => {
      const fixture = TestBed.createComponent(TwoPaneHost);
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('mounts without errors with zero panes', async () => {
      const fixture = TestBed.createComponent(NoPanesHost);
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('applies flex-row layout class for horizontal direction (default)', () => {
      const fixture = TestBed.createComponent(TwoPaneHost);
      fixture.detectChanges();
      const split = getSplit(fixture);
      expect(split.className).toContain('flex-row');
    });

    it('applies flex-col layout class for vertical direction', () => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.componentRef.setInput('direction', 'vertical');
      fixture.detectChanges();
      expect(fixture.nativeElement.className).toContain('flex-col');
    });

    it('sets data-split-direction attribute', () => {
      const fixture = TestBed.createComponent(TwoPaneHost);
      fixture.detectChanges();
      const split = getSplit(fixture);
      expect(split.getAttribute('data-split-direction')).toBe('horizontal');
    });
  });

  describe('even flex-basis distribution (§3 default sizing)', () => {
    it('distributes two panes at 50% each when no defaultSize is declared', async () => {
      const fixture = TestBed.createComponent(TwoPaneHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const panes = getPanes(fixture);
      expect(panes).toHaveLength(2);
      for (const pane of panes) {
        expect(pane.style.flexBasis).toBe('50%');
      }
    });

    it('distributes three panes at ~33.33% each when no defaultSize is declared', async () => {
      const fixture = TestBed.createComponent(ThreePaneHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const panes = getPanes(fixture);
      expect(panes).toHaveLength(3);
      const expected = `${100 / 3}%`;
      for (const pane of panes) {
        expect(pane.style.flexBasis).toBe(expected);
      }
    });

    it('renders a single pane filling the container with no gutter', async () => {
      const fixture = TestBed.createComponent(OnePaneHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const panes = getPanes(fixture);
      expect(panes).toHaveLength(1);
      expect(panes[0].style.flexBasis).toBe('100%');
    });

    it('renders no panes for an empty split', async () => {
      const fixture = TestBed.createComponent(NoPanesHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const panes = getPanes(fixture);
      expect(panes).toHaveLength(0);
    });
  });

  describe('TwSplit inputs (§3.2)', () => {
    it('has direction defaulting to horizontal', () => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.detectChanges();
      expect(fixture.componentInstance.direction()).toBe('horizontal');
    });

    it('has unit defaulting to percent', () => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.detectChanges();
      expect(fixture.componentInstance.unit()).toBe('percent');
    });

    it('has gutterSize defaulting to 6', () => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.detectChanges();
      expect(fixture.componentInstance.gutterSize()).toBe(6);
    });

    it('has disabled defaulting to false', () => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.detectChanges();
      expect(fixture.componentInstance.disabled()).toBe(false);
    });

    it('has keyboardStep defaulting to 10', () => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.detectChanges();
      expect(fixture.componentInstance.keyboardStep()).toBe(10);
    });

    it('has keyboardStepLarge defaulting to 50', () => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.detectChanges();
      expect(fixture.componentInstance.keyboardStepLarge()).toBe(50);
    });

    it('has storageKey defaulting to null', () => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.detectChanges();
      expect(fixture.componentInstance.storageKey()).toBeNull();
    });

    it('has rtl defaulting to null', () => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.detectChanges();
      expect(fixture.componentInstance.rtl()).toBeNull();
    });
  });

  describe('TwSplitPane inputs (§3.3)', () => {
    it('has minSize defaulting to 0', () => {
      const fixture = TestBed.createComponent(TwSplitPane);
      fixture.detectChanges();
      expect(fixture.componentInstance.minSize()).toBe(0);
    });

    it('has maxSize defaulting to Infinity', () => {
      const fixture = TestBed.createComponent(TwSplitPane);
      fixture.detectChanges();
      expect(fixture.componentInstance.maxSize()).toBe(Infinity);
    });

    it('has collapsible defaulting to false', () => {
      const fixture = TestBed.createComponent(TwSplitPane);
      fixture.detectChanges();
      expect(fixture.componentInstance.collapsible()).toBe(false);
    });

    it('has collapsedSize defaulting to 0', () => {
      const fixture = TestBed.createComponent(TwSplitPane);
      fixture.detectChanges();
      expect(fixture.componentInstance.collapsedSize()).toBe(0);
    });

    it('has snapSize defaulting to 0', () => {
      const fixture = TestBed.createComponent(TwSplitPane);
      fixture.detectChanges();
      expect(fixture.componentInstance.snapSize()).toBe(0);
    });

    it('has defaultSize defaulting to undefined', () => {
      const fixture = TestBed.createComponent(TwSplitPane);
      fixture.detectChanges();
      expect(fixture.componentInstance.defaultSize()).toBeUndefined();
    });
  });

  describe('stub methods (§3.2 programmatic API)', () => {
    let split: TwSplit;

    beforeEach(() => {
      const fixture = TestBed.createComponent(TwSplit);
      fixture.detectChanges();
      split = fixture.componentInstance;
    });

    it('setSizes throws "not implemented"', () => {
      expect(() => split.setSizes([50, 50])).toThrow('not implemented');
    });

    it('collapse throws "not implemented"', () => {
      expect(() => split.collapse(0)).toThrow('not implemented');
    });

    it('expand throws "not implemented"', () => {
      expect(() => split.expand(0)).toThrow('not implemented');
    });

    it('reset throws "not implemented"', () => {
      expect(() => split.reset()).toThrow('not implemented');
    });
  });
});
