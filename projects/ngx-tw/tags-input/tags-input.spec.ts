import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { type Direction, Directionality } from '@angular/cdk/bidi';
import { Subject } from 'rxjs';
import {
  FormFieldComponent,
  LabelDirective,
} from '@cdevhub/ngx-tw/form-field';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import { TagsInputComponent } from './tags-input';

// ── Hosts ──

@Component({
  imports: [TagsInputComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-tags-input aria-label="Tags" [formControl]="control" />`,
})
class ReactiveHost {
  readonly control = new FormControl<string[]>([], { nonNullable: true });
}

@Component({
  imports: [TagsInputComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-tags-input aria-label="Tags" [(ngModel)]="value" />`,
})
class TemplateDrivenHost {
  value: string[] = [];
}

@Component({
  imports: [TagsInputComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-tags-input aria-label="Tags" [formField]="tagsForm.labels" />`,
})
class SignalFormHost {
  protected readonly model = signal({ labels: [] as string[] });
  readonly tagsForm = form(this.model);
}

@Component({
  imports: [TagsInputComponent, FormFieldComponent, LabelDirective, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field>
      <label twLabel>Recipients</label>
      <tw-tags-input [formControl]="control" />
    </tw-form-field>
  `,
})
class FormFieldHost {
  readonly control = new FormControl<string[]>([], { nonNullable: true });
}

// ── Helpers ──

describe('TagsInputComponent', () => {
  const mounted: ComponentFixture<unknown>[] = [];

  function mount<T>(type: Type<T>): ComponentFixture<T> {
    const fixture = TestBed.createComponent(type);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    mounted.push(fixture);
    return fixture;
  }

  /** Mounts a bare component (with an accessible name) and writes initial tags via the CVA path. */
  function mountBare(tags: string[] = []): ComponentFixture<TagsInputComponent<string>> {
    const fixture = TestBed.createComponent(TagsInputComponent);
    fixture.componentRef.setInput('aria-label', 'Tags');
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    mounted.push(fixture);
    if (tags.length) {
      fixture.componentInstance.writeValue(tags);
      fixture.detectChanges();
    }
    return fixture as ComponentFixture<TagsInputComponent<string>>;
  }

  function input(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return fixture.nativeElement.querySelector('input') as HTMLInputElement;
  }

  function removeButtons(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function chipLabels(fixture: ComponentFixture<unknown>): string[] {
    return removeButtons(fixture).map((b) =>
      (b.getAttribute('aria-label') ?? '').replace(/^Remove /, ''),
    );
  }

  function type(fixture: ComponentFixture<unknown>, text: string): void {
    const el = input(fixture);
    el.value = text;
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function key(el: Element, k: string, opts: KeyboardEventInit = {}): KeyboardEvent {
    const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts });
    el.dispatchEvent(ev);
    return ev;
  }

  afterEach(() => {
    for (const f of mounted) {
      f.nativeElement.remove?.();
      f.destroy();
    }
    mounted.length = 0;
  });

  // ── Rendering ──

  describe('Rendering', () => {
    it('creates with no inputs', () => {
      const fixture = mount(TagsInputComponent);
      expect(fixture.componentInstance).toBeTruthy();
      expect(fixture.nativeElement.getAttribute('role')).toBe('group');
    });

    it('renders a chip per committed tag', () => {
      const fixture = mountBare(['alpha', 'beta']);
      expect(chipLabels(fixture)).toEqual(['alpha', 'beta']);
    });

    it('renders every color without error', () => {
      const colors: TwColor[] = [
        'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
      ];
      const fixture = mountBare(['x']);
      for (const color of colors) {
        fixture.componentRef.setInput('color', color);
        fixture.detectChanges();
        expect(removeButtons(fixture).length).toBe(1);
      }
    });

    it('renders every size without error', () => {
      const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      const fixture = mountBare(['x']);
      for (const size of sizes) {
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(removeButtons(fixture).length).toBe(1);
      }
    });
  });

  // ── Inputs ──

  describe('Inputs', () => {
    it('applies placeholder to the input', () => {
      const fixture = mountBare();
      fixture.componentRef.setInput('placeholder', 'Add a tag');
      fixture.detectChanges();
      expect(input(fixture).getAttribute('placeholder')).toBe('Add a tag');
    });

    it('disables the input and buttons when disabled', () => {
      const fixture = mountBare(['x']);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(input(fixture).disabled).toBe(true);
      expect(removeButtons(fixture)[0].disabled).toBe(true);
      expect(fixture.nativeElement.getAttribute('aria-disabled')).toBe('true');
    });

    it('mirrors required to aria-required on the input', () => {
      const fixture = mountBare();
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();
      expect(input(fixture).getAttribute('aria-required')).toBe('true');
    });
  });

  // ── Commit / Outputs ──

  describe('Commit and outputs', () => {
    it('commits the typed text on Enter and emits valueChange + tagAdded', () => {
      const fixture = mountBare();
      const added = vi.fn();
      const changed = vi.fn();
      fixture.componentInstance.tagAdded.subscribe(added);
      fixture.componentInstance.valueChange.subscribe(changed);
      type(fixture, 'apple');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['apple']);
      expect(added).toHaveBeenCalledWith({ tag: 'apple', value: ['apple'] });
      expect(changed).toHaveBeenCalledWith(['apple']);
      expect(input(fixture).value).toBe('');
    });

    it('commits on a separator character and swallows it', () => {
      const fixture = mountBare();
      type(fixture, 'red');
      const ev = key(input(fixture), ',');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['red']);
      expect(ev.defaultPrevented).toBe(true);
    });

    it('does not commit an empty/whitespace Enter (lets form submit through)', () => {
      const fixture = mountBare();
      type(fixture, '   ');
      const ev = key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual([]);
      expect(ev.defaultPrevented).toBe(false);
    });

    it('drops a duplicate silently when allowDuplicates is false', () => {
      const fixture = mountBare(['apple']);
      const added = vi.fn();
      fixture.componentInstance.tagAdded.subscribe(added);
      type(fixture, 'apple');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['apple']);
      expect(added).not.toHaveBeenCalled();
      expect(input(fixture).value).toBe(''); // gesture consumed
    });

    it('keeps duplicates when allowDuplicates is true', () => {
      const fixture = mountBare(['apple']);
      fixture.componentRef.setInput('allowDuplicates', true);
      fixture.detectChanges();
      type(fixture, 'apple');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['apple', 'apple']);
    });

    it('blocks commits past max and retains the input text', () => {
      const fixture = mountBare(['a', 'b']);
      fixture.componentRef.setInput('maxTags', 2);
      fixture.detectChanges();
      const added = vi.fn();
      fixture.componentInstance.tagAdded.subscribe(added);
      type(fixture, 'c');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['a', 'b']);
      expect(added).not.toHaveBeenCalled();
      expect(input(fixture).value).toBe('c'); // retained for retry
    });

    it('addTag() returns true on success and false when dropped', () => {
      const fixture = mountBare();
      expect(fixture.componentInstance.addTag('one')).toBe(true);
      expect(fixture.componentInstance.addTag('  ')).toBe(false);
      expect(fixture.componentInstance.addTag('one')).toBe(false); // duplicate
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['one']);
    });
  });

  // ── Removal ──

  describe('Removal', () => {
    it('removes a tag on remove-button click and emits tagRemoved', () => {
      const fixture = mountBare(['a', 'b']);
      const removed = vi.fn();
      fixture.componentInstance.tagRemoved.subscribe(removed);
      removeButtons(fixture)[0].click();
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['b']);
      expect(removed).toHaveBeenCalledWith({ tag: 'a', value: ['b'], index: 0 });
    });

    it('removeTag(value) removes by value', () => {
      const fixture = mountBare(['a', 'b', 'c']);
      fixture.componentInstance.removeTag('b');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['a', 'c']);
    });

    it('clear() empties all tags and emits valueChange once', () => {
      const fixture = mountBare(['a', 'b']);
      const removed = vi.fn();
      const changed = vi.fn();
      fixture.componentInstance.tagRemoved.subscribe(removed);
      fixture.componentInstance.valueChange.subscribe(changed);
      fixture.componentInstance.clear();
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual([]);
      expect(removed).not.toHaveBeenCalled(); // bulk reset, no per-tag event
      expect(changed).toHaveBeenCalledWith([]);
    });
  });

  // ── Keyboard ──

  describe('Keyboard', () => {
    it('Delete on a focused chip removes it', () => {
      const fixture = mountBare(['a', 'b']);
      key(removeButtons(fixture)[0], 'Delete');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['b']);
    });

    it('two-step Backspace: empty-input Backspace highlights the last chip, then removes it', () => {
      const fixture = mountBare(['a', 'b']);
      const el = input(fixture);
      el.focus();
      // First Backspace on the empty input highlights (focuses) the last chip.
      key(el, 'Backspace');
      fixture.detectChanges();
      expect(document.activeElement).toBe(removeButtons(fixture)[1]);
      // Second Backspace (now on the chip) removes it.
      key(document.activeElement as Element, 'Backspace');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['a']);
    });

    it('ArrowLeft from the start of the input focuses the last chip', () => {
      const fixture = mountBare(['a', 'b']);
      const el = input(fixture);
      el.focus();
      el.setSelectionRange(0, 0);
      key(el, 'ArrowLeft');
      fixture.detectChanges();
      expect(document.activeElement).toBe(removeButtons(fixture)[1]);
    });

    it('ArrowRight past the last chip returns focus to the input', () => {
      const fixture = mountBare(['a']);
      key(removeButtons(fixture)[0], 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(input(fixture));
    });

    it('restores focus to the next chip after removing a middle chip', () => {
      const fixture = mountBare(['a', 'b', 'c']);
      // Focus + remove the middle chip (index 1).
      key(removeButtons(fixture)[1], 'Delete');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['a', 'c']);
      // Focus restoration rule: the chip now at index 1 ('c') receives focus.
      const buttons = removeButtons(fixture);
      expect(document.activeElement).toBe(buttons[1]);
      expect(buttons[1].getAttribute('aria-label')).toBe('Remove c');
    });

    it('restores focus to the input after removing the only chip', () => {
      const fixture = mountBare(['solo']);
      key(removeButtons(fixture)[0], 'Delete');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual([]);
      expect(document.activeElement).toBe(input(fixture));
    });

    it('ArrowRight moves focus from one chip to the next', () => {
      const fixture = mountBare(['a', 'b', 'c']);
      key(removeButtons(fixture)[0], 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(removeButtons(fixture)[1]);
    });

    it('End on a chip returns focus to the input', () => {
      const fixture = mountBare(['a', 'b']);
      key(removeButtons(fixture)[0], 'End');
      fixture.detectChanges();
      expect(document.activeElement).toBe(input(fixture));
    });

    it('Escape clears the in-progress input text without removing tags', () => {
      const fixture = mountBare(['a']);
      type(fixture, 'partial');
      key(input(fixture), 'Escape');
      fixture.detectChanges();
      expect(input(fixture).value).toBe('');
      expect(chipLabels(fixture)).toEqual(['a']);
    });

    it('Escape on a highlighted chip cancels the highlight and refocuses the input (no removal)', () => {
      const fixture = mountBare(['a', 'b']);
      key(removeButtons(fixture)[1], 'Escape');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['a', 'b']);
      expect(document.activeElement).toBe(input(fixture));
    });
  });

  // ── RTL keyboard navigation ──

  describe('RTL keyboard navigation', () => {
    // Chips sit on a flex row that lays out right-to-left under `dir="rtl"`,
    // and the chip host is a custom element rather than a native control, so
    // the browser does no arrow flipping for us. ArrowLeft/ArrowRight used to
    // map to previous/next unconditionally, which moved focus the wrong way in
    // an RTL locale. Home/End stay logical — CDK's ListKeyManager does not flip
    // them either — and so does the caret test (`selectionStart === 0` is the
    // logical start of the text in both directions).
    function provideRtl(): void {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: Directionality,
            useValue: {
              value: 'rtl',
              valueSignal: signal<Direction>('rtl'),
              change: new Subject<Direction>(),
            },
          },
        ],
      });
    }

    it('ArrowLeft moves focus from one chip to the NEXT under rtl', () => {
      provideRtl();
      const fixture = mountBare(['a', 'b', 'c']);
      key(removeButtons(fixture)[0], 'ArrowLeft');
      fixture.detectChanges();
      // LTR would stay put (index 0 has no previous chip); RTL advances.
      expect(document.activeElement).toBe(removeButtons(fixture)[1]);
    });

    it('ArrowRight moves focus from one chip to the PREVIOUS under rtl', () => {
      provideRtl();
      const fixture = mountBare(['a', 'b', 'c']);
      key(removeButtons(fixture)[1], 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(removeButtons(fixture)[0]);
    });

    it('ArrowLeft past the last chip returns focus to the input under rtl', () => {
      provideRtl();
      const fixture = mountBare(['a']);
      key(removeButtons(fixture)[0], 'ArrowLeft');
      fixture.detectChanges();
      expect(document.activeElement).toBe(input(fixture));
    });

    it('ArrowRight from the start of the input focuses the last chip under rtl', () => {
      provideRtl();
      const fixture = mountBare(['a', 'b']);
      const el = input(fixture);
      el.focus();
      el.setSelectionRange(0, 0);
      key(el, 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(removeButtons(fixture)[1]);
    });

    it('does not step out of the input on ArrowLeft under rtl', () => {
      provideRtl();
      const fixture = mountBare(['a', 'b']);
      const el = input(fixture);
      el.focus();
      el.setSelectionRange(0, 0);
      key(el, 'ArrowLeft');
      fixture.detectChanges();
      // LTR's step-out key must not fire in RTL — the caret keeps moving inside
      // the text field instead.
      expect(document.activeElement).toBe(el);
    });

    it('keeps Home / End logical under rtl', () => {
      provideRtl();
      const fixture = mountBare(['a', 'b', 'c']);
      key(removeButtons(fixture)[2], 'Home');
      fixture.detectChanges();
      expect(document.activeElement).toBe(removeButtons(fixture)[0]);

      key(removeButtons(fixture)[0], 'End');
      fixture.detectChanges();
      expect(document.activeElement).toBe(input(fixture));
    });
  });

  // ── Paste ──

  describe('Paste', () => {
    function paste(fixture: ComponentFixture<unknown>, text: string): void {
      // jsdom lacks DataTransfer/ClipboardEvent.clipboardData; mock the surface
      // the component reads (`event.clipboardData?.getData('text')`).
      const ev = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'clipboardData', { value: { getData: () => text } });
      input(fixture).dispatchEvent(ev);
      fixture.detectChanges();
    }

    it('splits pasted text on separators into multiple tags', () => {
      const fixture = mountBare();
      paste(fixture, 'one,two,three');
      expect(chipLabels(fixture)).toEqual(['one', 'two', 'three']);
    });

    it('preserves interior whitespace within a tag', () => {
      const fixture = mountBare();
      paste(fixture, 'New York,Boston');
      expect(chipLabels(fixture)).toEqual(['New York', 'Boston']);
    });

    it('skips empty pieces from doubled / trailing separators', () => {
      const fixture = mountBare();
      paste(fixture, 'foo,,bar,');
      expect(chipLabels(fixture)).toEqual(['foo', 'bar']);
    });

    it('commits pieces up to max and blocks the rest', () => {
      const fixture = mountBare();
      fixture.componentRef.setInput('maxTags', 2);
      fixture.detectChanges();
      paste(fixture, 'a,b,c,d');
      expect(chipLabels(fixture)).toEqual(['a', 'b']);
    });
  });

  // ── Accessibility ──

  describe('Accessibility', () => {
    it('names each remove button "Remove {label}"', () => {
      const fixture = mountBare(['apple']);
      expect(removeButtons(fixture)[0].getAttribute('aria-label')).toBe('Remove apple');
    });

    it('keeps a single tab stop: input tabbable by default, chips not', () => {
      const fixture = mountBare(['a', 'b']);
      expect(input(fixture).getAttribute('tabindex')).toBe('0');
      for (const b of removeButtons(fixture)) {
        expect(b.getAttribute('tabindex')).toBe('-1');
      }
    });

    it('moves the roving tabindex onto a chip when it is active', () => {
      const fixture = mountBare(['a', 'b']);
      key(removeButtons(fixture)[1], 'Home'); // focus first chip
      fixture.detectChanges();
      const buttons = removeButtons(fixture);
      expect(buttons[0].getAttribute('tabindex')).toBe('0');
      expect(input(fixture).getAttribute('tabindex')).toBe('-1');
    });

    // `aria-invalid` lives on the inner text input, never on the `role="group"`
    // host — ARIA 1.2 does not allow it there and axe flags it as critical.
    // The negative assertion is the load-bearing half: it is what stops the
    // disallowed host attribute from being reintroduced.
    it('sets aria-invalid on the inner input, not on the group host', () => {
      const fixture = mount(ReactiveHost);
      const host = fixture.nativeElement.querySelector('tw-tags-input') as HTMLElement;
      fixture.componentInstance.control.setValidators(() => ({ required: true }));
      fixture.componentInstance.control.updateValueAndValidity();
      fixture.componentInstance.control.markAsTouched();
      fixture.detectChanges();
      expect(input(fixture).getAttribute('aria-invalid')).toBe('true');
      expect(host.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  // ── LiveAnnouncer ──

  describe('LiveAnnouncer', () => {
    it('announces additions and removals', () => {
      const fixture = mountBare();
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');
      type(fixture, 'apple');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledWith('apple added', 'polite');
      removeButtons(fixture)[0].click();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledWith('apple removed', 'polite');
    });

    it('announces when max is reached (assertive)', () => {
      const fixture = mountBare(['a']);
      fixture.componentRef.setInput('maxTags', 1);
      fixture.detectChanges();
      const spy = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce');
      type(fixture, 'b');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledWith('Maximum 1 tags reached', 'assertive');
    });
  });

  // ── ControlValueAccessor / forms ──

  describe('ControlValueAccessor', () => {
    it('writeValue renders chips without emitting', () => {
      const fixture = mountBare();
      const changed = vi.fn();
      fixture.componentInstance.valueChange.subscribe(changed);
      fixture.componentInstance.writeValue(['a', 'b']);
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['a', 'b']);
      expect(changed).not.toHaveBeenCalled();
    });

    it('round-trips through a reactive FormControl', () => {
      const fixture = mount(ReactiveHost);
      const host = fixture.componentInstance;
      // model → view
      host.control.setValue(['x']);
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['x']);
      // view → model
      type(fixture, 'y');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(host.control.value).toEqual(['x', 'y']);
    });

    it('setDisabledState disables via reactive forms', () => {
      const fixture = mount(ReactiveHost);
      fixture.componentInstance.control.disable();
      fixture.detectChanges();
      expect(input(fixture).disabled).toBe(true);
    });

    it('round-trips through ngModel', async () => {
      const fixture = mount(TemplateDrivenHost);
      type(fixture, 'tag1');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.value).toEqual(['tag1']);
    });

    it('round-trips through a signal form', async () => {
      const fixture = mount(SignalFormHost);
      type(fixture, 'sig');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.tagsForm().value().labels).toEqual(['sig']);
    });
  });

  // ── Form-field integration ──

  describe('Form-field integration', () => {
    it('reports empty only when there are no chips and the input is blank', () => {
      const fixture = mountBare();
      expect(fixture.componentInstance.empty()).toBe(true);
      fixture.componentInstance.writeValue(['a']);
      fixture.detectChanges();
      expect(fixture.componentInstance.empty()).toBe(false);
    });

    it('reports non-empty while text is being typed (no chips yet)', () => {
      const fixture = mountBare();
      type(fixture, 'partial');
      expect(fixture.componentInstance.empty()).toBe(false);
    });

    it('renders inside a tw-form-field and strips its own border', () => {
      const fixture = mount(FormFieldHost);
      const host = fixture.nativeElement.querySelector('tw-tags-input') as HTMLElement;
      expect(host.className).not.toContain('border-border');
    });
  });

  // ── Accessible name on the focusable input ──

  describe('Accessible name', () => {
    it('mirrors aria-label onto the focusable input', () => {
      const fixture = mountBare();
      // mountBare sets aria-label="Tags"; assert it lands on the <input>, not the host group.
      expect(input(fixture).getAttribute('aria-label')).toBe('Tags');
    });

    it('resolves aria-labelledby on the input from a projected form-field label', async () => {
      const fixture = mount(FormFieldHost);
      await fixture.whenStable();
      // Flush the form-field's pushed labelledby id into the input's attr binding.
      fixture.detectChanges();
      const labelEl = fixture.nativeElement.querySelector('label[twLabel]') as HTMLElement;
      const labelledBy = input(fixture).getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(labelledBy).toContain(labelEl.id);
    });
  });

  // ── Disabled blocks emission ──

  describe('Disabled', () => {
    it('blocks commit and removal and emits nothing while disabled', () => {
      const fixture = mountBare(['a']);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const added = vi.fn();
      const removed = vi.fn();
      const changed = vi.fn();
      fixture.componentInstance.tagAdded.subscribe(added);
      fixture.componentInstance.tagRemoved.subscribe(removed);
      fixture.componentInstance.valueChange.subscribe(changed);
      // Typing + Enter must not commit.
      type(fixture, 'b');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      // Clicking the remove button must not remove.
      removeButtons(fixture)[0].click();
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['a']);
      expect(added).not.toHaveBeenCalled();
      expect(removed).not.toHaveBeenCalled();
      expect(changed).not.toHaveBeenCalled();
    });
  });

  // ── Focus indicator ──

  describe('Focus indicator', () => {
    it('renders the canonical focus-visible outline on remove buttons', () => {
      const fixture = mountBare(['a']);
      expect(removeButtons(fixture)[0].className).toContain('focus-visible:outline-2');
    });
  });

  describe('FocusMonitor', () => {
    const focusMonitorSpy = {
      monitor: vi.fn(),
      stopMonitoring: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
      TestBed.configureTestingModule({
        providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
      });
    });

    it('monitors the host on init', () => {
      mountBare();
      expect(focusMonitorSpy.monitor).toHaveBeenCalled();
    });

    it('stops monitoring on destroy', () => {
      const fixture = mountBare();
      fixture.destroy();
      expect(focusMonitorSpy.stopMonitoring).toHaveBeenCalled();
    });
  });

  // ── addOnBlur ──

  describe('addOnBlur', () => {
    let origin$: Subject<unknown>;

    beforeEach(() => {
      origin$ = new Subject<unknown>();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: FocusMonitor,
            useValue: { monitor: vi.fn(() => origin$), stopMonitoring: vi.fn() },
          },
        ],
      });
    });

    it('commits the in-progress text when the control loses focus', () => {
      const fixture = mountBare();
      fixture.componentRef.setInput('addOnBlur', true);
      fixture.detectChanges();
      // Focus the control first so the blur branch (wasFocused && !origin) fires.
      origin$.next('program');
      type(fixture, 'pear');
      origin$.next(null);
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['pear']);
    });

    it('does not commit on blur when addOnBlur is false', () => {
      const fixture = mountBare();
      origin$.next('program');
      type(fixture, 'pear');
      origin$.next(null);
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual([]);
    });
  });

  // ── Accessor inputs (object tags) ──

  describe('Accessor inputs', () => {
    interface Person {
      name: string;
    }

    function mountPeople(): ComponentFixture<TagsInputComponent<Person>> {
      const fixture = TestBed.createComponent(TagsInputComponent) as unknown as ComponentFixture<
        TagsInputComponent<Person>
      >;
      fixture.componentRef.setInput('aria-label', 'People');
      fixture.componentRef.setInput('createTag', (text: string): Person => ({ name: text }));
      fixture.componentRef.setInput('tagLabel', (t: Person) => t.name);
      fixture.componentRef.setInput(
        'compareWith',
        (a: Person, b: Person) => a.name === b.name,
      );
      document.body.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      mounted.push(fixture);
      return fixture;
    }

    it('builds object tags via createTag, labels via tagLabel, dedupes via compareWith', () => {
      const fixture = mountPeople();
      type(fixture, 'Ada');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      type(fixture, 'Grace');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['Ada', 'Grace']);
      // A name-equal duplicate is dropped (compareWith matches on name).
      type(fixture, 'Ada');
      key(input(fixture), 'Enter');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['Ada', 'Grace']);
    });
  });

  // ── separatorKeys ──

  describe('separatorKeys', () => {
    it('commits on a custom separator and no longer on the default comma', () => {
      const fixture = mountBare();
      fixture.componentRef.setInput('separatorKeys', [';']);
      fixture.detectChanges();
      // Semicolon commits.
      type(fixture, 'one');
      const semi = key(input(fixture), ';');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['one']);
      expect(semi.defaultPrevented).toBe(true);
      // Comma no longer commits and is not swallowed.
      type(fixture, 'two');
      const comma = key(input(fixture), ',');
      fixture.detectChanges();
      expect(chipLabels(fixture)).toEqual(['one']);
      expect(comma.defaultPrevented).toBe(false);
    });
  });

  // ── name attribute ──

  describe('name attribute', () => {
    it('mirrors the name input onto the rendered input', () => {
      const fixture = mountBare();
      fixture.componentRef.setInput('name', 'tags');
      fixture.detectChanges();
      expect(input(fixture).getAttribute('name')).toBe('tags');
    });
  });
});
