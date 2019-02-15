# sketch-to-code-generator

現状、sketch-to-code-generator は、sketch ファイルをパースして、iOS のレイアウトコードを生成できるツールです。パース時は独自に定義した命名ルールに従ってパースします。今後は、sketch 以外のデザインファイル、iOS 以外のプラットフォーム(つまり Android)にも対応できればと思います。

## What you can do

- [WIP]lint ... 指定した命名規則に則っているかをチェックします。 (extract の方が進んでしまい今は out of date 状態)
- extract ... 指定した命名規則で sketch をパースして要素を抽出し json ファイルに出力します。同時に画像やアイコンなども抽出します。
- generate ... ectract した json から対象の OS のコードを生成します。

### prerequisite

1. node version `8.9.0` or over.
2. Install [sketch](https://www.sketchapp.com/).
3. check if `SKETCH_TOOL_PATH` is valid with command like `$ ls /Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool`
4. run `npm install` on project root directory.

## How to Use (in development phase)

まだコマンド化していないのですが、基本的な使い方は、

1. .env ファイルの各種パスを設定
2. `cli-app`と`core`ディレクトリ配下それぞれで `tsc -w` で watch しつつトランスパイル(すると`dist`ディレクトリに吐き出される)
3. `cd cli-app` して `node index.js extract --input "../linterSample.sketch"` でメタデータを sketch から抽出
4. `node index.js generate --project Foo` という形でコードを生成

という流れです。

## How it works

- sketch ファイルを [node-sketch](https://github.com/oscarotero/node-sketch)を使ってすべての artboard と symbol をパース
- パースした結果を `tree.json`という階層構造を持った json と、`metadata.json`という各 view のプロパティ情報を持った json に出力、同時に画像やスライスも出力
- 出力した結果に従って OS 別(今は iOS のみ)のソースコードやアセットファイル、プロジェクトファイル等を生成

### extract

- それぞれの artboard に含まれる`group`は`View`に変換し、`symbol`は要素の特徴にしたがって抽出
- どの`symbol`を抽出するかは`stc.config.json` でも定義できるし、ある程度は自動でも可能
- アイコンの抽出などは、sketch.app に含まれる `sketch-tool` の slice コマンドを利用

### generate

-
- コードテンプレートには[handlebars](https://handlebarsjs.com/)を使っている

### stc.config.json

config ファイル中の `keywords` に 1:1 で対応するクラスに変換(つまり、keywords の数だけアプリ側でクラスができる)

- `symbol`の構成要素は、

- 各 `keywords` がコード生成後の各クラスに対応するような形
- `keywords`

- group は Container(View)とし、symbol は命名規則に従って各種要素に変換
- シンボルのレイヤ構造は `stc.config.json` に記載

## acknowlagement

this project is originally boilerplated by https://github.com/jsynowiec/node-typescript-boilerplate
