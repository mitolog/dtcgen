import { Color } from './Color';
import { Size } from './Size';

export class Shadow {
  isEnabled: boolean;
  color: Color;
  opacity: number; // between 0 to 1 with floating points
  radius: number;
  offset: Size;
}
