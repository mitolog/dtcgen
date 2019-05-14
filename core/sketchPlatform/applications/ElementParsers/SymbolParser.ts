import _ = require('lodash');
import { BaseElementParser } from './BaseElementParser';
import { View, TreeElement, Image, TextView } from '../../../domain/Entities';
import { TakeOverData } from '../../entities/TakeOverData';
import { SketchView } from '../../entities/SketchView';
import { SketchUtil } from '../../SketchUtil';
import { AutoParser } from './AutoParser';

export class SymbolParser extends BaseElementParser {
  parse(node: any, view: View, treeElement?: TreeElement) {
    super.parse(node, view, treeElement);
  }

  parseSharedStyle(node: any, styleType: string, view: View) {
    throw new Error('Method not implemented.');
  }
  parseOverride(node: any, styleType: string, view: View) {
    throw new Error('Method not implemented.');
  }

  // todo: embed within `parse` method above
  parseSymbol(
    takeOverData: TakeOverData,
    parentTree: TreeElement,
    parentId?: string,
  ) {
    const node = takeOverData.node;
    if (!node._class || !node.name) {
      return;
    }
    let targetNode: any = this.symbolForNode(node);
    if (!targetNode) {
      // TBD: exclude 'shapeGroup' because it's info is too large to deal with at this time.
      if (node._class === 'shapeGroup') return;
      // there might be rectnagle/image/etc... instances under symbol's sublayers.
      // we need to parse these kinds of layers too.
      targetNode = node;
    }

    const view = new SketchView(targetNode, parentId);
    if (SketchUtil.shouldExclude(node.name, this.config, parentTree)) {
      return;
    }

    const treeElement = new TreeElement(view);
    treeElement.name = takeOverData.name.toLowerCamelCase(' ');
    SketchUtil.parseConstraint(node.resizingConstraint, view);
    takeOverData.takeOverCommonProps(view);

    // AutoParse this node(node-sketch).
    const parser = new AutoParser(
      this.sketch,
      this.config,
      this.pathManager.outputDir,
    );
    parser.parse(targetNode, view, takeOverData.nodeOnArtboard);

    if (takeOverData.imageName) {
      (view as Image).imageName = takeOverData.imageName;
    }
    if (takeOverData.textTitle) {
      ((view as unknown) as TextView).text = takeOverData.textTitle;
    }

    parentTree.addElement(treeElement);
    const subLayers = _.get(targetNode, 'layers');
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
   * Retrieve corresponding symbol for a node(node-sketch) instance.
   * @param node Node instance
   */
  private symbolForNode(node: any): any | null {
    const symbolsPage = this.sketch['symbolsPage'];
    let targetSymbol: any | null = null;
    if (node._class === 'symbolMaster' || node._class === 'symbolInstance') {
      targetSymbol = symbolsPage.get(
        'symbolMaster',
        instance => instance.symbolID === node.symbolID,
      );
      return targetSymbol;
    }
    return targetSymbol;
  }
}
