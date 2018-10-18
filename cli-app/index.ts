//'use strict';
import Cac from 'Cac';
import * as cp from 'child_process';
import * as fs from 'fs';
import { SketchLinter } from './Linter';

const cli = Cac();
cli.command(
  'lint',
  {
    desc: 'lint design resource file',
  },
  (input, flag) => {
    /* とりあえず全体像を使いみたいので、
     * アーキテクチャあんま関係なくここに処理を書いていく 
     */

    const config = JSON.parse(fs.readFileSync('./linter.config.json', 'utf8'));
    if (!config || !config.sketch) return;
    const sketchConfig = config.sketch;

    // とりあえず pagesとartboardsのみ
    // (symbolやレイヤーはsketch api経由でないとむりぽ)
    let command = sketchConfig.sketchToolPath + ' ';
    command += 'list artboards '; // this command includes pages also
    command += sketchConfig.targetSketchFilePath + ' > ';
    command += sketchConfig.outFilePath;

    console.log('executing... ', command);
    cp.execSync(command).toString();
    const sketchJson = JSON.parse(
      fs.readFileSync(sketchConfig.outFilePath, 'utf8'),
    );
    console.log('retrieved sketch json.');

    // todo: config.jsonの読み込み後のnormalizeなり型チェックはeslintのソレを使ってもいいかも
    // todo: lintするjsonとconfigのクラス化,標準化などで型で縛れるように

    console.log('now start linting...');
    const linter = new SketchLinter(sketchConfig);
    const result = linter.lint(sketchJson);
    console.log('finished linting.');
    console.log('--------------------');
    console.log(result.names[0].Page);
    console.log(result.names[1].Artboard);
  },
);

cli.parse();
