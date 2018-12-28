import * as fs from 'fs-extra';
import * as ns from 'node-sketch';
import * as _ from 'lodash';
import { SketchLayerType } from '../entities/SketchLayerType';
import { injectable } from 'inversify';
import * as dotenv from 'dotenv';
import * as cp from 'child_process';
import { Container } from '../../domain/entities/Container';
import { ElementType } from '../../domain/entities/ElementType';
import { SketchParser } from '../applications/SketchParser';
import { Rect } from '../../domain/entities/Rect';
import { View } from '../../domain/entities/View';
import { OSType } from '../../domain/entities/OSType';
import { IOSCodeGenerator } from '../applications/IOSCodeGenerator';
import { ICodeGenerator } from '../../domain/applications/ICodeGenerator';
import { PathManager, OutputType } from '../../utilities/PathManager';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export interface ISketchRepository {
  getAll(type: SketchLayerType): Promise<Node[]>;
  extractAll(): Promise<void>;
  extractSlices(): void;
  generateAll(ostype: OSType): void;
}

@injectable()
export class SketchRepository implements ISketchRepository {
  private config?: any = null;

  constructor() {
    // todo: config探索
    const jsonObj = JSON.parse(
      fs.readFileSync(process.env.CONFIG_PATH, 'utf8'),
    );
    if (jsonObj) {
      this.config = jsonObj.sketch;
    }
  }

  /**
   * Private methods
   */

  /**
   * get sketch file object from which extract metadata and asset files
   * return {Promise<any>} node-sketch object which express sketch file.
   */
  private async getTargetSketch(): Promise<any> {
    return await ns.read(process.env.SKETCH_FILE_PATH);
  }

  /**
   * add constraint values(numbers) which represents relative position from parent view
   * @param outputs {View[]} An array of View or subclass of View
   */
  private addConstraintValues(outputs: View[]): void {
    if (!outputs) return;

    const baseFrame: Rect = _.get(this.config, 'extraction.baseFrame');
    if (!baseFrame) return;

    for (const output of outputs) {
      if (!output.constraints) continue;
      const baseView: View = outputs
        .filter(
          view =>
            output.parentId
              ? view.id === output.parentId
              : view.id === output.containerId,
        )
        .reduce((acc, current) => current, null);
      if (!baseView) continue;
      const baseRect: Rect =
        baseView.type !== 'Container' ? baseView.rect : baseFrame;
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
      }
      output.constraints = newConstraints;
    }
  }

  /**
   * interface implementation
   */

  /// retrieve all artboards the sketch file has.
  async getAll(): Promise<Node[]> {
    const sketch = await this.getTargetSketch();
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
  async extractAll(): Promise<void> {
    const sketch = await this.getTargetSketch();

    // extract all images within 'Pages'(not in 'Symbols')
    const imagesDirName = PathManager.getOutputPath(OutputType.images, true);
    sketch.use(new ns.plugins.ExportImages(imagesDirName));

    // extract all artboards
    const artboards = await this.getAll();
    const outputs: any[] = [];
    const sketchParser = new SketchParser(sketch, this.config);

    artboards.forEach(artboard => {
      if (!artboard['name']) return; // same as continue
      let artboardName = artboard['name'];

      // todo: パターンマッチによる名前の抽出
      artboardName = artboardName
        .split('/')
        .map(str => str.trim())
        .join('');

      const container: Container = new Container();
      container.type = ElementType.Container;
      container.id = artboard['do_objectID'];
      container.name = artboardName;
      outputs.push(container);

      artboard['layers'].forEach(node => {
        sketchParser.parseLayer(node, 1, outputs);
      });
    });

    this.addConstraintValues(outputs);

    const metadataPath = PathManager.getOutputPath(OutputType.metadata, true);
    fs.writeFileSync(metadataPath, JSON.stringify(outputs));
  }

  extractSlices(): void {
    const execSync = cp.execSync;
    const dirPath = PathManager.getOutputPath(OutputType.slices, true);
    let command = process.env.SKETCH_TOOL_PATH;
    command += ' export slices ';
    command += process.env.SKETCH_FILE_PATH;
    command += ' --formats=pdf'; //png,svg
    // command += ' --scales=1,2,3';
    command += ' --output=' + dirPath;

    execSync(command);

    // `export slices` command may make leading/trailing spaces, so remove these.
    PathManager.removeWhiteSpaces(dirPath);
  }

  generateAll(ostype: OSType): void {
    if (!ostype) return;
    const metadataFilePath = PathManager.getOutputPath(OutputType.metadata);
    let generator: ICodeGenerator;

    switch (ostype) {
      case OSType.ios:
        generator = new IOSCodeGenerator();
        generator.generate(metadataFilePath);
        break;
      case OSType.android:
        /** TBA */
        break;
      default:
        break;
    }
  }
}
