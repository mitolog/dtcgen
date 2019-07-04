export enum DesignToolType {
  sketch = 'sketch',
  figma = 'figma',
}
export const DesignToolTypeKeys: string[] = Object.keys(DesignToolType);
export const DesignToolTypeValues: string[] = DesignToolTypeKeys.map(
  k => DesignToolType[k as any],
).map(v => v as string);
