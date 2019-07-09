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

    try {

      const cmd = await this._getCommand();

      if ( cmd === 'quit' ) {
        return console.log( 'Goodbye!' );
      }

      if ( cmd === 'match.list' ) {
        await this._listMatches();
      }

      if ( cmd === 'match.create' ) {
        await this._createMatch( this._defaults );
      }

      if ( cmd === 'match.join' ) {
        await this._joinMatch();
      }

      if ( cmd === 'match.observe' ) {
        await this._observeMatch();
      }

    }
    catch ( err ) {
      console.log( err );
    }

    return this._main();

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

  async _createMatch( DEFAULTS ) {

    const cpu = await this._askBoolean( 'Would you like to play against a cpu? [y/n]: ' );

    return new Promise( ( resolve, reject ) => {

      // TODO: HANDLE ERRORS AND CLEANUP
      this._setupMatchHandlers( true ).then( resolve, reject );

      console.info( 'Creating new match with default configuration...' );

      const __TEST_FLEET = [ { class: 'mega lifeboat', size: 2, count: 1 } ];

      this._client.emit( 'match.create', DEFAULTS.SIZE, __TEST_FLEET, cpu, ( err, matchId ) => {
        // this._client.emit( 'match.create', DEFAULTS.SIZE, DEFAULTS.SHIPS, cpu, err => {

        if ( err ) {
          // TODO: CLEANUP
          return reject( err );
        }

        console.info( `Match (${matchId}) has been created. Please wait for opponent...` );

      } );

    } );

  }

  async _joinMatch() {

    const matchId = await this._askQuestion( 'Please enter match id to join: ' );

    return new Promise( ( resolve, reject ) => {

      this._setupMatchHandlers( true ).then( resolve, reject );

      this._client.emit( 'match.join', matchId, err => {
        if ( err ) {
          return reject( err );
        }
        console.log( 'You have joined the match. Please wait for opponent...' );
      } );

    } );

  }

  async _observeMatch() {

    const matchId = await this._askQuestion( 'Please enter match id to observe: ' );

    return new Promise( ( resolve, reject ) => {

      this._setupMatchHandlers( false ).then( resolve, reject );

      this._client.emit( 'match.observe', matchId, err => {
        if ( err ) {
          return reject( err );
        }
        console.log( 'You are observing the match. Please wait for players...' );
      } );

    } );

  }

  async _setupMatchHandlers( isPlayer ) {
    return new Promise( ( resolve, reject ) => {

      let moves = [];

      const cleanup = err => {

        this._client.removeAllListeners( 'match.move' );
        this._client.removeAllListeners( 'match.getFleetPositions' );
        this._client.removeAllListeners( 'match.getNextMove' );

        err ? reject( err ) : resolve();

      };

      this._client.once( 'match.end', result => {

        if ( !result ) {
          console.log( '[!] Match was abandoned.' );
        }

        cleanup();

      } );

      this._client.once( 'match.error', err => {
        cleanup( err );
      } );

      this._client.once( 'match.winner', winner => {
        if ( isPlayer ) {
          console.log( `[!] You ${winner ? 'won' : 'lost'}!` );
        }
        else {
          console.log( `[!] Player ${winner} won!` );
        }
      } );

      this._client.on( 'match.move', ( move, p1, p2 ) => {

        if ( isPlayer ) {
          moves.push( move );
          this._printMoves( [ move ] );
        }
        else {
          p1.name = 'Player 1';
          p2.name = 'Player 2';
          move.name = `Player ${move.player}`;
          this._printState( [ move ], p1, p2 );
        }

      } );

      if ( isPlayer ) {

        this._client.on( 'match.getFleetPositions', ( size, fleet, cb ) => {
          // TODO: READ FROM STDIN
          cb( null, BoardUtils.randomFleetPositions( size, fleet ) );
        } );

        this._client.on( 'match.getNextMove', ( num, ally, enemy, cb ) => {
          ally.name = 'Ally';
          enemy.name = 'Enemy';
          this._printState( moves, ally, enemy );
          this._getCoords( num ).then( c => cb( null, c ), cb );
        } );

      }

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

  async _askBoolean( query ) {

    const res = await this._askQuestion( query );

    if ( res === 'y' ) {
      return true;
    }

    if ( res === 'n' ) {
      return false;
    }

    return this._askBoolean( query );

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

  _printState( moves, p1, p2 ) {

    const a = BoardUtils.render( p1.board );
    const e = BoardUtils.render( p2.board );

    a.unshift( p1.name, StringUtils.repeat( '=', p1.name.length ) );
    e.unshift( p2.name, StringUtils.repeat( '=', p2.name.length ) );

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
    moves.length = 0;

    console.log();

  }

  _printMoves( moves ) {
    for ( const move of moves ) {

      const player = move.name || move.player ? 'YOU' : 'ENEMY';
      const coord = this._toCoordStr( move.coords );
      const result = move.sunken ? `SUNK ${move.sunken.class}` : move.result > 0 ? 'HIT' : 'MISSED';

      console.log( `[${move.num}] ${player} fired at ${coord} and ${result}.` );

    }
  }

};
