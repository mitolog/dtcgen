import * as fs from "fs";
import * as mustache from "mustache";

convert();

function convert() {
  const sketchData: any[] = JSON.parse(String(read("result.json")));
  const template: string = String(read("viewController.mustache"));

  // viewController毎に分割
  const containers: any[] = sketchData.filter(
    element => element.id && element.type && element.type === "Container"
  );

  let outputs = [];
  for (const container of containers) {
    const views = sketchData.filter(
      element => element.containerId && element.containerId === container.id
    );
    let containerObj = {
      container: container,
      views: views
    };
    const output = mustache.render(template, containerObj);
    const filePath = "outputs/" + container.name + "ViewController.swift";
    outputs.push({ filePath: filePath, content: output });
  }

  // viewController毎にviewを書き出し
  for (const output of outputs) {
    fs.writeFileSync(output.filePath, output.content);
  }
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
