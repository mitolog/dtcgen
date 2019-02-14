import { ElementType } from './ElementType';
import { Constraints } from './Constraints';
import { Container } from './Container';
import { Rect } from './Rect';
import { Color } from './Color';
import { ColorComponents } from './ColorComponents';

export class View extends Container {
  isVisible: boolean;
  originalRect: Rect; // hold original rect to use for calculating constraints properly.

  overrideOriginId?: string;
  parentId?: string;
  constraints?: Constraints;
  backgroundColor?: Color;
  radius?: number;
}
