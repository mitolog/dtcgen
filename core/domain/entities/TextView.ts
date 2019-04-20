import { View } from './View';
import { TextStyle } from './TextStyle';

export enum TextViewType {
  label = 0,
  input,
  textView,
}
export class TextView extends View {
  textViewType: TextViewType;
  text?: string;
  placeHolder?: string;
  textStyle?: TextStyle;
}
