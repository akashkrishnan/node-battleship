'use strict';

module.exports = {
  countChars,
  mergeBlocks,
  repeat,
};

function countChars( str ) {

  let point;
  let index;
  let width = 0;
  let len = 0;

  for ( index = 0; index < str.length; ) {

    point = str.codePointAt( index );
    width = 0;

    while ( point ) {
      width += 1;
      point = point >> 8;
    }

    index += Math.round( width / 2 );
    len += 1;

  }

  return len;

}

function mergeBlocks( blocks, separator ) {

  const maxHeight = Math.max( ...blocks.map( b => b.length ) );

  const maxWidths = blocks.map( b => Math.max( ...b.map( l => countChars( l ) ) ) );

  const lines = [];

  for ( let l = 0; l < maxHeight; ++l ) {

    const line = blocks.map( ( b, bidx ) => {

      const part = ( b[ l ] || '' );

      return part + repeat( ' ', maxWidths[ bidx ] - part.length );

    } ).join( separator );

    lines.push( line );
  }

  return lines;

}

function repeat( c, n ) {
  return new Array( n ).fill( c ).join( '' ) || '';
}
