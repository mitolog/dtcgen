import * as fs from 'fs-extra';
import * as ns from 'node-sketch';
import * as _ from 'lodash';
import { SketchLayerType } from '../entities/SketchLayerType';
import { injectable } from 'inversify';
import * as dotenv from 'dotenv';
import * as cp from 'child_process';
import * as path from 'path';
import * as pluralize from 'pluralize';
import '../../extensions/String.extensions';
import { SketchContainer } from '../entities/SketchContainer';
import { SketchParser } from '../applications/SketchParser';
import { Rect } from '../../domain/entities/Rect';
import { TreeElement } from '../../domain/entities/TreeElement';
import { PathManager, OutputType } from '../../utilities/PathManager';
import { SketchView } from '../entities/SketchView';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

type DynamicAttribute = { [k: string]: [[TreeElement?]] };

export interface ISketchRepository {
  getAll(inputPath: string): Promise<Node[]>;
  extractAll(inputPath: string, outputDir?: string): Promise<void>;
  extractSlices(inputPath: string, outputDir?: string): void;
}

@injectable()
export class SketchRepository implements ISketchRepository {
  constructor() {}

  /**
   * Private methods
   */

  /**
   * recursively lookup config json from
   * command executed directory to upper directories.
   * @param jsonPath {string?} path to config json
   * @return sketch {string?} sketch config object
   */
  private getConfig(jsonPath?: string): Object | null {
    const targetPath = jsonPath || process.env.CONFIG_PATH;
    const absolutePath = path.isAbsolute(targetPath)
      ? targetPath
      : path.resolve(process.cwd(), targetPath);

    if (fs.existsSync(absolutePath)) {
      const jsonObj = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      return jsonObj.sketch;
    } else if (path.dirname(absolutePath) === '/') {
      throw new Error('no config file');
    }

    const upperFilePath = path.join(
      path.dirname(absolutePath),
      '../',
      path.basename(absolutePath),
    );
    return this.getConfig(upperFilePath);
  }

  /**
   * get sketch file object from which extract metadata and asset files
   * return {Promise<any>} node-sketch object which express sketch file.
   */
  private async getTargetSketch(inputPath: string): Promise<any> {
    const absolutePath = this.absolutePath(inputPath);
    if (!absolutePath) return;
    return await ns.read(absolutePath);
  }

  private absolutePath(pathOrDir: string): string {
    const absolutePath = path.isAbsolute(pathOrDir)
      ? pathOrDir
      : path.resolve(process.cwd(), pathOrDir);
    if (!absolutePath) return null;
    return absolutePath;
  }

  /**
   * add constraint values(numbers) which represents relative position from parent view
   * @param outputs {any[]} An array of [ Container | View | subclass of View ]
   */
  private addConstraintValues(props: [SketchView?]): void {
    if (!props || props.length <= 0) return;

    for (const output of props) {
      if (!output.constraints || !output.parentId) continue;
      let baseView: SketchContainer | SketchView;
      let parentId = output.parentId;
      for (const prop of props) {
        if (prop.id === parentId) {
          baseView = prop;
          break;
        }
      }
      if (!baseView) continue;
      const originalRect: Rect =
        baseView.type === 'Container'
          ? baseView.rect
          : (baseView as SketchView).originalRect;
      // calculate margins from each sides
      let newConstraints = {};
      if (output.constraints.top) {
        newConstraints['top'] = output.rect.y.toString();
      }
      if (output.constraints.right) {
        newConstraints['right'] = (-(
          originalRect.width -
          (output.rect.x + output.rect.width)
        )).toString();
      }
      if (output.constraints.bottom) {
        newConstraints['bottom'] = (-(
          originalRect.height -
          (output.rect.y + output.rect.height)
        )).toString();
      }
      if (output.constraints.left) {
        newConstraints['left'] = output.rect.x.toString();
      }
      if (output.constraints.width) {
        newConstraints['width'] = output.rect.width.toString();
      }
      if (output.constraints.height) {
        newConstraints['height'] = output.rect.height.toString();
      }
      output.constraints = newConstraints;
    }
  }

  private checkIntegrity(
    treeElement: TreeElement,
    views: [SketchView?],
    matched: [string?],
    errors: [string?],
  ) {
    let result = false;
    for (const view of views) {
      if (view.id === treeElement.uid) {
        result = true;
      }
    }
    if (result) {
      matched.push(treeElement.uid);
    } else {
      errors.push(treeElement.uid);
    }

    if (treeElement.elements && treeElement.elements.length > 0) {
      for (const aNode of treeElement.elements) {
        this.checkIntegrity(aNode, views, matched, errors);
      }
    }
  }

  private gatherDynamicAttributes(
    dynamicClasses: string[],
    treeElement: TreeElement,
    attribute: DynamicAttribute,
  ) {
    // treeElementsを走査して、dynamicClassesにマッチすれば、その配下を格納
    const targetName = treeElement.name;
    const matches: string[] = dynamicClasses.filter(className => {
      const results = targetName.match(new RegExp(className, 'gi'));
      return results && results.length > 0 ? true : false;
    });
    const isDynamic = matches && matches.length > 0 ? true : false;
    if (!isDynamic) {
      for (const element of treeElement.elements) {
        this.gatherDynamicAttributes(dynamicClasses, element, attribute);
      }
      return;
    }

    const assignableClassName: string = matches[matches.length - 1];
    // 末尾に近い方のclassNameのindexより前の部分の文字列を取得
    const regExp = new RegExp(assignableClassName, 'gi');
    let matchStartIndex: number = 0;
    let match: RegExpExecArray;
    while ((match = regExp.exec(targetName)) != null) {
      if (match.index > matchStartIndex) {
        matchStartIndex = match.index;
      }
    }
    // `classPrefix` shuold be like "City", not "Cities"
    let classPrefix: string =
      targetName.substring(0, matchStartIndex) || targetName;
    if (attribute[classPrefix]) {
      attribute[classPrefix].push(treeElement.elements);
    } else {
      attribute[classPrefix] = [treeElement.elements];
    }
  }

  /**
   * interface implementation
   */

  /// retrieve all artboards the sketch file has.
  async getAll(inputPath: string): Promise<Node[]> {
    const sketch = await this.getTargetSketch(inputPath);
    const pages = sketch.pages;
    const nodes = [];
    for (const page of pages) {
      if (page.name === 'Symbols') continue;
      const instances = page.getAll(SketchLayerType.Artboard);
      if (!instances) continue;
      nodes.push(instances);
    }
    const result = [].concat(...nodes); // lessen dimension
    return result;
  }

  /// Extract all elements which belongs to each artboards. No validation because we assume it's already linted.
  async extractAll(inputPath: string, outputDir?: string): Promise<void> {
    const sketch = await this.getTargetSketch(inputPath);
    const pathManager = new PathManager(outputDir);

    // extract all images within 'Pages'(not in 'Symbols')
    const imagesDirName = pathManager.getOutputPath(OutputType.images, true);
    sketch.use(new ns.plugins.ExportImages(imagesDirName));

    // extract all artboards
    const artboards = await this.getAll(inputPath);
    const views: [SketchView?] = [];
    const treeElements: [TreeElement?] = [];
    const sketchConfig: Object = this.getConfig();
    const sketchParser = new SketchParser(sketch, sketchConfig, outputDir);
    const dynamicClasses: string[] = _.get(
      sketchConfig,
      'extraction.dynamicClasses',
    );
    const attributesByArtboards: { [k: string]: DynamicAttribute } = {};

    artboards.forEach(artboard => {
      if (!artboard['name']) return; // same as continue

      const container: SketchContainer = new SketchContainer(artboard);
      const topTree: TreeElement = new TreeElement(container);
      // todo: パターンマッチによる名前の抽出
      container.name = artboard['name'].toLowerCamelCase('/');
      topTree.name = container.name;
      views.push(container as SketchView);

      artboard['layers'].forEach(node => {
        sketchParser.parseLayer(node, views, topTree, container.id);
      });
      treeElements.push(topTree);

      const attribute: DynamicAttribute = {};
      this.gatherDynamicAttributes(dynamicClasses, topTree, attribute);
      attributesByArtboards[container.name] = attribute;
    });

    this.addConstraintValues(views);

    const errors: [string?] = [];
    let matched: [string?] = [];
    const elementTotalCount: number = views.length;
    for (const element of treeElements) {
      this.checkIntegrity(element, views, matched, errors);
    }
    if (matched.length !== elementTotalCount) {
      throw new Error(
        `extracted jsons have some unintegrity: ${errors.map(error => error)}`,
      );
    }

    for (const artboardName of Object.keys(attributesByArtboards)) {
      const attribute: DynamicAttribute = attributesByArtboards[artboardName];
      for (const classPrefix of Object.keys(attribute)) {
        const classes: string = pluralize(classPrefix); // make plural(複数形)
        if (!classes) continue;
        const attributesPath = pathManager.getOutputPath(
          OutputType.dynamicAttributes,
          true,
          null,
          `${artboardName}/${classes}.json`,
        );
        const elements: [[TreeElement?]] = attribute[classPrefix];
        fs.writeFileSync(attributesPath, JSON.stringify(elements));
      }
    }
    // metadata用のdirにdynamicData用のdirを作り、更にartboard別にdirを作り、その配下に各jsonを出力する
    /**
     * {
     *  travelCities: {
     *   Cities: [ [TreeElement?], [TreeElement?] ... ],
     *   Hotels: [ [TreeElement?], [TreeElement?] ... ]
     *  },
     *  hotelCity: {
     *
     *  }
     * }
     *
     * -> /travelCities
     *      Cities.json : [ [TreeElement?], [TreeElement?] ... ]
     *      Hotels.json : [ [TreeElement?], [TreeElement?] ... ]
     *
     */

    const metadataPath = pathManager.getOutputPath(OutputType.metadata, true);
    fs.writeFileSync(metadataPath, JSON.stringify(views));

    const treePath = pathManager.getOutputPath(OutputType.tree, true);
    fs.writeFileSync(treePath, JSON.stringify(treeElements));
  }

  extractSlices(inputPath: string, outputDir?: string): void {
    const absoluteInputPath = this.absolutePath(inputPath);
    const pathManager = new PathManager(outputDir);
    if (!absoluteInputPath) return;
    const execSync = cp.execSync;
    const dirPath = pathManager.getOutputPath(OutputType.slices, true);
    let command = process.env.SKETCH_TOOL_PATH;
    command += ' export slices ';
    command += absoluteInputPath;
    command += ' --formats=pdf'; //png,svg
    // command += ' --scales=1,2,3';
    command += ' --output=' + dirPath;

    execSync(command);

    // `export slices` command may make leading/trailing spaces, so remove these.
    pathManager.removeWhiteSpaces(dirPath);
  }
}
