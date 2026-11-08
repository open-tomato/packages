/**
 * @open-tomato/no-restyle-from-above
 *
 * Styles live at the lowest layer, and a higher layer restyles a component
 * by choosing one of its variant props. So on a component element from
 * another component, `className` may only be the passthrough,
 * `className={className}`. Layout classes count too: there is no
 * "layout context" loosening.
 *
 * The linted file must belong to a component, `src/<level>/<Name>/…`. An
 * element is a component element from another component when its name,
 * or the object of a member name such as `Menu.Item`, is bound to an
 * import whose relative specifier lands in a level folder and outside the
 * file's own component folder. A DOM element, a component from a package
 * (a Radix primitive, which the lowest layer styles), one defined in the
 * file, and one imported from the own folder are never findings.
 *
 * Options: `{ levels }`, the level folders lowest first.
 */
import {
  isInside,
  LEVELS_SCHEMA,
  levelsOf,
  locate,
  ownComponent,
  resolveRelative,
} from './atomic-layers.mjs';

/** The passthrough prop a component hands on unchanged. */
const PASSTHROUGH = 'className';

/** The root identifier of a JSX element name: `Icon` of `Icon`, `Menu` of `Menu.Item`. */
function rootIdentifier(name) {
  let root = name;
  while (root.type === 'JSXMemberExpression') root = root.object;
  return root.type === 'JSXIdentifier'
    ? root
    : undefined;
}

/** The variable `name` resolves to from `scope`, walking outwards. */
function findVariable(scope, name) {
  for (let current = scope; current !== null; current = current.upper) {
    const variable = current.set.get(name);
    if (variable !== undefined) return variable;
  }
  return undefined;
}

/**
 * The import specifier `identifier` is bound to by an `import` declaration,
 * or `undefined`. TypeScript's `import x = require(…)` is an import binding
 * too, with no `source`; it is not read, as `layer-imports` does not read it.
 */
function importSourceOf(context, identifier) {
  const variable = findVariable(context.sourceCode.getScope(identifier), identifier.name);
  const definition = variable?.defs[0];
  return definition?.type === 'ImportBinding' && definition.parent.type === 'ImportDeclaration'
    ? definition.parent.source.value
    : undefined;
}

/** The element's name as written, for the message: `Icon`, `Menu.Item`. */
function writtenName(name) {
  return name.type === 'JSXMemberExpression'
    ? `${writtenName(name.object)}.${name.property.name}`
    : name.name;
}

/** Whether a `className` attribute holds the bare passthrough identifier. */
function isPassthrough(attribute) {
  const { value } = attribute;
  return value !== null
    && value.type === 'JSXExpressionContainer'
    && value.expression.type === 'Identifier'
    && value.expression.name === PASSTHROUGH;
}

export const noRestyleFromAbove = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Allow only the passthrough className on a component element imported from another component.',
    },
    schema: LEVELS_SCHEMA,
    messages: {
      restyle:
        '{{name}} comes from another component ({{targetLevel}}), so its className takes only the passthrough. '
        + 'Restyle it by choosing a variant prop; if none fits, add the variant to {{name}}\'s own .variants file.',
    },
  },
  create(context) {
    const levels = levelsOf(context);
    const own = ownComponent(context, levels);
    if (own === undefined) return {};

    /** The level of the other component `element` comes from, or `undefined`. */
    function foreignLevel(element) {
      const root = rootIdentifier(element.name);
      if (root === undefined) return undefined;
      const specifier = importSourceOf(context, root);
      const resolved = specifier === undefined
        ? undefined
        : resolveRelative(context.filename, specifier);
      if (resolved === undefined || isInside(resolved, own.componentDir)) return undefined;
      return locate(resolved, levels, { isFile: false })?.level;
    }

    return {
      JSXAttribute(attribute) {
        if (attribute.name.type !== 'JSXIdentifier' || attribute.name.name !== PASSTHROUGH) return;
        if (isPassthrough(attribute)) return;
        const element = attribute.parent;
        const targetLevel = foreignLevel(element);
        if (targetLevel === undefined) return;
        context.report({
          node: attribute,
          messageId: 'restyle',
          data: { name: writtenName(element.name), targetLevel },
        });
      },
    };
  },
};
