import { View } from './View';

export enum MapType {
  standard,
  satellite,
  hybrid,
}

export class MapView extends View {
  mapType?: MapType;
  isZoomEnabled?: boolean;
  isScrollEnabled?: boolean;
  isRotateEnabled?: boolean;
}
