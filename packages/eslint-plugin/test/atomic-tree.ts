/**
 * The fixture tree the three atomic-layer rule tests read: file paths of a
 * small component library, with no file on disk, because the rules read a
 * layer from the path alone.
 *
 * ```text
 * /project/src/
 *   particles/focus/focus.variants.ts
 *   atoms/Button/{index.ts, Button.tsx, BasicButton.tsx, Button.variants.ts}
 *   atoms/Chip/Chip.tsx            (imports a sibling atom: warns)
 *   atoms/IconButton/IconButton.tsx (imports BasicButton: allowed)
 *   atoms/Icon/Icon.tsx, atoms/Touchable/Touchable.variants.ts
 *   atoms/index.ts                 (a level barrel: no component)
 *   molecules/Card/{Card.tsx, CardHeader.tsx, Card.variants.ts}
 *   organisms/Table/{Table.tsx, Table.variants.ts, components/Row/Row.tsx}
 *   lib/cn.ts, stories/Demo.tsx    (outside the levels)
 * ```
 */
import * as tsParser from '@typescript-eslint/parser';
import { describe, it } from 'bun:test';
import { RuleTester } from 'eslint';

RuleTester.describe = describe;
RuleTester.it = it;
// No `itOnly`: bun's `it.only` throws on access under CI, and ESLint reads
// it only for a case marked `only`, which none here is.

/** The root of the fixture library's sources. */
export const SRC = '/project/src';

/** The absolute path of `relative` inside the fixture tree's `src`. */
export function at(relative: string): string {
  return `${SRC}/${relative}`;
}

/** A `RuleTester` that parses TypeScript and JSX. */
export function tsxTester(): RuleTester {
  return new RuleTester({
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  });
}
