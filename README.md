[![TypeScript version][ts-badge]][typescript-31]
[![Node.js version][nodejs-badge]][nodejs]

# design-to-code-generator

## flow (memo)

以下 1 -> 2 -> 3 といっきに実行もできるし、別々にも実行できるように

1. linter 実行

- linter.config.json の lint
- sketch のメタデータ取得可否の lint

2. extract の実行

- 各種必要ファイルの取得可否チェック
  - linter.config.json
  - \*.sketch
- ectract の実行
  - sketch メタデータの抽出
  - ベクターファイルの抽出

3. generate の実行

- generate config の取得可否チェックと取得
- generate 実行

## to run (under development phase)

### requirement

1. [Install sketch](https://www.sketchapp.com/) first.
2. fill `sketchToolPath` and `targetSketchFilePath` within `linter.config.json`.
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
