import { isNumber } from 'util';

export enum ColorName {
  white = 'White',
  black = 'black',
  clear = 'Clear',
}
export class ColorComponents {
  alpha: number;
  red: number;
  green: number;
  blue: number;

  constructor(comps: ColorComponents) {
    this.alpha = isNumber(comps.alpha) ? comps.alpha : parseFloat(comps.alpha);
    this.red = isNumber(comps.red) ? comps.red : parseFloat(comps.red);
    this.green = isNumber(comps.green) ? comps.green : parseFloat(comps.green);
    this.blue = isNumber(comps.blue) ? comps.blue : parseFloat(comps.blue);
  }

  static colorWith(name: ColorName, alpha?: number) {
    switch (name) {
      case ColorName.black:
        return new ColorComponents(<ColorComponents>{
          alpha: isNumber(alpha) ? alpha : 1,
          red: 0,
          green: 0,
          blue: 0,
        });
        break;
      case ColorName.white:
        return new ColorComponents(<ColorComponents>{
          alpha: isNumber(alpha) ? alpha : 1,
          red: 1,
          green: 1,
          blue: 1,
        });
      case ColorName.clear:
        return ColorComponents.clearColor();
    }
  }

  static clearColor(): ColorComponents {
    const clearColor = new ColorComponents(<ColorComponents>{
      alpha: 0,
      red: 0,
      green: 0,
      blue: 0,
    });
    return clearColor;
  }

  static randomColor(): ColorComponents {
    const randomColor = new ColorComponents(<ColorComponents>{
      alpha: 0.5,
      red: Math.random(),
      green: Math.random(),
      blue: Math.random(),
    });
    return randomColor;
  }
}
