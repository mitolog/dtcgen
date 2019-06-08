import { isString } from 'util';

export class Point {
  x: number;
  y: number;

  public static parsePoint(obj: any): Point | null {
    if (!isString(obj)) return null;

    let numbers: number[] = obj.match(/[0-9.e-]+/gi).map(str => {
      return parseFloat(str);
    });
    return new Point({ x: numbers[0], y: numbers[1] });
  }

  constructor(point: Point) {
    this.x = point.x <= Number.EPSILON ? 0 : point.x;
    this.y = point.y <= Number.EPSILON ? 0 : point.y;
  }
}
