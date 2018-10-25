'use strict';

import { SketchElementType } from './SketchElementType';

export interface NameInterface {
  id: string; // unique id derived from original desigin resource
  name: string; // name derived from original design resource
  isValid: boolean; // indicates if it passed naming convention
  hints: string[]; // shows hint if name is something wrong
  // CANBEFIX: can be more abstructed
  type: SketchElementType; // describes which type of element is it (i.e. symbols, layers, etc...)
}

export class Name implements NameInterface {
  public static get is(): string {
    return 'linter-core-domain.Name';
  }

  constructor(json: any, type: SketchElementType) {
    this.id = json.id;
    this.name = json.name;
    this.type = type;
    this.hints = [];
    this.isValid = true;
  }

  public id: string;
  public name: string;
  public isValid: boolean;
  public hints: string[];
  public type: SketchElementType;
}
