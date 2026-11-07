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
| `.` | the plugin, and `PLUGIN_KEY` |
| `./rules/no-unsafe-unicode` | the rule, and `findUnsafeUnicode(text)`, which answers `{ index, code, kind }` for each character |
| `./rules/cva-only-classname` | the rule |
