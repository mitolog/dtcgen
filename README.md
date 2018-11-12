[![TypeScript version][ts-badge]][typescript-31]
[![Node.js version][nodejs-badge]][nodejs]

# sketch-linter

## 当面の目標

1.  `%d Demo %d` にマッチする artboard を見つけ
2.  当該 artboard に含まれる `Button` と `InputText` のシンボルを抽出
3.  まずは iOS 向けにクラス名や、アサインするメタデータ(とりあえずは画面上の位置, ボタン名やプレースホルダなど)を確定
4.  sourcery で作ったテンプレートの当該箇所に 3 の結果を入力

[todo]

- sourcery でテンプレートを作成する必要がある
- semantic ワードと OS 別クラス名の変換
-

## to run (under development phase)

### preparation

1. [Install sketch](https://www.sketchapp.com/) first.
2. fill `sketchToolPath` and `targetSketchFilePath` within `linter.config.json`.
3. run `npm install` on project root directory.

## development iteration

1. run `tsc --target es5 -w cli-app/*.ts --outDir dist/` .
2. `node dist/cli-app/index.js lint` .

## to test node-sketch module (tentative)

```
$ tsc --target es5 -w test-node-sketch.ts
$ cd cli-app
$ node test-node-sketch.js > result.js
```

## test with jest

1. run `npn test` .

by doing this, you can run tests of specs depends on `jest.config.js` .

## node-typescript-boilerplate

What's included:

- [TypeScript][typescript] [3.1][typescript-31],
- [TSLint 5][tslint] with [Microsoft rules][tslint-microsoft-contrib],
- [Jest][jest] unit testing and code coverage,
- Type definitions for Node.js v8 and Jest,
- [Prettier][prettier] to enforces a consistent code style (but it's optional),
- [NPM scripts for common operations](#available-scripts),
- a simple example of TypeScript code and unit test,
- .editorconfig for consistent file format.

## Quick start

This project is intended to be used with v8 (LTS Carbon) release of [Node.js][nodejs] or newer and [NPM][npm]. Make sure you have those installed. Then just type following commands:

```sh
git clone https://github.com/jsynowiec/node-typescript-boilerplate
cd node-typescript-boilerplate
npm install
```

or just download and unzip current `master` branch:

```sh
wget https://github.com/jsynowiec/node-typescript-boilerplate/archive/master.zip -O node-typescript-boilerplate
unzip node-typescript-boilerplate.zip && rm node-typescript-boilerplate.zip
```

Now start adding your code in the `src` and unit tests in the `__tests__` directories. Have fun and build amazing things 🚀

### Unit tests in JavaScript

Writing unit tests in TypeScript can sometimes be troublesome and confusing. Especially when mocking dependencies and using spies.

This is **optional**, but if you want to learn how to write JavaScript tests for TypeScript modules, read the [corresponding wiki page][wiki-js-tests].

## Available scripts

- `clean` - remove coverage data, Jest cache and transpiled files,
- `build` - transpile TypeScript to ES6,
- `build:watch` - interactive watch mode to automatically transpile source files,
- `lint` - lint source files and tests,
- `test` - run tests,
- `test:watch` - interactive watch mode to automatically re-run tests

## Alternative

As an alternative to TypeScript, you can try my [Node.js Flow boilerplate][flow-boilerplate]. It's basically the same but with ES6, async/await, Flow type checking and ESLint.

## License

Licensed under the APLv2. See the [LICENSE](https://github.com/jsynowiec/node-typescript-boilerplate/blob/master/LICENSE) file for details.

[ts-badge]: https://img.shields.io/badge/TypeScript-3.1-blue.svg
[nodejs-badge]: https://img.shields.io/badge/Node.js->=%208.9-blue.svg
[nodejs]: https://nodejs.org/dist/latest-v8.x/docs/api/
[travis-badge]: https://travis-ci.org/jsynowiec/node-typescript-boilerplate.svg?branch=master
[travis-ci]: https://travis-ci.org/jsynowiec/node-typescript-boilerplate
[typescript]: https://www.typescriptlang.org/
[typescript-31]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-1.html
[license-badge]: https://img.shields.io/badge/license-APLv2-blue.svg
[license]: https://github.com/jsynowiec/node-typescript-boilerplate/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg
[prs]: http://makeapullrequest.com
[donate-badge]: https://img.shields.io/badge/$-support-green.svg
[donate]: http://bit.ly/donate-js
[github-watch-badge]: https://img.shields.io/github/watchers/jsynowiec/node-typescript-boilerplate.svg?style=social
[github-watch]: https://github.com/jsynowiec/node-typescript-boilerplate/watchers
[github-star-badge]: https://img.shields.io/github/stars/jsynowiec/node-typescript-boilerplate.svg?style=social
[github-star]: https://github.com/jsynowiec/node-typescript-boilerplate/stargazers
[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20this%20Node.js%20TypeScript%20boilerplate!%20https://github.com/jsynowiec/node-typescript-boilerplate%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/jsynowiec/node-typescript-boilerplate.svg?style=social
[jest]: https://facebook.github.io/jest/
[tslint]: https://palantir.github.io/tslint/
[tslint-microsoft-contrib]: https://github.com/Microsoft/tslint-microsoft-contrib
[flow-boilerplate]: https://github.com/jsynowiec/node-flowtype-boilerplate
[wiki-js-tests]: https://github.com/jsynowiec/node-typescript-boilerplate/wiki/Unit-tests-in-plain-JavaScript
[prettier]: https://prettier.io
