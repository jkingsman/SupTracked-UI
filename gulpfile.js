"use strict";

var gulp = require('gulp'),
minifyHtml = require('gulp-minify-html'),
minifyCss  = require('gulp-minify-css'),
concat     = require('gulp-concat'),
del        = require('del'),
uglify     = require('gulp-uglify'),
jshint     = require('gulp-jshint'),
stylish    = require('jshint-stylish'),
connect     = require('gulp-connect'),
jade       = require('gulp-jade');

//lint it out
gulp.task('hint', function () {
  gulp.src(['./src/js/**/*'])
  .pipe(jshint())
  .pipe(jshint.reporter(stylish));
});

//clear out the folder
gulp.task('empty', function() {
  del(['./dist/**', './dist/js/**', '!./dist', '!./dist/img', '!./dist/js']);
});

// minify our html
gulp.task('html', function () {
  gulp.src('./src/jade/*.jade')
  .pipe(jade())
  .pipe(gulp.dest('./dist/'))
  .pipe(connect.reload());
});

//minify & concat our CSS
gulp.task('css', function () {
  gulp.src('./src/css/*')
  .pipe(minifyCss())
  .pipe(concat('style.css'))
  .pipe(gulp.dest('./dist/'))
  .pipe(connect.reload());
});

//lib
gulp.task('js-lib', function () {
  gulp.src(['./src/lib/materialize.js', './src/lib/init.js', './src/lib/request.js'])
  .pipe(uglify())
  .pipe(concat('lib.js'))
  .pipe(gulp.dest('./dist'))
  .pipe(connect.reload());
});

//main
gulp.task('js-main', function () {
  gulp.src(['./src/js/**/*'])
  .pipe(uglify())
  .pipe(gulp.dest('./dist/js'))
  .pipe(connect.reload());
});

//move over remaining files
gulp.task('copy', function () {
  gulp.src(['./src/img/**/*'])
  .pipe(gulp.dest('./dist/img'))
  .pipe(connect.reload());
});

//serve it
gulp.task('webserver', function() {
  connect.server({
    root: 'dist',
    livereload: true,
  });
});

gulp.task('default', ['empty', 'hint', 'html', 'css', 'js-lib', 'js-main', 'copy']);

//realtime watching
gulp.task('realtime', function() {
  gulp.watch('./src/**/*', ['hint', 'html', 'css', 'js-lib', 'js-main', 'copy']);
});

gulp.task('watch', ['realtime', 'default', 'webserver']);
