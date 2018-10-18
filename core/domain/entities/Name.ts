'use strict';

import { SketchElementType } from './SketchElementType';

export class Name {
  public static get is(): string {
    return 'linter-core-domain.Name';
  }

  constructor(json: any, type: SketchElementType) {
    this.id = json.id;
    this.name = json.name;
    this.type = type;
    this.hints = [];
  }

  public id: string; // unique id derived from original desigin resource
  public name: string; // name derived from original design resource
  public isValid: boolean; // indicates if it passed naming convention
  public hints: string[]; // shows hint if name is something wrong
  // CANBEFIX: can be more abstructed
  public type: SketchElementType; // describes which type of element is it (i.e. symbols, layers, etc...)
}
