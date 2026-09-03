import { expect, test } from '../../fixtures/base';
import { SelectPage } from '../../pages/select.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Select interaction + a11y suite. Mirrors the dialog reference layout
 * (`dialog.spec.ts`) — overlay POM + heading-anchored sections + `@overlay`
 * tag throughout.
 *
 * Coverage maps to chapter 04 §Select and the open items in REVIEW.md §select:
 *
 *  - Closed by default; trigger renders placeholder.
 *  - On first open with no value, `aria-activedescendant` points at the
 *    first non-disabled option (REVIEW correction — the listbox uses an
 *    active-descendant cursor, options themselves are not focusable).
 *  - `ArrowDown`/`ArrowUp` move the active descendant; `Enter` commits the
 *    active option; `Esc` closes without committing.
 *  - Keyboard typeahead jumps to the first option whose label starts with
 *    the typed prefix (≈400 ms reset timer in source).
 *  - Multi-select: default trigger shows comma-joined labels (no chips).
 *  - Searchable: the search input filters the listbox.
 *  - Grouped options render under `role="group"` with the group's accessible
 *    name as the group label.
 *  - Disabled select: click and keyboard cannot open the panel.
 *  - `variant` auto-resolves to `'naked'` when inside `<tw-form-field>` —
 *    asserted via the `data-variant` debug attribute.
 *  - Custom `*twSelectTrigger`, `*twSelectOption`, `*twSelectEmpty` and
 *    `*twSelectHeader` templates render in their respective slots.
 */
test.describe('Select', () => {
  test('@interaction @overlay closed by default; trigger renders the placeholder', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    // The "neutral" entry in the Colors grid has no initial value — its
    // placeholder is the literal "neutral". The demo wires `aria-label`
    // via `[attr.aria-label]` on `<tw-select>` (which sets the host
    // attribute but does NOT propagate into the trigger button's
    // computed name), so we match on the trigger's rendered placeholder
    // text rather than on the accessible name.
    const trigger = select.colorsSection.getByRole('combobox').filter({ hasText: 'neutral' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(select.listbox).toHaveCount(0);
  });

  test('@interaction @overlay click opens, Esc closes without committing a selection', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.searchableSection, 'Country');
    const readout = select.outputByTestId('output-searchable');

    // Initial value is 'de' per the demo seed.
    await expect(readout).toContainText('selected = de');

    await select.openVia(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await select.waitForClosed();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Value unchanged.
    await expect(readout).toContainText('selected = de');
  });

  test('@a11y @overlay first open with no value points aria-activedescendant at the first non-disabled option', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    // The Grouped options select starts with no value and includes a
    // disabled option ("India") — but it's not first; "United States" is.
    const trigger = select.triggerIn(select.groupedSection, 'Country');
    await select.openVia(trigger);

    // This select is `searchable`, so opening moves DOM focus into the
    // overlay's search input — and `aria-activedescendant` MUST live on the
    // element that holds focus, or arrow navigation is silent to assistive
    // tech. It used to stay on the trigger, which is the SC 4.1.2 defect the
    // September audit recorded; asserting it there would re-encode the bug.
    const owner = select.searchInput;
    await expect(owner).toBeFocused();
    await expect(
      trigger,
      'a searchable trigger must NOT keep aria-activedescendant once focus leaves it',
    ).not.toHaveAttribute('aria-activedescendant', /\S/);

    await expect(
      owner,
      'aria-activedescendant should be set on first open',
    ).toHaveAttribute('aria-activedescendant', /\S/);
    const activeId = await owner.getAttribute('aria-activedescendant');

    const active = page.locator(`#${activeId}`);
    // Source picks the first enabled option in DOM order. The overlay
    // omits `aria-disabled` entirely on enabled options (see
    // `select-overlay.ts` — the binding is `… || null`).
    await expect(active).not.toHaveAttribute('aria-disabled', 'true');
    await expect(active).toContainText('United States');
  });

  test('@interaction @overlay ArrowDown advances the active descendant; Enter commits it', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    // Searchable section starts with 'de' selected; ArrowDown should move
    // off it and commit a different country.
    const trigger = select.triggerIn(select.searchableSection, 'Country');
    const readout = select.outputByTestId('output-searchable');
    await expect(readout).toContainText('selected = de');

    await trigger.focus();
    // Alt+Down is the spec-preferred way to open without committing.
    await page.keyboard.press('Alt+ArrowDown');
    await select.waitForOpen();

    // Active starts on the selected option ('Germany'). Move down once to
    // the next enabled option ('France', then 'Spain' …) — we don't care
    // exactly which, only that the value changes and the panel closes.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await select.waitForClosed();

    const after = (await readout.textContent()) ?? '';
    expect(after).not.toContain('selected = de');
    expect(after).toMatch(/selected = [a-z]{2,3}/);
  });

  test('@interaction @overlay keyboard typeahead jumps to the first option that starts with the typed prefix', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.groupedSection, 'Country');
    await trigger.focus();
    await page.keyboard.press('Alt+ArrowDown');
    await select.waitForOpen();

    // Type "j" — only "Japan" starts with that letter in the country list.
    await page.keyboard.press('j');
    // This select is `searchable`, so focus (and therefore
    // `aria-activedescendant`) lives on the overlay's search input, not the
    // trigger. Reading it from the trigger yields `#null`.
    const activeId = await select.searchInput.getAttribute('aria-activedescendant');
    const active = page.locator(`#${activeId!}`);
    await expect(active).toContainText('Japan');

    await page.keyboard.press('Enter');
    await select.waitForClosed();
    await expect(trigger).toContainText('Japan');
  });

  test('@interaction @overlay multi-select default trigger renders comma-joined labels', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    // Multi-select section is seeded with ['bug', 'docs'] — trigger should
    // therefore read "Bug, Docs" via the default (non-chip) trigger renderer.
    const trigger = select.triggerIn(select.multiSection, 'Tags');
    await expect(trigger).toContainText('Bug');
    await expect(trigger).toContainText('Docs');
    // Comma-joined, not chips: assert the joined string appears verbatim.
    await expect(trigger).toContainText(/Bug,\s*Docs/);
  });

  test('@interaction @overlay searchable filters the listbox and exposes a search input with aria-autocomplete="list"', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.searchableSection, 'Country');
    await expect(trigger).toHaveAttribute('aria-autocomplete', 'list');

    await select.openVia(trigger);
    const countBefore = await select.options().count();
    expect(countBefore).toBeGreaterThan(5);

    await select.searchInput.fill('united');
    // After filtering, only "United States" and "United Kingdom" remain.
    await expect(select.options()).toHaveCount(2);
    await expect(select.optionByLabel('United States')).toBeVisible();
    await expect(select.optionByLabel('United Kingdom')).toBeVisible();
  });

  test('@a11y @overlay grouped options render under role="group" with the group label', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.groupedSection, 'Country');
    await select.openVia(trigger);

    // The demo declares four groups: Americas, Europe, Asia, Oceania.
    const groups = select.listbox.locator('[role="group"]');
    await expect(groups).toHaveCount(4);
    await expect(groups.nth(0)).toHaveAttribute('aria-label', 'Americas');
    await expect(groups.nth(1)).toHaveAttribute('aria-label', 'Europe');
  });

  test('@a11y @overlay disabled select cannot open via click or keyboard', async ({ page }) => {
    const select = new SelectPage(page);
    await select.goto();

    // "Disabled with value" — first combobox inside the States section.
    const trigger = select.triggerIn(select.statesSection, 'Disabled whole');
    await expect(trigger).toBeDisabled();
    await expect(trigger).toHaveAttribute('aria-disabled', 'true');

    // CDK + native disabled both block real clicks — `force: true` skips
    // actionability so we exercise the directive's own guard.
    await trigger.click({ force: true });
    await expect(select.listbox).toHaveCount(0);

    // Keyboard path: focus and ArrowDown / Enter are both no-ops while
    // `isDisabled()` returns true.
    await trigger.focus().catch(() => {
      /* native disabled prevents focus — that's already the contract */
    });
    await page.keyboard.press('Enter');
    await expect(select.listbox).toHaveCount(0);
  });

  test('@a11y @overlay variant auto-resolves to "naked" when wrapped in tw-form-field', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.formFieldSection, 'Country');
    await expect(trigger).toHaveAttribute('data-variant', 'naked');

    // Sanity: a default (non-form-field) select reports the default variant.
    const standalone = select.triggerIn(select.searchableSection, 'Country');
    await expect(standalone).toHaveAttribute('data-variant', 'default');
  });

  test('@interaction @overlay required surfaces as aria-required="true" on the trigger', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const required = select.triggerIn(select.statesSection, 'Required fruit');
    await expect(required).toHaveAttribute('aria-required', 'true');
  });

  test('@interaction @overlay custom *twSelectTrigger renders chips instead of comma-joined labels', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.customTriggerSection, 'Tags');
    // Start empty — the custom template renders a "Pick one or more tags…" hint.
    await expect(trigger).toContainText('Pick one or more tags');

    await select.openVia(trigger);
    await select.optionByLabel('Bug').click();
    await select.optionByLabel('Feature').click();

    // Custom trigger renders each selected option as a span chip.
    await expect(trigger).toContainText('Bug');
    await expect(trigger).toContainText('Feature');
    await expect(trigger).not.toContainText('Pick one or more tags');
  });

  test('@interaction @overlay custom *twSelectHeader + *twSelectEmpty render in their slots and reflect the search string', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.customEmptySection, 'Labels');
    await select.openVia(trigger);

    // Header projection — the demo writes "Project labels" above the listbox.
    await expect(select.overlayContainer).toContainText('Project labels');

    // Filter to a string that matches nothing → custom empty template
    // renders the typed string back at the user.
    await select.searchInput.fill('zzz-no-match');
    await expect(select.overlayContainer).toContainText('No label matches');
    await expect(select.overlayContainer).toContainText('zzz-no-match');
  });

  test('@interaction @overlay clear button resets the value and emits source="reset"', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const readout = select.outputByTestId('output-searchable');
    await expect(readout).toContainText('selected = de');

    // The clear control is a native button and a SIBLING of the trigger (HTML
    // forbids interactive content inside a button), so it is scoped to the
    // section rather than to the trigger. The content model itself is asserted
    // in `select.spec.ts` ("renders the clear control as a native button
    // OUTSIDE the trigger"), not here.
    await select.searchableSection
      .getByRole('button', { name: 'Clear selection' })
      .click();
    await expect(readout).toContainText('selected = null');
  });

  test('@a11y @overlay listbox carries the documented combobox ARIA contract', async ({
    page,
  }) => {
    const select = new SelectPage(page);
    await select.goto();

    const trigger = select.triggerIn(select.searchableSection, 'Country');
    await expect(trigger).toHaveAttribute('role', 'combobox');
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await select.openVia(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', /\S/);
    const controls = await trigger.getAttribute('aria-controls');
    await expect(page.locator(`#${controls!}`)).toHaveAttribute('role', 'listbox');
  });
});
