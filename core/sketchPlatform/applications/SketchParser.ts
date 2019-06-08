import * as _ from 'lodash';
import {
  ElementType,
  Button,
  Image,
  TreeElement,
  TextView,
  TextViewType,
  TextInput,
  NavigationBarIOS,
  DynamicClass,
  DynamicClassShift,
} from '../../domain/Entities';
import { SketchView, TakeOverData } from '../entities/Entities';

import { SketchUtil } from '../SketchUtil';
import {
  IElementParser,
  ButtonParser,
  TextViewParser,
  TextInputParser,
  ImageParser,
  AutoParser,
  ListParser,
  SymbolParser,
  MapParser,
  NavigationBarParser,
} from './ElementParsers';

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
    SketchUtil.parseConstraint(node.resizingConstraint, view);

    if (SketchUtil.shouldExclude(node.name, this.config, parentTree)) return;

    const keywords: string[] = this.config['extraction'].keywords;
    const matches: string[] = keywords.filter(keyword => {
      const results = node.name.match(new RegExp(keyword, 'g'));
      return results && results.length > 0 ? true : false;
    });
    const isKeywordMatched = matches && matches.length > 0 ? true : false;
    if (isKeywordMatched) {
      // adopt last matched word. if target string is like `Final View Button`,
      // so `View` and  `Button` will be matched, but adopt latter one,
      // because it's expected to be a button element according to english grammer.
      view.type = <ElementType>matches[matches.length - 1];

      this.shiftElementIfNeeded(treeElement, parentTree);
      this.parseElement(node, view, treeElement);
      treeElement.name = view.name.toLowerCamelCase(' ');
      parentTree.addElement(treeElement);
      return;
    }

    const classType: string = node._class;
    switch (classType) {
      case 'group':
        parentTree.addElement(treeElement);
        // parse underlying nodes
        node.layers.forEach(aNode => {
          this.parseLayer(aNode, treeElement, view.id);
        });
        break;
      case 'symbolInstance':
        const symbolParser = new SymbolParser(
          this.sketch,
          this.config,
          this.outputDir,
        );
        const takeOverData = new TakeOverData(node);
        symbolParser.parseSymbol(takeOverData, parentTree, parentId);
        break;
      default:
        const parser = new AutoParser(this.sketch, this.config, this.outputDir);
        parser.parse(node, view);
        parentTree.addElement(treeElement);
        break;
    }
  }

  /**
   * Private methods below
   */

  // dynamicClassesのうち、(iOS/Android)テンプレート側で貼り付けしないもの(excludeOnPaste)を、
  // 貼り付けしない分、同階層他の他要素をx,y軸方向のいずれかに詰める必要があれば、詰める
  private shiftElementIfNeeded(
    treeElement: TreeElement,
    parentTree: TreeElement,
  ) {
    const dynamicClasses: DynamicClass[] = _.get(
      this.config,
      'extraction.dynamicClasses',
      [],
    ).map(obj => new DynamicClass(obj));

    if (!dynamicClasses || dynamicClasses.length <= 0) return;
    const excludes = dynamicClasses.filter(classObj => classObj.excludeOnPaste);
    if (!excludes || excludes.length <= 0) return;

    const targetViewType: ElementType = treeElement.properties.type;
    const targetRect = treeElement.properties.rect;
    const targetName = treeElement.name;

    for (const classObj of excludes) {
      const shiftDirection = classObj.getShift();
      if (!shiftDirection) continue;
      const excludeName = classObj.name || null;
      if (!excludeName || excludeName !== targetViewType) continue;

      // sketch/figmaも、画面上では、上から順にz軸で前面 -> 後面 と並んでいる
      // 一方TreeElement.elementsでは、後面 -> 前面の順で入っている
      // よってfor文でindex順にiterateしてる場合、後面からでてくるので、
      // 除外対象要素にぶち当たったら、そこで処理完了とし、それより前面のlayerは処理しない。
      for (const elm of parentTree.elements) {
        const isNotShiftOriginElement = elm.name !== targetName;
        if (!isNotShiftOriginElement) break;

        switch (shiftDirection) {
          case DynamicClassShift.up:
            if (targetRect.y < elm.properties.rect.y) {
              elm.properties.rect.y = elm.properties.rect.y - targetRect.height;
            }
            break;
          case DynamicClassShift.down:
            if (targetRect.y > elm.properties.rect.y) {
              elm.properties.rect.y = elm.properties.rect.y + targetRect.height;
            }
            break;
          case DynamicClassShift.left:
            if (targetRect.x < elm.properties.rect.x) {
              elm.properties.rect.x = elm.properties.rect.x - targetRect.width;
            }
            break;
          case DynamicClassShift.right:
            if (targetRect.x > elm.properties.rect.x) {
              elm.properties.rect.x = elm.properties.rect.x + targetRect.width;
            }
            break;
        }
      }
    }
  }

  private parseElement(node: any, view: SketchView, treeElement: TreeElement) {
    let parser: IElementParser;
    switch (view.type) {
      case ElementType.Button:
        parser = new ButtonParser(this.sketch, this.config);
        parser.parse(node, <Button>(<unknown>view));
        break;
      case ElementType.TextView:
        ((<unknown>view) as TextView).textViewType = TextViewType.textView;
        parser = new TextViewParser(this.sketch, this.config);
        parser.parse(node, <TextView>(<unknown>view));
        break;
      case ElementType.TextInput:
        parser = new TextInputParser(this.sketch, this.config);
        parser.parse(node, <TextInput>(<unknown>view));
        break;
      case ElementType.Image:
        parser = new ImageParser(this.sketch, this.config, this.outputDir);
        parser.parse(node, <Image>(<unknown>view));
        break;
      case ElementType.List:
        parser = new ListParser(this.sketch, this.config, this.outputDir);
        parser.parse(node, view, treeElement);
        break;
      case ElementType.Map:
        parser = new MapParser(this.sketch, this.config, this.outputDir);
        parser.parse(node, view, treeElement);
        break;
      case ElementType.NavBar:
        parser = new NavigationBarParser(
          this.sketch,
          this.config,
          this.outputDir,
        );
        parser.parse(node, <NavigationBarIOS>(<unknown>view), treeElement);
        break;
      default:
        break;
    }
  }
}
