/**
 * Tests for `@open-tomato/no-restyle-from-above` over the fixture tree of
 * `atomic-tree.ts`. The valid cases are component elements given the
 * passthrough or no `className`, plain DOM elements, elements from a
 * package, the component's own folder or its own file, and files outside
 * any component; the invalid cases are every other `className` handed to
 * a component imported from another component's folder.
 */
import { noRestyleFromAbove } from '../rules/no-restyle-from-above.mjs';

import { at, tsxTester } from './atomic-tree';

const RESTYLE = [{ messageId: 'restyle' }];

const FILES_CHANGED = at('molecules/FilesChanged/FilesChanged.tsx');
const WIZARD = at('molecules/Wizard/Wizard.tsx');

/** A module that imports `Icon` from the atoms and returns `jsx`. */
function withIcon(jsx: string): string {
  return `import { Icon } from '../../atoms/Icon';\nexport function C({ className }: Props) { return ${jsx}; }`;
}

tsxTester().run('@open-tomato/no-restyle-from-above', noRestyleFromAbove, {
  valid: [
    { filename: FILES_CHANGED, code: withIcon('<Icon name="file" />') },
    { filename: FILES_CHANGED, code: withIcon('<Icon name="file" className={className} />') },
    { filename: FILES_CHANGED, code: withIcon('<div className={rowVariants()}><Icon name="file" /></div>') },
    {
      filename: FILES_CHANGED,
      code: 'import { Slot } from \'@radix-ui/react-slot\';\nexport const C = () => <Slot className={slotVariants()} />;',
    },
    {
      filename: FILES_CHANGED,
      code: 'import { Row } from \'./Row\';\nexport const C = () => <Row className={rowVariants()} />;',
    },
    {
      filename: FILES_CHANGED,
      code: 'const Row = () => null;\nexport const C = () => <Row className="gap-2" />;',
    },
    {
      filename: FILES_CHANGED,
      code: withIcon('<>{[1].map((Icon) => <Icon className="gap-2" />)}</>'),
    },
    {
      filename: FILES_CHANGED,
      code: 'import Icon = require(\'../../atoms/Icon\');\nexport const C = () => <Icon className="p-2" />;',
    },
    {
      filename: at('stories/Demo.tsx'),
      code: 'import { Icon } from \'../atoms/Icon\';\nexport const C = () => <Icon className="p-2" />;',
    },
    {
      filename: at('atoms/index.tsx'),
      code: 'import { Icon } from \'./Icon\';\nexport const C = () => <Icon className="p-2" />;',
    },
  ],
  invalid: [
    { filename: FILES_CHANGED, code: withIcon('<Icon name="file" className={filesChangedIcon()} />'), errors: RESTYLE },
    { filename: FILES_CHANGED, code: withIcon('<Icon className="p-2" />'), errors: RESTYLE },
    { filename: FILES_CHANGED, code: withIcon('<Icon className={cn(iconVariants(), className)} />'), errors: RESTYLE },
    { filename: FILES_CHANGED, code: withIcon('<Icon className />'), errors: RESTYLE },
    {
      filename: FILES_CHANGED,
      code: 'import Icon from \'../../atoms/Icon\';\nexport const C = () => <Icon className={x()} />;',
      errors: RESTYLE,
    },
    {
      filename: FILES_CHANGED,
      code: 'import { Menu } from \'../../atoms/Menu\';\nexport const C = () => <Menu.Item className={x()} />;',
      errors: RESTYLE,
    },
    {
      filename: FILES_CHANGED,
      code: 'import * as Atoms from \'../../atoms\';\nexport const C = () => <Atoms.Icon className={x()} />;',
      errors: RESTYLE,
    },
    {
      filename: WIZARD,
      code: 'import { Stepper } from \'../Stepper\';\nexport const C = () => <Stepper className={wizardStepper()} />;',
      errors: RESTYLE,
    },
  ],
});
