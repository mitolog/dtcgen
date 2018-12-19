import { Button } from '../../../domain/entities/Button';
import { Color } from '../../../domain/entities/Color';
import { IElementParser } from './IElementParser';
import { ColorComponents } from '../../../domain/entities/ColorComponents';

export class ButtonParser implements IElementParser {
  private sketch: Object;
  private config: Object;

  constructor(sketch: Object, config: Object) {
    this.sketch = sketch;
    this.config = config;
  }

  parse(node: any, button: Button) {
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

    const elements = this.config['extraction'][button.type.toLowerCase()];
    const shouldFollowOverrides = this.config['extraction'].followOverrides;

    // TBD: exclude 'shapeGroup' because it's info is too large to deal with at this time.
    const layers = targetSymbol.layers.filter(
      layer => layer._class !== 'shapeGroup',
    );

    for (const key of Object.keys(elements)) {
      // TBD: 命名規則で大文字小文字を指定したものをここでも踏襲したほうがいいのではと
      const nameKey = key.charAt(0).toUpperCase() + key.slice(1); // とりあえず頭文字だけ大文字
      const matchedElements = layers.filter(
        layer => layer.name === nameKey && layer._class === elements[key],
      );
      const aElement = matchedElements[0];
      if (!aElement) continue;

      switch (key) {
        case 'icon':
          button.hasIcon = true;
          break;
        case 'background':
          button.radius = aElement.fixedRadius;
          const comps = new ColorComponents(<ColorComponents>(
            aElement.style.fills[0].color
          ));
          button.backgroundColor = new Color(<Color>{ fill: comps });
          if (shouldFollowOverrides) {
            this.parseOverride(node, 'layerStyle', button);
          }
          break;
        case 'label':
          // prettier-ignore
          if (
            !aElement.style ||
            !aElement.style.textStyle ||
            !aElement.style.textStyle.encodedAttributes ||
            !aElement.style.textStyle.encodedAttributes.MSAttributedStringFontAttribute
          )
            break;
          if (shouldFollowOverrides) {
            this.parseOverride(node, 'stringValue', button);
          }
          const textAttribute = aElement.style.textStyle.encodedAttributes;
          // prettier-ignore
          const fontObj = aElement.style.textStyle.encodedAttributes.MSAttributedStringFontAttribute;
          button.fontName = fontObj.attributes.name;
          button.fontSize = fontObj.attributes.size;
          const fontColorAttribute =
            textAttribute.MSAttributedStringColorAttribute;
          if (fontColorAttribute) {
            const comps = new ColorComponents(<ColorComponents>(
              fontColorAttribute
            ));
            button.fontColor = new Color(<Color>{ fill: comps });
          }
          break;
        default:
          break;
      }
    }
  }

  parseOverride(node: any, styleType: string, button: Button) {
    const sharedStyles: any[] = this.sketch['layerStyles'];
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
}
