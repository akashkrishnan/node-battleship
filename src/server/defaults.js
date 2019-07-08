'use strict';

const PORT = 80;
const SIZE = 10;
const SHIPS = [
  {
    class: 'Aircraft Carrier',
    size: 5,
    count: 1,
  },
  {
    class: 'Battleship',
    size: 4,
    count: 1,
  },
  {
    class: 'Cruiser',
    size: 3,
    count: 1,
  },
  {
    class: 'Submarine',
    size: 3,
    count: 1,
  },
  {
    class: 'Destroyer',
    size: 2,
    count: 1,
  },
];

module.exports = {
  PORT,
  SIZE,
  SHIPS,
};
