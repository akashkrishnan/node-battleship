'use strict';

const path = require( 'path' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: path.resolve( __dirname, '../src/client/web/main.jsx' ),
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-react',
          ],
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin(
      {
        template: path.resolve( __dirname, '../src/client/web/index.html' ),
      },
    ),
  ],
  output: {
    path: path.resolve( __dirname, '../dist/client/web' ),
    filename: 'index.js',
  },
};
