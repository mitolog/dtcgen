import { View } from './View';
import { Color } from './Color';
import { TextAlignment } from './TextAlignment';

export class TextView extends View {
  fontName: string;
  fontSize: number;
  fontColor: Color;
  backgroundColor?: Color;
  text?: string;
  alignment?: TextAlignment;
}
