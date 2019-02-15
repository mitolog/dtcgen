import { Rect } from '../../domain/entities/Rect';
import * as _ from 'lodash';
import { View } from '../../domain/entities/View';

/**
 * This class is for taking over from artboard view to symbol view
 */
export class TakeOverData {
  // should be filled on constructor
  rect: Rect;
  node: any;

  // optional
  nodeOnArtboard?: any;
  //imageName?: string;

  /**
   * take over data from the node on artboard to symbol.
   * @param node {any} node from which we take over data. should be instance on artboard.
   */
  constructor(node: any, nodeOnArtboard?: any) {
    this.node = node;

    if (nodeOnArtboard) {
      this.nodeOnArtboard = nodeOnArtboard;
    } else {
      this.nodeOnArtboard = null;
    }

    this.rect = new Rect(<Rect>{
      x: node.frame.x,
      y: node.frame.y,
      width: node.frame.width,
      height: node.frame.height,
    });
  }

  takeOverCommonProps(view: View): void {
    // takeOverするパターン:
    // 1. artboard -> symbolへの移行時
    //  nodeの_classは、確実に symbolInstance
    //  parentがartboard, groupなど

    // 2. symbol -> symbolへの移行時の判別
    //  nodeの_classがsymbolInstance
    //  parentがsymbolMaster

    view.name = this.node.name;
    view.rect = this.rect;
  }

  get name(): string {
    return this.node.name;
  }

  get imageName(): string | null {
    const overrideValues = this.overrideValues();
    if (!overrideValues || overrideValues.length <= 0) return null;

    const imagePaths = overrideValues
      .filter(overrideObj => {
        const name = overrideObj['overrideName'];
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
    const overrideValues = this.overrideValues();
    if (!overrideValues || overrideValues.length <= 0) return null;
    const stringOverrides = overrideValues
      .filter(overrideObj => {
        const name = overrideObj['overrideName'];
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
      .map(overrideObj => overrideObj['value']);
    return stringOverrides[0] || null;
  }

  /**
   * Private methods
   */

  private overrideValues(): Object[] | undefined {
    return _.get(this.nodeOnArtboard || this.node, 'overrideValues');
  }
}
