'use strict';

import SocketIO from 'socket.io-client';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app.jsx';
import Player from './player.jsx';

let DEFAULTS;
let inMatch = false;

console.info( 'Connecting to server...' );


// TODO: CREATE WRAPPER
// TODO: IMPROVE ERROR LOGGING WITH BETTER STACK TRACES
const client = SocketIO();

// NOTE: This is called when reconnected too
client.on( 'connect', () => {

  console.info( 'Connected to server.' );

  client.emit( 'DEFAULTS', ( err, defaults ) => {

    console.info( 'Received defaults from server.' );

    DEFAULTS = defaults;

    if ( !inMatch ) {
      newMatch( client );
    }

  } );

} );

// TODO: FIGURE OUT HOW TO DEAL WITH DISCONNECT/RECONNECT

function newMatch( client ) {

  inMatch = true;

  const player = new Player(
    client,
    ( size, fleet, cb ) => {

      console.log( size, fleet );

      // TODO: RANDOMIZE
      const positions = fleet.map( ( ship, i ) => [ [ i, 0 ], [ i, ship.size ] ] );

      cb( null, positions );

    },
    ( num, ally, enemy, cb ) => {

      console.log( board );
      console.log( fleet );

    },
  );

  client.on( 'match.error', err => {
    console.warn( '[SERVER]', err );
  } );

  client.once( 'match.end', winner => {
    console.info( 'winner:', winner );
    player.dispose();
  } );

  console.info( 'Creating new default match...' );

  client.emit( 'match.create', DEFAULTS.SIZE, DEFAULTS.SHIPS, () => {
    console.log( 'Match has been created.' );
  } );

}

ReactDOM.render( <App name='Akash'/>, document.getElementById( 'root' ) );
