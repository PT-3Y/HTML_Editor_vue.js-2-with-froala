const webpack = require('webpack')
const base = require('./webpack.base.conf')
const config = require('../config')
var env = process.env.NODE_ENV === 'testing'
  ? require('../config/test.env')
  : config.build.env

base.entry = {
  lib: './src/vue-froala.js'
}

base.output = {
  path: config.build.assetsRoot,
  publicPath: config.build.assetsPublicPath,
  filename: 'vue-froala.js',
  library: 'vue-froala-wysiwyg',
  libraryTarget: 'umd'
}

var webpackConfig = Object.assign({}, base)

webpackConfig.devtool = '#source-map'
webpackConfig.plugins = (webpackConfig.plugins || []).concat([
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': env
  }),
  new webpack.optimize.UglifyJsPlugin({
    compress: { warnings: false }
  }),
  new webpack.optimize.OccurenceOrderPlugin()
])

module.exports = webpackConfig
