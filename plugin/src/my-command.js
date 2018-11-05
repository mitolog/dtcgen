import BrowserWindow from 'sketch-module-web-view';
import sketch from 'sketch';

// documentation: https://developer.sketchapp.com/reference/api/

const options = {
  identifier: 'unique.id',
  width: 480,
  minWidth: 300,
  height: 300,
  show: false,
  loaded: false,
  alwaysOnTop: true,
};

let browserWindow = new BrowserWindow(options);
let webContents = browserWindow.webContents;

export default function onRun(contect) {
  log('onRun executed.');

  browserWindow.once('ready-to-show', () => {
    browserWindow.show();
  });

  /// called when executing js on webUI
  webContents.on('lint', page => {
    getSymbols(context, page);
  });

  /// load on-demand
  webContents.on('loadList', s => {
    browserWindow.loadURL(require('../resources/webview.html'));
  });

  /// initial load
  browserWindow.loadURL(require('../resources/webview.html'));
}

function getSymbols(context) {
  log('cccc');
  const document = require('sketch/dom').getSelectedDocument();
  const symbols = document.getSymbols();
  log(symbols.length);
  log(typeof symbols);
  for (const key of Object.keys(symbols)) {
    log(symbols[key]);
    break;
  }
}
