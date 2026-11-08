/**
 * Tests for `@open-tomato/shared-variants` over the fixture tree of
 * `atomic-tree.ts`. The valid cases are a component's own variants, the
 * variants of the lowest level, imports that are not variants files, and
 * files outside any component; the invalid cases are imports of another
 * component's `.variants` file in every form an import is written.
 */
import { sharedVariants } from '../rules/shared-variants.mjs';

import { at, tsxTester } from './atomic-tree';

const BORROWED = [{ messageId: 'borrowed' }];

const CARD = at('molecules/Card/Card.tsx');
const TOUCHABLE_VARIANTS = '../../atoms/Touchable/Touchable.variants';

tsxTester().run('@open-tomato/shared-variants', sharedVariants, {
  valid: [
    { filename: CARD, code: 'import { cardVariants } from \'./Card.variants\';' },
    { filename: at('organisms/Table/components/Row/Row.tsx'), code: 'import { rowVariants } from \'../../Table.variants\';' },
    { filename: CARD, code: 'import { focusVariants } from \'../../particles/focus/focus.variants\';' },
    { filename: CARD, code: 'import { ringVariants } from \'../../particles/ring.variants\';' },
    { filename: CARD, code: 'import { Touchable } from \'../../atoms/Touchable\';' },
    { filename: CARD, code: 'import { styles } from \'some-package/button.variants\';' },
    { filename: at('lib/theme.ts'), code: 'import { touchableVariants } from \'../atoms/Touchable/Touchable.variants\';' },
    {
      filename: CARD,
      code: `import { touchableVariants } from '${TOUCHABLE_VARIANTS}';`,
      options: [{ levels: ['atoms', 'molecules', 'organisms'] }],
    },
  ],
  invalid: [
    { filename: CARD, code: `import { touchableVariants } from '${TOUCHABLE_VARIANTS}';`, errors: BORROWED },
    { filename: CARD, code: `import { touchableVariants } from '${TOUCHABLE_VARIANTS}.ts';`, errors: BORROWED },
    { filename: CARD, code: `import { touchableVariants } from '${TOUCHABLE_VARIANTS}.js';`, errors: BORROWED },
    { filename: CARD, code: `import type { TouchableVariantProps } from '${TOUCHABLE_VARIANTS}';`, errors: BORROWED },
    { filename: CARD, code: `export { touchableVariants } from '${TOUCHABLE_VARIANTS}';`, errors: BORROWED },
    { filename: CARD, code: `const lazy = () => import('${TOUCHABLE_VARIANTS}');`, errors: BORROWED },
    { filename: at('atoms/Chip/Chip.tsx'), code: 'import { touchableVariants } from \'../Touchable/Touchable.variants\';', errors: BORROWED },
    { filename: at('organisms/Header/Header.tsx'), code: 'import { tableVariants } from \'../Table/Table.variants\';', errors: BORROWED },
  ],
});
