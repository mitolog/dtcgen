import { DynamicClass } from './DynamicClass';
import { ElementType } from './ElementType';
import { SliceConfig } from './SliceConfig';

export interface DtcConfig {
  sketchConfig?: SketchConfig;
  figmaConfig: FigmaConfig;
}

export interface SketchConfig {
  extraction?: SketchExtraction;
  namingRule?: any;
  slice?: SliceConfig;
}

export type SymbolElement<T> = { key: T };

export interface SketchExtraction {
  keywords?: string[];
  dynamicClasses?: DynamicClass[];
  exceptions?: string[];
  followOverrides?: boolean;
  symbols?: { [key in ElementType]: SymbolElement<string> };
}

export interface FigmaConfig {
  slice?: SliceConfig;
}
