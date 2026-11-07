import baseConfig from '../eslint-config/base.mjs';

/**
 * Package leaf: `eslint .` from this folder lints the package alone. The
 * base is read by relative path, not as a dependency: the config depends
 * on this plugin, so a dependency back would be a cycle.
 */
export default [
  ...baseConfig,
];
