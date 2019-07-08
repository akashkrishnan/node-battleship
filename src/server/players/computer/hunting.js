'use strict';

const { randomInt } = require( '../../utils' );
const { randomFleetPositions } = require( '../../utils/board' );
const AbstractPlayer = require( '../abstract' );

module.exports = class HuntingPlayer extends AbstractPlayer {

  async getFleetPositions( size, fleet ) {
    return randomFleetPositions( size, fleet );
  }

  async getNextMove( num, ally, enemy ) {
    let i = randomInt( 0, enemy.board.length );
    let j = randomInt( 0, enemy.board[ i ].length );
    return [ i, j ];
  }

};
