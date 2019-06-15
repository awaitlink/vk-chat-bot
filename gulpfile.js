const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const typedoc = require('gulp-typedoc');
const gulpClean = require('gulp-clean');
const rollup = require('gulp-better-rollup');
const { terser } = require('rollup-plugin-terser');
const concat = require('gulp-concat');
const tslint = require('gulp-tslint');
const pump = require('pump');
const typescript = require('rollup-plugin-typescript2');

const TO_CLEAN = ['dist', 'docs', '*.tgz'];
const SOURCE = 'src/**/*.ts';
const MAIN = 'src/main.ts';
const DEST = 'vk-chat-bot.min.js';
const DEST_FOLDER = 'dist';

function clean(cb) {
  pump([
    gulp.src(TO_CLEAN, { read: false, allowEmpty: true }),
    gulpClean(),
  ], cb);
}

function lint(cb) {
  pump([
    gulp.src(SOURCE),
    tslint({
      formatter: 'verbose',
    }),
    tslint.report(),
  ], cb);
}

function build(cb) {
  pump([
    gulp.src(MAIN),
    sourcemaps.init(),
    rollup({
      plugins: [
        typescript({ tsconfig: "tsconfig.json" }),
        terser(),
      ],
    }, {
        format: 'cjs',
      }),
    concat(DEST),
    sourcemaps.write(),
    gulp.dest(DEST_FOLDER),
  ], cb);
}

function docs(cb) {
  pump([
    gulp.src(SOURCE, { read: false }),
    typedoc({
      tsconfig: 'tsconfig,json',
      out: './docs',
      name: 'vk-chat-bot',
      ignoreCompilerErrors: false,
      version: true,
    }),
  ], cb);
}

exports.clean = clean;
exports.lint = lint;
exports.build = build;
exports.docs = docs;

exports.default = gulp.series(
  exports.clean,
  exports.build,
  exports.docs,
  exports.lint,
);
