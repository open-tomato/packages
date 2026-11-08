# @open-tomato/eslint-plugin

The custom ESLint rules of the open-tomato projects. The plugin registers
under the `@open-tomato` key, so each rule reads `@open-tomato/<rule>` in a
config and in a disable comment.

```bash
bun add -d @open-tomato/eslint-plugin eslint
```

[`@open-tomato/eslint-config`](../eslint-config/README.md) already turns
the rules on, so a project that uses the config needs no setup of its own.
A project with its own config registers the plugin itself:

```js
import openTomato from '@open-tomato/eslint-plugin';

export default [
  {
    plugins: { '@open-tomato': openTomato },
    rules: { '@open-tomato/no-unsafe-unicode': 'error' },
  },
];
```

## Rules

### `no-unsafe-unicode`

Refuses characters that are invisible or misleading in a source file,
written literally:

- C0 control characters except tab, line feed and carriage return, and DEL.
  A NUL makes git treat the file as binary, and makes grep miss text that is
  there.
- Bidirectional overrides and isolates, the Trojan Source set
  (CVE-2021-42574), which make code display in a different order than it
  runs.
- Zero-width and default-ignorable characters, invisible to a reviewer.
- The line and paragraph separators U+2028 and U+2029.

The fix is the escape: write the six-character backslash-u form instead of
the character. A zero-width joiner between two emoji is allowed, since that
is how emoji sequences are built. The rule runs on code, JSON and Markdown.

The control-byte gate of [`@open-tomato/gates`](../gates/README.md) checks
the same set at the byte level over every tracked file, and its tests assert
the two agree.

### `cva-only-classname`

For component libraries whose classes live in `cva` calls. A JSX
`className` may hold only:

- a variants call, any function whose name ends in `Variants`:
  `className={cardVariants({ tone })}`;
- a `cn()` call over variants calls and the passthrough `className`, alone
  or behind `&&`, `||`, `??` or a ternary:
  `className={cn(cardVariants({ tone }), className)}`;
- the passthrough `className` itself.

A string, a template literal or any other expression is refused. The `cva`
flavor of the config turns it on outside templates, pages, stories and
tests.

### The atomic-layer rules

Three rules for component libraries laid out in atomic levels,
`src/<level>/<Name>/`. Each reads a file's level from its path alone, so a
file directly in a level folder (a level barrel such as
`src/atoms/index.ts`) and a file outside the levels (`src/lib/`) belong to
no component and are never checked. Only relative specifiers are resolved;
a package or an alias such as `@/atoms/Button` is never a finding.

All three take one option, `{ levels }`, the level folders lowest first.
Without it they use `DEFAULT_LEVELS`, which the plugin exports:
`particles`, `atoms`, `molecules`, `organisms`, `templates`, `layouts`,
`pages`. A level with no folder costs nothing, so a library with fewer
levels keeps the default. The `atomic` flavor of the config turns the three
on at `warn`; the warnings show where a low-level component is redefined or
restyled in many places, which is the sign a `Basic<Component>` base is due.

#### `layer-imports`

A component imports only from lower levels. A same-level import is refused
at every level, since two atoms combined make a molecule:

```tsx
// src/atoms/Chip/Chip.tsx
import { Touchable } from '../Touchable';          // warns: atoms to atoms
import { Card } from '../../molecules/Card';       // warns: a higher level
import { chipVariants } from './Chip.variants';    // passes: its own folder
```

Imports inside the component's own folder are skipped, so a molecule or
organism may colocate its internals there (`organisms/Table/TableRow.tsx`).
The one same-level exception is the base component `Basic<Folder>`,
imported by that name from its folder's barrel:

```tsx
// src/atoms/IconButton/IconButton.tsx
import { BasicButton } from '../Button';               // passes
import { Button } from '../Button';                    // warns: not the base
import { BasicButton } from '../Button/BasicButton';   // warns: not the barrel
import { BasicCard } from '../Banner';                 // warns: name and folder disagree
```

Every name the declaration imports must be the base; where the base's file
sits inside its folder is free.

#### `no-restyle-from-above`

Styles live at the lowest layer, and a higher layer restyles a component by
choosing a variant prop. On a component element imported from another
component's folder, `className` may only be the passthrough:

```tsx
// src/molecules/FilesChanged/FilesChanged.tsx
import { Icon } from '../../atoms/Icon';

<Icon name="file" className={className} />            // passes
<Icon name="file" className={filesChangedIcon()} />   // warns
<Icon name="file" className="mr-2" />                 // warns: layout classes too
```

A DOM element, a component from a package (a Radix primitive, which the
lowest layer styles), a component defined in the same file, and one
imported from the own folder are never findings. A member name such as
`<Menu.Item>` counts as the import it starts with.

#### `shared-variants`

A component's variants are its own. Importing another component's
`.variants` file warns unless that file sits in the lowest level, where
shared variants belong:

```tsx
// src/molecules/Card/Card.tsx
import { cardVariants } from './Card.variants';                          // passes
import { focusVariants } from '../../particles/focus/focus.variants';    // passes
import { touchableVariants } from '../../atoms/Touchable/Touchable.variants'; // warns
```

The import may be written with or without an extension, as a type import,
a re-export or an `import()`.

## Turning a rule off for one line

A disable comment names the rule with its prefix, and says why after
`--`:

```tsx
export function LegacyGrid() {
  // eslint-disable-next-line @open-tomato/cva-only-classname -- markup kept from the old site
  return <div className="legacy-grid" />;
}
```

The rules used to live under the prefixes `ar/`, `house/`, `ot/` and
`d2c/`. A comment that still names one refers to a rule that no longer
exists, and ESLint reports it, so rename each to `@open-tomato/`.

## Exports

| Path | What it holds |
| --- | --- |
| `.` | the plugin, `PLUGIN_KEY`, and `DEFAULT_LEVELS` |
| `./rules/no-unsafe-unicode` | the rule, and `findUnsafeUnicode(text)`, which answers `{ index, code, kind }` for each character |
| `./rules/cva-only-classname` | the rule |
| `./rules/layer-imports` | the rule |
| `./rules/no-restyle-from-above` | the rule |
| `./rules/shared-variants` | the rule |
