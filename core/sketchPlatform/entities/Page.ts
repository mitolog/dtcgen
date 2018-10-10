import { Artboard } from './Artboard';

'use strict';

export class Page {
  public static get is(): string {
    return 'linter-core-domain.Page';
  }

  public id: String;
  public name: String;
  //public bounds: String;  // CANBEFIX to some appropreate type
  public artboards: [Artboard];
}
