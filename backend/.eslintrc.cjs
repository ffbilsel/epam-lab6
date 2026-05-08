/** ESLint config — Constitution Principles II & IV. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'jsdoc'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:jsdoc/recommended-typescript-error',
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.cjs', 'jest.config.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/ban-ts-comment': 'error',
    'no-console': 'error',
    'jsdoc/require-jsdoc': [
      'error',
      {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          ClassDeclaration: true,
          MethodDefinition: true,
        },
        contexts: [
          'TSInterfaceDeclaration',
          'TSTypeAliasDeclaration',
          'ExportNamedDeclaration > VariableDeclaration',
        ],
      },
    ],
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns-type': 'off',
  },
  overrides: [
    {
      files: ['tests/**/*.ts'],
      rules: {
        'jsdoc/require-jsdoc': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
};
