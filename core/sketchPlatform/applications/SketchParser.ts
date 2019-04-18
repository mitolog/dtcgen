import * as _ from 'lodash';

import {
  ElementType,
  Constraints,
  Button,
  Image,
  TreeElement,
  TextView,
  TextInput,
  View,
  ElementTypes,
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

  parseLayer(node: any, parentTree: TreeElement, parentId?: string) {
    // assign default values, but these may be overridden on latter procedure.
    const view: SketchView = new SketchView(node, parentId);
    const treeElement: TreeElement = new TreeElement(view);
    this.parseConstraint(node.resizingConstraint, view);

    this.assignToAbove(view, parentTree); // shuold be placed AHEAD of `shouldExclude`
    if (this.shouldExclude(node.name, parentTree)) return;

    const keywords: string[] = this.config['extraction'].keywords;
    const matches: string[] = keywords.filter(keyword => {
      const results = node.name.match(new RegExp(keyword, 'g'));
      return results && results.length > 0 ? true : false;
    });
    const isKeywordMatched = matches && matches.length > 0 ? true : false;
    if (isKeywordMatched) {
      // matchesは最後にマッチしたものを採用する。例えば keywords[]に `Button`, `View`があったとして
      // node.nameが `Final View Button` とかだと、複数のkeywordsにマッチする。
      // この時、英語文法的にこのnodeはボタンと想定されるので、最後にマッチした要素を利用するのが自然では。
      view.type = <ElementType>matches[matches.length - 1];
    }

    // `group` translated into `view` which holds various views on it
    if (node._class === 'group' && _.size(node.layers)) {
      parentTree.addElement(treeElement);
      // parse underlying nodes
      node.layers.forEach(aNode => {
        this.parseLayer(aNode, treeElement, view.id);
      });
    }
    // 'symbolInstance' should be translated into each elements depends on each view type
    else if (node._class === 'symbolInstance') {
      if (isKeywordMatched) {
        this.parseElement(node, view);
        treeElement.name = view.name.toLowerCamelCase(' ');
        parentTree.addElement(treeElement);
      } else {
        const takeOverData = new TakeOverData(node);
        this.parseSymbol(takeOverData, parentTree, parentId);
      }
    } else {
      const parser = new AutoParser(this.sketch, this.config, this.outputDir);
      parser.parse(node, view);
      parentTree.addElement(treeElement);
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
        parser.parse(node, <TextView>(<unknown>view));
        break;
      case ElementType.TextInput:
        parser = new TextInputParser(this.sketch, this.config);
        parser.parse(node, <TextInput>(<unknown>view));
        break;
      case ElementType.Image:
        parser = new ImageParser(this.sketch, this.config, this.outputDir);
        parser.parse(node, <TextInput>(<unknown>view));
        break;
      default:
        break;
    }
  }

  private parseSymbol(
    takeOverData: TakeOverData,
    parentTree: TreeElement,
    parentId?: string,
  ) {
    const node = takeOverData.node;
    if (!node._class || !node.name) {
      return;
    }
    const targetSymbol: any = this.symbolForNode(node);
    if (!targetSymbol) {
      // todo: symbolMaster, symbolInstanceでパースしたが、マッチするシンボルがない場合。
      // またはshapeGroupの場合。イレギュラーケースもある? 要調査。
      return;
    }

    const view = new SketchView(targetSymbol, parentId);
    this.assignToAbove(view, parentTree); // shuold be placed AHEAD of `shouldExclude`
    if (this.shouldExclude(node.name, parentTree)) return;

    const treeElement = new TreeElement(view);
    treeElement.name = takeOverData.name.toLowerCamelCase(' ');
    this.parseConstraint(node.resizingConstraint, view);
    takeOverData.takeOverCommonProps(view);

    // AutoParse this node(node-sketch).
    const parser = new AutoParser(this.sketch, this.config, this.outputDir);
    parser.parse(targetSymbol, view, takeOverData.nodeOnArtboard);

    if (takeOverData.imageName) {
      (view as Image).imageName = takeOverData.imageName;
    }
    if (takeOverData.textTitle) {
      ((view as unknown) as TextView).text = takeOverData.textTitle;
    }

    parentTree.addElement(treeElement);

    const subLayers = _.get(targetSymbol, 'layers');
    if (!subLayers || subLayers.length <= 0) {
      return;
    }

    subLayers.forEach(layer => {
      const newTakeOverData = new TakeOverData(
        layer,
        takeOverData.nodeOnArtboard || takeOverData.node,
      );
      this.parseSymbol(newTakeOverData, treeElement, view.id);
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

  private shouldExclude(targetName: string, parentTree?: TreeElement) {
    // exclude node that is listed on setting config.
    const excludeNames: string[] = _.get(this.config, 'extraction.exceptions');
    if (excludeNames && excludeNames.length > 0) {
      const found = excludeNames.find(name => {
        let layeredNames = name.split('/');
        if (layeredNames.length === 2) {
          const childMatched = targetName.match(
            new RegExp(layeredNames[1], 'gi'),
          );
          const parentMatched = parentTree.name.match(
            new RegExp(layeredNames[0], 'gi'),
          );
          return childMatched && parentMatched ? true : false;
        }
        return targetName.match(new RegExp(name, 'gi')) ? true : false;
      });
      return found ? true : false;
    }
    return false;
  }

  /// 親viewのtypeがxxだったら、yyの名前の子viewを探して、あればその子viewのzzプロパティを親のzzプロパティに適用する
  private assignToAbove(view: SketchView, parentTree: TreeElement) {
    // { 親要素のType : {小要素の名前: プロパティ名 } }
    // 例) List配下にある、Background要素があったら、その要素のbackgroundColorをListのそれに適用する
    const assignAboves: { [s: string]: { [s: string]: string[] } } = {
      List: {
        Background: ['fills', 'backgroundColor'],
      },
    };

    if (!parentTree || !assignAboves) return;

    for (let parentName of Object.keys(assignAboves)) {
      if (parentName !== parentTree.properties.type) continue;
      let viewPropPairs = assignAboves[parentName];
      for (let viewName of Object.keys(viewPropPairs)) {
        if (view.name !== viewName) continue;
        let propNames = viewPropPairs[viewName];
        // todo: `View`以外のプロパティにも対応できるように改善
        for (let propName of propNames) {
          (parentTree.properties as View)[propName] = view[propName];
        }
      }
    }
  }
}
