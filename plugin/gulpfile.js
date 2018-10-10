const gulp = require('gulp')
const plumber = require('gulp-plumber')
const del = require('del')
const exec = require('child_process').exec
const notify = require('gulp-notify')

const paths = {
  js: './src/**/*.js',
  pluginDist:
    'file:///Users/mito/Library/Application%20Support/com.bohemiancoding.sketch3/Plugins/sketchlinter.sketchplugin',
}

// clean
gulp.task('clean', () => {
  return del([paths.pluginDist])
})

// js
gulp.task('js', () => {
  return gulp
    .src([paths.js])
    .pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
})

gulp.task('build', cb => {
  exec('npm run build', function(err, stdout, stderr) {
    console.log(stdout)
    console.log(stderr)
    cb(err)
  })
})

// watch
gulp.task('watch', () => {
  gulp.watch(paths.js, gulp.series('clean', 'js', 'build'))
})

// default
//gulp.task('default', ['clean', 'js'])
