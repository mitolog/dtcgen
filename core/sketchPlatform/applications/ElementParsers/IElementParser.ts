import { View } from '../../../domain/entities/View';
import { TreeElement } from '../../../domain/Entities';

export interface IElementParser {
  parse(node: any, view: View, treeElement?: TreeElement);
  parseOverride(node: any, styleType: string, view: View);
  parseSharedStyle(node: any, styleType: string, view: View);
}
