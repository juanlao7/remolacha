import os from 'os';
import { App } from '../App';
import { Connection } from '../Connection';

const pty = require('node-pty');    // "import pty from 'node-pty';" does not work, it only imports the types, but not the library.

const app : App = {
    shell: async (params : any, connection : Connection) => {
        let columns = 80;
        let rows = 30;

        if (params != null && typeof params == 'object') {
            if (Number.isInteger(params.columns)) {
                columns = params.columns;
            }

            if (Number.isInteger(params.rows)) {
                rows = params.rows;
            }
        }

        const shell = (os.platform() == 'win32') ? 'powershell.exe' : 'bash';      // TODO: load the configured default shell.

        const term = pty.spawn(shell, [], {
            name: 'xterm-color',
            cwd: process.env.HOME,
            env: process.env,
            cols: columns,
            rows: rows
        });

        term.onData((data : string) => connection.send(data));
        term.onExit(() => connection.close());

        const onDataReceiveListenerId = connection.events.on('dataReceive', (emitter, data) => {
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

        connection.events.once('close', () => {
            connection.events.detach(onDataReceiveListenerId);
            term.kill();
        });
    }
};

export default app;
