import {
  ElementType,
  Button,
  Image,
  TreeElement,
  TextView,
  TextInput,
  NavigationBarIOS,
} from '../../domain/Entities';
import { SketchView } from '../entities/SketchView';
import { TakeOverData } from '../entities/TakeOverData';

import { SketchUtil } from '../SketchUtil';
import { IElementParser } from './ElementParsers/IElementParser';
import { ButtonParser } from './ElementParsers/ButtonParser';
import { TextViewParser } from './ElementParsers/TextViewParser';
import { TextInputParser } from './ElementParsers/TextInputParser';
import { ImageParser } from './ElementParsers/ImageParser';
import { AutoParser } from './ElementParsers/AutoParser';
import { TextViewType } from '../../domain/entities/TextView';
import { ListParser } from './ElementParsers/ListParser';
import { SymbolParser } from './ElementParsers/SymbolParser';
import { MapParser } from './ElementParsers/MapParser';
import { NavigationBarParser } from './ElementParsers/NavigationBarParser';

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
    }

    if (isKeywordMatched) {
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
