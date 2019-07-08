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
    return new Promise( ( resolve, reject ) => {

      console.info( 'Connecting to server...' );

      const client = this._client = socketio( host );

      client.once( 'connect', () => {

        console.info( 'Connected to server.' );

        client.emit( 'DEFAULTS', ( err, DEFAULTS ) => {

          console.info( 'Received game defaults from server.' );

          this._defaults = DEFAULTS;

          this._main().then( resolve, reject );

        } );

      } );

      client.on( 'disconnect', () => {
        console.error( '[!] You have disconnected from the server.' );
        resolve();
      } );

    } );
  }

  async _main() {

    const cmd = await this._getCommand();

    if ( cmd === 'quit' ) {
      return console.log( 'Goodbye!' );
    }

    if ( cmd === 'match.create' ) {
      await this._createMatch( this._defaults );
    }

    if ( cmd === 'match.list' ) {
      await this._listMatches();
    }

    return this._main();

  }

  async _createMatch( DEFAULTS ) {
    return new Promise( ( resolve, reject ) => {

      let moves = [];

      this._client.once( 'match.end', result => {
        if ( !result ) {
          console.log( '[!] Match was abandoned.' );
        }
        resolve();
      } );

      this._client.once( 'match.error', err => {
        console.warn( '[SERVER]', err );
        resolve();
      } );

      this._client.once( 'match.winner', winner => {
        console.log( `[!] You ${winner ? 'won' : 'lost'}!` );
      } );

      this._client.on( 'match.move', move => {
        moves.push( move );
      } );

      this._client.on( 'match.getFleetPositions', ( size, fleet, cb ) => {
        // TODO: READ FROM STDIN
        cb( null, BoardUtils.randomFleetPositions( size, fleet ) );
      } );

      this._client.on( 'match.getNextMove', ( num, ally, enemy, cb ) => {

        const a = BoardUtils.render( ally.board );
        const e = BoardUtils.render( enemy.board );

        a.unshift( 'You', '===' );
        e.unshift( 'Enemy', '=====' );

        const merged = StringUtils.mergeBlocks( [ a, e ], StringUtils.repeat( ' ', 4 ) );

        console.log();
        console.log( merged.join( '\n' ) );
        console.log();

        // console.log();
        // console.log( a.join( '\n' ) );
        // console.log();
        // console.log( e.join( '\n' ) );
        // console.log();

        this._printMoves( moves );
        moves = [];

        console.log();

        this._getCoords( num ).then( c => cb( null, c ), cb );

      } );

      console.info( 'Creating new match with default configuration...' );

      this._client.emit( 'match.create', DEFAULTS.SIZE, DEFAULTS.SHIPS, () => {
        console.info( 'Match has been created.' );
      } );

    } );
  }

  async _listMatches() {
    return new Promise( ( resolve, reject ) => {
      this._client.emit( 'match.list', ( err, matches ) => {

        if ( !matches.length ) {
          console.log( 'There are no matches!' );
          return resolve();
        }

        console.log( 'List of matches:' );

        for ( const match of matches ) {
          console.log( '- ' + JSON.stringify( match ) );
        }

        resolve();

      } );
    } );
  }

  async _getCommand() {

    const commands = new Set( [ 'match.list', 'match.create', 'match.join', 'match.observe', 'quit' ] );

    console.log( 'List of commands:' );
    commands.forEach( cmd => console.log( `- ${cmd}` ) );

    const cmd = await this._askQuestion( 'What would you like to do?: ' );

    if ( commands.has( cmd ) ) {
      return cmd;
    }

    console.log( '[!] Invalid command.' );

    return this._getCommand();

  }

  async _getCoords( num ) {
    const input = await this._askQuestion( `[${num}] Please enter coordinates to attack (ex. b4): ` );
    return this._toCoordsArr( input );
  }

  async _askQuestion( query ) {
    return new Promise( resolve => {
      this._terminal.question( query, line => resolve( line.trim() ) );
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
