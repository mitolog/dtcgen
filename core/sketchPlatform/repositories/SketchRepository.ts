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
import { isContainer } from '../../typeGuards';

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
   * Recursively add constraint values(numbers) which represents relative position from parent view
   * @param currentTreeElement {TreeElement} representing current view during recursive search
   * @param topElement {TreeElement} representing artboard
   */
  private addConstraintValues(
    currentTreeElement: TreeElement,
    topElement: TreeElement,
  ): void {
    for (const treeElement of currentTreeElement.elements) {
      if (treeElement.elements.length > 0) {
        this.addConstraintValues(treeElement, topElement);
      }

      //if (isContainer(treeElement.properties)) continue;
      const view = treeElement.properties as SketchView;
      if (!view.constraints || !view.parentId) continue;
      // TBD: `searchElement` can be bottleneck of speed because it's recursive.
      const parentTreeElement = topElement.searchElement(view.parentId);
      if (!parentTreeElement) continue;
      let baseView: SketchContainer | SketchView = parentTreeElement.properties;
      if (!baseView) continue;

      const originalRect: Rect =
        baseView.type === 'Container'
          ? baseView.rect
          : (baseView as SketchView).originalRect;
      // calculate margins from each sides
      let newConstraints = {};
      if (view.constraints.top) {
        newConstraints['top'] = view.rect.y.toString();
      }
      if (view.constraints.right) {
        newConstraints['right'] = (-(
          originalRect.width -
          (view.rect.x + view.rect.width)
        )).toString();
      }
      if (view.constraints.bottom) {
        newConstraints['bottom'] = (-(
          originalRect.height -
          (view.rect.y + view.rect.height)
        )).toString();
      }
      if (view.constraints.left) {
        newConstraints['left'] = view.rect.x.toString();
      }
      if (view.constraints.width) {
        newConstraints['width'] = view.rect.width.toString();
      }
      if (view.constraints.height) {
        newConstraints['height'] = view.rect.height.toString();
      }

      view.constraints = newConstraints;
      treeElement.properties = view;
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

      artboard['layers'].forEach(node => {
        sketchParser.parseLayer(node, topTree, container.id);
      });
      this.addConstraintValues(topTree, topTree);
      treeElements.push(topTree);

      const attribute: DynamicAttribute = {};
      this.gatherDynamicAttributes(dynamicClasses, topTree, attribute);
      attributesByArtboards[topTree.name] = attribute;
    });

    // delete current attributes first
    const attributesPath = pathManager.getOutputPath(
      OutputType.dynamicAttributes,
      true,
      null,
    );
    fs.removeSync(attributesPath);

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
