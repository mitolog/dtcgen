import * as fs from 'fs';
import * as ns from 'node-sketch';
import { SketchLayerType } from '../entities/SketchLayerType';
import { injectable } from 'inversify';

export interface ISketchRepository {
  getAll(type: SketchLayerType): Promise<Node[]>;
  extractAll(): Promise<any[]>;
}

@injectable()
export class SketchRepository implements ISketchRepository {
  private config: any = null;

  constructor() {
    // todo: linter.configからパスを取得
    const coreDir = process.env.CORE_DIR;
    // todo: configファイルの探索
    const jsonObj = JSON.parse(
      fs.readFileSync(
        '/Users/mito/Documents/Proj/innova/sketchLinter/sketchLinter/linter.config.json',
        'utf8',
      ),
    );
    if (jsonObj) {
      this.config = jsonObj.sketch;
    }
  }

  /**
   * Private methods
   */

  private retrieveSketchFilePath(): string {
    if (!this.config || !this.config['targetSketchFilePath']) return;
    return this.config['targetSketchFilePath'];
  }

  private async getSketch() {
    const fp = this.retrieveSketchFilePath();
    return await ns.read(fp);
  }

  private recurciveGetLayers(node, hierarchy, sketch, outputs) {
    //const space = Array(hierarchy).join(' ');
    let maxHierarchy = this.config.extraction.maxHierarchy;
    if (!maxHierarchy) {
      maxHierarchy = 3; // default
    }

    // 'group' should be translated into container views which includes various elements
    if (
      node._class === 'group' &&
      node.layers &&
      node.layers.length > 0 &&
      hierarchy <= maxHierarchy - 1
    ) {
      const viewObj = { type: 'View', hierarchy: hierarchy };

      const includedArtboard = node.getParent('artboard');
      if (includedArtboard) {
        viewObj['containerId'] = includedArtboard.do_objectID;
      }
      const parent = node.getParent('group');
      if (parent) {
        viewObj['parentId'] = parent.do_objectID;
      }
      viewObj['name'] = node.name;
      viewObj['id'] = node.do_objectID;
      viewObj['constraint'] = node.resizingConstraint;
      viewObj['isVisible'] = node.isVisible;
      if (node.frame._class === 'rect') {
        const frame = node.frame;
        viewObj['rect'] = {
          x: frame.x,
          y: frame.y,
          width: frame.width,
          height: frame.height,
        };
      }
      outputs.push(viewObj);
      hierarchy++;
      // parse underlying nodes
      node.layers.forEach(aNode => {
        this.recurciveGetLayers(aNode, hierarchy, sketch, outputs);
      });
    }
    // 'symbolInstance' should be translated into each elements on container views which is originally 'group'
    else if (node._class === 'symbolInstance') {
      const keywords = this.config.extraction.keywords;
      const viewObj = { type: 'View' };
      if (keywords && keywords.length > 0) {
        const matched = keywords.filter(keyword => {
          const results = node.name.match(new RegExp(keyword, 'g'));
          return results && results.length > 0 ? true : false;
        });
        if (matched && matched.length > 0) {
          viewObj.type = matched[0];
        } else {
          return;
        }
      }

      const parent = node.getParent('group');
      if (parent) {
        viewObj['parentId'] = parent.do_objectID;
      }
      const includedArtboard = node.getParent('artboard');
      if (includedArtboard) {
        viewObj['containerId'] = includedArtboard.do_objectID;
      }
      viewObj['name'] = node.name;
      viewObj['id'] = node.do_objectID;
      viewObj['constraint'] = node.resizingConstraint;
      viewObj['isVisible'] = node.isVisible;
      if (node.frame._class === 'rect') {
        const frame = node.frame;
        viewObj['rect'] = {
          x: frame.x,
          y: frame.y,
          width: frame.width,
          height: frame.height,
        };
      }

      this.parseSymbol(node, sketch, viewObj);
      outputs.push(viewObj);
    }
  }

  private parseSymbol(node, sketch, viewObj) {
    const symbolsPage = sketch.symbolsPage;
    const targetSymbol = symbolsPage.get(
      'symbolMaster',
      instance => instance.symbolID === node.symbolID,
    );
    if (
      !targetSymbol ||
      !targetSymbol.layers ||
      targetSymbol.layers.length <= 0
    )
      return;

    // TBD: exclude 'shapeGroup' because it's info is too large to deal with at this time.
    const layers = targetSymbol.layers.filter(
      layer => layer._class !== 'shapeGroup',
    );
    // ここでパースするelement毎に異なる取得情報
    const parseElements = this.config.extraction[viewObj.type.toLowerCase()];
    const shouldFollowOverrides = this.config.extraction.followOverrides;

    for (const key of Object.keys(parseElements)) {
      // TBD: 命名規則で大文字小文字を指定したものをここでも踏襲したほうがいいのではと
      const nameKey = key.charAt(0).toUpperCase() + key.slice(1); // とりあえず頭文字だけ大文字
      const matchedElements = layers.filter(
        layer => layer.name === nameKey && layer._class === parseElements[key],
      );
      const aElement = matchedElements[0];
      if (!aElement) continue;

      // ボタンの場合
      switch (key) {
        case 'background':
          viewObj['radius'] = aElement.fixedRadius;
          const fillObj = aElement.style.fills[0];
          viewObj['backgroundColor'] = fillObj.color.toJson();
          if (shouldFollowOverrides) {
            const parsedObj = this.parseOverride(
              node,
              sketch.layerStyles,
              'layerStyle',
            );
            if (!parsedObj) break;
            viewObj['backgroundColor'] = parsedObj['backgroundColor'];
          }
          break;
        case 'label':
          // prettier-ignore
          if (
            !aElement.style ||
            !aElement.style.textStyle ||
            !aElement.style.textStyle.encodedAttributes ||
            !aElement.style.textStyle.encodedAttributes.MSAttributedStringFontAttribute
          )
            break;
          const textAttribute = aElement.style.textStyle.encodedAttributes;
          // prettier-ignore
          const fontObj = aElement.style.textStyle.encodedAttributes.MSAttributedStringFontAttribute;
          viewObj['fontName'] = fontObj.attributes.name;
          viewObj['fontSize'] = fontObj.attributes.size;
          if (!textAttribute.MSAttributedStringColorAttribute) break;
          viewObj['color'] = textAttribute.MSAttributedStringColorAttribute;
          break;
        default:
          break;
      }
    }
  }

  private parseOverride(node, sharedStyles, styleType): Object {
    // const textLayerStyles = sketch.textLayerStyles;
    if (!node.overrideValues) return null;

    // extract targetOverride
    const targetOverride = node.overrideValues.filter(overrideValue => {
      const results = overrideValue.overrideName.match(
        new RegExp(styleType, 'g'),
      );
      return results && results.length > 0;
    });
    if (!targetOverride || targetOverride.length <= 0) return null;

    /**
     * 5-3. 3で取得したsymbolMasterオブジェクトのlayers[]を走査し、5-2で取得したID部分と、layers[].do_objectIDとが同じであればソレが対象レイヤ
        (sharedStyleまで追うかどうかを設定で切り替えられてもいいかも)
        ↑のマッチングをスキップしてる。もしかすると必要かも。
     */

    // parse each override objects
    const resultObj = {};
    switch (styleType) {
      case 'layerStyle':
        const sharedStyleId = targetOverride['value'];
        const targetStyles = sharedStyles.filter(
          style => style.do_objectID === sharedStyleId,
        );
        if (!targetStyles || targetStyles.length <= 0) return null;
        const fill = targetStyles[0]['value']['fills'][0];
        resultObj['backgroundColor'] = fill.color.toJson();
        break;
      case 'stringValue':
        const title = targetOverride['value'];
        break;
      default:
        break;
    }
    return resultObj;
  }

  /**
   * interface implementation
   */

  // type parameter should be 'artboard' currently.
  async getAll(type: SketchLayerType): Promise<Node[]> {
    const isArtboard = type === SketchLayerType.Artboard;
    const sketch = await this.getSketch();

    const pages = sketch.pages;
    const nodes = [];
    for (const page of pages) {
      if (isArtboard && page.name === 'Symbols') continue;
      const instances = page.getAll(type);
      if (!instances) continue;
      nodes.push(instances);
    }
    const result = [].concat(...nodes); // lessen dimension
    return result;
  }

  // このusecaseを使う前に既にlintはしている前提なので、バリデーションはしない
  // 'type' parameter should be 'artboard' currently.
  async extractAll(): Promise<any[]> {
    const sketch = await this.getSketch();
    const artboards = await this.getAll(SketchLayerType.Artboard);

    // 最終出力するjsonの雛形を用意
    const outputs = [];

    // 再帰的にkeywordsにマッチする要素と中間要素を抽出
    artboards.forEach(artboard => {
      if (!artboard['name']) return; // same as continue
      let artboardName = artboard['name'];

      // todo: パターンマッチによる名前の抽出
      artboardName = artboardName
        .split('/')
        .map(str => str.trim())
        .join('');

      const containerObj = { type: 'Container', id: artboard['do_objectID'] };
      containerObj['name'] = artboardName; //artboard['name'];
      outputs.push(containerObj);

      artboard['layers'].forEach(node => {
        this.recurciveGetLayers(node, 1, sketch, outputs);
      });
    });
    return outputs;
  }
}
