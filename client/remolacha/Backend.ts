import { EventManager } from 'remolacha-commons';
import { BackendConnection } from './BackendConnection';

export class Backend {
    private static instance : Backend = null;

    readonly events = new EventManager(this);

    private socket : WebSocket;
    private pendingMessages : Array<object>;
    private nextConnectionId : bigint;

    constructor() {
        this.socket = null;
        this.pendingMessages = [];
        this.nextConnectionId = BigInt(0);
        this.connectSocket();
    }

    static getInstance() : Backend {
        if (Backend.instance == null) {
            Backend.instance = new Backend();
        }

        return Backend.instance;
    }

    private connectSocket() {
        const socket = new WebSocket(`ws://${window.location.host}`);

        socket.addEventListener('close', e => {
            this.socket = null;
            console.error(`Connection closed. ${e.reason}`);
            this.connectSocket();
        });

        socket.addEventListener('open', () => {
            this.socket = socket;
            
            for (const message of this.pendingMessages) {
                this.sendMessage(message);
            }

            this.pendingMessages = [];
        });

        socket.addEventListener('error', e => console.error('Unexpected error on WebSocket connection.', e));

        socket.addEventListener('message', e => {
            const messageJSON = JSON.parse(e.data);
            this.events.fire('socketMessage', messageJSON);
        });
    }

    sendMessage(message : object) {
        if (this.socket == null) {
            this.pendingMessages.push(message);
        }
        else {
            // There is no way in the WebSockets API to check if the message was successfully sent. WTF!
            this.socket.send(JSON.stringify(message));
        }
    }

    createConnection(appId : string, service : string, params : any) : BackendConnection {
        const connection = new BackendConnection(this.nextConnectionId.toString(), appId, service, params);
        ++this.nextConnectionId;
        return connection;
    }
}
