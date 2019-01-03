import { View } from '../../domain/entities/View';
import { ElementType } from '../../domain/entities/ElementType';
import { Constraints } from '../../domain/entities/Constraints';
import * as _ from 'lodash';
import { ButtonParser } from './ElementParsers/ButtonParser';
import { Button } from '../../domain/entities/Button';
import { IElementParser } from './ElementParsers/IElementParser';
import { TextViewParser } from './ElementParsers/TextViewParser';
import { TextView } from '../../domain/entities/TextView';
import { TextInputParser } from './ElementParsers/TextInputParser';
import { TextInput } from '../../domain/entities/TextInput';
import { ImageParser } from './ElementParsers/ImageParser';
import { AutoParser } from './ElementParsers/AutoParser';
import { TakeOverArtboardData } from '../entities/TakeOverArtboardData';
import { Image } from '../../domain/entities/Image';

export interface ISketchParser {
  parseLayer(node: any, hierarchy: number, outputs: any[]);
  parseElement(node: any, view: View);
  parseSymbol(
    node: any,
    hierarchy: number,
    outputs: any[],
    takeOverData: TakeOverArtboardData,
  );
  parseConstraint(value: number, viewObj: object);
}

export class SketchParser implements ISketchParser {
  private sketch: Object;
  private config: Object;
  private outputDir?: string;

  constructor(sketch: Object, config: Object, outputDir?: string) {
    this.sketch = sketch;
    this.config = config;
    this.outputDir = outputDir;
  }

  /**
   * Interface methods below
   */

  parseLayer(node: any, hierarchy: number, outputs: any[]) {
    let maxHierarchy: number = this.config['extraction'].maxHierarchy;
    if (!maxHierarchy) {
      maxHierarchy = 3; // default
    }

    // assign default values, but these may be overridden latter procedure.
    const view: View = new View(node, hierarchy);
    this.parseConstraint(node.resizingConstraint, view);

    if (this.shouldExclude(node.name)) return;

    // `group` translated into `view` which holds various views on it
    if (
      node._class === 'group' &&
      _.size(node.layers)
      // hierarchy <= maxHierarchy - 1  // TBD: hierarchy shuoldn't be evaluated?
    ) {
      outputs.push(view);
      hierarchy++;
      // parse underlying nodes
      node.layers.forEach(aNode => {
        this.parseLayer(aNode, hierarchy, outputs);
      });
    }
    // 'symbolInstance' should be translated into each elements depends on each view type
    else if (node._class === 'symbolInstance') {
      const keywords: string[] = this.config['extraction'].keywords;
      if (!keywords || keywords.length <= 0) return;

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
        outputs.push(view);
      } else {
        // マッチしないシンボルはouputには入れず、symbolの実態をviewとして扱う
        // 更にそのsymbolの配下を再帰的にパースしてoutputに追加する形をとる
        // ただ、抽出したjsonはすべて階層構造を持たない(すべて階層1)ので、
        // シンボルが属するartboardを識別するには、containerId(属するartboardのid)が必要
        // また、symbolの座標やconstraintsはartboard上のものではないため、それらも引き継ぐ
        const takeOverData = new TakeOverArtboardData(node, hierarchy);
        this.parseSymbol(node, hierarchy, outputs, takeOverData);
      }
    }
  }

  parseElement(node: any, view: View) {
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

  parseSymbol(
    node: any,
    hierarchy: number,
    outputs: any[],
    takeOverData: TakeOverArtboardData,
  ) {
    if (!node._class || !node.name || this.shouldExclude(node.name)) return;
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
    if (!targetSymbol) {
      // todo: symbolMaster, symbolInstanceでパースしたが、マッチするシンボルがない場合。
      // またはshapeGroupの場合。イレギュラーケースもある? 要調査。
      return;
    }

    //if (this.shouldExclude(node.name)) return;
    const view: View = new View(targetSymbol, hierarchy);
    this.parseConstraint(node.resizingConstraint, view);
    view.containerId = takeOverData.artboardId;
    if (view.hierarchy === takeOverData.hierarchy) {
      // artboardからsymbolに移動する時の1回だけ、データを引き継ぐ
      view.rect = takeOverData.rect;
      view.parentId = takeOverData.parentId;
      // node名を引き継ぐと同じ名前が大量にできる傾向にあるので、一旦コメントアウト
      //view.name = takeOverData.name;
    }

    const subLayers = _.get(targetSymbol, 'layers');
    if (!subLayers || subLayers.length <= 0) {
      // 最下層なので、ここで当該要素(node)をパース
      const parser = new AutoParser(this.sketch, this.config, this.outputDir);
      parser.parse(targetSymbol, view);
      // todo: 以下2つのtakeOverの渡し方、めちゃめちゃヘボい。artboard上での必要な情報をsymbolに引き継ぐのに
      // artboard上のsymbolInstanceごと渡した方が良さそう
      if (takeOverData.imageName) {
        (view as Image).imageName = takeOverData.imageName;
      }
      if (takeOverData.textTitle) {
        (view as TextView).text = takeOverData.textTitle;
      }
      outputs.push(view);
      return;
    }

    outputs.push(view);
    hierarchy++;
    // todo: こちらの引き継ぎ方も上記同様だめ
    const tmpArtboardId = takeOverData.artboardId;
    const tmpImageName = takeOverData.imageName;
    const tmpTextTitle = takeOverData.textTitle;
    subLayers.forEach(layer => {
      const takeOverData = new TakeOverArtboardData(layer, hierarchy);
      takeOverData.artboardId = tmpArtboardId;
      takeOverData.imageName = tmpImageName;
      takeOverData.textTitle = tmpTextTitle;
      this.parseSymbol(layer, hierarchy, outputs, takeOverData);
    });
  }

  /**
   * Parse constraint value and output to view object.
   * Each constraints are re-assigned later considering related margins.
   * @param value bitmasked constraint value
   * @param view parsed view object
   */
  parseConstraint(value: number, view: View) {
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
   * Private methods below
   */

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
