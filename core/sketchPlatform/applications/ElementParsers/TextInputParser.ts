import { Color } from '../../../domain/entities/Color';
import { ColorComponents } from '../../../domain/entities/ColorComponents';
import { TextInput } from '../../../domain/entities/TextInput';
import * as _ from 'lodash';
import { TextAlignment } from '../../../domain/entities/TextAlignment';
import { SymbolParser } from './SymbolParser';
import { ElementType } from '../../../domain/entities/ElementType';

export class TextInputParser extends SymbolParser {
  parse(node: any, view: TextInput) {
    super.parse(node, view);
    const elements = this.getSymbolElements(ElementType.TextInput);
    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;
      switch (key.toLowerCase()) {
        case 'placeholder':
          this.parseInput(node, view, aLayer);
          break;
        case 'background':
          this.parseBackground(aLayer, view, node);
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

  private parseInput(node: any, view: TextInput, aLayer: any) {
    // prettier-ignore
    const fontAttribute = _.get(aLayer, 'style.textStyle.encodedAttributes.MSAttributedStringFontAttribute');
    // prettier-ignore
    const colorAttribute = _.get(aLayer, 'style.textStyle.encodedAttributes.MSAttributedStringColorAttribute');

    if (!fontAttribute || !colorAttribute) return;
    if (this.followOverrides) {
      this.parseOverride(node, 'stringValue', view);
    }
    // prettier-ignore
    view.fontName = fontAttribute.attributes.name;
    view.fontSize = fontAttribute.attributes.size;
    const comps = new ColorComponents(<ColorComponents>colorAttribute);
    view.fontColor = new Color(<Color>{ fill: comps });
  }
}
