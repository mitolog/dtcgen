import * as fs from 'fs';
import * as ns from 'node-sketch';
import * as _ from 'lodash';
import { SketchLayerType } from '../entities/SketchLayerType';
import { injectable } from 'inversify';
import * as dotenv from 'dotenv';
import * as cp from 'child_process';
import { Container } from '../../domain/entities/Container';
import { ElementType } from '../../domain/entities/ElementType';
import { SketchParser } from '../applications/SketchParser';

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

  private async getSketch() {
    return await ns.read(process.env.SKETCH_PATH);
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
      }
      output.constraints = newConstraints;
    }
  }

  /**
   * interface implementation
   */

  /// retrieve all artboards the sketch file has.
  async getAll(): Promise<Node[]> {
    const sketch = await this.getSketch();
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

  // No validation because we assume it's already linted.
  /// Extract all elements which belongs to each artboards.
  async extractAll(): Promise<any[]> {
    const sketch = await this.getSketch();
    const artboards = await this.getAll();

    // 最終出力するjsonの雛形を用意
    const outputs: any[] = [];

    // 再帰的にkeywordsにマッチする要素と中間要素を抽出
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
