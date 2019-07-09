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
    const player = socket.player = new SocketPlayer( socket.id, socket );

    player.on( 'DEFAULTS', cb => cb( null, DEFAULTS ) );

    player.on( 'match.list', ( cb ) => {

      const _matches = Object.entries( matches ).map( ( [ matchId, match ] ) => {

        return {
          id: matchId,
          running: match.running,
        };

      } );

      cb( null, _matches );

    } );

    player.on( 'match.join', ( matchId, cb ) => {

      const match = matches[ matchId ];

      if ( !match ) {
        return cb( new Error( 'Match does not exist.' ) );
      }

      match.addPlayer( player ).then( cb, cb );

    } );

    player.on( 'match.observe', ( matchId, cb ) => {

      const match = matches[ matchId ];

      if ( !match ) {
        return cb( new Error( 'Match does not exist.' ) );
      }

      match.addObserver( player ).then( cb, cb );

    } );

    player.on( 'match.create', async ( size, ships, cpu, cb ) => {

      size = size || DEFAULTS.SIZE;
      ships = ships || Utils.clone( DEFAULTS.SHIPS );
      cb = Utils.safeFn( cb );

      // TODO: LET MATCH CREATOR CHOOSE OPPONENT OR LET ANOTHER HUMAN PLAYER JOIN
      const players = [ player ];
      const matchId = uuid.v4();
      const match = matches[ matchId ] = new Match( size, ships, players );

      if ( cpu ) {
        try {
          await match.addPlayer( new RandomPlayer( 'Random Player' ) );
        }
        catch ( err ) {
          delete matches[ matchId ];
          return cb( err );
        }
      }

      cb( null, matchId );

      // TODO: USE SOCKET.IO ROOMS FOR MATCH?

      // TODO: SUPPORT OBSERVERS

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

        for ( const observer of match.observers ) {
          if ( observer instanceof SocketPlayer ) {
            observer.emit(
              'match.move',
              {
                ...move,
                player: players[ 0 ] === move.player ? 1 : 2,
              },
              match.boards[ 0 ].getAllyView(),
              match.boards[ 1 ].getAllyView(),
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

        for ( const observer of match.observers ) {
          if ( observer instanceof SocketPlayer ) {
            const p1 = players[ 0 ] === winner;
            observer.emit( 'match.winner', p1 ? 1 : 2 );
          }
        }

      } );

      match.on( 'error', err => {

        delete matches[ matchId ];

        for ( const player of players ) {
          if ( player instanceof SocketPlayer ) {
            console.error( err );
            player.emit( 'match.error', err );
          }
        }

        for ( const observer of match.observers ) {
          if ( observer instanceof SocketPlayer ) {
            observer.emit( 'match.error', err );
          }
        }

      } );

      match.on( 'end', result => {

        delete matches[ matchId ];

        for ( const player of players ) {
          if ( player instanceof SocketPlayer ) {
            player.emit( 'match.end', result );
          }
        }

        for ( const observer of match.observers ) {
          if ( observer instanceof SocketPlayer ) {
            observer.emit( 'match.end', result );
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
