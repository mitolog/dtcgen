import { ElementType } from './ElementType';

export interface ILayerName {
  id: string; // unique id derived from original desigin resource
  name: string; // name derived from original design resource
  type: ElementType; // describes which type of element is it (i.e. symbols, layers, etc...)
  hints: string[]; // shows hint if name is something wrong
  layers?: ILayerName[]; // can take sub layerName object
  isValid(): boolean; // indicates if it passed naming convention
}

export class LayerName implements ILayerName {
  constructor(
    id: string,
    name: string,
    type: ElementType,
    layers?: ILayerName[],
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.layers = layers;
    this.hints = [];
  }

  public id: string;
  public name: string;
  public hints: string[];
  public type: ElementType;
  public layers?: LayerName[];

  isValid(): boolean {
    return this.hints.length <= 0 ? true : false;
  }
}
