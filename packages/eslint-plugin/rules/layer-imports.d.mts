/**
 * Types for `layer-imports.mjs`, so its TypeScript test reads the export typed
 * rather than as an implicit `any`.
 */
import type { Rule } from 'eslint';

/** The rule itself. */
export declare const layerImports: Rule.RuleModule;
