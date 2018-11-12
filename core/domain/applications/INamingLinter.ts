import { LayerName } from '../entities/LayerName';

export interface INamingLinter {
  config: any; // todo: prepare some type for config object
  lint(layers: LayerName[], type: string); // type should be platform specific type string like 'artboard'
  isMatchedPattern(name: LayerName, str: string): [boolean, string?];
  isUpperCamelCase(name: LayerName): [boolean, string?];
  isLowerCamelCase(name: LayerName): [boolean, string?];
  isUnique(names: LayerName[]): [boolean, LayerName[]?];
  isAlphabetOnly(name: LayerName): [boolean, string?];
  isLessThanMaxLength(name: LayerName, count: number): [boolean, string?];
}
