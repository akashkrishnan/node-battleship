'use strict';

const path = require( 'path' );
const express = require( 'express' );

module.exports = () => {

  if ( process.env.NODE_ENV === 'production' ) {
    return express.static( path.resolve( __dirname, '..', 'dist', 'client' ) );
  }

  const config = require( '../../webpack/dev.js' );
  const webpack = require( 'webpack' );
  const middleware = require( 'webpack-dev-middleware' );

  const compiler = webpack( config );

  return middleware( compiler, { logLevel: 'error' } );

};
