/**
 * @open-tomato/layer-imports
 *
 * A component imports only from lower levels. Two atoms combined make a
 * molecule and two molecules an organism, so an import from the same
 * level is refused as much as one from a higher level.
 *
 * The linted file must belong to a component, `src/<level>/<Name>/…`. Each
 * relative import, re-export and `import()` is resolved against it; one
 * that lands in a level folder and outside the component's own folder
 * must land in a lower level. Imports inside the own folder are skipped:
 * a molecule or organism may colocate its own internals there and export
 * them through its barrel. A package, an alias, or a path that leaves the
 * level folders (`../../lib/cn`) is never a finding.
 *
 * One same-level import is allowed: the base component `Basic<Folder>`,
 * imported by that name from its folder's barrel, `src/<level>/<Folder>`
 * or `src/<level>/<Folder>/index`. Every name the declaration imports must
 * be that one, so `import { BasicButton } from '../Button'` passes, while
 * `import { Button } from '../Button'` and `import { BasicCard } from
 * '../Banner'` warn. Where the file sits inside the folder is free; the
 * rule reads only the barrel.
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

/** The prefix a base component's name starts with. */
const BASE_PREFIX = 'Basic';

/** The barrel's name inside a component folder, with the extensions it may be written with. */
const BARREL = /^index(\.[cm]?[jt]sx?)?$/;

/** The name an import or re-export specifier takes from its module. */
function importedName(specifier) {
  if (specifier.type === 'ImportSpecifier') return specifier.imported.name ?? specifier.imported.value;
  if (specifier.type === 'ExportSpecifier') return specifier.local.name ?? specifier.local.value;
  return undefined;
}

/** Whether `node` imports only `Basic<Folder>` from the barrel of the folder `target` names. */
function isBaseImport(node, target) {
  const { component, rest } = target;
  const throughBarrel = rest.length === 1 || (rest.length === 2 && BARREL.test(rest[1]));
  const specifiers = node.specifiers ?? [];
  return component !== undefined
    && throughBarrel
    && specifiers.length > 0
    && specifiers.every((specifier) => importedName(specifier) === `${BASE_PREFIX}${component}`);
}

export const layerImports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Allow a component to import only from lower levels, except Basic<Folder> from that folder\'s barrel.',
    },
    schema: LEVELS_SCHEMA,
    messages: {
      sameLevel:
        '{{component}} ({{level}}) imports \'{{specifier}}\' from its own level. A component imports only from lower levels; '
        + 'combine the two in a higher level, or extract a Basic<Folder> base and import it from the folder\'s barrel.',
      higherLevel:
        '{{component}} ({{level}}) imports \'{{specifier}}\' from a higher level, {{targetLevel}}. '
        + 'A component imports only from lower levels.',
    },
  },
  create(context) {
    const levels = levelsOf(context);
    const own = ownComponent(context, levels);
    if (own === undefined) return {};
    return importVisitors((node, specifier) => {
      const resolved = resolveRelative(context.filename, specifier);
      if (resolved === undefined || isInside(resolved, own.componentDir)) return;
      const target = locate(resolved, levels, { isFile: false });
      if (target === undefined || target.rank < own.rank) return;
      if (target.rank === own.rank && isBaseImport(node, target)) return;
      context.report({
        node,
        messageId: target.rank === own.rank
          ? 'sameLevel'
          : 'higherLevel',
        data: { component: own.component, level: own.level, specifier, targetLevel: target.level },
      });
    });
  },
};
