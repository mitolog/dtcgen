'use strict';

export enum SketchElementType {
  Page = 0,
  Artboard,
  Layer,
  Symbol,
  Group,
  Export,
}

// exports names of sketchElementTypes.
// should be same count with enum count.
export const sketchElementTypes = [
  SketchElementType[0],
  SketchElementType[1],
  SketchElementType[2],
  SketchElementType[3],
  SketchElementType[4],
  SketchElementType[5],
];
