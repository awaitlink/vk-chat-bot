let gulp = require('gulp'),
  sourcemaps = require('gulp-sourcemaps'),
  jsdoc = require('gulp-jsdoc3'),
  gulpClean = require('gulp-clean'),
  rollup = require('gulp-better-rollup'),
  { terser } = require('rollup-plugin-terser'),
  babel = require('rollup-plugin-babel'),
  concat = require('gulp-concat'),
  eslint = require('gulp-eslint'),
  ava = require('gulp-ava'),
  pump = require('pump')

const TO_CLEAN = ['dist', 'docs', '*.tgz']
const SOURCE = 'src/**/*.js'
const MAIN = 'src/main.js'
const DEST = 'vk-chat-bot.min.js'
const DEST_FOLDER = 'dist'
const DOCUMENTATION = ['README.md'].concat(SOURCE)
const TESTS = './test/test.js'

function clean (cb) {
  pump([
    gulp.src(TO_CLEAN, { read: false, allowEmpty: true }),
    gulpClean()
  ], cb)
}

function lint (cb) {
  pump([
    gulp.src(SOURCE),
    eslint(),
    eslint.format(),
    eslint.failAfterError()
  ], cb)
}

function build (cb) {
  pump([
    gulp.src(MAIN),
    sourcemaps.init(),
    rollup({
      plugins: [
        babel({
          babelrc: false,
          presets: [['@babel/env', { modules: false }]],
          plugins: [['@babel/transform-runtime', { regenerator: true }]],
          runtimeHelpers: true
        }),
        terser()
      ]
    }, {
      format: 'cjs'
    }),
    concat(DEST),
    sourcemaps.write(),
    gulp.dest(DEST_FOLDER)
  ], cb)
}

function docs (cb) {
  gulp.src(DOCUMENTATION, { read: false })
    .pipe(jsdoc(require('./.jsdoc.json'), cb))
}

function test () {
  return gulp.src(TESTS)
    .pipe(ava({ verbose: true }))
}

exports.clean = clean
exports.lint = lint
exports.test = test
exports.build = build
exports.docs = docs

exports.default = gulp.series(
  exports.clean,
  gulp.parallel(
    exports.lint,
    exports.test
  ),
  gulp.parallel(
    exports.build,
    exports.docs
  ),
)
