import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';
import { injectable } from 'inversify';
import {
  Color,
  StyleConfig,
  ColorStyleConfig,
  Styles,
  ColorComponents,
  StyleType
} from '../../domain/Entities';

export interface IFigmaPresenter {
  translateToStyle(nodes: object[], styleConfig: StyleConfig): Styles;
}

export enum FigmaColorType {
  fill = 'SOLID',
  image = 'IMAGE'
}

@injectable()
export class FigmaPresenter implements IFigmaPresenter {
  translateToStyle(nodes: object[], styleConfig: StyleConfig): Styles {
    const styles = new Styles();

    // translate colors
    const colorStyleConfig: ColorStyleConfig = styleConfig.colorStyleConfig;
    if (colorStyleConfig != null && colorStyleConfig.isEnabled) {
      styles.colors = this.translateColor(nodes);
    }
    return styles;
  }

  private translateColor(nodes: object[]): Color[] | null {

    const colorNodes = nodes.filter(node => {
      const type = _.get(node, 'document.style_type', null);
      const name = _.get(node, 'document.style_name', null);
      if (!type || !name) return false;

      const colorFill = _.get(node, 'document.fills[0]', null);
      if (!colorFill || colorFill['type'] != FigmaColorType.fill) return false;

      return type === StyleType.fill;
    });

    const colors: Color[] = colorNodes.map(node => {
      const figmaColor = _.get(node, 'document.fills[0].color', null);
      const name = _.get(node, 'document.style_name', uuidv4());
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
