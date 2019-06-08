import * as _ from 'lodash';
import {
  Color,
  ColorComponents,
  TextView,
  ElementType,
  MapView,
  MapType,
} from '../../../domain/Entities';
import { BaseElementParser } from './BaseElementParser';

export class MapParser extends BaseElementParser {
  parse(node: any, view: MapView) {
    super.parse(node, view);

    // set default
    view.mapType = MapType.standard;
    view.isRotateEnabled = true;
    view.isScrollEnabled = true;
    view.isZoomEnabled = true;

    const elements = this.getSymbolElements(ElementType.Map);
    for (const key of Object.keys(elements)) {
      const aLayer: any = this.getSubLayerFor(key, elements);
      if (!aLayer) continue;
      switch (key.toLowerCase()) {
        case 'map':
          this.parseMap(node, view, aLayer);
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
        view.text = targetOverride['value'];
        break;

      default:
        break;
    }
  }

  /* Private methods below */

  private parseMap(node: any, view: MapView, aLayer: any) {
    if (this.followOverrides) {
      //this.parseOverride(node, 'stringValue', view);
    } else {
      view.name = aLayer.name;
    }
  }
}
