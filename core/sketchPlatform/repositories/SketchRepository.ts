import * as fs from 'fs';
import * as ns from 'node-sketch';
import { SketchLayerType } from '../entities/SketchLayerType';
import { injectable } from 'inversify';

export interface ISketchRepository {
  getAll(type: SketchLayerType): Promise<Node[]>;
}

@injectable()
export class SketchRepository implements ISketchRepository {
  private retrieveConfig(): Object {
    // linter.configからパスを取得
    const coreDir = process.env.CORE_DIR;
    console.log(coreDir);
    const config = JSON.parse(
      fs.readFileSync(
        '/Users/mito/Documents/Proj/innova/sketchLinter/sketchLinter/linter.config.json',
        'utf8',
      ),
    );
    // todo: configファイルの探索
    if (!config || !config.sketch) return;
    return config.sketch;
  }

  private retrieveSketchFilePath(): string {
    const config = this.retrieveConfig();
    if (!config || !config['targetSketchFilePath']) return;
    return config['targetSketchFilePath'];
  }

  // type should be string 'artboard' currently.
  async getAll(type: SketchLayerType): Promise<Node[]> {
    const fp = this.retrieveSketchFilePath();
    const sketch = await ns.read(fp);

    const pages = sketch.pages;
    const nodes = [];
    for (const page of pages) {
      const artboards = page.getAll(type);
      if (!artboards) continue;
      nodes.push(artboards);
    }
    const result = [].concat(...nodes); // lessen dimension
    return result;

    // const artBoardNamesPerPages: { [s: string]: any }[] = pages.map(page => {
    //   const artBoards = page.getAll('artboard');
    // });
    // console.log(artBoardNamesPerPages);

    // .then(sketch => {
    //   // type別にnodeを取得
    //   // 現状は page, artboard, symbolに対応
    // const pages = sketch.pages;
    // const artBoardNamesPerPages: { [s: string]: any }[] = pages.map(
    //   page => {
    //     const artBoardNames = page.layers
    //       .filter(layer => layer._class === 'artboard')
    //       .map(layer => layer.name);
    //     const result: { [s: string]: any } = {};
    //     result[page.name] = artBoardNames;
    //     return result;
    //   },
    // );
    // console.log(artBoardNamesPerPages);

    //   // const symbols = sketch.symbols;
    //   // const symbolNames = symbols.map(symbol => symbol.name);
    //   // console.log(symbolNames);
    // })
    // .catch(err => {
    //   console.error('Error reading the sketch file');
    //   console.error(err);
    // });
  }
}
