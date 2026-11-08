/**
 * Tests for `@open-tomato/layer-imports` over the fixture tree of
 * `atomic-tree.ts`. The valid cases are lower-level imports, imports inside
 * the component's own folder, imports that leave the levels, files that
 * belong to no component, and the `Basic<Folder>` barrel exception; the
 * invalid cases are same-level and higher-level imports in every form an
 * import is written.
 */
import { layerImports } from '../rules/layer-imports.mjs';

import { at, tsxTester } from './atomic-tree';

const SAME = [{ messageId: 'sameLevel' }];
const HIGHER = [{ messageId: 'higherLevel' }];

const CHIP = at('atoms/Chip/Chip.tsx');
const ICON_BUTTON = at('atoms/IconButton/IconButton.tsx');
const CARD = at('molecules/Card/Card.tsx');

tsxTester().run('@open-tomato/layer-imports', layerImports, {
  valid: [
    { filename: CARD, code: 'import { Button } from \'../../atoms/Button\';' },
    { filename: CARD, code: 'import { cardVariants } from \'./Card.variants\';' },
    { filename: CARD, code: 'import { CardHeader } from \'./CardHeader\';' },
    { filename: CARD, code: 'import { focusVariants } from \'../../particles/focus/focus.variants\';' },
    { filename: CARD, code: 'import { cn } from \'../../lib/cn\';' },
    { filename: CARD, code: 'import { useState } from \'react\';' },
    { filename: CARD, code: 'import { Card } from \'@/molecules/Card\';' },
    { filename: CARD, code: 'import { Button } from \'../../atoms\';' },
    { filename: at('organisms/Table/components/Row/Row.tsx'), code: 'import { rowVariants } from \'../../Table.variants\';' },
    { filename: at('atoms/index.ts'), code: 'export * from \'./Button\';\nexport * from \'./Chip\';' },
    { filename: at('stories/Demo.tsx'), code: 'import { Table } from \'../organisms/Table\';' },
    { filename: at('lib/cn.ts'), code: 'import { Button } from \'../atoms/Button\';' },
    { filename: ICON_BUTTON, code: 'import { BasicButton } from \'../Button\';' },
    { filename: ICON_BUTTON, code: 'import { BasicButton } from \'../Button/index\';' },
    { filename: ICON_BUTTON, code: 'import { BasicButton } from \'../Button/index.ts\';' },
    { filename: ICON_BUTTON, code: 'import { BasicButton as Base } from \'../Button\';' },
    { filename: ICON_BUTTON, code: 'import type { BasicButton } from \'../Button\';' },
    { filename: ICON_BUTTON, code: 'export { BasicButton } from \'../Button\';' },
    { filename: at('molecules/Profile/Profile.tsx'), code: 'import { BasicCard } from \'../Card\';' },
    {
      filename: at('widgets/Panel/Panel.tsx'),
      code: 'import { Card } from \'../Card\';',
      options: [{ levels: ['atoms', 'molecules'] }],
    },
  ],
  invalid: [
    { filename: CHIP, code: 'import { Touchable } from \'../Touchable\';', errors: SAME },
    { filename: CHIP, code: 'import { touchableVariants } from \'../Touchable/Touchable.variants\';', errors: SAME },
    { filename: CHIP, code: 'import { Icon } from \'../index\';', errors: SAME },
    { filename: CHIP, code: 'import \'../Touchable/touchable.css\';', errors: SAME },
    { filename: CHIP, code: 'const lazy = () => import(\'../Touchable\');', errors: SAME },
    { filename: CHIP, code: 'export * from \'../Touchable\';', errors: SAME },
    { filename: at('atoms/Button/Button.tsx'), code: 'import { Card } from \'../../molecules/Card\';', errors: HIGHER },
    { filename: CARD, code: 'import { Table } from \'../../organisms/Table\';', errors: HIGHER },
    { filename: at('organisms/Header/Header.tsx'), code: 'import { tableVariants } from \'../Table/Table.variants\';', errors: SAME },
    { filename: ICON_BUTTON, code: 'import { Button } from \'../Button\';', errors: SAME },
    { filename: ICON_BUTTON, code: 'import { BasicButton, Button } from \'../Button\';', errors: SAME },
    { filename: ICON_BUTTON, code: 'import BasicButton from \'../Button\';', errors: SAME },
    { filename: ICON_BUTTON, code: 'import * as ButtonParts from \'../Button\';', errors: SAME },
    { filename: ICON_BUTTON, code: 'import { BasicButton } from \'../Button/BasicButton\';', errors: SAME },
    { filename: at('molecules/Profile/Profile.tsx'), code: 'import { BasicCard } from \'../Banner\';', errors: SAME },
    { filename: at('molecules/Profile/Profile.tsx'), code: 'import { BasicBanner } from \'../Card\';', errors: SAME },
    {
      filename: at('widgets/Panel/Panel.tsx'),
      code: 'import { Tile } from \'../Tile\';',
      options: [{ levels: ['atoms', 'widgets'] }],
      errors: SAME,
    },
  ],
});
