'use strict'

/*
-------------------------------------------------------------------------------------------------
Dependences:
*/
const gulp = require('gulp')
const gutil = require('gulp-util')
const del = require('del')
const autoprefixer = require('autoprefixer')
const postcss = require('gulp-postcss')
const sass = require('gulp-sass')
const stylelint = require('gulp-stylelint')
const sourcemaps = require('gulp-sourcemaps')
const nunjucks = require('gulp-nunjucks')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const browserify = require('browserify')
const envify = require('loose-envify/custom')
const rev = require('gulp-rev')
const revReplace = require('gulp-rev-replace')
const htmlmin = require('gulp-htmlmin')
const cleancss = require('gulp-clean-css')
const uglify = require('gulp-uglify')
const plumber = require('gulp-plumber')
const critical = require('critical').stream
const purifycss = require('gulp-purifycss')
const header = require('gulp-header')
const runSequence = require('run-sequence')
const notify = require("gulp-notify")
const fs = require('fs')
const iconfont         = require('gulp-iconfont');
const iconfontCss      = require('gulp-iconfont-css');

const handleErrors = require('./gulp/util/handleErrors')

const PROJECT_NAME = 'offline-society'
const BANNER = fs.readFileSync('banner.txt', 'utf8').replace('@date', (new Date()))
const CONFIG = require('./config').get()
const COMPATIBILITY = ['last 2 versions', 'Firefox ESR', 'not ie <= 10']  // see https://github.com/ai/browserslist#queries
const EXTRAS_GLOB = 'src/**/*.{txt,json,xml,ico,jpeg,jpg,png,gif,svg,ttf,otf,eot,woff,woff2}'

/*
-------------------------------------------------------------------------------------------------
Base Locations:
*/
let base = {
  src:      'src/',
  build:    'public/',
  dist:     'dist/',
  // for all them static files:
  staticAssets: {
    src:    'src/static/',
    build:  'public/static/',
    dist:   'dist/static/'
  }
}

/*
-------------------------------------------------------------------------------------------------
Config Parameters
*/
let config = {
  // SASS
  sass: {
    src:          base.staticAssets.src + 'scss/**/*.scss',
    watch:        base.staticAssets.src + 'scss/**/*.scss',
    build:        base.staticAssets.build + 'css/',
    dist:         base.staticAssets.dist + 'css/',
    includePaths: ['node_modules/foundation-sites/scss']
  },
  // Javascript
  js: {
    src:   base.staticAssets.src + 'js/app.js',
    build: base.staticAssets.build + 'js/',
    dist:  base.staticAssets.dist + 'js/'
  },
  nunjucks: {
    src: ['src/templates/**/*.html', '!**/_*'],
    watch: 'src/templates/**/*.html',
    build: base.build,
    dist: base.dist + 'templates'
  }
}

/*
-------------------------------------------------------------------------------------------------
Tasks
*/
let bundler = browserify({ entry: true, debug: true })
  .add(config.js.src)
  .transform('eslintify', { continuous: true })
  .transform('babelify')
  .transform(envify(CONFIG))
  .transform('uglifyify')

function bundle() {
  return bundler.bundle()
    /*.on('error', err => {
      gutil.log(gutil.colors.red(err.message))
      this.emit('end')
    })*/
    .on('error', handleErrors)
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write())
    .on('error', handleErrors)
    .pipe(gulp.dest(config.js.build))
}

gulp.task('clean', () => {
  return del(base.build)
  return del(base.dist)
})

gulp.task('browserify', () => {
  return bundle()
})

gulp.task('watchify', () => {
  const watchify = require('watchify')
  console.log('Im watchifying!')
  bundler = watchify(bundler)
  bundler.on('update', () => {
    gutil.log('-> bundling...')
    bundle()
  })
  return bundle
})

/*
-------------------------------------------------------------------------------------------------
SASS -- Build stylesheets
*/
gulp.task('sass', () => {
  return gulp.src(config.sass.src)
    .pipe(plumber())
    /*.pipe(stylelint({
      syntax: 'scss',
      reporters: [ { formatter: 'string', console: true } ],
      failAfterError: false
    }))*/
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: config.sass.includePaths
    }))
    .pipe(postcss([autoprefixer({
      browsers: COMPATIBILITY
    })]))
    .pipe(sourcemaps.write())
    .pipe(plumber.stop())
    .pipe(gulp.dest(config.sass.build))
    .pipe(gulp.dest(config.sass.dist))
    .pipe( notify({
      message: "Generated file: <%= file.relative %>"
    }));
})


/*
-------------------------------------------------------------------------------------------------
Generate Icon font
*/

let icon_config = {
  // name of icon font
  name:       PROJECT_NAME,
  // Path of the raw icons (as SVG)
  src:        base.staticAssets.src + 'icons/*.svg',
  // Set the base of "icons" folder. Without it, the template goes to weird places (cant leave src)
  base:       base.staticAssets.src,
  // This is where the icon-font gulp pipe spits the webfont files
  fontDest:   base.staticAssets.build + 'fonts/',
  // Path where the SCSS file should be saved,
  // IMPORTANT: This is relative to the font destination (fontDest)
  sassOutput: '../../../src/static/scss/_base/_icons.scss',
  // Path of fonts, relative to CSS (not scss) (eg, this is where @font-face points)
  fontPath:   '../fonts/',
  // Basis of the icons' class in CSS
  className:  'icon',
  // The template path for generating the stylesheet (we use scss)
  template:   'gulp/util/_iconFont-template.scss',
  // Files to watch for changes to re-generate the icon font
  watch:      base.staticAssets.src + 'icons/*.svg'
}

gulp.task('iconfont', () => {
   const runTimestamp     = Math.round(Date.now()/1000);

   return gulp.src(icon_config.src ,{base: icon_config.base})
    .pipe(iconfontCss({
      fontName: icon_config.name,              // The name of the generated font family (required). Has to be identical to iconfont's fontName option.
      path: icon_config.template,             // The template path for stylesheet (we use scss)
      targetPath: icon_config.sassOutput,     // The path where the (S)CSS file should be saved, relative to the path used in gulp.dest()
                                              // Depending on the path, it might be necessary to set the base option, see https://github.com/backflip/gulp-iconfont-css/issues/16.
      fontPath: icon_config.fontPath,         // Directory of font files relative to generated (S)CSS file (optional, defaults to ./)
      className: icon_config.className        // Name of the generated CSS class/placeholder. Used for mixins and functions, too
    }))
    .pipe(iconfont({
      fontName: icon_config.name,
      appendUnicode: false,
      formats: ['ttf', 'eot', 'woff','woff2','svg'], // default, 'woff2' and 'svg' are available
      timestamp: runTimestamp // recommended to get consistent builds when watching files
     }))
    .on('error', handleErrors)
    .pipe(gulp.dest(icon_config.fontDest))
    .pipe( notify({
          title: "Icon font built",
          message: "Generated icon font: " + icon_config.name
        }));
})

/*
-------------------------------------------------------------------------------------------------
Nunjucks -- Compile markup templates
*/
gulp.task('nunjucks', () => {
  return gulp.src(config.nunjucks.src)
    .pipe(plumber())
    .pipe(nunjucks.compile(CONFIG, {
      throwOnUndefined: true
    }))
    .pipe(plumber.stop())
    .pipe(gulp.dest(config.nunjucks.build))
    .pipe(gulp.dest(config.nunjucks.dist))
})

/*
-------------------------------------------------------------------------------------------------
Extras -- Move arbitrary files from source to public
*/
gulp.task('extras', () => {
  return gulp.src(EXTRAS_GLOB)
    .pipe(gulp.dest(base.build))
})

/*
-------------------------------------------------------------------------------------------------
Critical -- Inline critical path CSS
*/
gulp.task('critical', () => {
  return gulp.src('public/**/*.html')
    .pipe(critical({
      base: 'public/',
      inline: true,
      dimensions: [{
        width: 1336,  // desktop
        height: 768
      }, {
        width: 1024,  // tablet
        height: 768
      }, {
        width: 360,  // mobile
        height: 640
      }]
    }))
    .on('error', handleErrors)
    .pipe(gulp.dest('public/'))
})

/*
-------------------------------------------------------------------------------------------------
Rev -- Revision assets
*/
gulp.task('rev', () => {
  return gulp.src(['public/**/*', '!**/*.html', '!**/*.txt', '!**/*.ico'])
    .pipe(rev())
    .pipe(gulp.dest('public/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('public/'))
})

gulp.task('rev:replace', ['rev'], () => {
  const manifest = gulp.src('public/rev-manifest.json')
  return gulp.src('public/**/*')
    .pipe(revReplace({ manifest: manifest }))
    .pipe(gulp.dest('public/'))
})

/*
-------------------------------------------------------------------------------------------------
PurifyCSS -- Remove unused CSS
*/
gulp.task('purifycss', () => {
  return gulp.src('public/**/*.css')
    .pipe(purifycss(['public/**/*.js', 'public/**/*.html']))
    .pipe(gulp.dest('public/'))
})

/*
-------------------------------------------------------------------------------------------------
Minify --
*/
gulp.task('minify:html', () => {
  return gulp.src(['public/**/*.html'])
    .pipe(plumber())
    .pipe(htmlmin({
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: {
        preserveComments: 'license',
        compressor: { screw_ie8: true }
      },
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    }))
    .pipe(plumber.stop())
    .pipe(gulp.dest('public/'))
})

gulp.task('minify:css', () => {
  return gulp.src('public/**/*-*.css')
    .pipe(cleancss())
    .pipe(header(BANNER))
    .pipe(gulp.dest('public/'))
})

gulp.task('minify:js', () => {
  return gulp.src('public/**/*-*.js')
    .pipe(uglify({
      preserveComments: 'license',
      compressor: { screw_ie8: true },
      output: { preamble: BANNER }
    }))
    .pipe(gulp.dest('public/'))
})

/*
-------------------------------------------------------------------------------------------------
Workflow Tasks:
*/
gulp.task('build', (done) => {
  runSequence('clean', ['browserify', 'nunjucks', 'iconfont', 'sass', 'extras'], done)
})

gulp.task('build:production', (done) => {
  runSequence('build', 'rev:replace', 'purifycss', ['minify:html', 'minify:css', 'minify:js'], done)
})

gulp.task('watch', ['watchify'], () => {
  const browserSync = require('browser-sync').create()
  browserSync.init({
    server: 'public',
    files: 'public/**/*'
  })

  gulp.watch(config.sass.watch, ['sass'])
  gulp.watch(icon_config.watch, ['iconfont'])
  gulp.watch(config.nunjucks.watch, ['nunjucks'])
  gulp.watch(EXTRAS_GLOB, ['extras'])
})

gulp.task('start', (done) => {
  runSequence('build', 'watch', done)
})

gulp.task('default', ['build'])
