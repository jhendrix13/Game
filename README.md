#Game [work in progress]
This game is a work in progress. This repository hosts the source code for the client of the game, but excludes the server-sided source code.

Most of the interesting source code for the game client resides in the *game/client_modules* directory.

#Game Server
The game server runs off of Node.JS [ https://nodejs.org/en/ ]. Several node modules are used, including Socket.IO for server-client communication [ http://socket.io/ ] and the MySQL module [ https://www.npmjs.com/package/mysql ].
The database is MySQL.

#Game Client
The game utilizes HTML5 and specifically HTML5's standard canvas functions to create the game client.
The Socket.IO engine for server-client communication.