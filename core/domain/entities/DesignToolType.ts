export enum DesignToolType {
  sketch = 'sketch',
}
export const DesignToolTypeKeys: string[] = Object.keys(DesignToolType);
export const DesignToolTypeValues: string[] = DesignToolTypeKeys.map(
  k => DesignToolType[k as any],
).map(v => v as string);
