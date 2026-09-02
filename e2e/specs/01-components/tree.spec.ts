import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/base';

test.describe.configure({ mode: 'parallel' });

/**
 * Tree (CDK `cdk-tree`, children-accessor model) interaction + a11y suite.
 *
 * `tree` is a keyboard state machine and had no dedicated e2e spec — the
 * generic smoke/axe sweeps only load the page. What needs a real browser:
 *
 *   - **Row activation identity.** `tree.ts` binds CDK's `(activation)` output
 *     to `toggleSelection(node)` where `node` comes from the `*cdkTreeNodeDef`
 *     template context, not from `$event`. That argument is glue: a binding
 *     that resolved the wrong closure would select the wrong row. Every test
 *     below that presses Enter therefore does it on a MIDDLE row and asserts
 *     *which* row ended up selected — a first-row assertion would pass against
 *     a hard-coded index.
 *   - **Roving tabindex.** CDK's TreeKeyManager moves `tabindex="0"` between
 *     rows on focus/arrow keys. jsdom has no real focus ring or tab order, so
 *     "exactly one row is tabbable" is only meaningful here.
 *   - **Enter must reach the row, not the inner control.** The demo's node
 *     template puts `(click)="toggleSelection()"` on an inner `tabindex="-1"`
 *     button — the template-context closure, a *different* path from the CDK
 *     output. Keyboard tests go through the row so they exercise the binding
 *     rather than the closure.
 *
 * Branches are opened here by clicking their chevron, the way a user would,
 * rather than relying on the demo's seeded `[expandedKeys]`. `expandBranch` is
 * a no-op when the branch already starts open, so the spec asserts the same
 * behaviour either way and does not double as a test of the seeding path (that
 * one lives in `tree.spec.ts`, where it belongs).
 */
test.describe('Tree', () => {
  const EXAMPLES = '/components/tree/examples';

  const section = (page: Page, heading: string): Locator =>
    page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: heading, level: 2 }) });

  /** The single-select docs tree. */
  const docsTree = (page: Page): Locator =>
    section(page, 'Single Selection').getByRole('tree');

  /**
   * A row by its exact label. `hasText` with a RegExp matches raw text content —
   * it does NOT trim — and some demo node templates wrap the label in a button
   * across several lines, so the row's text content carries surrounding
   * whitespace. Anchor with `\s*` rather than dropping the anchors, which would
   * make `Members` match `View members` too.
   */
  const row = (tree: Locator, name: string): Locator =>
    tree.getByRole('treeitem').filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) });

  /** Opens a branch row via its chevron; no-op if it is already open. */
  async function expandBranch(tree: Locator, name: string): Promise<Locator> {
    const branch = row(tree, name);
    await expect(branch).toHaveAttribute('aria-expanded', /true|false/);
    if ((await branch.getAttribute('aria-expanded')) === 'false') {
      await branch.getByRole('button', { name: 'Expand' }).click();
    }
    await expect(branch).toHaveAttribute('aria-expanded', 'true');
    return branch;
  }

  test('@a11y rows expose treeitem semantics with level, position and expansion', async ({
    page,
  }) => {
    await page.goto(EXAMPLES);
    const tree = docsTree(page);
    await expect(tree).toHaveAttribute('role', 'tree');
    await expandBranch(tree, 'Guides');

    // Roots are level 1; children of an expanded branch are level 2.
    await expect(row(tree, 'Introduction')).toHaveAttribute('aria-level', '1');
    await expect(row(tree, 'Guides')).toHaveAttribute('aria-level', '1');
    await expect(row(tree, 'Theming')).toHaveAttribute('aria-level', '2');

    // Leaves must not carry aria-expanded at all.
    await expect(row(tree, 'Theming')).not.toHaveAttribute('aria-expanded', /.*/);

    // Set size / position in set describe the sibling group, not the flat list.
    await expect(row(tree, 'Introduction')).toHaveAttribute('aria-setsize', '3');
    await expect(row(tree, 'Theming')).toHaveAttribute('aria-setsize', '3');
    await expect(row(tree, 'Theming')).toHaveAttribute('aria-posinset', '2');
  });

  test('@interaction Enter on a middle row selects THAT row', async ({ page }) => {
    await page.goto(EXAMPLES);
    const tree = docsTree(page);
    const singleSection = section(page, 'Single Selection');
    await expect(singleSection.getByText('active = null')).toBeVisible();
    await expandBranch(tree, 'Guides');

    // "Theming" sits in the middle of the visible rows and inside a branch —
    // neither first nor last, so a wrong-closure binding cannot coincidentally
    // land on it.
    const theming = row(tree, 'Theming');
    await theming.press('Enter');

    await expect(singleSection.getByText('active = Theming')).toBeVisible();
    await expect(theming).toHaveAttribute('aria-selected', 'true');
    // Nothing else moved.
    await expect(row(tree, 'Introduction')).toHaveAttribute('aria-selected', 'false');
    await expect(row(tree, 'Installation')).toHaveAttribute('aria-selected', 'false');
    await expect(row(tree, 'Forms')).toHaveAttribute('aria-selected', 'false');
  });

  test('@interaction Space activates the focused row, and single mode is scalar', async ({
    page,
  }) => {
    await page.goto(EXAMPLES);
    const tree = docsTree(page);
    const singleSection = section(page, 'Single Selection');
    await expandBranch(tree, 'Guides');

    await row(tree, 'Theming').press('Space');
    await expect(singleSection.getByText('active = Theming')).toBeVisible();

    // Selecting a different row replaces the previous one rather than adding.
    await row(tree, 'Introduction').press('Space');
    await expect(singleSection.getByText('active = Introduction')).toBeVisible();
    await expect(row(tree, 'Theming')).toHaveAttribute('aria-selected', 'false');
    await expect(row(tree, 'Introduction')).toHaveAttribute('aria-selected', 'true');
  });

  test('@a11y exactly one row is tabbable, and arrow keys move it', async ({ page }) => {
    await page.goto(EXAMPLES);
    const tree = docsTree(page);
    const tabbable = tree.locator('[role="treeitem"][tabindex="0"]');

    await row(tree, 'Introduction').focus();
    await expect(tabbable).toHaveCount(1);
    await expect(tabbable).toHaveText(/Introduction/);

    await page.keyboard.press('ArrowDown');
    await expect(row(tree, 'Guides')).toBeFocused();
    await expect(tabbable).toHaveCount(1);
    await expect(tabbable).toHaveText(/Guides/);

    await page.keyboard.press('ArrowUp');
    await expect(row(tree, 'Introduction')).toBeFocused();
    await expect(tabbable).toHaveCount(1);
  });

  test('@interaction ArrowRight expands a collapsed branch and ArrowLeft collapses it', async ({
    page,
  }) => {
    await page.goto(EXAMPLES);
    // The controlled-expansion tree drives `[(expandedKeys)]` from a signal and
    // prints it, so the keyboard path is asserted through the bound model and
    // not only through the DOM.
    const controlledSection = section(page, 'Controlled Expansion');
    const controlled = controlledSection.getByRole('tree');
    await expandBranch(controlled, 'src');

    const app = row(controlled, 'app');
    await expect(controlledSection.getByText('open = [src]')).toBeVisible();
    await expect(app).toHaveAttribute('aria-expanded', 'false');
    await expect(row(controlled, 'app.routes.ts')).toHaveCount(0);

    await app.press('ArrowRight');
    await expect(app).toHaveAttribute('aria-expanded', 'true');
    await expect(row(controlled, 'app.routes.ts')).toHaveCount(1);
    await expect(controlledSection.getByText('open = [src, app]')).toBeVisible();

    await app.press('ArrowLeft');
    await expect(app).toHaveAttribute('aria-expanded', 'false');
    await expect(row(controlled, 'app.routes.ts')).toHaveCount(0);
    await expect(controlledSection.getByText('open = [src]')).toBeVisible();
  });

  test('@a11y cascade selection reports the tri-state via aria-checked on the row', async ({
    page,
  }) => {
    await page.goto(EXAMPLES);
    const permissions = section(page, 'Multiple Selection & Cascade');
    const tree = permissions.getByRole('tree');
    const members = await expandBranch(tree, 'Members');
    const viewMembers = row(tree, 'View members');
    const inviteMembers = row(tree, 'Invite members');

    // Multiple mode exposes selection through aria-checked, never aria-selected.
    await expect(members).toHaveAttribute('aria-checked', 'false');
    await expect(members).not.toHaveAttribute('aria-selected', /.*/);

    // One leaf of three → the branch is partially selected.
    await viewMembers.press('Enter');
    await expect(viewMembers).toHaveAttribute('aria-checked', 'true');
    await expect(inviteMembers).toHaveAttribute('aria-checked', 'false');
    await expect(members).toHaveAttribute('aria-checked', 'mixed');
    await expect(permissions.getByText('granted = 1 node(s)')).toBeVisible();

    // Activating the partially-selected branch cascades to every leaf under it:
    // 3 leaves + the branch itself are reported as checked.
    await members.press('Enter');
    await expect(members).toHaveAttribute('aria-checked', 'true');
    await expect(inviteMembers).toHaveAttribute('aria-checked', 'true');
    await expect(permissions.getByText('granted = 4 node(s)')).toBeVisible();

    // The sibling branch is untouched — cascade must not leak sideways.
    await expect(row(tree, 'Billing')).toHaveAttribute('aria-checked', 'false');
  });
});
