import baseConfig from '@open-tomato/eslint-config';

/**
 * Root leaf: the release scripts and the root files. Each package lints
 * itself from its own folder through `turbo run lint`, so the packages
 * are ignored here.
 */
export default [
  {
    ignores: ['packages/**'],
  },
  ...baseConfig,
];
