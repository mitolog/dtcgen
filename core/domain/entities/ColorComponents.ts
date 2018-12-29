export class ColorComponents {
  alpha: number;
  red: number;
  green: number;
  blue: number;

  constructor(comps: ColorComponents) {
    this.alpha = comps.alpha;
    this.red = comps.red;
    this.green = comps.green;
    this.blue = comps.blue;
  }

  static randomColor(): ColorComponents {
    const randomColor = new ColorComponents(<ColorComponents>{
      alpha: 1,
      red: Math.random(),
      green: Math.random(),
      blue: Math.random(),
    });
    return randomColor;
  }
}
