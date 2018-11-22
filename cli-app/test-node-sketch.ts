import * as ns from "node-sketch";

ns.read("/Users/mito/Downloads/linterSample.sketch")
  .then(sketch => {
    const pages = sketch.pages;
    const nodes = [];
    for (const page of pages) {
      if (page.name === "Symbols") continue;
      const artboards = page.getAll("artboard");
      if (!artboards) continue;
      nodes.push(artboards);
    }
    const res = [].concat(...nodes);
    res
      .filter(node => node.name === "Travel / Reservation")
      .forEach(artboard => {
        artboard.layers.forEach(node => {
          recurciveGetLayers(node, 1, sketch);
        });
      });
  })
  .catch(err => {
    console.error("Error reading the sketch file");
    console.error(err);
  });

const maxHierarchy = 3;
/**
 * @param node Node Abstract class of node-sketch
 * @param hierarchy number hierarchy of how much deeper we shuold dig into
 */
const recurciveGetLayers = (node, hierarchy, sketch) => {
  const space = Array(hierarchy).join(" ");
  if (
    node._class === "group" &&
    node.layers &&
    node.layers.length > 0 &&
    hierarchy <= maxHierarchy - 1
  ) {
    console.log(`${space}-----`);
    console.log(`${space}group: ${node.name}`);
    // ここでnodeのframeを取得, node.frame._class === 'rect' を確認して、x,y,width,heightを取得
    if (node.frame._class === "rect") {
      const rect = node.frame;
      // prettier-ignore
      console.log(`${space}group rect: ${rect.x}, ${rect.y}, ${rect.width}, ${rect.height}`);
      console.log(`${space}resizing constraint: ${node.resizingConstraint}`);
      console.log(`${space}isVisible: ${node.isVisible}`);
    }
    hierarchy++;
    node.layers.forEach(aNode => {
      recurciveGetLayers(aNode, hierarchy, sketch);
    });
  } else {
    const rect = node.frame;
    console.log(`${space}-----`);
    console.log(`${space}${node._class}: ${node.name}`);
    console.log(
      `${space}rect: ${rect.x}, ${rect.y}, ${rect.width}, ${rect.height}`
    );
    console.log(`${space}resizing constraint: ${node.resizingConstraint}`);
    console.log(`${space}isVisible: ${node.isVisible}`);
    if (node._class === "symbolInstance") {
      console.log(`${space}symbol: ${node.symbolID}`);
    }

    const symbols = sketch.symbols.filter(symbol => {
      symbol.symbolID === node.symbolID;
    });
    // if (
    //   symbols &&
    //   symbols.length > 0 &&
    //   symbols[0]._class === "symbolInstance"
    // ) {
    //   console.log(`${space}retrieved symbol: ${symbols[0].name}`);
    // }
    //console.log(node);
    /*

      今回は、ボタンのセマンティクスを取得するということで。
      /Users/mito/Downloads/linterSample.sketch の Travel / Guide の "Book Trip" ボタンを取得するとして
      
      1. node._class=SymbolInstanceかどうかチェック, node.nameに 'Button' がふくまれているかどうかチェック 
        -> "Book Trip" がタイトルのボタンを取得
      2. node.symbolIDを取得し、sketch.symbolsから同symbolIDの_class=symbolMasterを取得
        -> "Book Trip" の元になるシンボルを取得
      3. 2で取得したsymbolMasterオブジェクトから、メタデータを取得、取得するものは...
        - symbol.layers[](ただし、_class=shapeGroupのオブジェクトは膨大なパス情報を含むので一旦除外)
        - 今回はボタンを取得するものとし、名前(.name)とclass(._class)が以下のものに絞る:
          - Label(_class=text)
          - Background(_class=rectangle)
      4. Label, Backgroundそれぞれ overrideValuesがある場合とない場合があるので、以下の手順でたどる

      5. オーバーライドがある場合...(Backgroundの例)
        5-1. node.overrideValues[].overrideNameを取得、'19F2B0E5-A608-4AAD-B881-7A7B6322F720_layerStyle' 
        5-2. _layerStyle であることを確認し, その手前のID部分(19F2B0E5-A608-4AAD-B881-7A7B6322F720)を取得
        5-3. 3で取得したsymbolMasterオブジェクトのlayers[]を走査し、5-2で取得したID部分と、layers[].do_objectIDとが同じであればソレが対象レイヤ
        (sharedStyleまで追うかどうかを設定で切り替えられてもいいかも)
        5-4. node.overrideValues[].valueと、sketch.document.layerStyles.objects[]を走査してdo_objectIDをマッチング
        同じものがあればそれが対象のsharedStyleデータ(一応 _class=sharedStyle をチェック)。
        5-5. 5-4で取得した style.value.fills[0]が最終的に取得したいボタンの色情報のはず
      6. Labelのオーバーライドの場合...
        backgroundと同じだが、文字列はvalueのものを使う
        (sharedStyleまで追うかどうかを設定で切り替えられてもいいかも)
    */

    if (node.overrideValues) {
      for (const value of node.overrideValues) {
        //console.log("overrideName: ", value.overrideName);
        // console.log(
        //   "parent.symbolID: ",
        //   value.getParent("symbolInstance").symbolID
        // );
        // console.log(
        //   "parent.overrideValues: ",
        //   value.getParent("symbolInstance").overrideValues
        // );
        //console.log(`${space}${value}`);
      }
    }
  }
};
