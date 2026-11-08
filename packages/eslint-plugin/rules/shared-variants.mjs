/**
 * @open-tomato/shared-variants
 *
 * A component's variants are its own. Variants that two components share
 * live in the lowest level (particles, by default), so importing another
 * component's `.variants` file warns unless that file sits in the lowest
 * level.
 *
 * The linted file must belong to a component, `src/<level>/<Name>/…`. Each
 * relative import, re-export and `import()` is resolved against it; one
 * whose last segment is a variants file (`X.variants`, written with or
 * without an extension) in another component's folder is a finding. The
 * component's own variants, a variants file in the lowest level, and a
 * file outside any component are never findings.
 *
 * Options: `{ levels }`, the level folders lowest first.
 */
import {
  importVisitors,
  isInside,
  LEVELS_SCHEMA,
  levelsOf,
  locate,
  ownComponent,
  resolveRelative,
} from './atomic-layers.mjs';

/** A variants file's last path segment, with or without its extension. */
const VARIANTS_FILE = /\.variants(\.[cm]?[jt]sx?)?$/;

export const sharedVariants = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when a component imports another component\'s .variants file from outside the lowest level.',
    },
    schema: LEVELS_SCHEMA,
    messages: {
      borrowed:
        '{{component}} imports {{owner}}\'s variants, \'{{specifier}}\'. Pick a variant prop of {{owner}} instead, '
        + 'or move the shared variants to {{lowest}}, the lowest level.',
    },
  },
  create(context) {
    const levels = levelsOf(context);
    const own = ownComponent(context, levels);
    if (own === undefined) return {};
    return importVisitors((node, specifier) => {
      const resolved = resolveRelative(context.filename, specifier);
      if (resolved === undefined || !VARIANTS_FILE.test(resolved) || isInside(resolved, own.componentDir)) return;
      const target = locate(resolved, levels, { isFile: true });
      if (target === undefined || target.rank === 0) return;
      context.report({
        node,
        messageId: 'borrowed',
        data: { component: own.component, owner: target.component ?? target.level, specifier, lowest: levels[0] },
      });
    });
  },
};
