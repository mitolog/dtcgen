import { Node } from 'node-sketch';
import {
  LayerName,
  StyleConfig,
  Styles,
  Color,
  ColorComponents,
  ColorStyleConfig,
} from '../../domain/Entities';
import { injectable } from 'inversify';
import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';

export interface ISketchPresenter {
  translate(nodes: Node[]): LayerName[];
  translateToStyle(objects: object[], styleConfig: StyleConfig): Styles;
}

@injectable()
export class SketchPresenter implements ISketchPresenter {
  // Imagine nodes are artboards'
  translate(nodes: Node[]): LayerName[] {
    return nodes.map(node => {
      return new LayerName(node['do_objectID'], node['name'], node['_class']);
    });
  }

  translateToStyle(styleObjects: object[], styleConfig: StyleConfig): Styles {
    const styles = new Styles();

    // translate colors
    const colorStyleConfig: ColorStyleConfig = styleConfig.colorStyleConfig;
    if (colorStyleConfig) {
      styles.colors = this.translateColor(styleObjects, colorStyleConfig);
    }
    return styles;
  }

  private translateColor(
    styleObjects: object[],
    config: ColorStyleConfig,
  ): Color[] | null {
    // color extraction
    const colorKeywords = config.keywords;
    const colorCaseSensitive = config.caseSensitive;
    const colorExtractEnabled = config.isEnabled;
    if (!colorExtractEnabled) {
      return null;
    }

    const matchOption: string = colorCaseSensitive ? 'i' : '';
    const colorStyles = styleObjects.filter(styleObject => {
      const matches = colorKeywords.filter(keyword => {
        return styleObject['name'].match(new RegExp(keyword, matchOption));
      });
      return matches && matches.length > 0;
    });

    const colors: Color[] = colorStyles.map(style => {
      const sketchColor = _.get(style, 'value.fills[0].color', null);
      const name = style['name'] || uuidv4();
      if (!sketchColor) {
        throw new Error('sketch json structure may be changed?');
      }

      const fill = new ColorComponents(sketchColor);
      return new Color({
        fill: fill,
        name: name,
      });
    });

    return colors;
  }
}
