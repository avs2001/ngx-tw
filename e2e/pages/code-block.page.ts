import { expect, type Locator, type Page } from '@playwright/test';

export type CodeBlockSectionName =
  | 'Variants'
  | 'Language Labels'
  | 'Word Wrap'
  | 'Copy Event'
  | 'Playground';

/**
 * Thin POM for the code-block examples route. Chapter 04 narrows E2E to
 * the copy button outcome (label toggle to "Copied" + `(copied)` emission)
 * and the `[wrap]` → `whitespace-pre-wrap` toggle.
 */
export class CodeBlockPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly wrapSection: Locator;
  readonly copySection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.wrapSection = this.section('Word Wrap');
    this.copySection = this.section('Copy Event');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/code-block/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: CodeBlockSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
