import * as _ from 'lodash';
import * as dotenv from 'dotenv';
import { BaseElementParser } from './BaseElementParser';
import { OutputType } from '../../../utilities/PathManager';

import {
  Color,
  ColorComponents,
  View,
  TextView,
  TextViewType,
  Image,
  ElementType,
  AutoDetectType,
  TextStyle,
  DynamicClass,
} from '../../../domain/Entities';
import { isAutoDetectType } from '../../../typeGuards';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export class AutoParser extends BaseElementParser {
  /// `node` shuold be symbol's node (not artboard's).
  /// `view` should have been already assigned takeOver data.
  /// `parentNode` can be node on artboard's.
  parse(node: any, view: View, parentNode?: any) {
    // doesn't need any initialized properties on super.parse().
    //super.parse(node, view, parentNode);
    const type: AutoDetectType | null = this.distinctType(node, view);
    if (!type) return;
    switch (type) {
      case AutoDetectType.Text:
        view.type = ElementType.TextView;
        this.parseLabel(node, <TextView>view);
        break;
      case AutoDetectType.Image:
        view.type = ElementType.Image;
        this.parseImage(node, <Image>view);
        break;
      case AutoDetectType.View:
        this.parseBackground(node, view, parentNode);
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
        // - 要素が多くなった場合に、大量に命名規則が発生してしまう、すると dtc.config.jsonで定義すべきものも同時に増えてとても大変

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
    const dynamicClasses: DynamicClass[] = super.dynamicClasses();
    const matches: DynamicClass[] = dynamicClasses.filter(classObj => {
      const name = classObj.name || null;
      if (!name) return false;
      const results = view.name.match(new RegExp(name, 'gi'));
      return results && results.length > 0 ? true : false;
    });
    if (matches && matches.length > 0) {
      const matchedClass = matches[matches.length - 1];
      const matchedType: AutoDetectType = isAutoDetectType(matchedClass.name)
        ? (matchedClass.name as AutoDetectType)
        : AutoDetectType.View;
      type = AutoDetectType[matchedType];
    }
    return type;
  }

  private parseLabel(aLayer: any, view: TextView) {
    // we treat all autoParsed textview as label. The other types will be dealt
    // within parseElement() on SketchParser, where each text types are detected by keywords.
    view.textViewType = TextViewType.label;

    if (this.followOverrides) {
      this.parseOverride(aLayer, 'stringValue', view);
    } else {
      view.name = aLayer.name;
    }
    this.parseBackground(aLayer, view);

    // If there are no `view.text`, we can assign symbol's default text, if needed.
    // if (!view.text) {
    //   view.text = _.get(aLayer, 'attributedString.string', null);
    // }

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

    view.textStyle = textStyle;
  }

  private parseImage(node: any, view: Image) {
    // prettier-ignore
    const fillObj = _.get(node, 'style.fills[0]');
    const fillType = _.get(fillObj, 'fillType');

    this.parseBackground(node, view);

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
}
