import BrowserWindow from 'sketch-module-web-view'
import sketch from 'sketch'
//const fs = require('file-system')

// documentation: https://developer.sketchapp.com/reference/api/

const options = {
  identifier: 'unique.id',
  width: 480,
  minWidth: 300,
  height: 300,
  show: false,
  loaded: false,
  alwaysOnTop: true,
}

let browserWindow = new BrowserWindow(options)
let webContents = browserWindow.webContents

export default function onRun(contect) {
  log('onRun executed')
  getSymbols()

  browserWindow.once('ready-to-show', () => {
    browserWindow.show()
  })

  /// called when executing js on webUI
  webContents.on('lint', page => {
    getSymbols(context, page)
  })

  webContents.on('loadList', s => {
    browserWindow.loadURL(require('../resources/webview.html'))
  })

  browserWindow.loadURL(require('../resources/webview.html'))
}

export function getSymbols(context) {
  log('aaaaa')
  const document = require('sketch/dom').getSelectedDocument()
  const symbols = document.getSymbols()
  // skpm logで閲覧可能
  log(symbols.length)
  log(symbols[0])
  for (symbol of symbols) {
    log(symbol.name)
  }
}
