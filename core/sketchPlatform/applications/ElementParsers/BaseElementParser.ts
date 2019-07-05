import * as _ from 'lodash';
import { isNumber, isBoolean } from 'util';
import { IElementParser } from './IElementParser';
import { PathManager } from '../../../utilities/Utilities';
import {
  View,
  Gradient,
  FillType,
  ColorComponents,
  ColorFill,
  Color,
  TreeElement,
  Shadow,
  Size,
  TextStyle,
  DynamicClass,
  ElementType,
  SymbolElement,
} from '../../../domain/Entities';
import { isFillType, isDynamicClass } from '../../../typeGuards';

export abstract class BaseElementParser implements IElementParser {
  public sketch: Object;
  public config: Object;

  public pathManager: PathManager;
  public subLayers?: any[];
  public get followOverrides(): boolean {
    return this.config['extraction'].followOverrides;
  }
  public get layerStyles(): any[] {
    return this.sketch['layerStyles'];
  }
  public dynamicClasses(): DynamicClass[] {
    const dynamicClasses = _.get(this.config, `extraction.dynamicClasses`, []);
    if (!dynamicClasses || dynamicClasses.length <= 0) return [];
    const attained: DynamicClass[] = [];
    for (const classObj of dynamicClasses) {
      const dynamicClass = new DynamicClass(classObj);
      if (isDynamicClass(dynamicClass)) {
        attained.push(dynamicClass);
      }
    }
    return attained;
  }

  constructor(sketch: Object, config: Object, outputDir?: string) {
    this.sketch = sketch;
    this.config = config;
    this.pathManager = new PathManager(outputDir);
  }

  // just set sublayer here.
  parse(node: any, view: View, treeElement?: TreeElement) {
    const symbolId: string | null = node.symbolID || null;
    if (!symbolId) {
      // node is an element on "artboard".
      this.subLayers = node.layers.filter(
        layer => layer._class !== 'shapeGroup',
      );
      return;
    }

    // node shuold be a symbol instance.
    const targetSymbol = this.getSymbolWithSymbolID(node.symbolID);
    if (!targetSymbol.layers || targetSymbol.layers.length <= 0) return;

    // TBD: exclude 'shapeGroup' because it's info is too large to deal with at this time.
    this.subLayers = targetSymbol.layers.filter(
      layer => layer._class !== 'shapeGroup',
    );
  }

  parseBackground(targetNode: any, view: View, parentNode?: any) {
    // Set radius
    view.radius = targetNode.fixedRadius;

    const hasBackgroundColor = targetNode['hasBackgroundColor'] || false;
    const backgroundColor = targetNode['backgroundColor'] || null;
    if (hasBackgroundColor && backgroundColor) {
      const fillColorComponents = new ColorComponents(<ColorComponents>(
        backgroundColor
      ));
      view.backgroundColor = new Color(<Color>{
        fill: fillColorComponents,
      });
    }

    const fillsObj = _.get(targetNode, 'style.fills', null);
    if (fillsObj) {
      const fills = this.getFills(fillsObj);
      if (fills) {
        view.fills = fills;
      }
    }

    const shadowsObj = _.get(targetNode, 'style.shadows', null);
    if (shadowsObj) {
      this.adoptShadow(shadowsObj, view);
    }

    if (this.followOverrides) {
      // Parse overrides of "SYMBOLs" if atteined, and assign to the `view`.
      this.parseOverride(targetNode, 'layerStyle', view);
      // Parse overrides of "NODE ON ARTBOARD" if atteined, and assign to the `view`.
      if (parentNode) {
        this.parseOverride(parentNode, 'layerStyle', view);
      }
    }
    // // just for testing
    // view.backgroundColor = new Color(<Color>{
    //   fill: ColorComponents.randomColor(),
    // });
  }

  parseTextStyle(aLayer: any): TextStyle | null {
    const textStyle: TextStyle = new TextStyle();

    const textAttribute = _.get(
      aLayer,
      'style.textStyle.encodedAttributes',
      null,
    );
    if (!textAttribute) return;

    const fontObj = textAttribute['MSAttributedStringFontAttribute'] || null;
    if (fontObj) {
      textStyle.fontName = _.get(fontObj, 'attributes.name', null);
      textStyle.fontSize = _.get(fontObj, 'attributes.size', null);
    }
    const colorObj = textAttribute['MSAttributedStringColorAttribute'] || null;
    if (colorObj) {
      const comps = new ColorComponents(<ColorComponents>colorObj);
      textStyle.fontColor = new Color(<Color>{ fill: comps });
    }
    const alignment = _.get(textAttribute, 'paragraphStyle.alignment', null);
    textStyle.alignment = alignment !== null ? alignment : null;
    const vAlignment = textStyle['verticalAlignment'];
    if (vAlignment !== null) {
      textStyle.verticalAlignment = vAlignment;
    }

    return textStyle;
  }

  abstract parseSharedStyle(node: any, styleType: string, view: View);
  abstract parseOverride(node: any, styleType: string, view: View);

  getFills(fillsObj: any): ColorFill[] | null {
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
      colorFill.opacity = _.get(fill, 'contextSettings.opacity', 1);
      let colorFillComponents = new ColorComponents({
        alpha: isNumber(colorComps['alpha']) ? colorComps['alpha'] : 0,
        red: isNumber(colorComps['red']) ? colorComps['red'] : 0,
        green: isNumber(colorComps['green']) ? colorComps['green'] : 0,
        blue: isNumber(colorComps['blue']) ? colorComps['blue'] : 0,
      });
      colorFill.color = Color.withFill(colorFillComponents);

      let gradObj = fill['gradient'] || null;
      if (gradObj && fillType === FillType.gradient) {
        gradObj['type'] = gradObj['gradientType'] || null;
        colorFill.gradient = new Gradient(gradObj);
      }
      fills.push(colorFill);
    }

    return fills.length > 0 ? fills : null;
  }

  adoptShadow(shadowsObj: any, view: View) {
    const shadows: Shadow[] = [];
    for (let shadowObj of shadowsObj) {
      const isEnabled: boolean = isBoolean(shadowObj['isEnabled'])
        ? shadowObj['isEnabled']
        : false;
      const colorComps: object = shadowObj['color'] || null;
      const offsetX: number = isNumber(shadowObj['offsetX'])
        ? shadowObj['offsetX']
        : 0;
      const offsetY: number = isNumber(shadowObj['offsetY'])
        ? shadowObj['offsetY']
        : 0;
      const radius: number = isNumber(shadowObj['blurRadius'])
        ? shadowObj['blurRadius']
        : 0;

      if (!colorComps) {
        continue;
      }

      let shadow = new Shadow();
      shadow.isEnabled = isEnabled;
      shadow.opacity = _.get(shadowObj, 'contextSettings.opacity', 1);
      shadow.offset = new Size({ width: offsetX, height: offsetY });
      shadow.radius = radius;

      let colorFillComponents = new ColorComponents({
        alpha: isNumber(colorComps['alpha']) ? colorComps['alpha'] : 0,
        red: isNumber(colorComps['red']) ? colorComps['red'] : 0,
        green: isNumber(colorComps['green']) ? colorComps['green'] : 0,
        blue: isNumber(colorComps['blue']) ? colorComps['blue'] : 0,
      });
      shadow.color = Color.withFill(colorFillComponents);

      shadows.push(shadow);
    }

    if (shadows.length > 0) {
      view.shadows = shadows;
    }
  }

  getSymbolElements(
    elementType: ElementType,
  ): SymbolElement<string> | undefined {
    return _.get(this.config, `extraction.symbols.${elementType}`);
  }

  getSubLayers(key: string, elements: SymbolElement<string>): any[] {
    if (!this.subLayers || this.subLayers.length <= 0) return null;
    const matchedLayers = this.subLayers.filter(layer => {
      const matched = layer.name.match(new RegExp(key, 'g'));
      return matched && matched.length > 0 && layer._class === elements[key];
    });
    return matchedLayers;
  }

  getSubLayerFor(key: string, elements: SymbolElement<string>): any {
    if (!this.subLayers || this.subLayers.length <= 0) return null;
    const matchedLayers = this.subLayers.filter(layer => {
      const matched = layer.name.match(new RegExp(key, 'gi'));
      return matched && matched.length > 0 && layer._class === elements[key];
    });
    return matchedLayers[0];
  }

  /// retrieve symbol instance with symbolID
  getSymbolWithSymbolID(id?: string): any {
    if (!id) return null;

    const symbolsPage = this.sketch['symbolsPage'];
    const targetSymbol = symbolsPage.get(
      'symbolMaster',
      instance => instance.symbolID === id,
    );
    if (!targetSymbol) return null;
    return targetSymbol;
  }
}
