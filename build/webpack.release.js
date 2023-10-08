var path = require('path')
var webpack = require("webpack")
var MiniCssExtractPlugin = require("mini-css-extract-plugin")
var projectRoot = path.resolve(__dirname, '../')

const cssLoader = [
  {
    loader: MiniCssExtractPlugin.loader,
    options: {
      hmr: process.env.NODE_ENV === 'development'
    }
  },
  'css-loader'
]

const sassLoader = [
  {
    loader: MiniCssExtractPlugin.loader,
    options: {
      hmr: process.env.NODE_ENV === 'development'
    }
  },
  'css-loader',
  'sass-loader'
]


module.exports = {
  entry: {
    'vue-froala': './src/vue-froala.js',
  },
  output: {
    filename: '[name].js',
    library: 'vue-froala-wysiwyg',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  performance: {
    maxEntrypointSize: 700000,
	maxAssetSize: 700000
  },
 
  mode: 'production',
  module: {
    rules: [{
        test: /\.vue$/,
        loader: 'vue-loader',
        enforce: 'pre',
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
        options: {
          presets: ['@babel/env'],
          plugins: ['@babel/plugin-transform-runtime']
        },
        include: projectRoot,
        exclude: /node_modules/,
        enforce: 'pre'
      },
      {
        test: /\.css$/,
        loader: cssLoader
      },
      {
        test: /\.s[a|c]ss$/,
        loader: sassLoader
      }
    ]
  },
  optimization: {
    minimize: false,
  }
}
