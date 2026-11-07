/**
 * The style and import rules every open-tomato project shares, applied by
 * `base.mjs` to every JavaScript and TypeScript file.
 *
 * In short: single quotes, semicolons, two-space indent, trailing commas
 * on multiline literals, and imports grouped type first, then builtin,
 * external, internal, parent, sibling and index, alphabetised with a
 * blank line between groups.
 *
 * @type {import("eslint").Linter.RulesRecord} */
export default {
  '@stylistic/comma-dangle': ['error', 'always-multiline'],
  '@stylistic/eol-last': ['error', 'always'],
  '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
  '@stylistic/implicit-arrow-linebreak': ['error', 'beside'],
  '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
  '@stylistic/multiline-ternary': ['error', 'always'],
  '@stylistic/newline-per-chained-call': ['error', { 'ignoreChainWithDepth': 2 }],
  '@stylistic/no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
  '@stylistic/no-multi-spaces': ['error', { exceptions: { Property: false }, 'ignoreEOLComments': true }],
  '@stylistic/no-tabs': ['error'],
  '@stylistic/object-curly-spacing': ['error', 'always'],
  '@stylistic/quotes': ['error', 'single'],
  '@stylistic/semi': ['error', 'always'],
  'arrow-body-style': ['error', 'as-needed'],
  'no-var': 'error',
  'no-undef': 'error',
  'import/prefer-default-export': 'off',
  'import/no-unresolved': ['error', { ignore: ['^bun:'] }],
  'import/order': ['error', {
    groups: [
      'type',
      'builtin',
      'external',
      'internal',
      'parent',
      'sibling',
      'index',
    ],
    'newlines-between': 'always',
    alphabetize: {
      order: 'asc',
      caseInsensitive: true,
    },
  }],
};
