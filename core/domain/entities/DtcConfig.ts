import { DynamicClass } from './DynamicClass';
import { ElementType } from './ElementType';
import { SliceConfig } from './SliceConfig';

export interface DtcConfig {
  figmaConfig: FigmaConfig;
}

export interface FigmaConfig {
  slice?: SliceConfig;
}
