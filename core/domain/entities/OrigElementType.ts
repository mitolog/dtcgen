export enum ElementType {
  // ここがjsonをみて動的にsemanticな要素名が決まる?
  Page = 0,
  Artboard,
  Symbol,
}

// exports names of sketchElementTypes.
// should be same count with enum count.
export const ElementTypes = [ElementType[0], ElementType[1], ElementType[2]];
