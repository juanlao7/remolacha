import psList, { ProcessDescriptor } from 'ps-list';
import fkill from 'fkill';
import { App } from '../App';
import { Connection } from '../Connection';

const PROCESSES_UPDATE_INTERVAL = 1000;

const app : App = {
    getProcesses: async (params : any, connection : Connection) => {
        let closed = false;
        connection.events.once('close', () => closed = true);

        while (!closed) {
            const processes = await psList();
            const data : any = {};

            for (const key in processes[0]) {       // We assume there is at least 1 process running.
                data[key] = [];
            }

            for (const process of processes) {
                for (const key in data) {
                    data[key].push(process[key as keyof ProcessDescriptor]);
                }
            }

            connection.send(data);
            await new Promise(resolve => setTimeout(resolve, PROCESSES_UPDATE_INTERVAL));
        }
    },

    killProcesses: async (params : any, connection : Connection) => {
        try {
            if (params == null || typeof params != 'object' || !Array.isArray(params.pids) || params.pids.some((x : any) => !Number.isInteger(x))) {
                throw new Error('Unexpected params.');
            }

            await fkill(params.pids, {force: true});
            connection.send({status: 'ok'});
        }
        catch (e) {
            connection.send({
                status: 'error',
                error: e.message
            });
        }
    }
};

export default app;
