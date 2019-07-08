'use strict';

const Utils = require( '.' );
const StringUtils = require( './string' );
const chalk = require( 'chalk' );

module.exports = {
  randomCoordinates,
  randomFleetPositions,
  render,
};

function randomCoordinates( size ) {
  return [
    Utils.randomInt( 0, size ),
    Utils.randomInt( 0, size ),
  ];
}

function randomFleetPositions( size, fleet ) {

  // TODO: IMPROVE PERFORMANCE

  const board = Utils.createMatrix( size, size, () => 0 );
  const positions = [];

  for ( const ship of fleet ) {
    while ( 1 ) {

      const p = [ [], [] ];

      // Get available start coords
      do {
        p[ 0 ] = randomCoordinates( size );
      }
      while ( board[ p[ 0 ][ 0 ] ][ p[ 0 ][ 1 ] ] );

      // Get random direction
      const axis = Utils.randomBool();
      const off = +!axis;

      // Determine stop coords
      const min = p[ 0 ][ axis ];
      const max = p[ 1 ][ axis ] = min + ship.size - 1;
      const idx = p[ 1 ][ off ] = p[ 0 ][ off ];

      // Ensure stop coords on board
      if ( max >= size ) {
        continue;
      }

      // Check for overlap
      const cords = [];
      for ( let i = min; i <= max; ++i ) {

        const c = [];
        c[ axis ] = i;
        c[ off ] = idx;

        if ( board[ c[ 0 ] ][ c[ 1 ] ] ) {
          break;
        }

        cords.push( c );

      }

      // Ensure no overlap
      if ( cords.length === ship.size ) {

        for ( const c of cords ) {
          board[ c[ 0 ] ][ c[ 1 ] ] = 1;
        }

        positions.push( p );
        break;

      }

    }
  }

  return positions;

}

function render( board ) {

  const n = board.length;

  let hr = '   +' + StringUtils.repeat( '---+', n );

  const header = '     ' + new Array( n ).fill( 0 )
                                         .map( ( v, i ) => i + 1 )
                                         .join( '   ' );

  const lines = [ header, hr ];

  board.forEach( ( row, ridx ) => {

    const line = row.map( c => {

      let t = '   ';

      if ( c.shipId ) {

        const bgColor = c.status > 0 ? 'bgRed' : 'bgBlack';

        t = chalk.white[ bgColor ]( ` ${c.shipId} ` );

      }
      else if ( c.status > 0 ) {
        t = chalk.white.bgRed( ' X ' );
      }
      else if ( c.status < 0 ) {
        t = chalk.black.bgWhite( ' - ' );
      }

      return t;

    } ).join( '|' );

    const label = String.fromCharCode( 97 + ridx );

    lines.push( ` ${label} |${line}|`, hr );

  } );

  return lines;

}
