import { View } from '../../../domain/entities/View';

export interface IElementParser {
  parse(node: any, view: View);
  parseOverride(node: any, styleType: string, view: View);
  parseSharedStyle(node: any, styleType: string, view: View);
}
