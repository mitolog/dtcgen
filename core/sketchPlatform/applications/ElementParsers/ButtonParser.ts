import { Button } from '../../../domain/entities/Button';
import { Color } from '../../../domain/entities/Color';
import { ColorComponents } from '../../../domain/entities/ColorComponents';
import { SymbolParser } from './SymbolParser';
import { ElementType } from '../../../domain/entities/ElementType';

export class ButtonParser extends SymbolParser {
  parse(node: any, button: Button) {
    super.parse(node, button);

    const elements = this.getSymbolElements(ElementType.Button);

    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;

      switch (key.toLowerCase()) {
        case 'icon':
          button.hasIcon = true;
          break;
        case 'background':
          this.parseBackground(node, button, aLayer);
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
        button.name = targetOverride['value'];
        break;

      default:
        break;
    }
  }

  private parseBackground(node: any, button: Button, aLayer: any) {
    button.radius = aLayer.fixedRadius;
    const comps = new ColorComponents(<ColorComponents>(
      aLayer.style.fills[0].color
    ));
    button.backgroundColor = new Color(<Color>{ fill: comps });
    if (this.followOverrides) {
      this.parseOverride(node, 'layerStyle', button);
    }
  }

  private parseLabel(node: any, button: Button, aLayer: any) {
    // prettier-ignore
    if (
      !aLayer.style ||
      !aLayer.style.textStyle ||
      !aLayer.style.textStyle.encodedAttributes ||
      !aLayer.style.textStyle.encodedAttributes.MSAttributedStringFontAttribute
    )
      return;
    if (this.followOverrides) {
      this.parseOverride(node, 'stringValue', button);
    }
    const textAttribute = aLayer.style.textStyle.encodedAttributes;
    // prettier-ignore
    const fontObj = aLayer.style.textStyle.encodedAttributes.MSAttributedStringFontAttribute;
    button.fontName = fontObj.attributes.name;
    button.fontSize = fontObj.attributes.size;
    const fontColorAttribute = textAttribute.MSAttributedStringColorAttribute;
    if (fontColorAttribute) {
      const comps = new ColorComponents(<ColorComponents>fontColorAttribute);
      button.fontColor = new Color(<Color>{ fill: comps });
    }
  }
}
