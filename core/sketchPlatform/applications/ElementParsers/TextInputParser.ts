import {
  Color,
  ColorComponents,
  TextInput,
  ElementType,
  TextStyle,
  View,
} from '../../../domain/Entities';
import * as _ from 'lodash';
import { BaseElementParser } from './BaseElementParser';

export class TextInputParser extends BaseElementParser {
  parse(node: any, textInput: TextInput) {
    super.parse(node, textInput);

    // set default
    textInput.isEditable = true;
    textInput.showsLabel = false;
    textInput.showsUnderline = false;

    const elements = this.getSymbolElements(ElementType.TextInput);
    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;
      switch (key.toLowerCase()) {
        case 'placeholder':
          this.parsePlaecholder(node, textInput, aLayer);
          break;
        case 'background':
          this.parseBackground(aLayer, textInput, node);
          break;
      }
    }
  }

  parseSharedStyle(node: any, styleType: string, view: TextInput) {
    //throw new Error('Method not implemented.');
  }

  parseOverride(node: any, styleType: string, view: TextInput) {
    if (!node.overrideValues) return;
    const sharedStyles: any[] = this.layerStyles;
    // const textLayerStyles = sketch.textLayerStyles;

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
    if (!targetOverride) return;

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
        view.backgroundColor = new Color(<Color>bgColorObj);
        break;

      case 'stringValue':
        view.placeHolder = targetOverride['value'];
        break;

      default:
        break;
    }
  }

  /* Private methods below */

  private parsePlaecholder(node: any, view: TextInput, aLayer: any) {
    if (this.followOverrides) {
      this.parseOverride(node, 'stringValue', view);
    } else {
      view.name = aLayer.name;
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

    view.textStyle = textStyle;
  }
}
