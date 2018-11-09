import * as ns from "node-sketch";

ns.read("/Users/mito/Downloads/BID (1).sketch")
  .then(sketch => {
    const pages = sketch.pages;
    const nodes = [];
    for (const page of pages) {
      const artboards = page.getAll("artboard");
      if (!artboards) continue;
      nodes.push(artboards);
    }
    const res = [].concat(...nodes);
    console.log(res);

    const artBoardNamesPerPages: { [s: string]: any }[] = pages.map(page => {
      const artboards = page.getAll("artboard");
      const parents = artboards
        .filter(layer => layer.getParent("page"))
        .map(layer => {
          const parent = layer.getParent("page");
          return parent.name;
        });

      //   console.log(parents);
      const artBoardNames = artboards.map(layer => layer.name);
      // const artBoardNames = page.layers
      //   .filter(layer => layer._class === "artboard")
      //   .map(layer => layer.name);
      const result: { [s: string]: any } = {};
      result[page.name] = artBoardNames;
      return result;
    });
    //console.log(artBoardNamesPerPages);

    // const symbols = sketch.symbols;
    // const symbolNames = symbols.map(symbol => symbol.name);
    // console.log(symbolNames);
  })
  .catch(err => {
    console.error("Error reading the sketch file");
    console.error(err);
  });
