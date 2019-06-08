import { Color, Size } from '../Entities';

export class Shadow {
  isEnabled: boolean;
  color: Color;
  opacity: number; // between 0 to 1 with floating points
  radius: number;
  offset: Size;
}
