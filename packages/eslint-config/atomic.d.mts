/** Types for `atomic.mjs`. */
import type { Linter } from 'eslint';

/** Options of {@link atomic}. */
export interface AtomicOptions {
  /** The level folders under `src/`, lowest first. Defaults to the plugin's `DEFAULT_LEVELS`. */
  readonly levels?: readonly string[];
}

/** The atomic flavor, built with the given levels. */
export declare function atomic(options?: AtomicOptions): Linter.Config[];

/** The atomic flavor, with the default levels. */
declare const config: Linter.Config[];
export default config;
