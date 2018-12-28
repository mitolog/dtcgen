export enum OSType {
  ios = 'ios',
  android = 'android',
}
export const OSTypeKeys: string[] = Object.keys(OSType);
export const OSTypeValues: string[] = OSTypeKeys.map(k => OSType[k as any]).map(
  v => v as string,
);
