import { ColorComponents } from './ColorComponents';

export class Color {
  fill: ColorComponents;
  name?: number;

  constructor(color: Color) {
    this.fill = color.fill;
    if (color.name) {
      this.name = color.name;
    }
  }
}
