'use strict';

const { randomBool } = require( '../utils' );
const Board = require( './board' );
const events = require( 'events' );

module.exports = class Match extends events.EventEmitter {

  constructor( size, ships, players ) {
    super();
    this._running = false;
    this._size = size;
    this._ships = ships;
    this._players = players;
    this._observers = [];
    this._history = [];
  }

  get running() {
    return this._running;
  }

  get players() {
    return this._players;
  }

  get observers() {
    return this._observers;
  }

  get history() {
    return this._history;
  }

  get boards() {
    return this._boards;
  }

  async addPlayer( player ) {

    if ( this._players.length >= 2 ) {
      throw new Error( 'Match is full.' );
    }

    if ( this._players[ 0 ] === player ) {
      return new Error( 'Already observing match.' );
    }

    this._players.push( player );

    this._start().catch( err => {
      this.emit( 'error', err );
    } );

  }

  async addObserver( observer ) {

    // TODO: MAKE SURE OBSERVER NOT IN PLAYERS LIST

    if ( this._observers[ 0 ] === observer ) {
      return new Error( 'Already joined match.' );
    }

    this._observers.push( observer );

  }

  async _start() {

    if ( this._running ) {
      throw Error( 'Match is already in progress.' );
    }

    this._running = true;

    // Get fleet positions and initialize boards
    const boards = this._boards = await Promise.all(
      this._players.map( async player => {

        const fleet = __generateFleet( this._ships );

        // TODO: VALIDATE POSITIONS FORMAT
        const positions = await player.getFleetPositions( this._size, fleet );

        // Assign fleet positions
        positions.forEach( ( pos, i ) => fleet[ i ].position = pos );

        return new Board( this._size, fleet );

      } ),
    );

    // TODO: LET PLAYERS DECIDE STRATEGY TO DETERMINE WHO GOES FIRST
    let winner = null;

    for ( let turn = randomBool(); this._running && !winner; turn = +!turn ) {

      // Get current players
      const player = this._players[ turn ];
      const ally = boards[ turn ];

      // Enemy's board
      const enemy = boards[ +!turn ];

      // Keep making moves until there is a miss
      // TODO: SET A LIMIT ON NUMBER OF 0s
      for ( let result = 0; result >= 0; ) {

        const num = this._history.length + 1;
        const coords = await player.getNextMove( num, ally.getAllyView(), enemy.getEnemyView() ) || [];

        let sunken;
        [ result, sunken ] = enemy.attack( ...coords );

        if ( result ) {

          const move = { player, coords, result, sunken };
          this._history.push( move );
          this.emit( 'move', { num, ...move } );

          // Check for winner
          if ( enemy.empty ) {
            winner = player;
            this.emit( 'winner', winner );
            break;
          }

        }

      }

    }

    this._running = false;

    this.emit( 'end', !!winner );

  }

  async stop() {

    if ( !this._running ) {
      throw Error( 'Match hasn\'t started yet.' );
    }

    this._running = false;

  }

};

function __generateFleet( ships ) {

  const fleet = [];

  for ( const ship of ships ) {
    for ( let i = 0, n = ship.count; i < n; ++i ) {
      fleet.push(
        {
          class: ship.class,
          size: ship.size,
          hits: 0,
        },
      );
    }
  }

  return fleet;

}
