'use strict';

const Utils = require( '../utils' );
const { FleetPositionsError } = require( '../errors' );

module.exports = class Board {

  constructor( size, fleet ) {

    this._size = size;
    this._fleet = fleet;
    this._board = Utils.createMatrix( size, size, () => ( { status: 0 } ) );

    // Place ships on board
    this._placeShips();

  }

  _placeShips() {
    this._fleet.forEach( ( ship, idx ) => {

      const p = ship.position;

      const h = Math.abs( p[ 0 ][ 1 ] - p[ 1 ][ 1 ] ) === ship.size - 1;
      const v = Math.abs( p[ 0 ][ 0 ] - p[ 1 ][ 0 ] ) === ship.size - 1;

      // Ensure either horizontal or vertical of correct size
      if ( ship.size !== 1 && h === v ) {
        throw new FleetPositionsError( 'Invalid ship orientation or size.' );
      }

      // Get smallest index in axis of ship
      const axisMinIdx = Math.min( p[ 0 ][ +h ], p[ 1 ][ +h ] );
      const offIdx = p[ 0 ][ +v ];

      // Ensure within bounds
      if ( axisMinIdx < 0 || offIdx < 0 ) {
        throw new FleetPositionsError( 'Ship position out of bounds.' );
      }

      if ( axisMinIdx + ship.size > this._size || offIdx >= this._size ) {
        throw new FleetPositionsError( 'Ship position out of bounds.' );
      }

      for ( let i = axisMinIdx, n = axisMinIdx + ship.size; i < n; ++i ) {

        let row = h ? offIdx : i;
        let col = v ? offIdx : i;

        const cell = this._board[ row ][ col ];

        if ( cell.shipId ) {
          throw new FleetPositionsError( 'Overlapping ships.' );
        }

        cell.shipId = idx + 1;

      }

    } );
  }

  get size() {
    return this._size;
  }

  get empty() {
    return !this._fleet.find( ship => ship.hits !== ship.size );
  }

  getAllyView() {
    return {
      board: this._board,
      fleet: this._fleet,
    };
  }

  getEnemyView() {

    const fleet = __publishFleet( this._fleet );
    const board = this._board.map( row => row.map( cell => ( { status: cell.status } ) ) );

    return { board, fleet };

  }

  attack( row, col ) {

    if ( !Utils.inRange( row, 0, this._size ) ||
         !Utils.inRange( col, 0, this._size ) ) {
      return [ 0 ];
    }

    const p = this._board[ row ][ col ];

    if ( p.status ) {
      return [ 0 ];
    }

    let sunken;

    p.status = p.shipId ? 1 : -1;

    if ( p.shipId ) {

      const ship = this._fleet[ p.shipId - 1 ];

      if ( ++ship.hits === ship.size ) {
        sunken = ship;
      }

    }

    return [ p.status, sunken ];

  }

};

function __publishFleet( fleet ) {
  return fleet.map( ship => {

    // Only expose ship's position once it has been sunk
    if ( ship.hits === ship.size ) {
      return ship;
    }

    return {
      class: ship.class,
      size: ship.size,
    };

  } );
}
