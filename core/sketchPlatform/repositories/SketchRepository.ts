import * as fs from 'fs-extra';
import * as ns from 'node-sketch';
import * as _ from 'lodash';
import * as dotenv from 'dotenv';
import * as cp from 'child_process';
import * as path from 'path';
import * as pluralize from 'pluralize';
import { injectable } from 'inversify';

import {
  Rect,
  TreeElement,
  DynamicClass,
  SliceConfig,
  DesignToolType,
} from '../../domain/Entities';
import {
  SketchView,
  SketchLayerType,
  SketchContainer,
} from '../entities/Entities';
import '../../extensions/String.extensions';
import { SketchParser } from '../applications/SketchParser';
import { PathManager, OutputType } from '../../utilities/Utilities';
import { ISketchRepository } from './ISketchRepository';
import { isString } from 'util';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

type DynamicAttribute = { [k: string]: [[TreeElement?]] };

@injectable()
export class SketchRepository implements ISketchRepository {
  constructor() {}

  /**
   * Private methods
   */

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
    dynamicClasses: DynamicClass[],
    treeElement: TreeElement,
    attribute: DynamicAttribute,
  ) {
    // treeElementsを走査して、dynamicClassesにマッチすれば、その配下を格納
    const targetName = treeElement.name;
    const matches: string[] = dynamicClasses
      .filter(classObj => {
        const name = classObj.name || null;
        if (!name || classObj.excludeOnPaste) return false;
        const results = targetName.match(new RegExp(name, 'gi'));
        return results && results.length > 0 ? true : false;
      })
      .map(classObj => classObj.name);
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
    const dtcConfig: Object = pathManager.getConfig();
    const sketchConfig = dtcConfig['sketch'] || null;
    const sketchParser = new SketchParser(sketch, sketchConfig, outputDir);
    const dynamicClasses: DynamicClass[] = _.get(
      sketchConfig,
      'extraction.dynamicClasses',
      [],
    ).map(obj => new DynamicClass(obj));

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

    const config = new SliceConfig();
    config.initWithDtcConfig(DesignToolType.sketch);
    config.inputPath = inputPath;
    config.outputDir = outputDir;
    this.extractSlices(config);
  }

  async extractImages(config: SliceConfig): Promise<void> {
    const sketch = await this.getTargetSketch(config.inputPath);
    const pathManager = new PathManager(config.outputDir);

    // extract all images within 'Pages'(not in 'Symbols')
    const imagesDirName = pathManager.getOutputPath(OutputType.images, true);
    sketch.use(new ns.plugins.ExportImages(imagesDirName));
  }

  extractSlices(config: SliceConfig): Promise<void> {
    const absoluteInputPath = this.absolutePath(config.inputPath);
    const pathManager = new PathManager(config.outputDir);
    if (!absoluteInputPath) return;
    const execSync = cp.execSync;
    const dirPath = pathManager.getOutputPath(OutputType.slices, true);
    let command = process.env.SKETCH_TOOL_PATH;
    if (!command || !isString(command)) {
      throw new Error('no sketch tool path set.');
    }
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
