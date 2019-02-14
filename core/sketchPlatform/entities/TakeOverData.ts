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

  // private
  private isTopSymbolLayer: boolean;

  /**
   * take over data from the node on artboard to symbol.
   * @param node {any} node from which we take over data. should be instance on artboard.
   */
  constructor(node: any, nodeOnArtboard?: any) {
    this.node = node;

    if (nodeOnArtboard) {
      this.isTopSymbolLayer = false;
      this.nodeOnArtboard = nodeOnArtboard;
    } else {
      this.isTopSymbolLayer = true;
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

    const parent: any = this.node.getParent();

    // view.id(restorationIdentifier)がsymbolのIDになってしまっている
    // ので、artboard上でのidを引き継ぐ必要がある。それにしたがって、
    // そのviewにのっかってる1階層目のviewのparentIdも変える必要があるがそれは下段にて実施。
    // if (this.isTopSymbolLayer) {
    //   // nodeOnArtboardがない場合、つまり初回のtakeOverの際のみ
    //   // つまり、artboardからsymbolに以降する際のみ、idを上書きする。
    //   view.id = this.node.do_objectID;
    // }

    view.name = this.node.name;
    view.rect = this.rect;

    // symbolが複数箇所で使われていて、且つそのsymbolがoverrideされていて、
    // 且つそのsymbolの子要素がある場合、それらの要素は、parentIdでしか親symbolを特定できないが、
    // 親symbolのidは複数存在するため、意図しない箇所のsymbolにaddsubviewされる可能性がある。
    // よって何かしらの対応が必要となる。
    // 基本方針としては、親symbolにoverride情報(overrideの固有id含む)をもたせ、
    // 子symbolにoverrideの固有idをもたせ、それでヒモづけを行う。
    // この時、子symbolはそれより下にlayersを持たないものと仮定する(存在する場合はその時考える)

    // xcode上での親子関係の特定の仕方
    // 1. reuseIdentifier(view.id)と parentId のマッチング (従来)
    // 2. overrideの do_objectIDでマッチング

    // 2の場合の、Xcode上での探索の仕方：
    // targetView.parentIdにマッチするview.reuseIdentifierが複数個マッチする場合、
    // 当該viewを別途配列に格納(1)。1の配列を走査し、parentIdが無いところまで遡る。
    // そこで、overrideValues[]を見つけたら、その中に自分のreuseIdentifier(各overrideValuesの
    // do_objectIDにする)が入ってないかチェック。入っていれば、1の配列に入っている直近のparentに
    // あたるviewにaddsubviewする。

    // 本プログラム上での処理：
    //
    // 1. takeOverDataの中で、`isTopSymbolLayer` のviewの場合、
    // nodeにoverrideValuesが存在するかチェック。存在すれば、2を実施、しなければ何もしない。

    // 2. view.overridesに 各overrideObjectの do_ObjectIDの配列を作成:
    // view.overrides = [ "do_ObjectID_1", "do_ObjectID_2", "do_ObjectID_3", ... ]

    // 3. this.nodeOnArtboardにoverrideValuesがあるかチェック。なければ何もしない。あれば、
    // overrideValues[n]['overrideName'].split('_').[0] に、今回のnode.do_objectIDがマッチするか
    // チェック。マッチすれば、view.id を overrideValues[n]['do_objectID']にする

    // 3の手順をしたときに、view.idをparentIdとする下層のsymbolがある場合は存在する？
    // その時対応するか...。

    /**
     * Assign overrideOriginId if needed
     */
    const overrideValues = this.overrideValues();
    if (this.nodeOnArtboard && overrideValues && overrideValues.length) {
      overrideValues
        .filter(obj => {
          const name = obj['overrideName'];
          return name && name.split('_') && name.split('_')[0].length;
        })
        .forEach(obj => {
          const nameFormer = obj['overrideName'].split('_')[0];
          const names = nameFormer.split('/');
          const targetId =
            names && names.length > 1 ? names[names.length - 1] : names[0];
          // If unique id of this node is included within override object,
          // assign unique id(do_objectID) of node on artboard to the `view`.
          if (targetId === this.node.do_objectID) {
            // expect here to come only once on each iteration.
            view.overrideOriginId = this.nodeOnArtboard.do_objectID;
          }
        });
    }
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
