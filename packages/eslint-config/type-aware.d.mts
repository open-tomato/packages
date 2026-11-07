/** Types for `type-aware.mjs`. */
import type { Linter } from 'eslint';

/** Options of {@link typeAware}. */
export interface TypeAwareOptions {
  /** The folder of the project's `tsconfig.json`: pass `import.meta.dirname`. */
  readonly tsconfigRootDir: string;
  /** The files the type-aware rules cover; every TypeScript file by default. */
  readonly files?: string[];
}

/** The type-aware blocks for one project. */
export declare function typeAware(options: TypeAwareOptions): Linter.Config[];
export default typeAware;
