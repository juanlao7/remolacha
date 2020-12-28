import Environment from './Environment';
import AppManifest from './AppManifest';
import Window from './Window';
import EventManager from './EventManager';

export default class AppInstance {
    readonly events = new EventManager(this);

    private id : number;
    private appManifest : AppManifest;
    private windows : Set<Window>;

    constructor(id : number, appManifest : AppManifest) {
        this.id = id;
        this.appManifest = appManifest;
        this.windows = new Set<Window>();
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

    async callBackend(service : string, data : Blob) : Promise<object> {
        return await Environment.getInstance().callBackend(this.appManifest.id, service, data);
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
        // TODO: destroy all windows.
        this.events.fire('exit');
    }
}
