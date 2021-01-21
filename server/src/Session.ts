import WebSocket from 'ws';
import { EventManager } from 'remolacha-commons';
import { Connection } from './Connection';
import { Service } from './Service';
import apps from './apps';

export class Session {
    readonly events = new EventManager(this);

    private socket : WebSocket;

    constructor(socket : WebSocket) {
        this.socket = socket;
        this.socket.on('message', message => this.onMessage(message));
    }

    private onMessage(message : WebSocket.Data) {
        try {
            const messageJSON = JSON.parse(message.toString());
            
            if (messageJSON.action == 'open') {
                this.onOpenMessage(messageJSON);
            }
            else {
                this.events.fire('message', messageJSON);
            }
        }
        catch (e) {
            console.error((e as Error).message);
        }
    }

    private async onOpenMessage(message : any) {
        const connection = new Connection(message.connectionId, this);

        try {
            if (!(message.appId in apps)) {
                throw new Error(`App "${message.appId}" not found.`);
            }

            const appModule = apps[message.appId].default;

            if (!(message.service in appModule)) {
                throw new Error(`Service "${message.service}" not found on app "${message.appId}".`);
            }

            if (!('connectionId' in message)) {
                throw new Error('Undefined connection ID.');
            }

            const service : Service = appModule[message.service];
            await service(message.params, connection);
        }
        catch (e) {
            connection.fail(e.message);
            connection.close();
        }
    }

    send(message : any) {
        this.socket.send(JSON.stringify(message));
    }
}