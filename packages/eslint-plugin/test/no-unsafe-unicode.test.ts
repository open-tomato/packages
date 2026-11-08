/**
 * Tests for `@open-tomato/no-unsafe-unicode`: ESLint's `RuleTester` over
 * snippets that carry each kind of unsafe character, wired to bun's
 * `describe` and `it` so each case is one bun test.
 *
 * Every unsafe character is built with `String.fromCodePoint`, so this
 * file never holds one literally and passes its own rule.
 */
import { describe, expect, it } from 'bun:test';
import { RuleTester } from 'eslint';

import plugin, { PLUGIN_KEY } from '../index.mjs';
import { findUnsafeUnicode, noUnsafeUnicode } from '../rules/no-unsafe-unicode.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const char = (code: number): string => String.fromCodePoint(code);

const ZERO_WIDTH_SPACE = char(0x200b);
const RIGHT_TO_LEFT_OVERRIDE = char(0x202e);
const ESCAPE = char(0x1b);
const LINE_SEPARATOR = char(0x2028);
const ZERO_WIDTH_JOINER = char(0x200d);
const PERSON = char(0x1f9d1);
const LAPTOP = char(0x1f4bb);
const BYTE_ORDER_MARK = char(0xfeff);

const UNSAFE = [{ messageId: 'unsafe' }];

const tester = new RuleTester();

tester.run('@open-tomato/no-unsafe-unicode', noUnsafeUnicode, {
  valid: [
    { code: 'const greeting = \'hello\';' },
    { code: 'const escaped = \'\\u200B\';' },
    { code: `const coder = '${PERSON}${ZERO_WIDTH_JOINER}${LAPTOP}';` },
    { code: `${BYTE_ORDER_MARK}const leading = 1;` },
  ],
  invalid: [
    { code: `const a = 'hel${ZERO_WIDTH_SPACE}lo';`, errors: UNSAFE },
    { code: `const b = 'x${RIGHT_TO_LEFT_OVERRIDE}y';`, errors: UNSAFE },
    { code: `const c = '${ESCAPE}[31m';`, errors: UNSAFE },
    { code: `const d = 'a${LINE_SEPARATOR}b';`, errors: UNSAFE },
    { code: `const e = '1${ZERO_WIDTH_JOINER}2';`, errors: UNSAFE },
  ],
});

describe('the plugin entry', () => {
  it('registers every rule under the @open-tomato key', () => {
    expect(PLUGIN_KEY).toBe('@open-tomato');
    expect(Object.keys(plugin.rules ?? {}).sort()).toEqual([
      'cva-only-classname',
      'layer-imports',
      'no-restyle-from-above',
      'no-unsafe-unicode',
      'shared-variants',
    ]);
  });
});

describe('findUnsafeUnicode', () => {
  it('reports the index and code point of each finding', () => {
    expect(findUnsafeUnicode(`ab${ZERO_WIDTH_SPACE}`)).toEqual([
      { index: 2, code: 0x200b, kind: 'invisible character' },
    ]);
  });
});
