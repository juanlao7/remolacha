import express from 'express';
import WebSocket from 'ws';
import errorhandler from 'errorhandler';
import { ArgumentParser } from 'argparse';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { Session } from './Session';

// Exiting if there is an uncaught exception or an unhandled promise rejection.

process.on('uncaughtException', e => {
    console.error(e);
    console.log('Uncaught exception, exiting...');
    process.exit();
});

process.on('unhandledRejection', e => {
    console.error(e);
    console.log('Unhandled promise rejection, exiting...');
    process.exit();
});

// Argument parsing.

const parser = new ArgumentParser({description: 'Remolacha server components'});

parser.add_argument('--port', {help: 'Port to use. 3000 by default.', default: 3000});

const args = parser.parse_args();

// Start.

const app = express();
app.use(errorhandler());
app.use(express.static(__dirname + '/public'));

app.use((request, response, next) => {
    const err : any = new Error(`Not found (${request.url})`);
    err.status = 404;
    next(err);
});

app.use((err : any, request : any, response : any) => {
    console.log(err.stack);
    response.status(('status' in err) ? err.status : 500);
    response.type('txt');
    response.send(err.message);
});

const server : Server = app.listen(args.port, () => console.log('Listening on port ' + (server.address() as AddressInfo).port));
const wsServer = new WebSocket.Server({noServer: true});

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        // TODO: check CORS.
        new Session(socket);
    });
});

// Handling signals sent to this process.

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown);

function gracefulShutdown(signal : any) {
    console.log(`Received signal "${signal}".`);
    console.log('Closing HTTP server...');

    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
}
