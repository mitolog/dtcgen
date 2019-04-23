import { Color } from './Color';

export enum TextAlignment {
  EqualWidth = 0,
  Right = 1,
  Center = 2,
  Left = 3,
}

export enum VerticalTextAlignment {
  up = 0,
  middle,
  bottom,
}

export class TextStyle {
  fontName?: string;
  fontSize?: number;
  fontColor?: Color;
  alignment?: TextAlignment;
  verticalAlignment?: VerticalTextAlignment;
}
