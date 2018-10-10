import { Rect } from './rect';

'use strict';

export class Artboard {
  public static get is(): string {
    return 'linter-core-domain.Artboard';
  }

  public id: String;
  public name: String;
  public bounds: String; // CANBEFIX: to some appropreate type
  public rect: Rect;
}
