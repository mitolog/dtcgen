import { View } from './View';
import { TextStyle } from './TextStyle';

export class TextInput extends View {
  isEditable: boolean;
  showsUnderline: boolean;
  showsLabel: boolean;

  text?: string;
  placeHolder?: string;
  assistiveText?: string;
  errorText?: string;
  textStyle?: TextStyle;
}
