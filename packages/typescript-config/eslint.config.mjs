import baseConfig from '../eslint-config/base.mjs';

/**
 * Package leaf: `eslint .` from this folder lints the package alone. The
 * base is read by relative path, not as a dependency, so the two config
 * packages never depend on each other.
 */
export default [
  ...baseConfig,
];
