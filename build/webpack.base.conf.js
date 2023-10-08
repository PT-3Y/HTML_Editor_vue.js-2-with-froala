var path = require('path')
var config = require('../config')
var webpack = require('webpack')
var utils = require('./utils')
var projectRoot = path.resolve(__dirname, '../')
const { VueLoaderPlugin } = require('vue-loader');
module.exports = {
  entry: {
    main: './src/main.js',

  },
  output: {
    path: config.build.assetsRoot,
    publicPath: config.build.assetsPublicPath,
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.vue'],
    alias: {
      'src': path.resolve(__dirname, '../src'),
      'stream': require.resolve('stream-browserify')
    },
    modules: [path.join(__dirname, '../node_modules'),path.join(__dirname,'../node_modules/froala-editor/js')],
  },
  module: {
    rules: [{
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            compatConfig: {
              MODE: 2
            }
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: projectRoot,
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: 'vue-html-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'file-loader',
        query: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  },
  plugins: [
    // make sure to include the plugin!
    new VueLoaderPlugin(),
  ],
  
  // vue: {
  //   loaders: utils.cssLoaders()
  // }
}