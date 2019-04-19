import { View } from './View';
import { Color } from './Color';
import { TextAlignment, VerticalTextAlignment } from './TextAlignment';

export enum ButtonType {
  text = 0,
  icon,
  iconAndText,
  toggle, // not implemented yet
  unknown,
}

export class TextStyle {
  fontName?: string;
  fontSize?: number;
  fontColor?: Color;
  alignment?: TextAlignment;
  verticalAlignment?: VerticalTextAlignment;
}

export class Button extends View {
  buttonType: ButtonType;
  textStyle?: TextStyle;
  text?: string;
  hasIcon?: boolean;
}
