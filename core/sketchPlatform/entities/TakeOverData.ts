import { Rect } from '../../domain/entities/Rect';
import * as _ from 'lodash';

/**
 * This class is for taking over from artboard view to symbol view
 */
export class TakeOverData {
  // should be filled on constructor
  id: string;
  rect: Rect;
  node: any;
  hierarchy: number;
  parentId: string;

  // optional
  artboardId?: string;
  nodeOnArtboard?: any;
  //imageName?: string;

  /**
   * take over data from the node on artboard to symbol.
   * @param node {any} node from which we take over data. should be instance on artboard.
   * @param hierarchy {number} hierarchy of view layer
   */
  constructor(node: any, hierarchy: number, nodeOnArtboard?: any) {
    this.node = node;
    this.hierarchy = hierarchy;
    this.nodeOnArtboard = nodeOnArtboard ? nodeOnArtboard : node;
    const parent = node.getParent();
    if (parent) {
      this.parentId = parent.do_objectID;
    } else {
      console.log('no parent on takeover data');
    }

    this.rect = new Rect(<Rect>{
      x: node.frame.x,
      y: node.frame.y,
      width: node.frame.width,
      height: node.frame.height,
    });

    this.artboardId = nodeOnArtboard
      ? this.containerId(nodeOnArtboard)
      : this.containerId(node);

    this.id = nodeOnArtboard ? nodeOnArtboard.do_objectID : node.do_objectID;
  }

  private containerId(node: any): string | null {
    if (node._class === 'artboard') {
      return node.do_objectID;
    } else if (node._class === 'page' || node._class === 'sketch') {
      //console.log('no containerId on takeover data');
      return null;
    }
    const parent = node.getParent();
    return this.containerId(parent);
  }

  get name(): string {
    return this.node.name;
  }

  get imageName(): string | null {
    const overrideValues = this.nodeOnArtboard.overrideValues;
    if (!overrideValues || overrideValues.length <= 0) return null;

    const imagePaths = overrideValues
      .filter(overrideObj => {
        const name = overrideObj.overrideName;
        if (
          !name ||
          name.split('_').length <= 1 ||
          name.split('_')[1] !== 'image'
        )
          return false;

        const currentId = name.split('_')[0];
        const isImageData =
          _.get(overrideObj, 'value._ref_class') === 'MSImageData';

        return currentId === this.node.do_objectID && isImageData;
      })
      .map(overrideObj => {
        return _.get(overrideObj, 'value._ref');
      });
    return imagePaths[0] || null;
  }

  get textTitle(): string | null {
    const overrideValues = this.nodeOnArtboard.overrideValues;
    if (!overrideValues) return null;
    const stringOverrides = overrideValues
      .filter(overrideObj => {
        const name = overrideObj.overrideName;
        if (
          !name ||
          name.split('_').length <= 1 ||
          name.split('_')[1] !== 'stringValue'
        )
          return false;

        const nameFormerPart = name.split('_')[0];
        const ids = nameFormerPart.split('/');
        const targetId =
          ids && ids.length > 1 ? ids[ids.length - 1] : nameFormerPart;
        return targetId === this.node.do_objectID;
      })
      .map(overrideObj => overrideObj.value);
    //console.log(stringOverrides);
    return stringOverrides[0] || null;
  }
}
