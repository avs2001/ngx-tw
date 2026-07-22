import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Keyboard-driven modal search surface that filters a flat or grouped command list and runs the chosen action — the ⌘K launcher pattern from VS Code, Linear, and Raycast.',
  whenToUse: [
    'A global ⌘K / Ctrl+K launcher reaching actions from anywhere in the app',
    'The action set is large enough that type-ahead filtering beats scanning a list',
    'Power users should navigate or jump to a record without touching the mouse',
    'Commands span several groups (navigation, editing, settings) and need section headers plus shortcut hints',
    'The result list is fetched or scored remotely via a custom `filterFn`',
  ],
  whenNotToUse: [
    { instead: 'menu', because: 'the action set is short and anchored to the button that was clicked' },
    { instead: 'select', because: 'the user is picking a value that writes to a form control rather than running a callback' },
    { instead: 'combobox', because: 'the typed search belongs inline in a form field rather than in a modal overlay' },
    { instead: 'dialog', because: 'the surface holds a form or confirmation that does not fit the one-action-per-row model' },
  ],
  related: ['menu', 'dialog', 'select', 'combobox', 'icon'],
  aliases: ['cmdk', 'cmd+k', 'command k', 'command menu', 'spotlight', 'launcher', 'quick open', 'omnibox', 'action search', 'fuzzy finder'],
} satisfies ComponentMeta;
