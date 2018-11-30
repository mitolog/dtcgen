import * as fs from "fs";
import * as handlebars from "handlebars";

handlebars.registerHelper("myIf", (val1: any, operator, val2: any, options) => {
  let cond = false;
  if (operator === "===") {
    cond = val1 === val2;
  } else if (operator === "!==") {
    cond = val1 !== val2;
  } else if (operator === "==") {
    cond = val1 == val2;
  } else if (operator === "!=") {
    cond = val1 != val2;
  } else if (operator === ">") {
    cond = val1 > val2;
  } else if (operator === ">=") {
    cond = val1 >= val2;
  } else if (operator === "<") {
    cond = val1 < val2;
  } else if (operator === "<=") {
    cond = val1 <= val2;
  }

  if (cond) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

convert();

function convert() {
  const sketchData: any[] = JSON.parse(String(read("result.json")));
  const templateStr: string = String(read("viewController.mustache"));

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
    let template = handlebars.compile(templateStr);
    const output = template(containerObj);
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
