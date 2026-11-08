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
 * - `layer-imports`, `no-restyle-from-above` and `shared-variants` hold a
 *   component library to its atomic levels: imports only from lower
 *   levels, restyling only through variant props, and shared variants
 *   only in the lowest level. Each reads a level from the path,
 *   `src/<level>/<Name>/`, and takes the same `{ levels }` option, lowest
 *   first; `DEFAULT_LEVELS` is the list they use without one. The `atomic`
 *   flavor of `@open-tomato/eslint-config` turns them on at `warn`.
 */
import { DEFAULT_LEVELS } from './rules/atomic-layers.mjs';
import { cvaOnlyClassName } from './rules/cva-only-classname.mjs';
import { layerImports } from './rules/layer-imports.mjs';
import { noRestyleFromAbove } from './rules/no-restyle-from-above.mjs';
import { noUnsafeUnicode } from './rules/no-unsafe-unicode.mjs';
import { sharedVariants } from './rules/shared-variants.mjs';

/** The key a config registers the plugin under. */
export const PLUGIN_KEY = '@open-tomato';

export { DEFAULT_LEVELS };

export default {
  meta: { name: '@open-tomato/eslint-plugin' },
  rules: {
    'cva-only-classname': cvaOnlyClassName,
    'layer-imports': layerImports,
    'no-restyle-from-above': noRestyleFromAbove,
    'no-unsafe-unicode': noUnsafeUnicode,
    'shared-variants': sharedVariants,
  },
};
