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
  hierarchy: number;
  topSymbolHierarchy: number;

  // optional
  artboardId?: string;
  nodeOnArtboard?: any;
  //imageName?: string;

  // private
  private isTopSymbolLayer: boolean;

  /**
   * take over data from the node on artboard to symbol.
   * @param node {any} node from which we take over data. should be instance on artboard.
   * @param hierarchy {number} hierarchy of view layer
   */
  constructor(
    node: any,
    hierarchy: number,
    topSymbolHierarchy: number = null,
    nodeOnArtboard?: any,
  ) {
    this.node = node;
    this.hierarchy = hierarchy;
    //this.nodeOnArtboard = nodeOnArtboard ? nodeOnArtboard : node;
    if (nodeOnArtboard) {
      this.isTopSymbolLayer = false;
      this.nodeOnArtboard = nodeOnArtboard;
    } else {
      this.isTopSymbolLayer = true;
      this.nodeOnArtboard = null;
    }

    this.topSymbolHierarchy = topSymbolHierarchy || hierarchy;

    this.rect = new Rect(<Rect>{
      x: node.frame.x,
      y: node.frame.y,
      width: node.frame.width,
      height: node.frame.height,
    });

    this.artboardId = nodeOnArtboard
      ? this.containerId(nodeOnArtboard)
      : this.containerId(node);
  }

  takeOverCommonProps(view: View): void {
    // view.id(restorationIdentifier)がsymbolのIDになってしまっている
    // ので、artboard上でのidを引き継ぐ必要がある。が、それにしたがって、
    // そのviewにのっかってる1階層目のviewのparentIdも変える必要がある
    if (this.isTopSymbolLayer) {
      // nodeOnArtboardがない場合、つまり初回のtakeOverの際のみ
      // つまり、artboardからsymbolに以降する際のみ、idを上書きする。
      view.id = this.node.do_objectID;
    }
    view.containerId = this.artboardId;
    view.rect = this.rect;
    if (
      !this.isTopSymbolLayer &&
      this.topSymbolHierarchy &&
      this.hierarchy - this.topSymbolHierarchy === 1
    ) {
      // symbolから1階層目のviewだけは、artboard上のidを指定
      view.parentId = this.nodeOnArtboard.do_objectID;
    }
  }

  get name(): string {
    return this.node.name;
  }

  get imageName(): string | null {
    const overrideValues = _.get(
      this.nodeOnArtboard || this.node,
      'overrideValues',
    );
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
    const overrideValues = _.get(
      this.nodeOnArtboard || this.node,
      'overrideValues',
    );
    if (!overrideValues || overrideValues.length <= 0) return null;
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
    return stringOverrides[0] || null;
  }

  /**
   * Private methods
   */
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
}
