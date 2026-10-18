// Lint is where the rules in CLAUDE.md stop being requests. Anything here fails CI, for people and agents alike.
import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', 'test-results', 'playwright-report', 'blob-report', '.auth', 'src/api/schema.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['tests/**/*.ts', 'src/**/*.ts'],
    plugins: { playwright },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Waiting a fixed time hides timing problems instead of fixing them.
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-page-pause': 'error',
      // A test that is skipped, focused or marked fixme is not running; nobody, human or agent, may leave one behind.
      'playwright/no-skipped-test': ['error', { allowConditional: false }],
      'playwright/no-focused-test': 'error',
      'playwright/no-commented-out-tests': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-conditional-expect': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/missing-playwright-await': 'error',
      // Every test asserts. Page-object methods named expect* count as assertions.
      'playwright/expect-expect': ['error', { assertFunctionPatterns: ['^expect[A-Z]\\w*$'] }],
      // Locators by position break when the page changes; each one needs a reason in an eslint-disable comment.
      'playwright/no-nth-methods': 'error',
    },
  },
  {
    // Specs describe behaviour; locators, raw page calls and data generation live in src/.
    files: ['tests/**/*.spec.ts'],
    rules: {
      'playwright/no-raw-locators': 'error',
      'no-restricted-imports': [
        'error',
        { paths: [{ name: '@playwright/test', message: 'Import test and expect from src/fixtures.' }] },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='page']",
          message: 'No raw page calls in specs: add a method to a page object in src/pages or src/components.',
        },
        {
          selector: 'CallExpression[callee.property.name=/^(getBy[A-Z]\\w*|locator)$/]',
          message: 'No locators in specs: they belong in a page object.',
        },
        {
          selector: "CallExpression[callee.property.name='fixme']",
          message: 'test.fixme hides a failing test. Report the failure instead.',
        },
      ],
    },
  },
  {
    // The setup project prepares state; it has nothing to assert.
    files: ['tests/setup/**/*.ts'],
    rules: { 'playwright/expect-expect': 'off' },
  },
  {
    // Page objects may use a raw locator only as a last resort, with an eslint-disable comment saying why.
    files: ['src/pages/**/*.ts', 'src/components/**/*.ts'],
    rules: { 'playwright/no-raw-locators': 'error' },
  },
);
