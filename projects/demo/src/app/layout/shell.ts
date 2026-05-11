import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from 'ngx-tw/theme';

interface NavItem {
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

interface ColorPreset {
  name: string;
  key: string;
  /** CSS color used for the swatch dot in the preset dropdown. */
  swatch: string;
}

const NAV: NavGroup[] = [
  {
    category: 'Components',
    items: [
      { label: 'Accordion', children: [
        { label: 'Overview', path: '/components/accordion/overview' },
        { label: 'Examples', path: '/components/accordion/examples' },
        { label: 'API', path: '/components/accordion/api' },
      ]},
      { label: 'Alert', children: [
        { label: 'Overview', path: '/components/alert/overview' },
        { label: 'Examples', path: '/components/alert/examples' },
        { label: 'API', path: '/components/alert/api' },
      ]},
      { label: 'Avatar', children: [
        { label: 'Overview', path: '/components/avatar/overview' },
        { label: 'Examples', path: '/components/avatar/examples' },
        { label: 'API', path: '/components/avatar/api' },
      ]},
      { label: 'Badge', children: [
        { label: 'Overview', path: '/components/badge/overview' },
        { label: 'Examples', path: '/components/badge/examples' },
        { label: 'API', path: '/components/badge/api' },
      ]},
      { label: 'Button', children: [
        { label: 'Overview', path: '/components/button/overview' },
        { label: 'Examples', path: '/components/button/examples' },
        { label: 'API', path: '/components/button/api' },
      ]},
      { label: 'Calendar', children: [
        { label: 'Overview', path: '/components/calendar/overview' },
        { label: 'Examples', path: '/components/calendar/examples' },
        { label: 'API', path: '/components/calendar/api' },
      ]},
      { label: 'Card', children: [
        { label: 'Overview', path: '/components/card/overview' },
        { label: 'Examples', path: '/components/card/examples' },
        { label: 'API', path: '/components/card/api' },
      ]},
      { label: 'Checkbox', children: [
        { label: 'Overview', path: '/components/checkbox/overview' },
        { label: 'Examples', path: '/components/checkbox/examples' },
        { label: 'API', path: '/components/checkbox/api' },
      ]},
      { label: 'Code Block', children: [
        { label: 'Overview', path: '/components/code-block/overview' },
        { label: 'Examples', path: '/components/code-block/examples' },
        { label: 'API', path: '/components/code-block/api' },
      ]},
      { label: 'Collapsible', children: [
        { label: 'Overview', path: '/components/collapsible/overview' },
        { label: 'Examples', path: '/components/collapsible/examples' },
        { label: 'API', path: '/components/collapsible/api' },
      ]},
      { label: 'Command Palette', children: [
        { label: 'Overview', path: '/components/command-palette/overview' },
        { label: 'Examples', path: '/components/command-palette/examples' },
        { label: 'API', path: '/components/command-palette/api' },
      ]},
      { label: 'Date Picker', children: [
        { label: 'Overview', path: '/components/date-picker/overview' },
        { label: 'Examples', path: '/components/date-picker/examples' },
        { label: 'API', path: '/components/date-picker/api' },
      ]},
      { label: 'Date Range Picker', children: [
        { label: 'Overview', path: '/components/date-range-picker/overview' },
        { label: 'Examples', path: '/components/date-range-picker/examples' },
        { label: 'API', path: '/components/date-range-picker/api' },
      ]},
      { label: 'Dialog', children: [
        { label: 'Overview', path: '/components/dialog/overview' },
        { label: 'Examples', path: '/components/dialog/examples' },
        { label: 'API', path: '/components/dialog/api' },
      ]},
      { label: 'Flip Card', children: [
        { label: 'Overview', path: '/components/flip-card/overview' },
        { label: 'Examples', path: '/components/flip-card/examples' },
        { label: 'API', path: '/components/flip-card/api' },
      ]},
      { label: 'Form Field', children: [
        { label: 'Overview', path: '/components/form-field/overview' },
        { label: 'Examples', path: '/components/form-field/examples' },
        { label: 'API', path: '/components/form-field/api' },
      ]},
      { label: 'Icon', children: [
        { label: 'Overview', path: '/components/icon/overview' },
        { label: 'Examples', path: '/components/icon/examples' },
        { label: 'API', path: '/components/icon/api' },
      ]},
      { label: 'Input', children: [
        { label: 'Overview', path: '/components/input/overview' },
        { label: 'Examples', path: '/components/input/examples' },
        { label: 'API', path: '/components/input/api' },
      ]},
      { label: 'Item', children: [
        { label: 'Overview', path: '/components/item/overview' },
        { label: 'Examples', path: '/components/item/examples' },
        { label: 'API', path: '/components/item/api' },
      ]},
      { label: 'Menu', children: [
        { label: 'Overview', path: '/components/menu/overview' },
        { label: 'Examples', path: '/components/menu/examples' },
        { label: 'API', path: '/components/menu/api' },
      ]},
      { label: 'Paginator', children: [
        { label: 'Overview', path: '/components/paginator/overview' },
        { label: 'Examples', path: '/components/paginator/examples' },
        { label: 'API', path: '/components/paginator/api' },
      ]},
      { label: 'Popover', children: [
        { label: 'Overview', path: '/components/popover/overview' },
        { label: 'Examples', path: '/components/popover/examples' },
        { label: 'API', path: '/components/popover/api' },
      ]},
      { label: 'Progress Bar', children: [
        { label: 'Overview', path: '/components/progress-bar/overview' },
        { label: 'Examples', path: '/components/progress-bar/examples' },
        { label: 'API', path: '/components/progress-bar/api' },
      ]},
      { label: 'Radio', children: [
        { label: 'Overview', path: '/components/radio/overview' },
        { label: 'Examples', path: '/components/radio/examples' },
        { label: 'API', path: '/components/radio/api' },
      ]},
      { label: 'Segmented Control', children: [
        { label: 'Overview', path: '/components/segmented-control/overview' },
        { label: 'Examples', path: '/components/segmented-control/examples' },
        { label: 'API', path: '/components/segmented-control/api' },
      ]},
      { label: 'Select', children: [
        { label: 'Overview', path: '/components/select/overview' },
        { label: 'Examples', path: '/components/select/examples' },
        { label: 'API', path: '/components/select/api' },
      ]},
      { label: 'Separator', children: [
        { label: 'Overview', path: '/components/separator/overview' },
        { label: 'Examples', path: '/components/separator/examples' },
        { label: 'API', path: '/components/separator/api' },
      ]},
      { label: 'Skeleton', children: [
        { label: 'Overview', path: '/components/skeleton/overview' },
        { label: 'Examples', path: '/components/skeleton/examples' },
        { label: 'API', path: '/components/skeleton/api' },
      ]},
      { label: 'Slider', children: [
        { label: 'Overview', path: '/components/slider/overview' },
        { label: 'Examples', path: '/components/slider/examples' },
        { label: 'API', path: '/components/slider/api' },
      ]},
      { label: 'Sort', children: [
        { label: 'Overview', path: '/components/sort/overview' },
        { label: 'Examples', path: '/components/sort/examples' },
        { label: 'API', path: '/components/sort/api' },
      ]},
      { label: 'Spinner', children: [
        { label: 'Overview', path: '/components/spinner/overview' },
        { label: 'Examples', path: '/components/spinner/examples' },
        { label: 'API', path: '/components/spinner/api' },
      ]},
      { label: 'Split', children: [
        { label: 'Overview', path: '/components/split/overview' },
        { label: 'Examples', path: '/components/split/examples' },
        { label: 'API', path: '/components/split/api' },
      ]},
      { label: 'Stepper', children: [
        { label: 'Overview', path: '/components/stepper/overview' },
        { label: 'Examples', path: '/components/stepper/examples' },
        { label: 'API', path: '/components/stepper/api' },
      ]},
      { label: 'Switch', children: [
        { label: 'Overview', path: '/components/switch/overview' },
        { label: 'Examples', path: '/components/switch/examples' },
        { label: 'API', path: '/components/switch/api' },
      ]},
      { label: 'Tab Nav', children: [
        { label: 'Overview', path: '/components/tab-nav/overview' },
        { label: 'Examples', path: '/components/tab-nav/examples' },
        { label: 'API', path: '/components/tab-nav/api' },
      ]},
      { label: 'Table', children: [
        { label: 'Overview', path: '/components/table/overview' },
        { label: 'Examples', path: '/components/table/examples' },
        { label: 'API', path: '/components/table/api' },
      ]},
      { label: 'Tabs', children: [
        { label: 'Overview', path: '/components/tabs/overview' },
        { label: 'Examples', path: '/components/tabs/examples' },
        { label: 'API', path: '/components/tabs/api' },
      ]},
      { label: 'Time Picker', children: [
        { label: 'Overview', path: '/components/time-picker/overview' },
        { label: 'Examples', path: '/components/time-picker/examples' },
        { label: 'API', path: '/components/time-picker/api' },
      ]},
      { label: 'Toast', children: [
        { label: 'Overview', path: '/components/toast/overview' },
        { label: 'Examples', path: '/components/toast/examples' },
        { label: 'API', path: '/components/toast/api' },
      ]},
      { label: 'Tooltip', children: [
        { label: 'Overview', path: '/components/tooltip/overview' },
        { label: 'Examples', path: '/components/tooltip/examples' },
        { label: 'API', path: '/components/tooltip/api' },
      ]},
    ],
  },
  {
    category: 'Services',
    items: [
      { label: 'Theme', children: [
        { label: 'Overview', path: '/services/theme/overview' },
        { label: 'Examples', path: '/services/theme/examples' },
        { label: 'API', path: '/services/theme/api' },
      ]},
    ],
  },
];

const PRESETS: ColorPreset[] = [
  { name: 'Default',  key: 'default',  swatch: 'oklch(0.55 0.2 260)' },
  { name: 'Candy',    key: 'candy',    swatch: 'oklch(0.65 0.22 350)' },
  { name: 'Ocean',    key: 'ocean',    swatch: 'oklch(0.70 0.13 190)' },
  { name: 'Forest',   key: 'forest',   swatch: 'oklch(0.68 0.17 155)' },
  { name: 'Sunset',   key: 'sunset',   swatch: 'oklch(0.70 0.18 50)' },
];

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
  template: `
    <div class="flex h-screen bg-surface text-fg">
      <!-- ============== Sidebar ============== -->
      <aside aria-label="Sidebar" class="relative w-64 shrink-0 flex flex-col border-r border-border-muted bg-surface overflow-hidden">
        <!-- Atmospheric layers -->
        <div class="sh-bloom"></div>
        <div class="sh-dotgrid absolute inset-0 opacity-60 pointer-events-none z-0"></div>

        <!-- Content layer (staggered reveal on mount) -->
        <div class="relative z-10 flex flex-col h-full sh-stagger">
          <!-- Brand -->
          <div class="h-16 flex items-center gap-3 px-5 shrink-0">
            <span class="relative size-9 grid place-items-center group">
              <span class="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600
                           shadow-sm transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105"></span>
              <span class="absolute inset-[3px] rounded-lg bg-surface"></span>
              <span class="relative font-display text-primary-600 text-2xl leading-none translate-y-[1px] italic">n</span>
            </span>
            <div class="flex flex-col leading-tight min-w-0">
              <span class="font-display text-2xl text-fg tracking-tight">ngx-tw</span>
              <span class="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">component library</span>
            </div>
          </div>

          <!-- Search -->
          <div class="px-4 pt-1 pb-3 shrink-0">
            <div class="relative group">
              <svg class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-subtle
                          transition-colors duration-200 group-focus-within:text-primary-500"
                   viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/>
              </svg>
              <input
                #searchInput
                type="search"
                [value]="searchQuery()"
                (input)="onSearchInput($event)"
                (focus)="searchFocused.set(true)"
                (blur)="searchFocused.set(false)"
                placeholder="Search components"
                aria-label="Search components"
                class="w-full pl-9 pr-14 py-2 text-sm rounded-lg bg-surface-raised text-fg placeholder:text-fg-subtle
                       border border-border-muted
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
                       focus-visible:border-transparent
                       transition-[color,box-shadow,border-color] duration-200"
              />
              @if (!searchQuery() && !searchFocused()) {
                <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 sh-kbd">⌘K</span>
              }
              @if (searchQuery()) {
                <button
                  type="button"
                  (click)="clearSearch()"
                  aria-label="Clear search"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-fg-subtle
                         hover:text-fg hover:bg-surface-sunken transition-colors duration-200"
                >
                  <svg class="size-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M4.28 3.22a.75.75 0 00-1.06 1.06L8.94 10l-5.72 5.72a.75.75 0 101.06 1.06L10 11.06l5.72 5.72a.75.75 0 101.06-1.06L11.06 10l5.72-5.72a.75.75 0 00-1.06-1.06L10 8.94 4.28 3.22z" clip-rule="evenodd"/>
                  </svg>
                </button>
              }
            </div>
          </div>

          <!-- Navigation -->
          <nav aria-label="Components" class="flex-1 overflow-y-auto sh-scroll px-4 pb-6">
            @for (group of filteredNav(); track group.category) {
              <section class="mb-5">
                <div class="sh-rule flex items-center px-1 mb-2">
                  <p class="font-mono text-[10px] font-medium text-fg-subtle uppercase tracking-[0.18em]">
                    {{ group.category }}
                  </p>
                </div>
                <ul class="space-y-0.5">
                  @for (item of group.items; track item.label) {
                    <li>
                      @if (item.path) {
                        <a [routerLink]="item.path"
                           routerLinkActive="sh-active bg-surface-muted text-fg"
                           class="sh-nav-link flex items-center px-3 py-1.5 rounded-md text-sm text-fg-muted
                                  hover:text-fg hover:bg-surface-muted transition-colors duration-200">
                          {{ item.label }}
                        </a>
                      }
                      @if (item.children) {
                        <button
                          type="button"
                          (click)="toggleExpand(item.label)"
                          [attr.aria-expanded]="isItemExpanded(item.label)"
                          class="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm
                                 text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-200"
                        >
                          <span class="truncate">{{ item.label }}</span>
                          <svg class="size-3.5 shrink-0 text-fg-subtle transition-transform duration-300
                                      [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
                               [class.rotate-90]="isItemExpanded(item.label)"
                               viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                        <div class="sh-submenu"
                             [class.sh-submenu--open]="isItemExpanded(item.label)"
                             [attr.aria-hidden]="!isItemExpanded(item.label)">
                          <div>
                            <ul class="sh-nav-children mt-1 space-y-0.5 pb-1">
                              @for (child of item.children; track child.path) {
                                <li>
                                  <a [routerLink]="child.path"
                                     routerLinkActive="sh-active bg-surface-muted text-fg font-medium"
                                     class="sh-nav-link flex items-center px-3 py-1.5 rounded-md text-sm
                                            text-fg-muted hover:text-fg hover:bg-surface-muted
                                            transition-colors duration-200">
                                    {{ child.label }}
                                  </a>
                                </li>
                              }
                            </ul>
                          </div>
                        </div>
                      }
                    </li>
                  }
                </ul>
              </section>
            }
            @if (filteredNav().length === 0) {
              <div class="px-3 py-12 text-center">
                <p class="font-display italic text-fg-muted text-xl leading-tight">Nothing here.</p>
                <p class="text-xs text-fg-subtle mt-2">
                  No components match <span class="font-mono text-fg-muted">"{{ searchQuery() }}"</span>
                </p>
                <button
                  type="button"
                  (click)="clearSearch()"
                  class="mt-4 font-mono text-[11px] uppercase tracking-wider text-primary-600
                         hover:text-primary-700 transition-colors duration-200"
                >
                  Clear search →
                </button>
              </div>
            }
          </nav>

          <!-- Footer -->
          <div class="px-5 py-3 border-t border-border-muted flex items-center justify-between shrink-0">
            <a class="flex items-center gap-2 text-xs text-fg-subtle hover:text-fg transition-colors duration-200"
               href="https://github.com" target="_blank" rel="noopener">
              <svg class="size-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </a>
            <span class="inline-flex items-center gap-2">
              <span class="relative grid size-1.5 place-items-center">
                <span class="size-1.5 rounded-full bg-primary-500 sh-pulse-dot"></span>
              </span>
              <span class="font-mono text-[10px] text-fg-subtle tracking-wider">v0.0.1</span>
            </span>
          </div>
        </div>
      </aside>

      <!-- ============== Main area ============== -->
      <div class="flex-1 flex flex-col min-w-0 bg-surface">
        <!-- Header -->
        <header class="sticky top-0 z-30 h-14 shrink-0 flex items-center justify-end gap-3 px-6
                       border-b border-border-muted
                       bg-surface/75 backdrop-blur-md supports-[backdrop-filter]:bg-surface/65">
          <!-- Preset dropdown -->
          <div class="relative">
            <button
              type="button"
              (click)="presetMenuOpen.update(v => !v)"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-fg-muted
                     hover:text-fg hover:bg-surface-muted transition-colors duration-200"
              [attr.aria-expanded]="presetMenuOpen()"
              aria-haspopup="listbox"
            >
              <span class="size-3 rounded-full shrink-0 ring-1 ring-border-muted"
                    [style.background]="activePreset().swatch"></span>
              <span class="font-mono text-[11px] uppercase tracking-[0.12em]">{{ activePreset().name }}</span>
              <svg class="size-3.5 text-fg-subtle" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
              </svg>
            </button>

            @if (presetMenuOpen()) {
              <div class="fixed inset-0 z-10" (click)="presetMenuOpen.set(false)"></div>
              <div
                role="listbox"
                class="sh-popover-enter absolute right-0 top-full mt-2 w-44 bg-surface-raised
                       border border-border-muted rounded-xl shadow-md py-1.5 z-20"
              >
                <div class="px-3 pt-1 pb-2 border-b border-border-muted">
                  <p class="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">Theme preset</p>
                </div>
                @for (p of presets; track p.key) {
                  <button
                    type="button"
                    role="option"
                    [attr.aria-selected]="activePreset().key === p.key"
                    (click)="setPreset(p)"
                    class="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors duration-200"
                    [class.text-fg]="activePreset().key === p.key"
                    [class.bg-surface-muted]="activePreset().key === p.key"
                    [class.text-fg-muted]="activePreset().key !== p.key"
                    [class.hover:bg-surface-muted]="activePreset().key !== p.key"
                    [class.hover:text-fg]="activePreset().key !== p.key"
                  >
                    <span class="size-3 rounded-full ring-1 ring-border-muted shrink-0"
                          [style.background]="p.swatch"></span>
                    <span class="flex-1 text-left">{{ p.name }}</span>
                    @if (activePreset().key === p.key) {
                      <svg class="size-3.5 text-primary-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Theme mode toggle (sliding pill) -->
          <div class="sh-toggle" [attr.data-mode]="themeModeKey()">
            <div class="sh-toggle-thumb" aria-hidden="true"></div>
            <button
              type="button"
              (click)="themeService.setTheme('light')"
              class="relative z-10 size-7 grid place-items-center rounded-md transition-colors duration-200"
              [class.text-fg]="themeModeKey() === 'light'"
              [class.text-fg-subtle]="themeModeKey() !== 'light'"
              aria-label="Light mode"
            >
              <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z"/>
              </svg>
            </button>
            <button
              type="button"
              (click)="themeService.setTheme('dark')"
              class="relative z-10 size-7 grid place-items-center rounded-md transition-colors duration-200"
              [class.text-fg]="themeModeKey() === 'dark'"
              [class.text-fg-subtle]="themeModeKey() !== 'dark'"
              aria-label="Dark mode"
            >
              <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button
              type="button"
              (click)="themeService.setTheme('system')"
              class="relative z-10 size-7 grid place-items-center rounded-md transition-colors duration-200"
              [class.text-fg]="themeModeKey() === 'system'"
              [class.text-fg-subtle]="themeModeKey() !== 'system'"
              aria-label="System theme"
            >
              <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>

          <!-- Version badge -->
          <span class="inline-flex items-center gap-1.5 font-mono text-[11px] text-fg-muted
                       border border-border-muted rounded-md px-2 py-1">
            <span class="size-1.5 rounded-full bg-primary-500 sh-pulse-dot"></span>
            v0.0.1
          </span>

          <!-- GitHub -->
          <a href="https://github.com" target="_blank" rel="noopener"
             class="text-fg-muted hover:text-fg transition-colors duration-200"
             aria-label="GitHub repository">
            <svg class="size-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
        </header>

        <!-- Content -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Shell {
  protected readonly themeService = inject(ThemeService);
  protected readonly presets = PRESETS;

  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly presetMenuOpen = signal(false);
  protected readonly activePreset = signal<ColorPreset>(PRESETS[0]);
  protected readonly expanded = signal<Set<string>>(new Set());
  protected readonly searchQuery = signal('');
  protected readonly searchFocused = signal(false);

  protected readonly themeModeKey = computed<string>(() => {
    const t = this.themeService.theme();
    return t === 'system' ? 'system' : this.themeService.resolvedTheme();
  });

  protected readonly filteredNav = computed<NavGroup[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return NAV
      .map(group => ({
        category: group.category,
        items: [...group.items]
          .sort((a, b) => a.label.localeCompare(b.label))
          .filter(item => {
            if (!query) return true;
            if (item.label.toLowerCase().includes(query)) return true;
            return !!item.children?.some(c => c.label.toLowerCase().includes(query));
          }),
      }))
      .filter(group => group.items.length > 0);
  });

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    if (this.isBrowser) {
      const saved = localStorage.getItem('ngx-tw-preset');
      if (saved) {
        const found = PRESETS.find(p => p.key === saved);
        if (found) this.activePreset.set(found);
      }
    }

    effect(() => {
      const preset = this.activePreset();
      if (!this.isBrowser) return;
      const el = document.documentElement;
      if (preset.key === 'default') {
        el.removeAttribute('data-preset');
      } else {
        el.setAttribute('data-preset', preset.key);
      }
      localStorage.setItem('ngx-tw-preset', preset.key);
    });
  }

  protected setPreset(preset: ColorPreset): void {
    this.activePreset.set(preset);
    this.presetMenuOpen.set(false);
  }

  protected toggleExpand(label: string): void {
    this.expanded.update(set => {
      const next = new Set(set);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  protected isItemExpanded(label: string): boolean {
    return this.searchQuery().trim().length > 0 || this.expanded().has(label);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.searchInput().nativeElement.focus();
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    // ⌘K / Ctrl+K focuses the search
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput().nativeElement.focus();
      this.searchInput().nativeElement.select();
      return;
    }
    // Escape clears + blurs the search when focused
    if (event.key === 'Escape' && this.searchFocused()) {
      if (this.searchQuery()) {
        this.clearSearch();
      } else {
        this.searchInput().nativeElement.blur();
      }
    }
  }
}
