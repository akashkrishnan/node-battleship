'use strict';

const BoardUtils = require( '../../utils/board' );
const AbstractPlayer = require( '../abstract' );

module.exports = class RandomPlayer extends AbstractPlayer {

  async getFleetPositions( size, fleet ) {
    return BoardUtils.randomFleetPositions( size, fleet );
  }

  async getNextMove( num, ally, enemy ) {
    return BoardUtils.randomCoordinates( enemy.board.length );
  }

};
