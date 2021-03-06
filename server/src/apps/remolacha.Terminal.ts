import fkill from 'fkill';
import os from 'os';
import { TypeTools } from 'remolacha-commons';
import { App } from '../App';
import { Connection } from '../Connection';

const pty = require('node-pty');    // "import pty from 'node-pty';" does not work, it only imports the types, but not the library.

const app : App = {
    openShell: async (params : any, connection : Connection) => {
        let columns = 80;
        let rows = 30;
        let cwd : string = null;

        if (params != null && typeof params == 'object') {
            if (Number.isInteger(params.columns)) {
                columns = params.columns;
            }

            if (Number.isInteger(params.rows)) {
                rows = params.rows;
            }

            if (TypeTools.isString(params.cwd)) {
                cwd = params.cwd;
            }
        }

        const shell = (os.platform() == 'win32') ? 'powershell.exe' : 'bash';      // TODO: load the configured default shell.

        const term = pty.spawn(shell, [], {
            name: 'xterm-color',
            cwd: (cwd == null) ? os.homedir() : cwd,
            env: process.env,
            cols: columns,
            rows: rows
        });

        term.onData((data : string) => connection.send(data));

        const onConnectionDataListenerId = connection.events.on('data', (emitter, data) => {
            if (typeof data != 'object') {
                return;
            }

            if (data.type == 'size') {
                let columns = (Number.isInteger(data.columns)) ? data.columns : term.cols;
                let rows = (Number.isInteger(data.rows)) ? data.rows : term.rows;
                term.resize(columns, rows);
            }
            else if (data.type == 'content') {
                term.write(data.content);
            }
        });

        const onConnectionCloseListenerId = connection.events.once('close', () => {
            connection.events.detach(onConnectionDataListenerId);
            fkill(term.pid, {'force': true, 'tree': true});         // term.kill() makes node freeze on Windows.
        });

        term.onExit(() => {
            connection.events.detach(onConnectionCloseListenerId);
            connection.close();
        });
    }
};

export default app;
