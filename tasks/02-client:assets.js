import gulp from 'gulp'
import pump from 'pump'
import merge from 'merge-stream'
import buffer from 'gulp-buffer'
import filter from 'gulp-filter'
import prettyError from 'gulp-prettyerror'
import path from 'path'

// IMAGES
import imagemin from 'gulp-imagemin'
import jpegRecompress from 'imagemin-jpeg-recompress'
import jimp from 'gulp-jimp-resize'

// SASS
import sass from 'gulp-sass'
import sassGlob from 'gulp-sass-glob'
import sassVars from 'gulp-sass-vars'

// POSTCSS
import postcss from 'gulp-postcss'
import pleeease from 'gulp-pleeease'

// OTHER
import concat from 'gulp-concat'
import webfont64 from 'gulp-base64-webfont-css'
import del from 'del'
import flatten from 'gulp-flatten'
import {iconSizes, bgSizes, sizes, ourSassConfig, postCssPluginsProd, postCssPluginsFast} from './shared/css'

// =============================================================================
// SCSS -> CSS and OPTIMIZE IMGs
// =============================================================================

const sources = {
  'fonts': [
    'node_modules/mdi/fonts/*.woff',
    'src/client/fonts/*.woff'
  ],
  'sass': [
    'src/client/scss/main.scss'
  ],
  'icons': [
    'src/client/img/*.icon.*'
  ],
  'elements': [
    'src/client/img/**/*'
  ],
  'elementFilter': [
    '**/*.{png,jpg,jpeg,gif}',
    '!**/*.{icon|bg}*'
  ],
  'backgrounds': [
    'src/client/img/**/*.bg.*'
  ]
}

const destination = (dest) => {
  if (!dest) {
    return path.resolve('./build/webserver/static/')
  }

  return path.resolve('./build/webserver/static/', dest)
}

gulp.task('client:media:prod', () => {
  del.sync(destination('css'))
  del.sync(destination('img'))

  const fontStream = pump([
    gulp.src(sources.fonts),
    webfont64(),
    concat('fonts.scss')
  ])

  const sassStream = pump([
    gulp.src(sources.sass),
    sassGlob()
  ])

  const iconStream = pump([
    gulp.src(sources.icons),
    jimp({
      'sizes': iconSizes
    })
  ])

  const elementStream = pump([
    gulp.src(sources.elements),
    filter(sources.elementFilter),
    jimp({
      sizes
    })
  ])

  const backgroundsStream = pump([
    gulp.src(sources.backgrounds),
    jimp({
      'sizes': bgSizes
    })
  ])

  const finalImageStream = pump([
    prettyError(),
    merge(backgroundsStream, iconStream, elementStream),
    imagemin([
      imagemin.gifsicle({
        'interlaced':        true,
        'optimizationLevel': 3
      }),
      jpegRecompress(),
      imagemin.optipng({
        'optimizationLevel': 5
      }),
      imagemin.svgo({
        'plugins': [
          {
            'removeViewBox': true
          }
        ]
      })
    ]),
    flatten(),
    gulp.dest(destination('img'))
  ])

  const finalCssStream = pump([
    prettyError(),
    merge(fontStream, sassStream),
    sassVars(ourSassConfig, {
      'verbose': false
    }),
    sass(),
    buffer(),
    concat('bundle.min.css'),
    postcss(postCssPluginsProd),
    pleeease({
      'autoprefixer': {
        'browsers': [
          '> 1%',
          'last 4 versions',
          'ios 7'
        ],
        'cascade': true
      },
      'filters': {
        'oldIe': false
      },
      'rem': [
        '16px',
        {
          'replace': true,
          'atrules': true
        }
      ],
      'pseudoElements': true,
      'import':         false,
      'rebaseUrls':     false,
      'minifier':       {
        'removeAllComments': true
      },
      'mqpacker':   true,
      'sourcemaps': false
    }),
    flatten(),
    gulp.dest(destination('css'))
  ])

  return merge(finalCssStream, finalImageStream)
})

gulp.task('client:media:fast', (done) => {
  del.sync(destination('css'))
  del.sync(destination('img'))

  const fontStream = pump([
    gulp.src(sources.fonts),
    webfont64(),
    concat('fonts.scss')
  ])

  const sassStream = pump([
    gulp.src(sources.sass),
    sassGlob()
  ])

  const iconStream = pump([
    gulp.src(sources.icons),
    jimp({
      'sizes': iconSizes
    })
  ])

  const elementStream = pump([
    gulp.src(sources.elements),
    filter([
      '**/*.{png,jpg,jpeg,gif}',
      '!**/*.bg*'
    ]),
    jimp({
      sizes
    })
  ])

  const backgroundsStream = pump([
    gulp.src(sources.backgrounds),
    jimp({
      'sizes': bgSizes
    })
  ])

  const finalImageStream = pump([
    prettyError(),
    merge(backgroundsStream, iconStream, elementStream),
    flatten(),
    gulp.dest(destination('img'))
  ])

  const finalCssStream = pump([
    prettyError(),
    merge(fontStream, sassStream),
    sassVars(ourSassConfig, {
      'verbose': false
    }),
    sass(),
    buffer(),
    concat('bundle.min.css'),
    postcss(postCssPluginsFast),
    flatten(),
    gulp.dest(destination('css'))
  ])

  return pump([
    prettyError(),
    merge(finalCssStream, finalImageStream)
  ]).on('end', () => {
    done()
  })
})

gulp.task('client:media:watch', (done) => {
  gulp.watch([
    'src/client/{fonts|img|scss}/**/*'
  ], gulp.series('client:media:fast'))

  done()
})