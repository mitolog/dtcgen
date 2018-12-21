import { Color } from '../../../domain/entities/Color';
import { ColorComponents } from '../../../domain/entities/ColorComponents';
import { TextView } from '../../../domain/entities/TextView';
import * as _ from 'lodash';
import { TextAlignment } from '../../../domain/entities/TextAlignment';
import { SymbolParser } from './SymbolParser';
import { ElementType } from '../../../domain/entities/ElementType';

export class TextViewParser extends SymbolParser {
  parse(node: any, textView: TextView) {
    super.parse(node, textView);

    const elements = this.getSymbolElements(ElementType.TextView);
    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;
      switch (key) {
        case 'description':
          this.parseDescription(node, textView, aLayer);
          break;
        case 'background':
          this.parseBackground(node, textView);
          break;
      }
    }
  }

  parseSharedStyle(node: any, styleType: string, view: TextView) {
    //throw new Error('Method not implemented.');
  }

  parseOverride(node: any, styleType: string, view: TextView) {
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
        view.name = targetOverride['value'];
        break;

      default:
        break;
    }
  }

  /* Private methods below */

  private parseDescription(node: any, textView: TextView, aLayer: any) {
    // prettier-ignore
    const fontAttribute = _.get(aLayer, 'style.textStyle.encodedAttributes.MSAttributedStringFontAttribute');
    // prettier-ignore
    const colorAttribute = _.get(aLayer, 'style.textStyle.encodedAttributes.MSAttributedStringColorAttribute');

    if (!fontAttribute || !colorAttribute) return;
    if (this.followOverrides) {
      this.parseOverride(node, 'stringValue', textView);
    }
    // prettier-ignore
    textView.fontName = fontAttribute.attributes.name;
    textView.fontSize = fontAttribute.attributes.size;
    const comps = new ColorComponents(<ColorComponents>colorAttribute);
    textView.fontColor = new Color(<Color>{ fill: comps });

    // // todo: textStyleのパース
    // const textStyle = null; //_.get(node, 'style.textStyle');
    // const attributedString = _.get(node, 'attributedString');

    // if (textStyle) {
    // } else if (attributedString) {
    //   // font descriptor
    //   const fontDescriptor = _.get(
    //     attributedString,
    //     'attributes[0].attributes.MSAttributedStringFontAttribute.attributes',
    //   );
    //   if (fontDescriptor) {
    //     textView.fontName = fontDescriptor.name;
    //     textView.fontSize = fontDescriptor.size;
    //   }

    //   // fontColor
    //   const fontColor = _.get(
    //     attributedString,
    //     'attributes[0].attributes.MSAttributedStringColorAttribute',
    //   );
    //   if (fontColor) {
    //     const colorComp = new ColorComponents(<ColorComponents>fontColor);
    //     textView.fontColor = new Color(<Color>{ fill: colorComp });
    //   }

    //   // text
    //   textView.text = attributedString.string;

    //   // text alignment
    //   const paragraphStyle = _.get(
    //     attributedString,
    //     'attributes[0].attributes.paragraphStyle',
    //   );
    //   if (paragraphStyle) {
    //     textView.alignment = <TextAlignment>paragraphStyle.alignment;
    //   }
    // }
  }

  private parseBackground(node: any, textView: TextView) {}
}
