import { ColorComponents } from '../Entities';

export class Color {
  fill: ColorComponents;
  name?: string;

  constructor(color: Color) {
    this.fill = color.fill;
    if (color.name) {
      this.name = color.name;
    }
  }

  static withFill(colorComponents: ColorComponents): Color {
    return new Color({ fill: colorComponents });
  }
}
