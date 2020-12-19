import { Environment } from './Environment';
import { AppManifest } from './AppManifest';
import { Window } from './Window';

export class AppInstance {
    private id : number;
    private appManifest : AppManifest;
    private environment : Environment;
    private windows : Set<Window>;

    constructor(id : number, appManifest : AppManifest, environment : Environment) {
        this.id = id;
        this.appManifest = appManifest;
        this.environment = environment;
        this.windows = new Set<Window>();
    }

    getId() : number {
        return this.id;
    }

    getAppManifest() : AppManifest {
        return this.appManifest;
    }

    getEnvironment() : Environment {
        return this.environment;
    }

    addWindow(window : Window) {
        if (this.windows.has(window)) {
            return;
        }

        this.windows.add(window);
        // TODO: append the HTML element.
        // TODO: listen to close event, and delete them from the set.
    }

    getWindows() : Set<Window> {
        return new Set(this.windows);
    }

    async callBackend(service : string, data : Blob) : Promise<object> {
        return await this.environment.callBackend(this.appManifest.id, service, data);
    }

    async loadCSS(url : string) : Promise<void> {
        await this.environment.loadCSS(this, url);
    }

    unloadCSS(url : string) {
        this.environment.unloadCSS(this, url);
    }

    async loadJS(url : string, skipIfAlreadyLoaded : boolean) : Promise<void> {
        await this.environment.loadJS(url, skipIfAlreadyLoaded);
    }

    exit() {
        // TODO: destroy all windows.
        // TODO: emit exit event, so Environment can remove the instance from all collections and unload CSS.
    }
}
