import * as ns from "node-sketch";

ns.read("/Users/mito/Downloads/BID (1).sketch")
  .then(sketch => {
    const pages = sketch.pages;
    const artBoardNamesPerPages: { [s: string]: any }[] = pages.map(page => {
      const artBoardNames = page.layers
        .filter(layer => layer._class === "artboard")
        .map(layer => layer.name);
      const result: { [s: string]: any } = {};
      result[page.name] = artBoardNames;
      return result;
    });
    console.log(artBoardNamesPerPages);

    const symbols = sketch.symbols;
    const symbolNames = symbols.map(symbol => symbol.name);
    console.log(symbolNames);
  })
  .catch(err => {
    console.error("Error reading the sketch file");
    console.error(err);
  });
