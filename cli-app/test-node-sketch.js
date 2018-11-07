"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ns = require("node-sketch");
ns.read("/Users/mito/Downloads/BID (1).sketch")
    .then(function (sketch) {
    var pages = sketch.pages;
    var artBoardNamesPerPages = pages.map(function (page) {
        var artBoardNames = page.layers
            .filter(function (layer) { return layer._class === "artboard"; })
            .map(function (layer) { return layer.name; });
        var result = {};
        result[page.name] = artBoardNames;
        return result;
    });
    console.log(artBoardNamesPerPages);
    var symbols = sketch.symbols;
    var symbolNames = symbols.map(function (symbol) { return symbol.name; });
    console.log(symbolNames);
})
    .catch(function (err) {
    console.error("Error reading the sketch file");
    console.error(err);
});
