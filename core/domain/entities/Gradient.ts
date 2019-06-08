import { isNumber, isString, isArray } from 'util';
import { Color } from './Color';
import { ColorComponents, ColorName } from './ColorComponents';
import { Point } from './Point';
import { isPoint } from '../../typeGuards';

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

  constructor(obj: Gradient) {
    this.elipseLength = isNumber(obj.elipseLength)
      ? obj.elipseLength
      : parseFloat(obj.elipseLength) || 0;

    const fromPoint =
      isPoint(obj.from) && isString(obj.from)
        ? Point.parsePoint(obj.from)
        : null;

    const toPoint =
      isPoint(obj.to) && isString(obj.to) ? Point.parsePoint(obj.to) : null;

    this.from = fromPoint || new Point({ x: 0, y: 0 });
    this.to = toPoint || new Point({ x: 1, y: 1 });

    this.stops =
      GradientStop.parseGradientStops(obj.stops) ||
      GradientStop.defaultGradientStops();

    this.type = obj.type || GradientType.linear;
  }
}
