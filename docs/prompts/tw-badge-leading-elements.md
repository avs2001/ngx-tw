# Prompt: Refactor `BadgeComponent` to support leading avatar and icon elements

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, especially content projection fallback, `contentChild()` usage, icon sizing scale, spacing scale, and the Visual Design System section
- `projects/ngx-tw/badge/badge.ts` — current badge implementation (the file you will modify)
- `projects/ngx-tw/badge/badge.spec.ts` — existing tests (must continue to pass)
- `projects/ngx-tw/alert/alert.ts` — reference for `contentChild()` detection pattern with directives
- `projects/ngx-tw/avatar/avatar.ts` — `AvatarComponent` API, selector `tw-avatar`, size variants (xs=`size-6`, sm=`size-8`, md=`size-10`, lg=`size-12`, xl=`size-16`)
- `projects/ngx-tw/icon/icon.ts` — `IconComponent` API, selector `tw-icon`, size variants (xs=`size-3`, sm=`size-4`, md=`size-5`, lg=`size-6`, xl=`size-8`)

## What to build

Refactor the existing `BadgeComponent` to accept a **leading element** — either a `tw-avatar` or a `tw-icon` — via content projection. The leading element is automatically sized to fit the badge's current size. No new inputs are added; detection is purely structural via `contentChild()` queries.

This is an additive refactor. All existing API, behavior, and tests must remain intact.

## API design

### Inputs

No new inputs. The existing API (`color`, `variant`, `size`, `pill`, `dismissible`, `dot`, `dismissed`) is unchanged.

### Content projection

Add a leading slot before the text content that accepts `tw-avatar` or `tw-icon`:

- `ng-content select="tw-avatar"` — projected avatar, rendered inside a size-constraining wrapper
- `ng-content select="tw-icon"` — projected icon, rendered inside a size-constraining wrapper
- Only one leading element is expected. If both are projected, both render (avatar first, icon second) — but document that only one is intended.

Detection via `contentChild()`:
- `contentChild(AvatarComponent)` — returns the projected avatar or `undefined`
- `contentChild(IconComponent)` — returns the projected icon or `undefined`

Derive `hasLeadingAvatar` and `hasLeadingIcon` as `computed()` booleans from these queries.

## Usage examples

```html
<!-- Simple badge (unchanged) -->
<span twBadge>Default</span>

<!-- Badge with leading icon -->
<span twBadge color="error" variant="soft">
  <tw-icon name="alert-circle" />
  Critical
</span>

<!-- Badge with leading avatar -->
<span twBadge color="primary" variant="outline" size="lg">
  <tw-avatar src="/avatars/jane.jpg" alt="Jane" />
  Jane Doe
</span>

<!-- Badge with avatar, pill, and dismiss -->
<span twBadge color="info" pill [dismissible]="true" (dismissed)="remove()">
  <tw-avatar initials="JD" color="info" />
  John Doe
</span>

<!-- Small badge with icon -->
<span twBadge size="xs" color="success" variant="solid">
  <tw-icon name="check" />
  Verified
</span>
```

## Styling

### New `leading` slot in `tv()` config

Add a `leading` slot to `badgeVariants`. This slot styles the wrapper `<span>` around the projected avatar or icon. Base classes: `inline-flex items-center justify-center shrink-0`.

Size variants for the `leading` slot define the wrapper dimensions that constrain the projected child:

| Badge size | Avatar wrapper | Icon wrapper |
|---|---|---|
| `xs` | `size-4` (16px) | `size-3` (12px) |
| `sm` | `size-4` (16px) | `size-3` (12px) |
| `md` | `size-5` (20px) | `size-3.5` (14px) |
| `lg` | `size-5` (20px) | `size-4` (16px) |
| `xl` | `size-6` (24px) | `size-4` (16px) |

Since avatar and icon need different sizes in the same slot, handle this with **two separate slots**: `leadingAvatar` and `leadingIcon`.

`leadingAvatar` base: `inline-flex shrink-0 rounded-full overflow-hidden`. Size variants apply the avatar wrapper sizes from the table above. Additionally, use `[&>tw-avatar]:size-full` to force the avatar to fill its wrapper.

`leadingIcon` base: `inline-flex shrink-0`. Size variants apply the icon wrapper sizes. Use `[&>tw-icon]:size-full` to force the icon to fill its wrapper.

### Root padding adjustment when avatar is present

When a leading avatar is detected, reduce left padding on the root to make the avatar sit closer to the badge edge. Use a `hasAvatar` variant (boolean) on the `tv()` config:

| Badge size | Normal left padding | With avatar left padding |
|---|---|---|
| `xs` | `px-1.5` | `pl-0.5` |
| `sm` | `px-2` | `pl-1` |
| `md` | `px-2` | `pl-1` |
| `lg` | `px-3` | `pl-1.5` |
| `xl` | `px-3` | `pl-1.5` |

Implement via `compoundVariants` combining `hasAvatar: true` with each `size`. Only override `pl-*` — right padding stays the same (handled by `twMerge`).

When a leading icon is present (no avatar), no padding adjustment is needed — the icon participates in the normal gap flow.

### Wiring

- Add `hasAvatar` as a boolean variant in `tv()` variants (default `false`).
- Pass `hasAvatar: !!this.avatarChild()` into the `badgeVariants()` call.
- Compute `leadingAvatarClasses` and `leadingIconClasses` from `variantResult`.

## Accessibility

No changes to ARIA. The badge retains `role="status"`. The avatar and icon bring their own ARIA attributes (`aria-label`, `aria-hidden`). No additional ARIA needed on the leading wrapper — it is decorative structure.

## Implementation notes

- Import `AvatarComponent` from `ngx-tw/avatar` and `IconComponent` from `ngx-tw/icon` for the `contentChild()` queries. These are type-only references for the query — they do NOT need to be in the `imports` array since the consumer projects them.
- The template should wrap each `ng-content select` in a conditional `@if` block gated by the corresponding `contentChild()` signal. This avoids rendering empty wrapper spans when no leading element is projected.
- Template structure (non-dot mode): leading avatar wrapper (if present) -> leading icon wrapper (if present and no avatar) -> content span with default `ng-content` -> dismiss button (if dismissible).
- The `dot` mode is unchanged — when `dot()` is true, no leading element renders.
- The `[&>tw-avatar]:size-full` and `[&>tw-icon]:size-full` child selectors on the wrapper spans force the projected components to fill the wrapper dimensions, overriding their own size classes. This works because `twMerge` is not involved here — these are parent-applied child selectors that win by specificity.

## File structure

Modified files only (this is a refactor, not a new entry point):

- `projects/ngx-tw/badge/badge.ts` — add `contentChild()` queries, new tv() slots, template changes
- `projects/ngx-tw/badge/badge.spec.ts` — add new test cases for leading avatar and leading icon

No changes to `index.ts`, `ng-package.json`, or `public-api.ts`.

### New tests to add in `badge.spec.ts`

Add test host components that project `tw-avatar` and `tw-icon` into the badge. Since these are real components, import `AvatarComponent` and `IconComponent` in the test hosts.

**Test coverage to add:**

- Leading icon renders inside the badge when projected
- Leading avatar renders inside the badge when projected
- Avatar wrapper has `rounded-full overflow-hidden` classes
- Leading element does not render when `dot()` is true
- Each badge size (xs-xl) renders without errors when a leading icon is projected
- Each badge size (xs-xl) renders without errors when a leading avatar is projected
- Left padding is reduced when avatar is present (check that root classes contain the reduced `pl-*` value)
- Badge with leading icon, dismissible, and content all render together
- Badge with leading avatar, pill, and dismiss all render together

All existing tests must continue to pass unchanged.

## Constraints

- No new inputs — detection is purely via `contentChild()`.
- Do not modify `AvatarComponent` or `IconComponent`.
- All styling via Tailwind utilities in `tv()` slots — no CSS files.
- Use semantic color tokens only.
- Use `computed()` for derived state (not `linkedSignal()` — these are read-only derivations).
- `ChangeDetection.OnPush` remains.
- Do not use `fakeAsync` or `tick` in tests.
- Do not use `@angular/animations`.
