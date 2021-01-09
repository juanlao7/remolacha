export class EventManager {
    private emitter : any;
    private idsByEventName : Map<string, Set<string>>;
    private listenersById : Map<string, (emitter : any, ...args : Array<any>) => void>;
    private nextId : bigint;

    constructor(emitter : any) {
        this.emitter = emitter;
        this.idsByEventName = new Map();
        this.listenersById = new Map();
        this.nextId = BigInt(0);
    }

    on(eventName : string, listener : (emitter : any, ...args : Array<any>) => void) : string {
        if (!this.idsByEventName.has(eventName)) {
            this.idsByEventName.set(eventName, new Set());
        }

        const id = this.nextId.toString();
        ++this.nextId;

        this.listenersById.set(id, listener);
        this.idsByEventName.get(eventName).add(id);
        return id;
    }

    once(eventName : string, listener : (emitter : any, ...args : Array<any>) => void) : string {
        const id = this.on(eventName, (emitter : any, ...args : Array<any>) => {
            listener(emitter, ...args);
            this.detach(id);
        });

        return id;
    }

    detach(id : string) {
        this.idsByEventName.forEach(ids => ids.delete(id));
        this.listenersById.delete(id);
    }

    fire(eventName : string, ...args : Array<any>) {
        if (!this.idsByEventName.has(eventName)) {
            return;
        }

        for (const id of this.idsByEventName.get(eventName)) {
            const listener = this.listenersById.get(id);
            listener(this.emitter, ...args);
        }
    }
}