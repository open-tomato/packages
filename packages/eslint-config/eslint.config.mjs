import baseConfig from './base.mjs';

/**
 * Package leaf: `eslint .` from this folder lints the package on its own
 * base, read by relative path so the package lints itself before it is
 * installed anywhere.
 */
export default [
  ...baseConfig,
];
