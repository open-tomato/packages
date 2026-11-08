import openTomato, { DEFAULT_LEVELS } from '@open-tomato/eslint-plugin';

import { CODE_FILES, JSX_FILES } from './files.mjs';

/** Stories and tests: a story composes a demo from siblings, and a test hands a class in to prove the passthrough. */
const DEMO_FILES = ['**/*.stories.*', '**/*.test.*', '**/*.spec.*'];

/** The severity every atomic rule is registered at: visibility, not a gate. */
const SEVERITY = 'warn';

/** Throws unless `levels` is a non-empty list of distinct, non-empty names. */
function assertLevels(levels) {
  const valid = Array.isArray(levels)
    && levels.length > 0
    && levels.every((level) => typeof level === 'string' && level !== '')
    && new Set(levels).size === levels.length;
  if (!valid) {
    throw new TypeError('atomic needs levels, a non-empty list of distinct level folder names, lowest first.');
  }
}

/**
 * The atomic flavor: the three atomic-layer rules of
 * `@open-tomato/eslint-plugin`, at `warn`, for component libraries laid
 * out as `src/<level>/<Name>/`. The warnings show where a low-level
 * component is redefined or restyled in higher layers, so the owner can
 * see when a `Basic<Component>` base is due.
 *
 * - `layer-imports`: a component imports only from lower levels, except
 *   `Basic<Folder>` from that folder's barrel. Every code file.
 * - `no-restyle-from-above`: on a component element from another
 *   component, `className` is only the passthrough. TSX and JSX files.
 * - `shared-variants`: another component's `.variants` file is imported
 *   only from the lowest level. Every code file.
 *
 * All three take the same `levels`, lowest first; the default is the
 * plugin's `DEFAULT_LEVELS`: particles, atoms, molecules, organisms,
 * templates, layouts, pages. A level with no folder costs nothing, so a
 * library with fewer levels keeps the default. Stories and tests are left
 * out. A library that gates on the rules sets them to `error` in a block
 * after this one.
 *
 *   import { atomic } from '@open-tomato/eslint-config/atomic';
 *   export default [...baseConfig, ...reactConfig, ...atomic({ levels: ['atoms', 'molecules', 'organisms'] })];
 *
 * @param {{ levels?: readonly string[] }} [options]
 * @returns {import("eslint").Linter.Config[]}
 */
export function atomic({ levels = DEFAULT_LEVELS } = {}) {
  assertLevels(levels);
  const option = { levels: [...levels] };
  const plugins = { '@open-tomato': openTomato };
  return [
    {
      files: CODE_FILES,
      ignores: DEMO_FILES,
      plugins,
      rules: {
        '@open-tomato/layer-imports': [SEVERITY, option],
        '@open-tomato/shared-variants': [SEVERITY, option],
      },
    },
    {
      files: JSX_FILES,
      ignores: DEMO_FILES,
      plugins,
      rules: { '@open-tomato/no-restyle-from-above': [SEVERITY, option] },
    },
  ];
}

/** @type {import("eslint").Linter.Config[]} */
export default atomic();
