import * as _ from 'lodash';

import {
  ElementType,
  Constraints,
  Button,
  Image,
  TreeElement,
  TextView,
  TextInput,
} from '../../domain/Entities';

import { SketchView } from '../entities/SketchView';
import { TakeOverData } from '../entities/TakeOverData';

import { IElementParser } from './ElementParsers/IElementParser';
import { ButtonParser } from './ElementParsers/ButtonParser';
import { TextViewParser } from './ElementParsers/TextViewParser';
import { TextInputParser } from './ElementParsers/TextInputParser';
import { ImageParser } from './ElementParsers/ImageParser';
import { AutoParser } from './ElementParsers/AutoParser';

export class SketchParser {
  private sketch: Object;
  private config: Object;
  private outputDir?: string;

  constructor(sketch: Object, config: Object, outputDir?: string) {
    this.sketch = sketch;
    this.config = config;
    this.outputDir = outputDir;
  }

  parseLayer(
    node: any,
    views: [SketchView?],
    parentTree: TreeElement,
    parentId?: string,
  ) {
    // assign default values, but these may be overridden latter procedure.
    const view: SketchView = new SketchView(node, parentId);
    const treeElement: TreeElement = new TreeElement(view);
    this.parseConstraint(node.resizingConstraint, view);

    if (this.shouldExclude(node.name)) return;

    // `group` translated into `view` which holds various views on it
    if (node._class === 'group' && _.size(node.layers)) {
      views.push(view);
      parentTree.addElement(treeElement);
      // parse underlying nodes
      node.layers.forEach(aNode => {
        this.parseLayer(aNode, views, treeElement, view.id);
      });
    }
    // 'symbolInstance' should be translated into each elements depends on each view type
    else if (node._class === 'symbolInstance') {
      const keywords: string[] = this.config['extraction'].keywords;
      const matches: string[] = keywords.filter(keyword => {
        const results = node.name.match(new RegExp(keyword, 'g'));
        return results && results.length > 0 ? true : false;
      });
      if (matches && matches.length > 0) {
        // matchesは最後にマッチしたものを採用する。例えば keywords[]に `Button`, `View`があったとして
        // node.nameが `Final View Button` とかだと、複数のkeywordsにマッチする。
        // この時、英語文法的にこのnodeはボタンと想定されるので、最後にマッチした要素を利用するのが自然では。
        view.type = <ElementType>matches[matches.length - 1];
        this.parseElement(node, view);
        views.push(view);
        treeElement.name = view.name.toLowerCamelCase(' ');
        parentTree.addElement(treeElement);
      } else {
        // 上記にマッチしないシンボルはsymbol(とその下層のsymbol)をパースし、outputに追加する。
        // ただ、抽出したjsonはすべて階層構造を持たない(すべて階層1)ので、
        // シンボルが属するartboardを識別するには、containerId(属するartboardのid)が必要
        // また、symbolの座標やconstraintsはartboard上のものではないため、それらも引き継ぐ
        const takeOverData = new TakeOverData(node);
        this.parseSymbol(takeOverData, views, parentTree, parentId);
      }
    }
  }

  /**
   * Private methods below
   */

  private parseElement(node: any, view: SketchView) {
    let parser: IElementParser;
    switch (view.type) {
      case ElementType.Button:
        parser = new ButtonParser(this.sketch, this.config);
        parser.parse(node, <Button>view);
        break;
      case ElementType.TextView:
        parser = new TextViewParser(this.sketch, this.config);
        parser.parse(node, <TextView>view);
        break;
      case ElementType.TextInput:
        parser = new TextInputParser(this.sketch, this.config);
        parser.parse(node, <TextInput>view);
        break;
      case ElementType.Image:
        parser = new ImageParser(this.sketch, this.config, this.outputDir);
        parser.parse(node, <TextInput>view);
        break;
      default:
        break;
    }
  }

  private parseSymbol(
    takeOverData: TakeOverData,
    views: [SketchView?],
    parentTree: TreeElement,
    parentId?: string,
  ) {
    const node = takeOverData.node;
    if (!node._class || !node.name || this.shouldExclude(node.name)) return;
    const targetSymbol: any = this.symbolForNode(node);
    if (!targetSymbol) {
      // todo: symbolMaster, symbolInstanceでパースしたが、マッチするシンボルがない場合。
      // またはshapeGroupの場合。イレギュラーケースもある? 要調査。
      return;
    }

    const view = new SketchView(targetSymbol, parentId);
    const treeElement = new TreeElement(view);
    treeElement.name = takeOverData.name.toLowerCamelCase(' ');
    if (takeOverData.nodeOnArtboard) {
      //console.log('parent: ', node.getParent()._class);
    }
    this.parseConstraint(node.resizingConstraint, view);
    takeOverData.takeOverCommonProps(view);

    const subLayers = _.get(targetSymbol, 'layers');
    if (!subLayers || subLayers.length <= 0) {
      // Parse this node(node-sketch), bevause it's an end of the tree structure.
      const parser = new AutoParser(this.sketch, this.config, this.outputDir);
      parser.parse(targetSymbol, view);

      if (takeOverData.imageName) {
        (view as Image).imageName = takeOverData.imageName;
      }
      if (takeOverData.textTitle) {
        (view as TextView).text = takeOverData.textTitle;
      }
      views.push(view);
      parentTree.addElement(treeElement);
      return;
    }

    views.push(view);
    parentTree.addElement(treeElement);
    subLayers.forEach(layer => {
      const newTakeOverData = new TakeOverData(
        layer,
        takeOverData.nodeOnArtboard || takeOverData.node,
      );
      this.parseSymbol(newTakeOverData, views, treeElement, view.id);
    });
  }

  /**
   * Parse constraint value and output to view object.
   * Each constraints are re-assigned later considering related margins.
   * @param value bitmasked constraint value
   * @param view parsed view object
   */
  private parseConstraint(value: number, view: SketchView) {
    // https://medium.com/zendesk-engineering/reverse-engineering-sketchs-resizing-functionality-23f6aae2da1a
    const bitWiseAnd: number = parseInt(value.toString(2));
    const bitWiseAndPadded: string = ('0000000000' + bitWiseAnd).slice(-6);
    const constraints: Constraints = {
      none: bitWiseAndPadded === '111111' ? 1 : 0,
      top: bitWiseAndPadded.substr(0, 1) === '0' ? 1 : 0,
      right: bitWiseAndPadded.substr(5, 1) === '0' ? 1 : 0,
      bottom: bitWiseAndPadded.substr(2, 1) === '0' ? 1 : 0,
      left: bitWiseAndPadded.substr(3, 1) === '0' ? 1 : 0,
      width: bitWiseAndPadded.substr(4, 1) === '0' ? 1 : 0,
      height: bitWiseAndPadded.substr(1, 1) === '0' ? 1 : 0,
    } as Constraints;
    view.constraints = constraints;
  }

  /**
   * Retrieve corresponding symbol for a node(node-sketch) instance.
   * @param node Node instance
   */
  private symbolForNode(node: any): any {
    const symbolsPage = this.sketch['symbolsPage'];
    let targetSymbol: any;
    if (node._class === 'symbolMaster' || node._class === 'symbolInstance') {
      targetSymbol = symbolsPage.get(
        'symbolMaster',
        instance => instance.symbolID === node.symbolID,
      );
      // TBD: exclude 'shapeGroup' because it's info is too large to deal with at this time.
    } else if (node._class !== 'shapeGroup') {
      targetSymbol = node;
    }
    return targetSymbol;
  }

  private shouldExclude(targetName: string) {
    // exclude node that is listed on setting config.
    const excludeNames: string[] = _.get(this.config, 'extraction.exceptions');
    if (excludeNames && excludeNames.length > 0) {
      const found = excludeNames.find(name => {
        const matched = targetName.match(new RegExp(name, 'g'));
        return matched ? true : false;
      });
      return found ? true : false;
    }
    return false;
  }
}
