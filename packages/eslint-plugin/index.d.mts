/** Types for `index.mjs`, the `@open-tomato/eslint-plugin` entry. */
import type { ESLint } from 'eslint';

/** The key a config registers the plugin under. */
export declare const PLUGIN_KEY: '@open-tomato';

/** The plugin, with the `cva-only-classname` and `no-unsafe-unicode` rules. */
declare const plugin: ESLint.Plugin;
export default plugin;
