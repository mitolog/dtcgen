import * as _ from 'lodash';
import {
  ElementType,
  ColorComponents,
  Color,
  TextStyle,
  NavigationBarIOS,
  TreeElement,
  NavigationItemIOS,
} from '../../../domain/Entities';
import { BaseElementParser, SymbolElement } from './BaseElementParser';
import { SymbolParser } from './SymbolParser';
import { TakeOverData } from '../../entities/TakeOverData';

export class NavigationBarParser extends BaseElementParser {
  parse(node: any, view: NavigationBarIOS, treeElement?: TreeElement) {
    super.parse(node, view, treeElement);

    const elements = this.getSymbolElements(ElementType.NavBar);

    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;

      switch (key.toLowerCase()) {
        case 'background':
          this.parseBackground(aLayer, view, node);
          break;
        case 'center':
          this.parseTitle(node, view, aLayer, treeElement);
          break;
        case 'left':
          this.parseItem(node, view, aLayer);
          break;
        case 'right':
          // aLayer shold have `Label`, `Arrow`, `Icon` where Arrow can be default back arrow.
          this.parseItem(node, view, aLayer);
          break;
        default:
          break;
      }
    }
  }

  parseSharedStyle(node: any, styleType: string, view: NavigationBarIOS) {
    throw new Error('Method not implemented.');
  }

  parseOverride(node: any, styleType: string, view: NavigationBarIOS) {
    const sharedStyles: any[] = this.layerStyles;
    // const textLayerStyles = sketch.textLayerStyles;
    if (!node.overrideValues) return null;

    // extract targetOverride
    // TODO: node.overrideValuesには、対象となるstyleType(例えば `layerStyle` )のoverrideは常に1つであるという前提にたっている
    const targetOverride = node.overrideValues
      .filter(overrideValue => {
        const results = overrideValue.overrideName.match(
          new RegExp(styleType, 'g'),
        );
        return results && results.length > 0;
      })
      .reduce((acc, current) => current, 0);
    if (!targetOverride) return null;

    // parse each override objects
    switch (styleType) {
      case 'layerStyle':
        const sharedStyleId = targetOverride['value'];
        const targetStyle = sharedStyles
          .filter(style => style.do_objectID === sharedStyleId)
          .reduce((acc, current) => current, 0);
        if (!targetStyle) return null;
        const fillsObj = _.get(targetStyle, 'value.fills', null);
        if (fillsObj) {
          this.adoptFill(fillsObj, view);
        }
        const shadowsObj = _.get(targetStyle, 'value.shadows', null);
        if (shadowsObj) {
          this.adoptShadow(shadowsObj, view);
        }

        // const comps = new ColorComponents(<ColorComponents>fill.color);
        // const bgColorObj = {
        //   fill: comps,
        //   name: targetStyle['name'],
        // };
        // view.backgroundColor = new Color(<Color>bgColorObj);
        break;
      default:
        break;
    }
  }

  private parseTitle(
    node: any,
    view: NavigationBarIOS,
    aLayer: any,
    treeElement?: TreeElement,
  ) {
    // check if there are `titleText` first
    const overrideValues: Object[] = node['overrideValues'] || [];
    if (this.followOverrides && overrideValues) {
      for (const overrideObj of overrideValues) {
        const overrideName = overrideObj['overrideName'] || null;
        const symbolID = overrideObj['value'] || null;
        if (!overrideName || !overrideName.match(/_symbolID$/) || !symbolID) {
          continue;
        }
        const objId = overrideName.split('_')[0] || null;
        const targetSymbol = this.getSymbolWithSymbolID(symbolID);
        if (!objId || !targetSymbol || !targetSymbol.name.match(/center/gi)) {
          continue;
        }
        for (const ovrObj of overrideValues) {
          const ovrName = ovrObj['overrideName'] || null;
          if (!ovrName || !ovrName.match(/_stringValue$/)) continue;
          const regExp = new RegExp(`${objId}`);
          const matched = ovrName.match(regExp);
          if (matched && matched.length > 0) {
            // assign title
            const titleText = ovrObj['value'];
            if (!titleText) {
              // deal with it as blank title
              return;
            }
            if (!view.navigationItem) {
              view.navigationItem = new NavigationItemIOS();
            }
            view.navigationItem.titleText = titleText;

            // assign text style
            const titleLayers = targetSymbol.layers.filter(layer => {
              const matched = layer.name.match(/title/gi);
              return matched && matched.length > 0;
            });
            if (!titleLayers || titleLayers.length <= 0) return;
            const textStyle = this.parseTextStyle(titleLayers[0]);
            if (textStyle) {
              view.navigationItem.titleTextStyle = textStyle;
            }
            return;
          }
        }
      }
    }

    // check if any `textView` exists, ONLY WHEN there are no `titleText`
    if (view.navigationItem && view.navigationItem.titleText) {
      return;
    }

    if (!treeElement) return;
    const symbolParser = new SymbolParser(
      this.sketch,
      this.config,
      this.pathManager.outputDir,
    );
    const takeOverData = new TakeOverData(aLayer);
    symbolParser.parseSymbol(takeOverData, treeElement, treeElement.uid);
  }

  private parseItem(node: any, view: NavigationBarIOS, aLayer: any) {
    // aLayer shold have `Label`, `Arrow`, `Icon` where Arrow can be default back arrow.
  }

  private parseTextStyle(aLayer: any): TextStyle | null {
    const textStyle: TextStyle = new TextStyle();

    const textAttribute = _.get(
      aLayer,
      'style.textStyle.encodedAttributes',
      null,
    );
    if (!textAttribute) return null;

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
}
