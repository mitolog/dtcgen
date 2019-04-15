import * as _ from 'lodash';
import { View } from '../../../domain/entities/View';
import { IElementParser } from './IElementParser';
import { ElementType } from '../../../domain/entities/ElementType';
import { PathManager } from '../../../utilities/PathManager';
import {
  Gradient,
  FillType,
  ColorComponents,
  ColorFill,
  Color,
} from '../../../domain/Entities';
import { isFillType } from '../../../typeGuards';
import { isNumber } from 'util';

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
  public dynamicClasses(): string[] {
    return _.get(this.config, `extraction.dynamicClasses`, []);
  }

  constructor(sketch: Object, config: Object, outputDir?: string) {
    this.sketch = sketch;
    this.config = config;
    this.pathManager = new PathManager(outputDir);
  }

  /// `node` is current target node which turns out to be an symbol.
  /// `parentNode` can be node on artboad.
  parse(node: any, view: View, parentNode?: any) {
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

  public parseBackground(targetNode: any, view: View, parentNode?: any) {
    // Set radius
    view.radius = targetNode.fixedRadius;

    // Set default backgroundColor in advance
    let fillColorComponents: ColorComponents = ColorComponents.clearColor();
    view.backgroundColor = new Color(<Color>{
      fill: fillColorComponents,
    });

    const hasBackgroundColor = targetNode['hasBackgroundColor'] || false;
    const backgroundColor = targetNode['backgroundColor'] || null;
    if (hasBackgroundColor && backgroundColor) {
      fillColorComponents = new ColorComponents(<ColorComponents>(
        backgroundColor
      ));
      view.backgroundColor = new Color(<Color>{
        fill: fillColorComponents,
      });
    }

    const fillsObj = _.get(targetNode, 'style.fills', null);
    if (fillsObj) {
      this.adoptFill(fillsObj, view);
    }

    if (this.followOverrides) {
      // Parse overrides of "SYMBOLs" if atteined, and assign to the `view`.
      this.parseOverride(targetNode, 'layerStyle', view);
      // Parse overrides of "NODE ON ARTBOARD" if atteined, and assign to the `view`.
      if (parentNode) {
        this.parseOverride(parentNode, 'layerStyle', view);
      }
    }
  }

  abstract parseSharedStyle(node: any, styleType: string, view: View);
  abstract parseOverride(node: any, styleType: string, view: View);

  adoptFill(fillsObj: any, view: View) {
    const fills: ColorFill[] = [];
    for (let fill of fillsObj) {
      const isFillEnabled: boolean = fill['isEnabled'] || false;
      const colorComps: object = fill['color'] || null;
      const fillType: FillType = _.get(fill, 'fillType', null);
      if (!colorComps || fillType === null) {
        continue;
      }

      let colorFill = new ColorFill();

      colorFill.isEnabled = isFillEnabled;
      colorFill.fillType = isFillType(fillType) ? fillType : FillType.fill;
      colorFill.opacity = _.get(fill, 'contextSettings.opacity', 0);
      let colorFillComponents = new ColorComponents({
        alpha: isNumber(colorComps['alpha']) ? colorComps['alpha'] : 0,
        red: isNumber(colorComps['red']) ? colorComps['red'] : 0,
        green: isNumber(colorComps['green']) ? colorComps['green'] : 0,
        blue: isNumber(colorComps['blue']) ? colorComps['blue'] : 0,
      });
      colorFill.color = Color.withFill(colorFillComponents);

      let gradObj = fill['gradient'] || null;
      if (gradObj && fillType === FillType.gradient) {
        colorFill.gradient = new Gradient(gradObj);
        fills.push(colorFill);
      }
    }

    if (fills.length > 0) {
      view.fills = fills;
    }
  }

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
