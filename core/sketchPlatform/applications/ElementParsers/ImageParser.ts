import * as _ from 'lodash';
import * as dotenv from 'dotenv';
import { Color } from '../../../domain/entities/Color';
import { ColorComponents } from '../../../domain/entities/ColorComponents';
import { BaseElementParser } from './BaseElementParser';
import { ElementType } from '../../../domain/entities/ElementType';
import { Image } from '../../../domain/entities/Image';
import { OutputType } from '../../../utilities/PathManager';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export class ImageParser extends BaseElementParser {
  parse(node: any, view: Image) {
    super.parse(node, view);
    const elements = this.getSymbolElements(ElementType.Image);
    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;
      switch (key.toLowerCase()) {
        case 'image':
          this.parseImage(node, view, aLayer);
          break;
        case 'background':
          this.parseBackground(aLayer, view, node);
          break;
      }
    }
  }

  parseSharedStyle(node: any, styleType: string, view: Image) {
    //throw new Error('Method not implemented.');
  }

  parseOverride(node: any, styleType: string, view: Image) {
    if (!node.overrideValues) return;
    const sharedStyles: any[] = this.layerStyles;

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

      case 'image':
        const imageRef = _.get(targetOverride, 'value._ref');
        if (!imageRef) break;
        const imageName = imageRef.split('/')[1];
        view.imageName = imageName ? imageName : '';
        break;
      default:
        break;
    }
  }

  /* Private methods below */

  private parseImage(node: any, view: Image, aLayer: any) {
    // prettier-ignore
    const fillObj = _.get(aLayer, 'style.fills[0]');
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
}
