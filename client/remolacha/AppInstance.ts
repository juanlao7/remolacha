import { Environment } from './Environment';
import { AppManifest } from './AppManifest';
import { Window } from './Window';

export class AppInstance {
    private id : number;
    private appManifest : AppManifest;
    private windows : Set<Window>;

    constructor(id : number, appManifest : AppManifest) {
        this.id = id;
        this.appManifest = appManifest;
        this.windows = new Set<Window>();
    }

    getId() : number {
        return this.id;
    }

    getAppManifest() : AppManifest {
        return this.appManifest;
    }

    addWindow(window : Window) {
        if (this.windows.has(window)) {
            return;
        }

        this.windows.add(window);
        Environment.getInstance().addWindow(window);
        // TODO: listen to close event, and delete them from the set.
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
        // TODO: emit exit event, so Environment can remove the instance from all collections and unload CSS.
    }
}
