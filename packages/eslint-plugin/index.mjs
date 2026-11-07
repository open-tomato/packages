/**
 * `@open-tomato/eslint-plugin`: the custom rules every open-tomato project
 * can turn on. The plugin registers under the `@open-tomato` key, so each
 * rule reads `@open-tomato/<rule>` in a config or a disable comment.
 *
 * - `no-unsafe-unicode` refuses control, BiDi-override and invisible
 *   characters written literally. `@open-tomato/eslint-config` turns it on
 *   for every linted language.
 * - `cva-only-classname` holds a JSX `className` to a CVA variants call.
 *   The `cva` flavor of `@open-tomato/eslint-config` turns it on.
 */
import { cvaOnlyClassName } from './rules/cva-only-classname.mjs';
import { noUnsafeUnicode } from './rules/no-unsafe-unicode.mjs';

/** The key a config registers the plugin under. */
export const PLUGIN_KEY = '@open-tomato';

export default {
  meta: { name: '@open-tomato/eslint-plugin' },
  rules: {
    'cva-only-classname': cvaOnlyClassName,
    'no-unsafe-unicode': noUnsafeUnicode,
  },
};
