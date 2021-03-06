import { EventManager } from 'remolacha-commons';
import { Environment } from './Environment';
import { AppManifest } from './AppManifest';
import { Window } from './Window';
import { PermissionDeniedError } from './PermissionDeniedError';
import { Backend } from './Backend';
import { BackendConnection } from './BackendConnection';

export class AppInstance {
    private static readonly FIRST_INSTANCE_ID = 1;

    readonly events = new EventManager(this);

    private id : number;
    private appManifest : AppManifest;
    private windows : Set<Window>;
    private exiting : boolean;
    private running : boolean;
    private connections : Set<BackendConnection>;

    constructor(id : number, appManifest : AppManifest) {
        this.id = id;
        this.appManifest = appManifest;
        this.windows = new Set<Window>();
        this.exiting = false;
        this.running = true;
        this.connections = new Set();
    }

    private onWindowDestroy(window : Window) {
        this.windows.delete(window);
    }

    getId() : number {
        return this.id;
    }

    getAppManifest() : AppManifest {
        return this.appManifest;
    }

    async addWindow(window : Window) : Promise<void> {
        if (this.windows.has(window)) {
            return;
        }

        this.windows.add(window);
        window.events.on('destroy', emitter => this.onWindowDestroy(emitter));
        await Environment.getInstance().addWindow(window);
    }

    getWindows() : Set<Window> {
        return new Set(this.windows);
    }

    createBackendConnection(service : string, params : any) : BackendConnection {
        const connection = Backend.getInstance().createConnection(this.appManifest.id, service, params);
        this.connections.add(connection);
        return connection;
    }

    callBackend(service : string, params : any) : Promise<any> {
        return new Promise((resolve, reject) => {
            const connection = this.createBackendConnection(service, params);
            
            connection.events.once('data', (emitter, data) => {
                resolve(data);
                connection.close();
            });

            connection.events.once('error', (emitter, error) => {
                reject(new Error(error));
                connection.close();
            });

            connection.events.once('close', () => resolve(null));
            connection.open();
        });
    }

    async loadCSS(url : string) : Promise<void> {
        await Environment.getInstance().loadCSS(this, url);
    }

    unloadCSS(url : string) {
        Environment.getInstance().unloadCSS(this, url);
    }

    async loadJS(url : string, skipIfAlreadyLoaded : boolean = true) : Promise<void> {
        await Environment.getInstance().loadJS(url, skipIfAlreadyLoaded);
    }

    exit() {
        if (this.id == AppInstance.FIRST_INSTANCE_ID) {
            throw new PermissionDeniedError(`It is not permitted to kill the app instance with ID ${AppInstance.FIRST_INSTANCE_ID}.`);
        }

        if (this.exiting) {
            // To prevent calling this method again on window destroy.
            return;
        }

        this.exiting = true;

        for (const connection of this.connections) {
            connection.close();
        }

        for (const window of this.windows) {
            window.destroy();
        }

        this.running = false;
        this.events.fire('exit');
    }

    isRunning() : boolean {
        return this.running;
    }
}
