import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';
import { injectable } from 'inversify';
import {
  Color,
  StyleConfig,
  ColorStyleConfig,
  Styles,
  ColorComponents,
} from '../../domain/Entities';

export interface IFigmaPresenter {
  translateToStyle(nodes: object[], styleConfig: StyleConfig): Styles;
}

@injectable()
export class FigmaPresenter implements IFigmaPresenter {
  translateToStyle(nodes: object[], styleConfig: StyleConfig): Styles {
    const styles = new Styles();

    // translate colors
    const colorStyleConfig: ColorStyleConfig = styleConfig.colorStyleConfig;
    if (colorStyleConfig) {
      styles.colors = this.translateColor(nodes, colorStyleConfig);
    }
    return styles;
  }

  private translateColor(
    nodes: object[],
    colorStyleConfig: ColorStyleConfig,
  ): Color[] | null {
    const keywords = colorStyleConfig.keywords || null;
    if (!keywords || keywords.length <= 0) return null;

    const colorNodes = nodes.filter(node => {
      const type = _.get(node, 'document.type', null);
      const name = _.get(node, 'document.name', null);
      if (!type || !name) return false;

      const matchOption: string = colorStyleConfig.caseSensitive ? 'i' : '';
      const matches = keywords.filter(keyword => {
        return name.match(new RegExp(keyword, matchOption));
      });
      return type === 'RECTANGLE' && matches && matches.length > 0;
    });

    const colors: Color[] = colorNodes.map(node => {
      const figmaColor = _.get(node, 'document.fills[0].color', null);
      const name = _.get(node, 'document.name', uuidv4());
      if (!figmaColor) {
        throw new Error('figma json structure may be changed?');
      }

      const fill = new ColorComponents({
        red: figmaColor['r'] || 0,
        blue: figmaColor['b'] || 0,
        green: figmaColor['g'] || 0,
        alpha: figmaColor['a'] || 0,
      });

      return new Color({
        fill: fill,
        name: name,
      });
    });

    return colors.length > 0 ? colors : null;
  }
}
