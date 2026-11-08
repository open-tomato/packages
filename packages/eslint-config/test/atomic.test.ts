/**
 * Tests for the `atomic` flavor of `@open-tomato/eslint-config`: the three
 * atomic-layer rules, read the way a project reads them.
 *
 * One `ESLint` instance per config lints files planted in a scratch
 * component tree, `src/<level>/<Name>/…`, since the rules read a layer
 * from the path. Each break reads as a warning (severity 1) under the
 * rule that names it; a story holding the same break reads clean, because
 * the flavor leaves stories and tests out; and `atomic({ levels })` moves
 * the lowest level, so the same variants import reads clean under it.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { ESLint } from 'eslint';

import { atomic } from '../atomic.mjs';

/** The package's directory. */
const PACKAGE_DIR = join(import.meta.dir, '..');

/** The `beforeAll` timeout: the cold ESLint start and the warm-up lint. */
const WARM_UP_TIMEOUT_MS = 30_000;

/** The timeout of each lint case over a warm instance. */
const LINT_CASE_TIMEOUT_MS = 15_000;

/** An atom importing a sibling atom: a same-level import. */
const SAME_LEVEL = 'import { Touchable } from \'../Touchable\';\n\nexport const chip = Touchable;\n';

/** A molecule restyling an atom through `className`. */
const RESTYLE = 'import { Icon } from \'../../atoms/Icon\';\n\nexport function Card() {\n  return <Icon className="p-2" />;\n}\n';

/** A molecule importing an atom's variants file. */
const BORROWED = 'import { touchableVariants } from \'../../atoms/Touchable/Touchable.variants\';\n\nexport const card = touchableVariants;\n';

/** One message of a lint result, reduced to what the cases read. */
interface Finding {
  readonly ruleId: string | null;
  readonly severity: number;
}

let scratch: string;
let flavor: ESLint;
let atomsLowest: ESLint;

/**
 * Plants `source` at `relative` in the scratch tree, lints it with
 * `eslint`, and answers the `@open-tomato/` findings: the planted imports
 * name files that do not exist, so the base's resolver rules fire too.
 */
async function lintPlanted(eslint: ESLint, relative: string, source: string): Promise<Finding[]> {
  const path = join(scratch, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, source, 'utf8');
  const [result] = await eslint.lintFiles([path]);
  if (result === undefined) throw new Error(`ESLint answered no result for ${relative}`);
  return result.messages
    .filter(({ ruleId }) => ruleId?.startsWith('@open-tomato/') === true)
    .map(({ ruleId, severity }) => ({ ruleId, severity }));
}

/** A config file in the scratch directory: the base, the react flavor, and `atomic` built with `call`. */
function plantConfig(name: string, call: string): string {
  const path = join(scratch, name);
  writeFileSync(path, [
    `import baseConfig from '${join(PACKAGE_DIR, 'base.mjs')}';`,
    `import reactConfig from '${join(PACKAGE_DIR, 'react.mjs')}';`,
    `import { atomic } from '${join(PACKAGE_DIR, 'atomic.mjs')}';`,
    `export default [...baseConfig, ...reactConfig, ...${call}];`,
    '',
  ].join('\n'), 'utf8');
  return path;
}

describe('the atomic flavor', () => {
  beforeAll(async () => {
    scratch = mkdtempSync(join(tmpdir(), 'ot-eslint-atomic-'));
    flavor = new ESLint({ cwd: scratch, overrideConfigFile: plantConfig('atomic.config.mjs', 'atomic()') });
    atomsLowest = new ESLint({
      cwd: scratch,
      overrideConfigFile: plantConfig('atoms-lowest.config.mjs', 'atomic({ levels: [\'atoms\', \'molecules\'] })'),
    });
    expect(await lintPlanted(flavor, 'src/atoms/Chip/warm-up.ts', 'export const x = 1;\n')).toEqual([]);
    expect(await lintPlanted(atomsLowest, 'src/atoms/Chip/warm-up-2.ts', 'export const x = 1;\n')).toEqual([]);
  }, WARM_UP_TIMEOUT_MS);

  afterAll(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  it('warns on a same-level import under @open-tomato/layer-imports', async () => {
    const findings = await lintPlanted(flavor, 'src/atoms/Chip/Chip.tsx', SAME_LEVEL);

    expect(findings).toContainEqual({ ruleId: '@open-tomato/layer-imports', severity: 1 });
  }, LINT_CASE_TIMEOUT_MS);

  it('warns on a className handed to an atom under @open-tomato/no-restyle-from-above', async () => {
    const findings = await lintPlanted(flavor, 'src/molecules/Card/Card.tsx', RESTYLE);

    expect(findings).toContainEqual({ ruleId: '@open-tomato/no-restyle-from-above', severity: 1 });
  }, LINT_CASE_TIMEOUT_MS);

  it('warns on a borrowed variants import under @open-tomato/shared-variants', async () => {
    const findings = await lintPlanted(flavor, 'src/molecules/Card/CardBody.ts', BORROWED);

    expect(findings).toContainEqual({ ruleId: '@open-tomato/shared-variants', severity: 1 });
  }, LINT_CASE_TIMEOUT_MS);

  it('leaves stories and tests out', async () => {
    const story = await lintPlanted(flavor, 'src/molecules/Card/Card.stories.tsx', RESTYLE);
    const test = await lintPlanted(flavor, 'src/atoms/Chip/Chip.test.tsx', SAME_LEVEL);

    expect(story).toEqual([]);
    expect(test).toEqual([]);
  }, LINT_CASE_TIMEOUT_MS);

  it('reads the lowest level from the levels it is given', async () => {
    const findings = await lintPlanted(atomsLowest, 'src/molecules/Card/CardFooter.ts', BORROWED);

    expect(findings).toEqual([]);
  }, LINT_CASE_TIMEOUT_MS);
});

describe('atomic', () => {
  it('hands every rule the same levels', () => {
    const levels = ['atoms', 'molecules'];
    const rules = atomic({ levels }).flatMap((block) => Object.values(block.rules ?? {}));

    expect(rules).toHaveLength(3);
    for (const entry of rules) expect(entry).toEqual(['warn', { levels }]);
  });

  it('refuses an empty level list', () => {
    expect(() => atomic({ levels: [] })).toThrow(TypeError);
  });

  it('refuses a level named twice', () => {
    expect(() => atomic({ levels: ['atoms', 'atoms'] })).toThrow(TypeError);
  });
});
