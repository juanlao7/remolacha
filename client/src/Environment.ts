import { AppManifest } from './AppManifest';
import { AppInstance } from './AppInstance';
import { AppInitializer } from './AppInitializer';
import { AppNotFoundError } from './AppNotFoundError';
import { MaxAppInstancesReachedError } from './MaxAppInstancesReachedError';
import { UndefinedAppInitializerError } from './UndefinedAppInitializerError';

export class Environment {
    static readonly MAX_APP_INSTANCES = Number.MAX_SAFE_INTEGER;

    private installedAppManifests : Map<string, AppManifest>;
    private appInstances : Map<number, AppInstance>;
    private appInstancesByAppId : Map<string, Set<AppInstance>>;
    private lastInstanceId : number;
    private appInitializers : Map<string, AppInitializer>;
    private loadedCSS : Map<string, [HTMLElement, Set<AppInstance>]>;
    private loadedJS : Set<string>;

    constructor() {
        this.installedAppManifests = new Map<string, AppManifest>();
        this.appInstances = new Map<number, AppInstance>();
        this.appInstancesByAppId = new Map<string, Set<AppInstance>>();
        this.lastInstanceId = 0;
        this.appInitializers = new Map<string, AppInitializer>();
        this.loadedCSS = new Map<string, [HTMLElement, Set<AppInstance>]>();
        this.loadedJS = new Set<string>();

        this.loadInstalledAppManifests();
    }

    private loadInstalledAppManifests() {
        // TODO
    }

    getInstalledApps() : Array<AppManifest> {
        return Array.from(this.installedAppManifests.values());
    }

    async openApp(appId : string, params : Map<string, any>) : Promise<AppInstance> {
        if (!this.installedAppManifests.has(appId)) {
            throw new AppNotFoundError(appId);
        }

        const appManifest : AppManifest = this.installedAppManifests.get(appId);

        if (appManifest.isSingleton && this.appInstancesByAppId.has(appManifest.id)) {
            // It is a singleton and an instance already exists.
            const appInstance : AppInstance = this.appInstancesByAppId.get(appManifest.id).values().next().value;
            this.appInitializers.get(appManifest.id).open(appInstance, false, params);
            return appInstance;
        }

        let appInstanceId = this.lastInstanceId + 1;

        while (this.appInstances.has(appInstanceId) && appInstanceId != this.lastInstanceId) {
            ++appInstanceId;

            if (appInstanceId >= Environment.MAX_APP_INSTANCES) {
                appInstanceId = 0;
            }
        }

        if (appInstanceId == this.lastInstanceId) {
            throw new MaxAppInstancesReachedError();
        }
        
        const appInstance : AppInstance = new AppInstance(appInstanceId, appManifest, this);
        this.appInstances.set(appInstanceId, appInstance);

        if (!this.appInstancesByAppId.has(appManifest.id)) {
            this.appInstancesByAppId.set(appManifest.id, new Set<AppInstance>());
        }

        this.appInstancesByAppId.get(appManifest.id).add(appInstance);
        // TODO: listen to exit event, to remove all references and unload CSS
        
        if (!this.appInitializers.has(appManifest.id)) {
            // TODO: run app's boot.js with await
        }

        if (!this.appInitializers.has(appManifest.id)) {
            throw new UndefinedAppInitializerError(appManifest.id);
        }

        this.appInitializers.get(appManifest.id).open(appInstance, true, params);
        return appInstance;
    }

    getRunningAppInstances() : Array<AppInstance> {
        return Array.from(this.appInstances.values());
    }

    setAppInitializer(appId : string, appInitializer : AppInitializer) {
        this.appInitializers.set(appId, appInitializer);
    }

    async callBackend(appId : string, service : string, data : Blob) : Promise<any> {
        // TODO
        return {};
    }

    async loadCSS(appInstance : AppInstance, url : string) : Promise<void> {
        if (this.loadedCSS.has(url)) {
            this.loadedCSS.get(url)[1].add(appInstance);
            return;
        }

        const styleElement = document.createElement('style');
        this.loadedCSS.set(url, [styleElement, new Set<AppInstance>([appInstance])]);

        // Approach to detect "load" event inspired on https://www.phpied.com/when-is-a-stylesheet-really-loaded/
        styleElement.textContent = `@import "${url}"`;

        await new Promise((resolve) => {
            const interval = setInterval(() => {
                try {
                    styleElement.sheet.cssRules;
                    clearInterval(interval);
                    resolve(undefined);
                }
                catch {
                    // cssRules is not available yet.
                }
            }, 1);

            document.body.appendChild(styleElement);
        });
    }

    unloadCSS(appInstance : AppInstance, url : string) {
        if (!this.loadedCSS.has(url)) {
            return;
        }

        const tuple = this.loadedCSS.get(url);
        tuple[1].delete(appInstance);

        if (tuple[1].size == 0) {
            tuple[0].remove();
            this.loadedCSS.delete(url);
        }
    }

    async loadJS(url : string, skipIfAlreadyLoaded : boolean) : Promise<void> {
        if (skipIfAlreadyLoaded && this.loadedJS.has(url)) {
            return;
        }

        this.loadedJS.add(url);
        const scriptElement = document.createElement('script');
        scriptElement.type = 'application/javascript';
        scriptElement.async = true;
        scriptElement.src = url;

        await new Promise((resolve, reject) => {
            scriptElement.addEventListener('load', resolve, {once: true});
            scriptElement.addEventListener('error', reject, {once: true});
            document.body.appendChild(scriptElement);
        });
    }
}
