import { Rect } from '../../domain/entities/Rect';
import * as _ from 'lodash';

/**
 * This class is for taking over from artboard view to symbol view
 */
export class TakeOverArtboardData {
  rect: Rect;
  hierarchy: number;
  parentId: string;

  name?: string;
  artboardId?: string;
  imageName?: string;
  textTitle?: string;

  /**
   * take over data from the node on artboard to symbol.
   * @param node {any} node from which we take over data. should be instance on artboard.
   * @param hierarchy {number} hierarchy of view layer
   */
  constructor(node: any, hierarchy: number) {
    this.rect = new Rect(<Rect>{
      x: node.frame.x,
      y: node.frame.y,
      width: node.frame.width,
      height: node.frame.height,
    });
    this.hierarchy = hierarchy;
    this.artboardId = this.containerId(node);
    const parent = node.getParent();
    if (parent) {
      this.parentId = parent.do_objectID;
    } else {
      console.log('no parent on takeover data');
    }
    this.name = node.name;
    const overrideValues = node.overrideValues;
    if (overrideValues && overrideValues.length > 0) {
      const imageName = overrideValues
        .filter(overrideObj => {
          const className = _.get(overrideObj, 'value._class');
          const refClass = _.get(overrideObj, 'value._ref_class');
          const ref = _.get(overrideObj, 'value._ref');
          return className && refClass && ref ? true : false;
        })
        .map(overrideObj => {
          return _.get(overrideObj, 'value._ref');
        })
        .reduce((acc, current) => current, null);
      this.imageName = imageName;

      const title = overrideValues
        .filter(overrideObj => {
          if (
            !overrideObj.overrideName ||
            overrideObj.overrideName.split('_') <= 1 ||
            overrideObj.overrideName.split('_')[1] !== 'stringValue'
          )
            return false;
          return true;
        })
        .map(overrideObj => {
          return overrideObj.value;
        })
        .reduce((acc, current) => current, null);
      this.textTitle = title;
    }
  }

  private containerId(node: any): string {
    if (node._class === 'artboard') {
      return node.do_objectID;
    } else if (node._class === 'page' || node._class === 'sketch') {
      //console.log('no containerId on takeover data');
      return null;
    }
    const parent = node.getParent();
    return this.containerId(parent);
  }
}
