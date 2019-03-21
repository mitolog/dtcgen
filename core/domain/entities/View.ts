import { ElementType } from './ElementType';
import { Constraints } from './Constraints';
import { Container } from './Container';
import { Rect } from './Rect';
import { Color } from './Color';

export class View extends Container {
  isVisible: boolean;
  originalRect: Rect; // hold original rect to use for calculating constraints properly.

  parentId?: string;
  constraints?: Constraints;
  backgroundColor?: Color;
  radius?: number;
}
