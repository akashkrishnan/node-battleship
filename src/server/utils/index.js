'use strict';

module.exports = {
  clone,
  createMatrix,
  inRange,
  randomInt,
  randomBool,
};

function clone( a ) {
  return JSON.parse( JSON.stringify( a ) );
}

function createMatrix( m, n, val_fn ) {

  const matrix = [];

  for ( let i = 0; i < m; ++i ) {

    const row = [];

    for ( let j = 0; j < n; ++j ) {
      row.push( val_fn( i, j ) );
    }

    matrix.push( row );

  }

  return matrix;

}

function inRange( x, a, b ) {
  return Number.isFinite( x ) && a <= x && x < b;
}

function randomInt( min, max ) {
  min = Math.floor( min );
  max = Math.floor( max );
  return Math.floor( min + max * Math.random() );
}

function randomBool() {
  return randomInt( 0, 2 );
}
