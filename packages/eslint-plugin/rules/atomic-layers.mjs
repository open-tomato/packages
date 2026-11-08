/**
 * What the three atomic-layer rules share: the level list, where a path
 * sits in it, and the import sources of a file.
 *
 * A layer is known by path alone, `…/src/<level>/<Name>/…`, so no rule
 * reads the file system. A path under `src/<level>/<Name>/` belongs to the
 * component `<Name>` of `<level>`; a file directly in a level folder, such
 * as a level barrel `src/atoms/index.ts`, belongs to the level and to no
 * component. A relative specifier is resolved against the importing file
 * without guessing an extension; a package specifier or an alias is not a
 * component and is never resolved.
 */
import { posix } from 'node:path';

/**
 * The default levels, lowest first: every level the open-tomato libraries
 * use, so a library with fewer folders loses nothing. `layouts` sits above
 * `templates`, and `pages` on top.
 */
export const DEFAULT_LEVELS = Object.freeze([
  'particles',
  'atoms',
  'molecules',
  'organisms',
  'templates',
  'layouts',
  'pages',
]);

/** The folder a level folder sits in. */
const SOURCE_DIR = 'src';

/** The JSON schema of the one option every atomic rule takes. */
export const LEVELS_SCHEMA = [
  {
    type: 'object',
    properties: {
      levels: {
        type: 'array',
        items: { type: 'string', minLength: 1 },
        minItems: 1,
        uniqueItems: true,
      },
    },
    additionalProperties: false,
  },
];

/** The levels a rule was configured with, or the default list. */
export function levelsOf(context) {
  return context.options[0]?.levels ?? DEFAULT_LEVELS;
}

/** `path` with POSIX separators. */
function toPosix(path) {
  return path.replaceAll('\\', '/');
}

/**
 * Where an absolute path sits: `{ level, rank, levelDir, component,
 * componentDir }`, with `component` and `componentDir` undefined for a
 * path directly in the level folder, or `undefined` outside every level.
 * The last `src/<level>` in the path wins, so a library nested in another
 * `src` reads its own levels. `isFile` says whether the last segment is a
 * file: a resolved import target without an extension may name a folder.
 */
export function locate(path, levels, { isFile }) {
  const segments = toPosix(path).split('/');
  for (let index = segments.length - 2; index >= 0; index -= 1) {
    const rank = levels.indexOf(segments[index + 1]);
    if (segments[index] !== SOURCE_DIR || rank === -1) continue;
    const levelDir = segments.slice(0, index + 2).join('/');
    const rest = segments.slice(index + 2);
    const ownsComponent = rest.length > (isFile
      ? 1
      : 0);
    return {
      level: levels[rank],
      rank,
      levelDir,
      component: ownsComponent
        ? rest[0]
        : undefined,
      componentDir: ownsComponent
        ? `${levelDir}/${rest[0]}`
        : undefined,
      rest,
    };
  }
  return undefined;
}

/** Whether `path` is `dir` or lies under it. */
export function isInside(path, dir) {
  return path === dir || path.startsWith(`${dir}/`);
}

/** Whether `specifier` is relative: `.`, `..`, or starting `./` or `../`. */
function isRelative(specifier) {
  return specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../');
}

/** `specifier` resolved against the importing `filename`, or `undefined` when it is not relative. */
export function resolveRelative(filename, specifier) {
  return isRelative(specifier)
    ? posix.normalize(posix.join(posix.dirname(toPosix(filename)), specifier))
    : undefined;
}

/**
 * The component the linted file belongs to, as `locate` reads it, or
 * `undefined` when the file sits outside every component.
 */
export function ownComponent(context, levels) {
  const place = locate(context.filename, levels, { isFile: true });
  return place?.component === undefined
    ? undefined
    : place;
}

/**
 * The visitors that call `onImport(node, specifier)` for each import
 * declaration, `export … from` declaration and `import()` call with a
 * string literal, type-only ones included: a type import ties two
 * components together as much as a value import does.
 */
export function importVisitors(onImport) {
  const fromSource = (node) => {
    if (node.source?.type === 'Literal' && typeof node.source.value === 'string') {
      onImport(node, node.source.value);
    }
  };
  return {
    ImportDeclaration: fromSource,
    ExportNamedDeclaration: fromSource,
    ExportAllDeclaration: fromSource,
    ImportExpression: fromSource,
  };
}
