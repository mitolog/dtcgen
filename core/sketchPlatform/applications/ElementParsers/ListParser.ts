import * as _ from 'lodash';
import { ElementType, View, TreeElement } from '../../../domain/Entities';
import { BaseElementParser } from './BaseElementParser';
import { TakeOverData } from '../../entities/TakeOverData';
import { SymbolParser } from './SymbolParser';

export class ListParser extends BaseElementParser {
  parse(node: any, view: View, treeElement?: TreeElement) {
    super.parse(node, view, treeElement);

    const elements = this.getSymbolElements(ElementType.List);
    for (const key of Object.keys(elements)) {
      const matched: any[] = this.getSubLayers(key, elements);
      if (!matched) continue;

      for (const aLayer of matched) {
        switch (key.toLowerCase()) {
          case 'background':
            this.parseBackground(aLayer, view, node);
            break;
          case 'cell':
            if (!treeElement) break;
            const symbolParser = new SymbolParser(
              this.getSketch(),
              this.getConfig(),
              this.pathManager.outputDir,
            );
            // assuming aLayer: cell(_class=symbolInstance), node: List(_class=group)
            const takeOverData = new TakeOverData(aLayer);
            symbolParser.parseSymbol(
              takeOverData,
              treeElement,
              treeElement.uid,
            );
            break;
        }
      }
    }
  }

  parseSharedStyle(node: any, styleType: string, view: View) {
    //throw new Error('Method not implemented.');
  }

  parseOverride(node: any, styleType: string, view: View) {
    //throw new Error('Method not implemented.');
  }

  /* Private methods below */
}
