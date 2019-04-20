import { View } from './View';
import { TextStyle } from './TextStyle';

export enum ButtonType {
  text = 0,
  icon,
  iconAndText,
  toggle, // not implemented yet
  unknown,
}

export class Button extends View {
  buttonType: ButtonType;
  textStyle?: TextStyle;
  text?: string;
  hasIcon?: boolean;
}
