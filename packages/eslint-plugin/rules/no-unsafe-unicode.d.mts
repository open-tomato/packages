/**
 * Types for `no-unsafe-unicode.mjs`, so a TypeScript file importing it
 * (the control-byte gate's agreement test) reads its exports typed rather
 * than as an implicit `any`.
 */
import type { Rule } from 'eslint';

/** One unsafe character: its UTF-16 index, its code point and what kind it is. */
export interface UnsafeUnicodeFinding {
  readonly index: number;
  readonly code: number;
  readonly kind: string;
}

/** Every unsafe character in `text`. */
export declare function findUnsafeUnicode(text: string): UnsafeUnicodeFinding[];

/** The rule itself. */
export declare const noUnsafeUnicode: Rule.RuleModule;
