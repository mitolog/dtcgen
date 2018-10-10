'use strict';

import { SketchElementType } from './SketchElementType';

export class Name {
  public static get is(): string {
    return 'linter-core-domain.Name';
  }

  public id: String; // unique id derived from original desigin resource
  public name: String; // name derived from original design resource
  public isValid: Boolean; // indicates if it passed naming convention
  public hint: String; // shows hint if name is something wrong
  // CANBEFIX: can be more abstructed
  public type: SketchElementType; // describes which type of element is it (i.e. symbols, layers, etc...)
}
