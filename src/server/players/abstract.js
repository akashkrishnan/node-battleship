'use strict';

module.exports = class AbstractPlayer {

  constructor( name ) {
    this._name = name;
  }

  get name() {
    return this._name;
  }

  async getFleetPositions( size, fleet ) {
    return null;
  }

  async getNextMove( ally, enemy ) {
    return null;
  }

};
