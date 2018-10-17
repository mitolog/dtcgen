import { EventEmitter } from 'events';
import * as cp from 'child_process';

'use strict';

export class SketchRepository extends EventEmitter {
  private json: JSON;

  constructor(path: String) {
    super();
  }

  getJson() {
    // nodejs cli実行してjsonを抽出 (これ多少時間かかる)
    cp.exec('ls -la ./', (err, stdout, stderr) => {
      if (err) console.log();
      console.log(stdout);
    });
    // /Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool list pages /Users/mito/Downloads/BID\ 2.sketch > ~/Downloads/pages.json
  }

  convertJsonToObject() {
    // これはdomain > usecaseのtranslatorでやる？
    // それをオブジェクトに変換
  }

  save() {
    // どっかに保存する？
  }
}
