import { EventManager } from 'remolacha-commons';
import { Backend } from './Backend';

enum BackendConnectionState {
    CREATED,
    OPEN,
    CLOSED
}

export class BackendConnection {
    readonly events = new EventManager(this);

    private connectionId : string;
    private appId : string;
    private service : string;
    private params : any;
    private onMessageListenerId : string;
    private state : number;

    constructor(connectionId : string, appId : string, service : string, params : any) {
        this.connectionId = connectionId;
        this.appId = appId;
        this.service = service;
        this.params = params;
        this.state = BackendConnectionState.CREATED;
        this.onMessageListenerId = Backend.getInstance().events.on('socketMessage', (emitter, message) => this.onBackendSocketMessage(message));
    }

    private onBackendSocketMessage(message : any) {
        if (message.connectionId == this.connectionId) {
            if (message.action == 'close') {
                this.finallyClose();
            }
            else if (message.action == 'data') {
                this.events.fire('dataReceive', message.data);
            }
        }
    }

    private finallyClose() {
        if (this.state != BackendConnectionState.OPEN) {
            return;
        }

        this.state = BackendConnectionState.CLOSED;
        this.events.fire('close');
    }

    open() {
        if (this.state != BackendConnectionState.CREATED) {
            return;
        }

        Backend.getInstance().sendMessage({
            action: 'open',
            connectionId: this.connectionId,
            appId: this.appId,
            service: this.service,
            params: this.params
        });

        this.state = BackendConnectionState.OPEN;
    }

    close() {
        if (this.state != BackendConnectionState.OPEN) {
            return;
        }

        const backend = Backend.getInstance();
        backend.events.detach(this.onMessageListenerId);

        backend.sendMessage({
            action: 'close',
            connectionId: this.connectionId
        });

        this.finallyClose();
    }

    send(data : any) {
        if (this.state != BackendConnectionState.OPEN) {
            throw new Error('Connection is not open.');
        }

        Backend.getInstance().sendMessage({
            action: 'data',
            connectionId: this.connectionId,
            data: data
        });
    }
}