'use strict';

const AbstractPlayer = require( './abstract' );

module.exports = class SocketPlayer extends AbstractPlayer {

  constructor( name, socket ) {
    super( name );
    this._socket = socket;
  }

  async getFleetPositions( ...args ) {
    return new Promise( ( resolve, reject ) => {
      this.emit( 'match.getFleetPositions', ...args, ( err, positions ) => {
        err ? reject( err ) : resolve( positions );
      } );
    } );
  }

  async getNextMove( ...args ) {
    return new Promise( ( resolve, reject ) => {
      this.emit( 'match.getNextMove', ...args, ( err, coords ) => {
        err ? reject( err ) : resolve( coords );
      } );
    } );
  }

  get socket() {
    return this._socket;
  }

  emit( ...args ) {
    return this._socket.emit( ...args );
  }

  on( ...args ) {
    return this._socket.on( ...args );
  }

};
