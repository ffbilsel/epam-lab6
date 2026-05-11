/**
 * ESLint overlay for tests — Constitution v1.1.0 / Principles V.5, V.6, V.7.
 *
 * Adds Jest-aware rules and a `no-restricted-syntax` set that blocks the
 * tautological-assertion patterns called out in V.7. Extends the root
 * `backend/.eslintrc.cjs` so all base rules (no-explicit-any, etc.) still
 * apply.
 */
const TAUTOLOGY_LINK =
  'See .specify/memory/constitution.md §V.7 — "Has meaningful assertions". Tautological assertions are prohibited.';

module.exports = {
  extends: ['../.eslintrc.cjs'],
  parserOptions: {
    project: ['../tsconfig.test.json'],
    tsconfigRootDir: __dirname + '/..',
    sourceType: 'module',
  },
  plugins: ['jest'],
  env: {
    'jest/globals': true,
    node: true,
  },
  rules: {
    // Carry over the test-friendly overrides from the root override block,
    // since `extends` does not pull `overrides` matching different paths.
    'jsdoc/require-jsdoc': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',

    // V.7 — assertion-presence and basic Jest hygiene.
    'jest/expect-expect': 'error',
    'jest/no-disabled-tests': 'error',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/valid-expect': 'error',
    'jest/no-conditional-expect': 'error',
    'jest/no-standalone-expect': 'error',
    'jest/prefer-strict-equal': 'warn',
    'jest/no-commented-out-tests': 'warn',
    'jest/valid-title': 'error',

    // V.7 — tautological-assertion ban.
    // Patterns flagged:
    //   expect(x).toBe(x)
    //   expect(x).toEqual(x)
    //   expect(x).toStrictEqual(x)
    //   sole expect(_).toBeDefined()  /  .not.toThrow()  (only first form
    //   is statically detectable; reviewer enforces the "sole assertion"
    //   variant per V.7).
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "CallExpression[callee.object.callee.name='expect'][callee.property.name=/^(toBe|toEqual|toStrictEqual)$/][arguments.length=1]:matches([arguments.0.type='Identifier']):matches([callee.object.arguments.0.type='Identifier'])",
        message: `Tautological assertion: expect(x).toBe(x) compares a value with itself. ${TAUTOLOGY_LINK}`,
      },
    ],

    // Tests are allowed to relax the JSDoc / non-null rules already overridden
    // in the root config; nothing else to override here.
  },
  overrides: [
    {
      files: ['_setup.ts', '_factories.ts', 'unit/_factories.ts', 'integration/_factories.ts'],
      rules: {
        // Setup helpers don't need expect() calls.
        'jest/expect-expect': 'off',
        'jest/no-standalone-expect': 'off',
      },
    },
  ],
};
