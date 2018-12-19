import { View } from './View';
import { Color } from './Color';

export class Button extends View {
  fontName: string;
  fontSize: number;
  fontColor: Color;
  backgroundColor?: Color;
  radius?: number;
  hasIcon?: boolean;
}
