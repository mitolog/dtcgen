import { Color } from './Color';
import { Gradient } from './Gradient';

export enum FillType {
  fill = 0,
  gradient = 1,
  image = 4,
  noise = 5,
}

export const FillTypeValues: number[] = [
  FillType.fill,
  FillType.gradient,
  FillType.image,
  FillType.noise,
];

export class ColorFill {
  isEnabled: boolean;
  color: Color;
  opacity: number; // between 0 to 1 with floating points
  fillType: FillType;
  gradient?: Gradient;
}
