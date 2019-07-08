'use strict';

const DEFAULTS = require( './defaults' );
const Utils = require( './utils' );
const SocketPlayer = require( './players/socket' );
const RandomPlayer = require( './players/computer/random' );
const Match = require( './game/match' );
const StaticAssets = require( './static-assets' );

const { promisify: p } = require( 'util' );
const http = require( 'http' );
const express = require( 'express' );
const compression = require( 'compression' );
const helmet = require( 'helmet' );
const socketio = require( 'socket.io' );
const uuid = require( 'uuid' );

module.exports = class Server {

  get running() {
    return !!this._running;
  }

  async listen( port ) {

    if ( this._running ) {
      throw new Error( 'Server is already running.' );
    }

    this._running = true;

    const app = express();
    const server = new http.Server( app );
    const io = socketio( server );

    app.use( compression() );
    app.use( helmet() );
    app.use( StaticAssets() );
    io.use( socketHandler( io ) );

    return p( server.listen.bind( server ) )( port );

  }

};

function socketHandler( io ) {

  const matches = {};

  return ( socket, next ) => {

    // TODO: RETRIEVE NAME FROM CLIENT
    const p = socket.player = new SocketPlayer( socket.id, socket );

    p.on( 'DEFAULTS', cb => cb( null, DEFAULTS ) );

    p.on( 'match.create', ( size, ships, cb ) => {

      size = size || DEFAULTS.SIZE;
      ships = ships || Utils.clone( DEFAULTS.SHIPS );

      // TODO: LET MATCH CREATOR CHOOSE OPPONENT OR LET ANOTHER HUMAN PLAYER JOIN
      const players = [ p, new RandomPlayer( 'Random Player' ) ];

      const matchId = uuid.v4();
      const match = matches[ matchId ] = new Match( size, ships, players );

      cb( matchId );

      // TODO: USE SOCKET.IO ROOMS FOR MATCH?

      // TODO: SUPPORT OBSERVERS

      match.start().catch( err => {
        for ( const player of players ) {
          if ( player instanceof SocketPlayer ) {
            console.error( err );
            player.emit( 'match.error', err );
          }
        }
      } );

      match.on( 'move', move => {
        for ( const player of players ) {
          if ( player instanceof SocketPlayer ) {
            player.emit(
              'match.move',
              {
                ...move,
                player: move.player === player,
              },
            );
          }
        }
      } );

      match.on( 'winner', winner => {
        for ( const player of players ) {
          if ( player instanceof SocketPlayer ) {
            player.emit( 'match.winner', player === winner );
          }
        }
      } );

      match.on( 'end', result => {
        for ( const player of players ) {
          if ( player instanceof SocketPlayer ) {
            player.emit( 'match.end', result );
          }
        }
      } );

    } );

    next();

  };

}

if ( !( 'toJSON' in Error.prototype ) ) {
  Object.defineProperty( Error.prototype, 'toJSON', {
    value: function () {
      const alt = {};
      Object.getOwnPropertyNames( this ).filter( k => k !== 'stack' ).forEach( k => alt[ k ] = this[ k ] );
      return alt;
    },
    configurable: true,
    writable: true,
  } );
}
