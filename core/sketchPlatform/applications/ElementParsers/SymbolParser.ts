import * as _ from 'lodash';
import { View } from '../../../domain/entities/View';
import { IElementParser } from './IElementParser';
import { ElementType } from '../../../domain/entities/ElementType';
import { PathManager } from '../../../utilities/PathManager';

export type SymbolElement<T> = { key: T };
export abstract class SymbolParser implements IElementParser {
  private sketch: Object;
  private config: Object;

  public pathManager: PathManager;
  public subLayers?: any[];
  public get followOverrides(): boolean {
    return this.config['extraction'].followOverrides;
  }
  public get layerStyles(): any[] {
    return this.sketch['layerStyles'];
  }

  constructor(sketch: Object, config: Object, outputDir?: string) {
    this.sketch = sketch;
    this.config = config;
    this.pathManager = new PathManager(outputDir);
  }

  parse(node: any, view: View) {
    const symbolsPage = this.sketch['symbolsPage'];
    const targetSymbol = symbolsPage.get(
      'symbolMaster',
      instance => instance.symbolID === node.symbolID,
    );
    if (
      !targetSymbol ||
      !targetSymbol.layers ||
      targetSymbol.layers.length <= 0
    )
      return;

    // TBD: exclude 'shapeGroup' because it's info is too large to deal with at this time.
    this.subLayers = targetSymbol.layers.filter(
      layer => layer._class !== 'shapeGroup',
    );
  }

  abstract parseSharedStyle(node: any, styleType: string, view: View);
  abstract parseOverride(node: any, styleType: string, view: View);

  getSymbolElements(
    elementType: ElementType,
  ): SymbolElement<string> | undefined {
    return _.get(this.config, `extraction.symbols.${elementType}`);
  }

  getSubLayerFor(key: string, elements: SymbolElement<string>): any {
    if (!this.subLayers || this.subLayers.length <= 0) return null;
    const matchedLayers = this.subLayers.filter(
      layer => layer.name === key && layer._class === elements[key],
    );
    return matchedLayers[0];
  }
}
