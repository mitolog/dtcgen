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
    // takeOverするパターン:
    // 1. artboard -> symbolへの移行時
    //  nodeの_classは、確実に symbolInstance
    //  parentがartboard, groupなど

    // 2. symbol -> symbolへの移行時の判別
    //  nodeの_classがsymbolInstance
    //  parentがsymbolMaster

    const parent: any = this.node.getParent();

    // view.id(restorationIdentifier)がsymbolのIDになってしまっている
    // ので、artboard上でのidを引き継ぐ必要がある。それにしたがって、
    // そのviewにのっかってる1階層目のviewのparentIdも変える必要があるがそれは下段にて実施。
    if (this.isTopSymbolLayer) {
      // nodeOnArtboardがない場合、つまり初回のtakeOverの際のみ
      // つまり、artboardからsymbolに以降する際のみ、idを上書きする。
      view.id = this.node.do_objectID;
    }

    view.containerId = this.artboardId;
    view.rect = this.rect;

    // if (this.node.do_objectID === '6961D835-1316-4AF9-BBC6-2F73C148E84B') {
    //   console.log('isTopSymbolLayer: ', this.isTopSymbolLayer);
    //   console.log('topSymbolHierarchy: ', this.topSymbolHierarchy);
    //   console.log('hierarchy: ', this.hierarchy);
    // }

    // symbol上にsymbolがのっかってる場合は、metadata.jsonにした時、
    // 親symbolのrestorationIdentifierに symbolMasterのdo_objectIDが入って、
    // 子symbolのparentIdは同restorationIdentifierを向くことになる。
    // が、これだと親symbolはアプリ上で何度も利用されるので、
    // xcode上で view.id == child.parentIdでマッチングした時に 想定しないviewに
    // addsubviewされる可能性がある。
    // よって、symbol上のsymbolの場合は、artboard上でどのパーツに乗ってるかを指定しなければいけない。
    // それには、nodeOnArtboard.do_objectIDを metadata.jsonに付与する必要がある。
    // で、xcode上で、view.id(親)にはsymbolMaster.do_objectIDは利用せず、以下のようにする：
    // targetView.parentId(子) == view.restorationIdentifier (親) ... このときのidは artboard上のdo_objectID
    // &&
    // targetView.symbolParentId(子) == view.symbolId(親) ... この時idは symbol上のdo_objectID

    const isFirstElementUnderTheSymbol =
      !this.isTopSymbolLayer && this.hierarchy - this.topSymbolHierarchy === 1;

    const isSymbolUnderTheSymbol =
      !this.isTopSymbolLayer &&
      this.node._class === 'symbolInstance' &&
      parent._class === 'symbolMaster';

    if (isFirstElementUnderTheSymbol) {
      // symbolから1階層目のviewだけは、artboard上のidを指定
      view.parentId = this.nodeOnArtboard.do_objectID;
    } else if (isSymbolUnderTheSymbol) {
      // symbolから2階層目以降のsymbolに関しては、親symbolのidをparentに指定
      view.parentId = parent.do_objectID;
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
