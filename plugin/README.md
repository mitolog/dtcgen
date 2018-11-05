# sketchLinter

_This plugin was created using `skpm`. For a detailed explanation on how things work, checkout the [skpm Readme](https://github.com/skpm/skpm/blob/master/README.md)._

## Usage

Install the dependencies

```bash
npm install
```

Once the installation is done, you can run some commands inside the project folder:

```bash
npm run build
```

To watch for changes:

```bash
npm run watch
```

Additionally, if you wish to run the plugin every time it is built:

```bash
npm run start
```

## Custom Configuration

### Babel

To customize Babel, you have two options:

- You may create a [`.babelrc`](https://babeljs.io/docs/usage/babelrc) file in your project's root directory. Any settings you define here will overwrite matching config-keys within skpm preset. For example, if you pass a "presets" object, it will replace & reset all Babel presets that skpm defaults to.

- If you'd like to modify or add to the existing Babel config, you must use a `webpack.skpm.config.js` file. Visit the [Webpack](#webpack) section for more info.

### Webpack

To customize webpack create `webpack.skpm.config.js` file which exports function that will change webpack's config.

```js
/**
 * Function that mutates original webpack config.
 * Supports asynchronous changes when promise is returned.
 *
 * @param {object} config - original webpack config.
 * @param {boolean} isPluginCommand - whether the config is for a plugin command or a resource
 **/
module.exports = function(config, isPluginCommand) {
  /** you can change config here **/
};
```

## Debugging

To view the output of your `console.log`, you have a few different options:

- Use the [`sketch-dev-tools`](https://github.com/skpm/sketch-dev-tools)
- Open `Console.app` and look for the sketch logs
- Look at the `~/Library/Logs/com.bohemiancoding.sketch3/Plugin Output.log` file

Skpm provides a convenient way to do the latter:

```bash
skpm log
```

The `-f` option causes `skpm log` to not stop when the end of logs is reached, but rather to wait for additional data to be appended to the input

## Publishing your plugin

```bash
skpm publish <bump>
```

(where `bump` can be `patch`, `minor` or `major`)

`skpm publish` will create a new release on your GitHub repository and create an appcast file in order for Sketch users to be notified of the update.

You will need to specify a `repository` in the `package.json`:

```diff
...
+ "repository" : {
+   "type": "git",
+   "url": "git+https://github.com/ORG/NAME.git"
+  }
...
```

## sketch データの取得方法

### sketchtool を使う

- sketch にデフォルトで入っている cli
- スクショの export や plugin の実行、json スタイルでのレイヤの出力などを行える
- 今回の sketch linter でのデータ取得は、これに依存する形になる

### sketchtool の守備範囲

- pages, artboards, symbols の名前は`sketchtool`で json 取得 ok
- layers, groups は `list layers` で json 取得可能だが、sketch ファイルの大きさによっては json 取得にだいぶ時間がかかる

### プラグインの場合....

- 全取得: sketchtool の `list layers` で取得
- ページ単位: sketch javascript API の getSelectedPage で取得

### cli の場合...

- 全取得: sketchtool の `list layers` で取得
- ページ単位: sketchtool からパース

### 用途

全取得：sketch を例えば CI に組み込む場合や、時間かけてもいい場合、ページ数が少ない場合 (lit 項目が多くなりがちなので遅い)
ページ単位：細かく lint したい場合(lint 項目を減らせるので早い)

#### list layers のパース

`list layers`で取得した配列にて、

- pages[]: ページ一覧
- pages[].layers[]: アートボード一覧
- pages[].layers[].layers[]: アートボード配下のレイヤー一覧
- pages[].layers[].layers[].layers[]: レイヤー配下のグループ一覧
- pages[last].layers[]: symbol 一覧(pages[last].name が`Symbols`になっていること)

ただ、テキストや shape、画像といった layer のタイプまでは取得できないため、semantic な lint については sketch api が必要。

※ `list layers` は massive な sketch ファイルだとだいぶ重いので注意

## sketch plugin デバッグの手順

1.  cd /path/to/the/sketchLinter
2.  npm run watch
3.  find sketchlinter.sketchplugin/Contents/Sketch -name '\*js' | entr -r /Applications/Sketch.app/Contents/MacOS/Sketch
4.  skpm log -f

※ 3,4 は別 console で実施 ※ 必要に応じて browsersync

## 実現したい機能

1. sketch ファイルを定期的に(ボタンをユーザが押したら)一括 lint
2. sketch で何かしら名前を更新するたびに、自動的に lint

今の所 1 にフォーカス。

## メモ

- tsconfig.json, tslint.json は vue-cli の create で作成したもの。設定は[こちら](https://qiita.com/nrslib/items/be90cc19fa3122266fd7)をベースに
