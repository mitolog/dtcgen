import * as fs from 'fs';
import * as ns from 'node-sketch';
import * as _ from 'lodash';
import { SketchLayerType } from '../entities/SketchLayerType';
import { injectable } from 'inversify';
import * as dotenv from 'dotenv';
import * as cp from 'child_process';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export interface ISketchRepository {
  getAll(type: SketchLayerType): Promise<Node[]>;
  extractAll(): Promise<any[]>;
  extractSlices(): void;
}

@injectable()
export class SketchRepository implements ISketchRepository {
  private config: any = null;

  constructor() {
    // todo: config探索
    const configDir = process.env.LINT_CONFIG_PATH;
    const jsonObj = JSON.parse(fs.readFileSync(configDir, 'utf8'));
    if (jsonObj) {
      this.config = jsonObj.sketch;
    }
  }

  /**
   * Private methods
   */

  private async getSketch() {
    return await ns.read(process.env.SKETCH_PATH);
  }

  private recurciveGetLayers(node, hierarchy, sketch, outputs) {
    let maxHierarchy = this.config.extraction.maxHierarchy;
    if (!maxHierarchy) {
      maxHierarchy = 3; // default
    }

    const viewObj = { type: 'View', hierarchy: hierarchy };
    this.parseConstraint(node.resizingConstraint, viewObj);

    // 'group' should be translated into container views which includes various elements
    if (
      node._class === 'group' &&
      node.layers &&
      node.layers.length > 0 &&
      hierarchy <= maxHierarchy - 1
    ) {
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
      if (keywords && keywords.length > 0) {
        const matched = keywords.filter(keyword => {
          const results = node.name.match(new RegExp(keyword, 'g'));
          return results && results.length > 0 ? true : false;
        });
        if (matched && matched.length > 0) {
          // matchedは最後にマッチしたものを採用する。例えば keywordsに `Button`, `View`があったとして
          // filterをかける、node.nameが `Final View Button` とかだと、複数マッチする。
          // この時、文法的にこのnodeはボタンと想定されるので、matchedの最後の要素を viewObjのtype
          // とするほうが自然では。
          viewObj.type = matched[matched.length - 1];
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
          viewObj['containerColor'] = { fill: fillObj.color };
          if (shouldFollowOverrides) {
            const parsedObj = this.parseOverride(
              node,
              sketch.layerStyles,
              'layerStyle',
            );
            if (!parsedObj) break;
            viewObj['containerColor'] = parsedObj['containerColor'];
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
          if (shouldFollowOverrides) {
            const parsedObj = this.parseOverride(
              node,
              sketch.layerStyles,
              'stringValue',
            );
            viewObj['name'] = parsedObj['name'];
          }
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

  private parseConstraint(value: number, viewObj: object) {
    // https://medium.com/zendesk-engineering/reverse-engineering-sketchs-resizing-functionality-23f6aae2da1a
    const bitWiseAnd = parseInt(value.toString(2));
    const bitWiseAndPadded = ('0000000000' + bitWiseAnd).slice(-6);
    const constraints = {
      none: bitWiseAndPadded === '111111' ? true : false,
      top: bitWiseAndPadded.substr(0, 1) === '0' ? true : false,
      right: bitWiseAndPadded.substr(5, 1) === '0' ? true : false,
      bottom: bitWiseAndPadded.substr(2, 1) === '0' ? true : false,
      left: bitWiseAndPadded.substr(3, 1) === '0' ? true : false,
      width: bitWiseAndPadded.substr(4, 1) === '0' ? true : false,
      height: bitWiseAndPadded.substr(1, 1) === '0' ? true : false,
    };
    viewObj['constraints'] = constraints;
  }

  // 出力前にconstraintの値を付与
  private addConstraintValues(outputs) {
    if (!outputs) return;

    for (const output of outputs) {
      if (!output.constraints) continue;
      const baseViews = outputs.filter(
        view =>
          output.parentId
            ? view.id === output.parentId
            : view.id === output.containerId,
      );
      if (!baseViews || baseViews.length <= 0) continue;
      // TODO: shuold be taken from "iPhone X Frame" symbol
      let baseRect = output.parentId
        ? baseViews[0].rect
        : { x: 0, y: 0, width: 375, height: 812 };
      // calculate margins from each sides
      let newConstraints = {};
      if (output.constraints.top) {
        newConstraints['top'] = output.rect.y.toString();
      }
      if (output.constraints.right) {
        newConstraints['right'] = (
          baseRect.width -
          (output.rect.x + output.rect.width)
        ).toString();
      }
      if (output.constraints.bottom) {
        newConstraints['bottom'] = (
          baseRect.height -
          (output.rect.y + output.rect.height)
        ).toString();
      }
      if (output.constraints.left) {
        newConstraints['left'] = output.rect.x.toString();
      }
      if (output.constraints.width) {
        newConstraints['width'] = output.rect.width.toString();
      }
      if (output.constraints.height) {
        newConstraints['height'] = output.rect.height.toString();
        output.constraints = newConstraints;
      }
    }
  }

  private parseOverride(node, sharedStyles, styleType): Object {
    // const textLayerStyles = sketch.textLayerStyles;
    if (!node.overrideValues) return null;

    // extract targetOverride
    // TODO: node.overrideValuesには、対象となるstyleType(例えば `layerStyle` )のoverrideは常に1つであるという前提にたっている
    const targetOverride = node.overrideValues
      .filter(overrideValue => {
        const results = overrideValue.overrideName.match(
          new RegExp(styleType, 'g'),
        );
        return results && results.length > 0;
      })
      .reduce((acc, current) => current, 0);
    if (!targetOverride) return null;

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
        const targetStyle = sharedStyles
          .filter(style => style.do_objectID === sharedStyleId)
          .reduce((acc, current) => current, 0);
        if (!targetStyle) return null;
        const fill = targetStyle['value']['fills'][0];
        const bgColorObj = {
          fill: fill['color'],
          name: targetStyle['name'],
        };
        resultObj['containerColor'] = bgColorObj;
        break;
      case 'stringValue':
        resultObj['name'] = targetOverride['value'];
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

    this.addConstraintValues(outputs);
    return outputs;
  }

  extractSlices(): void {
    const execSync = cp.execSync;
    let command = process.env.SKETCH_TOOL_PATH;
    command += ' export slices ';
    command += process.env.SKETCH_PATH;
    command += ' --formats=pdf'; //png,svg
    // command += ' --scales=1,2,3';
    command += ' --output=' + process.env.SKETCH_ASSET_OUTPUT_PATH;

    execSync(command);
  }
}
