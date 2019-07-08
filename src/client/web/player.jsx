'use strict';

export default class Player {

  constructor( socket, onGetFleetPositions, onGetNextMove ) {

    this._socket = socket;
    this._onGetFleetPositions = onGetFleetPositions;
    this._onGetNextMove = onGetNextMove;

    this._socket.on( 'match.getFleetPositions', onGetFleetPositions );
    this._socket.on( 'match.getNextMove', onGetNextMove );

  }

  dispose() {
    this._socket.removeListener( 'match.getFleetPositions', this._onGetFleetPositions );
    this._socket.removeListener( 'match.getNextMove', this._onGetNextMove );
  }

}
