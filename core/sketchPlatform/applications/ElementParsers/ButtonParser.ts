import * as _ from 'lodash';
import {
  ElementType,
  ColorComponents,
  Color,
  Button,
  ButtonType,
  TextStyle,
} from '../../../domain/Entities';
import { SymbolParser, SymbolElement } from './SymbolParser';

export class ButtonParser extends SymbolParser {
  parse(node: any, button: Button) {
    super.parse(node, button);

    const elements = this.getSymbolElements(ElementType.Button);

    button.buttonType = this.distinctButtonType(elements);

    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;

      switch (key.toLowerCase()) {
        case 'icon':
          button.hasIcon = true;
          break;
        case 'background':
          this.parseBackground(aLayer, button, node);
          break;
        case 'label':
          this.parseLabel(node, button, aLayer);
          break;
        default:
          break;
      }
    }
  }

  parseSharedStyle(node: any, styleType: string, button: Button) {
    throw new Error('Method not implemented.');
  }

  parseOverride(node: any, styleType: string, button: Button) {
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

    /**
     * 5-3. 3で取得したsymbolMasterオブジェクトのlayers[]を走査し、5-2で取得したID部分と、layers[].do_objectIDとが同じであればソレが対象レイヤ
        (sharedStyleまで追うかどうかを設定で切り替えられてもいいかも)
        ↑のマッチングをスキップしてる。もしかすると必要かも。
      */

    // parse each override objects
    switch (styleType) {
      case 'layerStyle':
        const sharedStyleId = targetOverride['value'];
        const targetStyle = sharedStyles
          .filter(style => style.do_objectID === sharedStyleId)
          .reduce((acc, current) => current, 0);
        if (!targetStyle) return null;
        const fill = targetStyle['value']['fills'][0];
        const comps = new ColorComponents(<ColorComponents>fill.color);
        const bgColorObj = {
          fill: comps,
          name: targetStyle['name'],
        };
        button.backgroundColor = new Color(<Color>bgColorObj);
        break;

      case 'stringValue':
        button.text = targetOverride['value'];
        break;

      default:
        break;
    }
  }

  private distinctButtonType(elements: SymbolElement<string>): ButtonType {
    if (!elements) return ButtonType.unknown;

    let buttonType: ButtonType = ButtonType.unknown;
    const matchedkeys: string[] = [];
    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;
      matchedkeys.push(key.toLowerCase());
    }

    const iconMatched = matchedkeys.filter(key => key === 'icon');
    const textMatched = matchedkeys.filter(key => key === 'label');

    if (iconMatched.length > 0 && textMatched.length > 0) {
      buttonType = ButtonType.iconAndText;
    } else if (iconMatched.length > 0 && textMatched.length <= 0) {
      buttonType = ButtonType.icon;
    } else if (iconMatched.length <= 0 && textMatched.length > 0) {
      buttonType = ButtonType.text;
    }
    return buttonType;
  }

  private parseLabel(node: any, button: Button, aLayer: any) {
    if (this.followOverrides) {
      this.parseOverride(node, 'stringValue', button);
    }

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

    button.textStyle = textStyle;
  }
}
