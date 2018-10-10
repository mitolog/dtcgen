import pluginCall from 'sketch-module-web-view/client'

window.lint = function() {
  pluginCall('lint', 'lint func is called')
}
