// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const playwright = require('eslint-plugin-playwright');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      'out-tsc/**',
      'coverage/**',
      'node_modules/**',
      '.angular/**',
      'playwright-report/**',
      'test-results/**',
      '**/*.min.js',
      // Workflow scripts run inside an implicit async wrapper supplied by the
      // Workflow tool, so top-level `return`/`await` are legal there but parse
      // as errors under a standalone module parser.
      '.claude/workflows/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs', 'playwright.config.ts'],
          defaultProject: 'tsconfig.json',
        },
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'tw', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: 'tw', style: 'kebab-case' },
          { type: 'attribute', prefix: 'tw', style: 'camelCase' },
        ],
      ],
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // CVA `onChange`/`onTouched` placeholders are legitimately empty.
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['arrowFunctions', 'methods'] },
      ],
    },
  },
  {
    // Library — aliasing inputs/outputs to native HTML attribute names (id,
    // disabled, required, aria-describedby, etc.) and re-emitting CDK host-
    // directive outputs under semantic names are intentional library patterns.
    files: ['projects/ngx-tw/**/*.ts'],
    rules: {
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/no-output-rename': 'off',
      '@angular-eslint/no-output-native': 'off',
    },
  },
  {
    // Demo app — no prefix constraint; consumers pick their own.
    files: ['projects/demo/**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': 'off',
      '@angular-eslint/component-selector': 'off',
    },
  },
  {
    // Test files — relax typed rules that fight Vitest + test host components.
    files: ['**/*.spec.ts', 'projects/**/test-setup.ts'],
    rules: {
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    // Playwright E2E specs and helpers.
    files: ['e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
  },
  {
    // Demo example galleries use <label> as a visual grouping label in demos,
    // not as a form-control label. Keep accessibility checks on for the
    // library itself, where controls are wired properly.
    files: ['projects/demo/src/app/routes/**/*.html'],
    rules: {
      '@angular-eslint/template/label-has-associated-control': 'off',
    },
  },
  {
    // Inline templates extracted from `*.spec.ts` via `processInlineTemplates`
    // (virtual path: `<spec>.ts/N_inline-template-…component.html`). Test host
    // templates project `<label twLabel>` into `<tw-form-field>`, which wires
    // aria-labelledby programmatically — the rule only sees DOM `for`/`id`.
    files: ['**/*.spec.ts/**/*.component.html'],
    rules: {
      '@angular-eslint/template/label-has-associated-control': 'off',
    },
  },
  // Disable stylistic rules that conflict with Prettier.
  prettier,
);
