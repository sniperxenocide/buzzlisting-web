/*var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-clean-css'),
    rev = require('gulp-rev'),
    RevAll = require('gulp-rev-all');
 
gulp.task('default', function () {
    return gulp.src('index.html')
        .pipe(useref())
        .pipe(RevAll.revision({ dontRenameFile: ['.html'] }))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest('.'));
});*/

let gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    minify = require('gulp-minify-css');
    babel = require('gulp-babel');

// write folder location eg: core/dashboard

let folder = '/core/user_management/users';
let fileName = 'users';

/*let folder = 'core';
let fileName = 'common';*/

let config = {
    // javascript part
    jsConcatFiles: [
        //add your files here eg: ['folder/*.js']
        'static/' + folder + '/js/*.js'
    ],
    es6jsConcatFiles: [
        //add your files here eg: ['folder/*.js']
        'static/' + folder + '/js/app/*.js'
    ],
    jsDestinationFileName: fileName + '.min.js',

    // css part
    cssConcatFiles: [
        //add your files here eg: ['folder/*.css']
        'static/' + folder + '/css/*.css'
    ],
    cssDestinationFileName: fileName + '.min.css',

    // for distribution
    buildFilesFoldersRemove: [
        'build/scss/',
        'build/js/!(*.min.js)',
        'build/bower.json',
        'build/bower_components/',
        'build/maps/'
    ]
};

gulp.task('scripts', function () {
    return gulp.src(config.jsConcatFiles)
        .pipe(plumber())
        .pipe(concat(config.jsDestinationFileName))
        .pipe(uglify())
        .pipe(gulp.dest('static/assets/js/'));
});

gulp.task('es6scripts', function () {
    return gulp.src(config.es6jsConcatFiles)
        .pipe(plumber())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat(config.jsDestinationFileName))
        .pipe(uglify())
        .pipe(gulp.dest('static/assets/js/app/'));
});

gulp.task('styles', function () {
    gulp.src(config.cssConcatFiles)
        .pipe(minify())
        .pipe(plumber())
        .pipe(concat(config.cssDestinationFileName))
        .pipe(gulp.dest('static/assets/css/'));
});

gulp.task('watch', function () {
    gulp.watch('static/' + folder + '/**', ['styles']);
    gulp.watch('static/' + folder + '/**', ['scripts']);
    gulp.watch('static/' + folder + '/**', ['es6scripts']);
});

gulp.task('default', ['scripts', 'es6scripts', 'styles', 'watch']);
