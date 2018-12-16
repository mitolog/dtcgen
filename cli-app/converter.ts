import * as fs from "fs-extra";
import * as handlebars from "handlebars";
import * as _ from "lodash";
import * as dotenv from "dotenv";
import * as cp from "child_process";

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

convert();

function convert() {
  const sketchData: any[] = JSON.parse(String(read("result.json")));
  const templateStr: string = String(read("viewController_static.hbs"));

  // viewController毎に分割
  const containers: any[] = sketchData.filter(
    element => element.id && element.type && element.type === "Container"
  );

  let outputs = [];
  for (const container of containers) {
    const views = sketchData.filter(
      element => element.containerId && element.containerId === container.id
    );
    // add flag to distinguish view type
    views.forEach(view => {
      switch (view.type) {
        case "View":
          view.isView = true;
          break;
        case "Button":
          view.isButton = true;
          break;
      }
    });
    let containerObj = {
      container: container,
      views: views
    };
    let template = handlebars.compile(templateStr);
    const output = template(containerObj);
    const filePath = "outputs/" + container.name + "ViewController.swift";
    outputs.push({ filePath: filePath, content: output });
  }

  // viewController毎にviewを書き出し
  for (const output of outputs) {
    fs.writeFileSync(output.filePath, output.content);
  }

  // アセットファイルの作成
  const assetFilePath = "outputs/";
  generateSlicedNames();
  // 1. list slicesをして、pages[n].slices[n].name の配列(assetNames)を作る
  // 2. assetNamesを走査して、スラッシュ区切りでパスにjsonを設置していく作業
}

/// read file
function read(filePath) {
  var content = new String();
  if (check(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  }
  return content;
}

/// check if file exists at input file path
function check(filePath) {
  var isExist = false;
  try {
    fs.statSync(filePath);
    isExist = true;
  } catch (err) {
    isExist = false;
  }
  return isExist;
}

async function generateSlicedNames() {
  // list all slices
  const execSync = cp.execSync;
  let command = process.env.SKETCH_TOOL_PATH;
  command += " list slices ";
  command += process.env.SKETCH_PATH;
  const json = execSync(command).toString();

  // parse all slices and make names[]
  if (!json) return;
  const jsonObj = JSON.parse(json);
  const assetNames: string[] = [];
  jsonObj.pages.forEach(page => {
    page.slices.forEach(slice => {
      if (slice.name) {
        assetNames.push(slice.name);
      }
    });
  });

  // parse slashes and make directories/files
  assetNames.forEach(assetName => {
    const extension = ".pdf";
    const destComponents = assetName.split("/").map(comp => comp.trim());
    const origComponents = assetName
      .split("/")
      .map(comp => comp.replace(/(\s+)/g, "\\$1"));
    const prependedPath = "outputs/assets/";
    const destDirPath =
      prependedPath +
      "Assets.xcassets/" +
      destComponents.join("/") +
      ".imageset/";
    mkdirIfNeeded(destDirPath);

    // `assetName` may include spaces, but no need to escape by myself. copySync will do.
    const origFilePath = prependedPath + assetName + extension;
    fs.copySync(origFilePath, destDirPath + _.last(destComponents) + extension);

    // Contents.jsonの作成
    // 中間ディレクトリ
    // 最後のディレクトリ
  });
}

// 再帰的にフォルダとファイルを作成
function recursiveMakeDirFile(components: string[], isDir: boolean) {}

async function mkdirIfNeeded(directory) {
  try {
    await fs.ensureDir(directory);
  } catch (err) {
    console.error(err);
  }
}
