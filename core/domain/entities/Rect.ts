export class Rect {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(rect: Rect) {
    this.x = rect.x;
    this.y = rect.y;
    this.width = rect.width;
    this.height = rect.height;
  }
}
