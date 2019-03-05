import * as _ from 'lodash';
import * as dotenv from 'dotenv';
import { SymbolParser } from './SymbolParser';
import { OutputType } from '../../../utilities/PathManager';

import {
  Color,
  ColorComponents,
  View,
  TextView,
  Image,
  ElementType,
} from '../../../domain/Entities';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

enum AutoDetectType {
  Text = 'text',
  Image = 'image',
  View = 'view',
  Cell = 'Cell',
}

export class AutoParser extends SymbolParser {
  // `node` shuold be symbol's node (not artboard's).
  // `view` should have been already assigned takeOver data.
  parse(node: any, view: View) {
    const type: AutoDetectType | null = this.distinctType(node, view);
    if (!type) return;
    switch (type) {
      case AutoDetectType.Text:
        view.type = ElementType.TextView;
        this.parseText(node, <TextView>view);
        break;
      case AutoDetectType.Image:
        view.type = ElementType.Image;
        this.parseImage(node, <Image>view);
        break;
      case AutoDetectType.View:
        this.parseBackground(node, view);
        break;
      case AutoDetectType.Cell:
        view.type = ElementType.Cell;
        break;
    }
  }

  distinctType(node: any, view: View): AutoDetectType | null {
    const className = _.get(node, '_class');
    if (!className) return null;

    let type: AutoDetectType;
    switch (className) {
      case 'text':
        type = AutoDetectType.Text;
        break;
      case 'rectangle':
        const fillType = _.get(node, 'style.fills[0].fillType');
        type =
          fillType && fillType === 4
            ? AutoDetectType.Image
            : AutoDetectType.View;
        break;
      default:
        // distinct with view name on artboard
        const typeByView = this.typeByViewName(view);
        type = typeByView || AutoDetectType.View;
        // todo: 名前で検出したtypeごとに自動パースしたほうがよさげでは。symbol配下の要素まで命名規則が決められてしまうと
        // - 制約事項が多くてデザイナのタスクが増える
        // - 要素が多くなった場合に、大量に命名規則が発生してしまう、すると stc.config.jsonで定義すべきものも同時に増えてとても大変

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
      case 'image':
        const imageRef = _.get(targetOverride, 'value._ref');
        if (!imageRef) break;
        const imageName = imageRef.split('/')[1];
        (view as Image).imageName = imageName ? imageName : '';
        break;
      default:
        break;
    }
  }

  //   /* Private methods below */

  private typeByViewName(view: View): AutoDetectType | null {
    if (!view.name) return null;
    let type: AutoDetectType | null = null;
    // todo: auto detect keywords shuold be placed somewhere around
    // should be name on artboard
    const autoDetectKeywords: string[] = ['Cell'];
    const matches: string[] = autoDetectKeywords.filter(keyword => {
      const results = view.name.match(new RegExp(keyword, 'g'));
      return results && results.length > 0 ? true : false;
    });
    if (matches && matches.length > 0) {
      type = AutoDetectType[matches[matches.length - 1]];
    }
    return type;
  }

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
    if (this.followOverrides && node.overrideValues) {
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
      const imagePathName = this.pathManager.getOutputPath(
        OutputType.images,
        true,
      );
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
