import { EventManager } from 'remolacha-commons';
import { Session } from './Session';

export class Connection {
    readonly events = new EventManager(this);

    private id : string;
    private session : Session;
    private closed : boolean;
    private onSessionMessageListenerId : string;

    constructor(id : string, session : Session) {
        this.id = id;
        this.session = session;
        this.closed = false;

        this.onSessionMessageListenerId = this.session.events.on('message', (emitter, message) => {
            if (message.connectionId != this.id) {
                return;
            }

            if (message.action == 'data') {
                this.events.fire('dataReceive', message.data);
            }
            else if (message.action == 'close') {
                this.closed = true;
                this.session.events.detach(this.onSessionMessageListenerId);
                this.events.fire('close');
            }
        });
    }

    send(data : any) {
        if (this.closed) {
            throw new Error(`Connection with ID "${this.id}" is not active anymore.`);
        }

        this.session.send({
            action: 'data',
            connectionId: this.id,
            data: data
        });
    }
}