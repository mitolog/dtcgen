import { EventEmitter } from 'events';

'use strict';

export class SketchRepository extends EventEmitter {
  private json: JSON;

  constructor() {
    super();
  }

  getJson() {
    // nodejs cli実行してjsonを抽出 (これ多少時間かかる)
    // /Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool list pages /Users/mito/Downloads/BID\ 2.sketch > ~/Downloads/pages.json
  }

  convertJsonToObject() {
    // それをオブジェクトに変換
  }

  save() {
    // どっかに保存する？
  }
}
