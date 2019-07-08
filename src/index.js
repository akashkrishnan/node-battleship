'use strict';

const DEFAULTS = require( './server/defaults' );
const Server = require( './server' );
const TerminalPlayer = require( './client/terminal/player' );

const electron = require( 'electron' );

const PROD = process.env.NODE_ENV === 'production';

if ( require.main === module ) {
  main().catch( console.log );
}

async function main() {

  let port; // TODO: GET FROM ARGS

  port = port || process.env.PORT || DEFAULTS.PORT;

  const server = new Server();
  await server.listen( port );

  if ( electron.app ) {
    await startElectron( port );
  }
  else {
    const player = new TerminalPlayer();
    await player.connect( `http://localhost:${port}` );
  }

  process.exit( 0 );

}

async function startElectron( port ) {
  return new Promise( resolve => {

    let win;

    electron.app.on( 'ready', () => {

      win = new electron.BrowserWindow(
        {
          show: false,
          width: 1280,
          height: 720,
        },
      );

      if ( !PROD ) {
        // window.webContents.openDevTools();
      }

      win.once( 'ready-to-show', () => win.show() );

      win.on( 'close', () => {
        win = null;
        resolve();
      } );

      win.loadURL( `http://localhost:${port}` );

    } );

  } );
}
