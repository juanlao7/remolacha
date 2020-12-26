export default class EventManager {
    private emitter : any;
    private listeners : Map<string, Array<(emitter : any, ...args : Array<any>) => void>>

    constructor(emitter : any) {
        this.emitter = emitter;
        this.listeners = new Map();
    }

    on(eventName : string, listener : (emitter : any, ...args : Array<any>) => void) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }

        this.listeners.get(eventName).push(listener);
    }

    fire(eventName : string, ...args : Array<any>) {
        if (!this.listeners.has(eventName)) {
            return;
        }

        for (const listener of this.listeners.get(eventName)) {
            listener(this.emitter, ...args);
        }
    }
}