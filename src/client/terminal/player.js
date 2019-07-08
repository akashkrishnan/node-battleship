'use strict';

const BoardUtils = require( '../../server/utils/board' );
const StringUtils = require( '../../server/utils/string' );
const readline = require( 'readline' );
const socketio = require( 'socket.io-client' );

module.exports = class TerminalPlayer {

  constructor() {

    this._terminal = readline.createInterface(
      {
        input: process.stdin,
        output: process.stdout,
      },
    );

  }

  async connect( host ) {
    return new Promise( resolve => {

      console.info( 'Connecting to server...' );

      const client = socketio( host );

      client.once( 'connect', () => {

        console.info( 'Connected to server.' );

        let moves = [];

        client.emit( 'DEFAULTS', ( err, DEFAULTS ) => {

          console.info( 'Received game defaults from server.' );

          client.once( 'match.end', result => {
            if ( !result ) {
              console.log( '[!] Match was abandoned.' );
            }
            resolve();
          } );

          client.once( 'match.error', err => {
            console.warn( '[SERVER]', err );
            resolve();
          } );

          client.once( 'match.winner', winner => {
            console.log( `[!] You ${winner ? 'won' : 'lost'}!` );
          } );

          client.on( 'match.move', move => {
            moves.push( move );
          } );

          client.on( 'match.getFleetPositions', ( size, fleet, cb ) => {
            // TODO: READ FROM STDIN
            cb( null, BoardUtils.randomFleetPositions( size, fleet ) );
          } );

          client.on( 'match.getNextMove', ( num, ally, enemy, cb ) => {

            const a = BoardUtils.render( ally.board );
            const e = BoardUtils.render( enemy.board );

            a.unshift( 'You', '===' );
            e.unshift( 'Enemy', '=====' );

            // const merged = StringUtils.mergeBlocks( [ a, e ], StringUtils.repeat( ' ', 4 ) );
            //
            // console.log();
            // console.log( merged.join( '\n' ) );
            // console.log();

            console.log();
            console.log( a.join( '\n' ) );
            console.log();
            console.log( e.join( '\n' ) );
            console.log();

            this._printMoves( moves );
            moves = [];

            console.log();

            this._getCoords( num ).then( c => cb( null, c ), cb );

          } );

          console.info( 'Creating new match with default configuration...' );

          client.emit( 'match.create', DEFAULTS.SIZE, DEFAULTS.SHIPS, () => {
            console.info( 'Match has been created.' );
          } );

        } );

      } );

      client.on( 'disconnect', () => {
        console.error( '[!] You have disconnected from the server.' );
        resolve();
      } );

    } );
  }

  async _getCoords( num ) {
    return new Promise( resolve => {
      this._terminal.question(
        `[${num}] Please enter coordinates to attack (ex. b4): `,
        line => resolve( this._toCoordsArr( line ) ),
      );
    } );
  }

  _toCoordsArr( str ) {

    str = str.trim().toLowerCase();

    return [
      str.charCodeAt( 0 ) - 97,
      Number.parseInt( str.slice( 1 ), 10 ) - 1,
    ];

  }

  _toCoordStr( coords ) {
    return [
      String.fromCharCode( coords[ 0 ] + 97 ),
      coords[ 1 ] + 1,
    ].join( '' );
  }

  _printMoves( moves ) {
    for ( const move of moves ) {

      const player = move.player ? 'YOU' : 'ENEMY';
      const coord = this._toCoordStr( move.coords );
      const result = move.sunken ? `SUNK ${move.sunken.class}` : move.result > 0 ? 'HIT' : 'MISSED';

      console.log( `[${move.num}] ${player} fired at ${coord} and ${result}.` );

    }
  }

};
