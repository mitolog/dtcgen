[![TypeScript version][ts-badge]][typescript-31]
[![Node.js version][nodejs-badge]][nodejs]

# sketch-to-code-generator

現状、sketch-to-code-generator は、sketch レイヤーの命名規則に従って、iOS アプリのビューを生成することのできる node 製コマンドラインツールです。今後 sketch プラグインにしたり、sketch 以外や Android にも対応できればいいな。

## What you can do

- lint ... 指定した命名規則に則っているかをチェック。 (extract の方が進んでしまい今は out of date 状態)
- extract ... 指定した命名規則で sketch をパースして要素を抽出し json ファイルに出力。同時に画像やアイコンなども抽出。
- generate ... ectract した json から対象の OS のコードを生成する。

## How to Use

基本的なフローは、

1. .env ファイルの各種パスを設定
2. 抽出したい要素の名前を `stc.config.json` の `sketch.extraction.keywords[]` に追加していく
3. 1 で追加した keyword をキーにして、その配下にぶら下がっている要素の名前と sketch 上でのクラス名オブジェクトを追加していく(以下 `stc.config.json` の項を参照)
4. それぞれ細かな設定を必要に応じて行い、 コマンド実行 (例: `node index.js -eg --output iOS` )する

という流れ。

## Rules in detail

- 当該 sketch ファイルの Pages に含まれるすべての artboard を再帰的に走査する
- それぞれの artboard に含まれる `group` は `View` に変換し、 `symbol` は各 OS 別のクラスに変換する
- どの `symbol` を抽出するかは、名前で決める、その名前は config ファイルで定義する
- また、どの `symbol` がどのクラスに対応するかも `stc.config.json` で定義する

## How it works

- sketch をパースする `node-sketch` モジュールを使って要素を抽出している
- アイコンの抽出などは、sketch.app に含まれる `sketch-tool` の slice コマンドを使っていいる
- iOS のコードテンプレートには `handlebars` を使っている(が、制約が大きいので変わるかもしれない..)

### stc.config.json

config ファイル中の `keywords` に 1:1 で対応するクラスに変換(つまり、keywords の数だけアプリ側でクラスができる)

- `symbol`の構成要素は、

- 各 `keywords` がコード生成後の各クラスに対応するような形
- `keywords`

- group は Container(View)とし、symbol は命名規則に従って各種要素に変換
- シンボルのレイヤ構造は `stc.config.json` に記載
-

## to run (under development phase)

### requirement

1. [Install sketch](https://www.sketchapp.com/) first.
2. fill `sketchToolPath` and `targetSketchFilePath` within `stc.config.json`.
3. run `npm install` on project root directory.

## development iteration

1. run `cd cli-app && tsc -w` .
2. run `cd core && tsc -w` .

## to run extraction

on `cli-app` dir, run `node index.js extract > result.json` .

## to run code generation

on `cli-app` dir, run `node converter.js` .

## test with jest

1. run `npn test` .

by doing this, you can run tests of specs depends on `jest.config.js` .

## acknowlagement

this project is originally boilerplated by https://github.com/jsynowiec/node-typescript-boilerplate

## flow (memo)

以下 1 -> 2 -> 3 といっきに実行もできるし、別々にも実行できるように

1. linter 実行

- stc.config.json の lint
- sketch のメタデータ取得可否の lint

2. extract の実行

- 各種必要ファイルの取得可否チェック
  - stc.config.json
  - \*.sketch
- ectract の実行
  - sketch メタデータの抽出
  - ベクターファイルの抽出

3. generate の実行

- generate config の取得可否チェックと取得
- generate 実行
