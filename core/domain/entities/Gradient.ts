import { isNumber, isArray } from 'util';
import { Point } from './Point';
import { ColorComponents, ColorName } from './ColorComponents';
import { isGradientType } from '../../typeGuards';
import { Color } from './Color';

export class GradientStop {
  position: number; // between 0 to 1, can be both horizontal/vertical
  color: Color;

  constructor(stop: GradientStop) {
    this.position = stop.position;
    this.color = stop.color;
  }

  static parseGradientStops(stopsObj: any): GradientStop[] | null {
    if (!stopsObj || !isArray(stopsObj) || stopsObj.length <= 0) return null;

    const stops: GradientStop[] = [];
    for (const stopObj of stopsObj) {
      let stop = new GradientStop({
        position: parseFloat(stopObj.position) || 0,
        color: Color.withFill(new ColorComponents(stopObj.color)),
      });
      stops.push(stop);
    }
    return stops;
  }

  static defaultGradientStops(): GradientStop[] {
    const stops: GradientStop[] = [];

    const start = new GradientStop({
      position: 0,
      color: Color.withFill(ColorComponents.colorWith(ColorName.black, 1)),
    });
    const stop = new GradientStop({
      position: 1,
      color: Color.withFill(ColorComponents.colorWith(ColorName.black, 0)),
    });

    stops.push(start);
    stops.push(stop);
    return stops;
  }
}

export enum GradientType {
  linear = 0,
  radial,
  angular,
}

export const GradientTypeValues: number[] = [
  GradientType.linear,
  GradientType.radial,
  GradientType.angular,
];

export class Gradient {
  from: Point; // can be both horizontal/vertical
  to: Point; // can be both horizontal/vertical
  type: GradientType;
  elipseLength: number; // can be both horizontal/vertical
  stops: GradientStop[];

  constructor(obj: any) {
    this.elipseLength = isNumber(obj.elipseLength)
      ? obj.elipseLength
      : parseFloat(obj.elipseLength) || 0;

    this.from = Point.parsePoint(obj.from) || new Point({ x: 0, y: 0 });
    this.to = Point.parsePoint(obj.to) || new Point({ x: 1, y: 1 });
    this.type = isGradientType(obj.gradientType)
      ? obj.gradientType
      : GradientType.linear;
    this.stops =
      GradientStop.parseGradientStops(obj.stops) ||
      GradientStop.defaultGradientStops();
  }
}
