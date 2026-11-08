/** Types for `index.mjs`, the `@open-tomato/eslint-plugin` entry. */
import type { ESLint } from 'eslint';

/** The key a config registers the plugin under. */
export declare const PLUGIN_KEY: '@open-tomato';

/** The levels the atomic-layer rules use without a `levels` option, lowest first. */
export declare const DEFAULT_LEVELS: readonly string[];

/**
 * The plugin, with the `cva-only-classname`, `layer-imports`,
 * `no-restyle-from-above`, `no-unsafe-unicode` and `shared-variants` rules.
 */
declare const plugin: ESLint.Plugin;
export default plugin;
