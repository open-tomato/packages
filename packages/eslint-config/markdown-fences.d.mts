/** Types for `markdown-fences.mjs`. */
import type { Linter } from 'eslint';

/** The processor that lints a Markdown file and its code fences. */
export declare const markdownWithFences: Linter.Processor;

/** The Markdown-fences flavor. */
declare const config: Linter.Config[];
export default config;
