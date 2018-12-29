import * as _ from 'lodash';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Color } from '../../../domain/entities/Color';
import { ColorComponents } from '../../../domain/entities/ColorComponents';
import { SymbolParser } from './SymbolParser';
import { View } from '../../../domain/entities/View';
import { TextView } from '../../../domain/entities/TextView';
import { Image } from '../../../domain/entities/Image';
import { ElementType } from '../../../domain/entities/ElementType';
import { PathManager, OutputType } from '../../../utilities/PathManager';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

enum PrimitiveType {
  Text = 'text',
  Image = 'image',
  View = 'view',
}

export class AutoParser extends SymbolParser {
  parse(node: any, view: View) {
    const type: PrimitiveType = this.distinctType(node);
    if (!type) return;
    switch (type) {
      case PrimitiveType.Text:
        view.type = ElementType.TextView;
        this.parseText(node, <TextView>view);
        break;
      case PrimitiveType.Image:
        view.type = ElementType.Image;
        this.parseImage(node, <Image>view);
        break;
      case PrimitiveType.View:
        this.parseBackground(node, view);
        break;
    }
  }

  distinctType(node: any): PrimitiveType {
    const className = _.get(node, '_class');
    if (!className) return null;

    let type: PrimitiveType;
    switch (className) {
      case 'text':
        type = PrimitiveType.Text;
        break;
      case 'rectangle':
        const fillType = _.get(node, 'style.fills[0].fillType');
        type =
          fillType && fillType === 4 ? PrimitiveType.Image : PrimitiveType.View;
        break;
      default:
        type = PrimitiveType.View;
        break;
    }

    return type;
  }

  parseSharedStyle(node: any, styleType: string, view: View) {
    throw new Error('Method not implemented.');
  }

  parseOverride(node: any, styleType: string, view: View) {
    if (!node.overrideValues) return;
    const sharedStyles: any[] = this.layerStyles;
    // const textLayerStyles = sketch.textLayerStyles;

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
      // 背景色のパース
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
      // テキストのパース
      case 'stringValue':
        (view as TextView).text = targetOverride['value'];
        break;
      default:
        break;
    }
  }

  //   /* Private methods below */

  private parseText(node: any, view: TextView) {
    // prettier-ignore
    const fontAttribute = _.get(node, 'style.textStyle.encodedAttributes.MSAttributedStringFontAttribute');
    // prettier-ignore
    const colorAttribute = _.get(node, 'style.textStyle.encodedAttributes.MSAttributedStringColorAttribute');

    if (!fontAttribute || !colorAttribute) return;
    if (this.followOverrides) {
      this.parseOverride(node, 'stringValue', view);
    } else {
      view.name = node.name;
    }
    // prettier-ignore
    view.fontName = fontAttribute.attributes.name;
    view.fontSize = fontAttribute.attributes.size;
    const comps = new ColorComponents(<ColorComponents>colorAttribute);
    view.fontColor = new Color(<Color>{ fill: comps });
  }

  private parseImage(node: any, view: Image) {
    // prettier-ignore
    const fillObj = _.get(node, 'style.fills[0]');
    const fillType = _.get(fillObj, 'fillType');

    if (!fillObj || fillType !== 4) return; // fillType 4 is "image pattern"
    if (this.followOverrides) {
      this.parseOverride(node, 'image', view);
    } else {
      // retrieve symbol’s default value
      const imageRef = _.get(fillObj, 'image._ref');
      const imageName = imageRef ? imageRef.split('/')[1] : '';
      view.imageName = imageName ? imageName : '';
      // we need to export the image if it's from symbols.
      // because ExportImages plugin(which is used within SketchRepository)
      // exports only images under pages.
      const imageRefNode = fillObj.get('MSJSONFileReference');
      const imagePathName = PathManager.getOutputPath(OutputType.images, true);
      imageRefNode.export(imagePathName);
    }
  }

  private parseBackground(node: any, view: View) {
    const color = _.get(node, 'style.fills[0].color');
    view.radius = node.fixedRadius;
    if (!color) {
      return;
    }
    const comps = new ColorComponents(<ColorComponents>color);
    view.backgroundColor = new Color(<Color>{ fill: comps });
    if (this.followOverrides) {
      this.parseOverride(node, 'layerStyle', view);
    }
  }
}
