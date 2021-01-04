import React from 'react';
import ReactDOM from 'react-dom';
import AppManifest from './AppManifest';
import AppInstance from './AppInstance';
import AppInitializer from './AppInitializer';
import Window from './Window';
import AppNotFoundError from './AppNotFoundError';
import MaxInstancesReachedError from './MaxInstancesReachedError';
import UndefinedAppInitializerError from './UndefinedAppInitializerError';
import manifestsJSON from '../apps/manifests.json';
import EventManager from './EventManager';
import theme from './theme';
import { ThemeProvider } from '@material-ui/core';

interface EnvironmentComponentProps {
}

interface EnvironmentComponentState {
    windows? : Array<Window>;
}

class EnvironmentComponent extends React.Component<EnvironmentComponentProps, EnvironmentComponentState> {
    // TODO: be responsive to changes in alwaysOnTop.

    private windowsByZIndex : Array<Window>;
    private lastFocusedWindow : Window;

    constructor(props : EnvironmentComponentProps) {
        super(props);
        this.windowsByZIndex = [];
        this.lastFocusedWindow = null;
        
        this.state = {
            windows: []
        }
    }

    private removeWindowImpl(array : Array<Window>, window : Window) : number {
        const index = array.indexOf(window);

        if (index < 0) {
            return -1;
        }

        array.splice(index, 1);
        return index;
    }

    private insertWindowInZIndexArray(window : Window, atFront : boolean) : number {
        const alwaysOnTop = window.getState().alwaysOnTop;
        let index = this.windowsByZIndex.length;

        if (!alwaysOnTop) {
            // Skip all existing alwaysOnTop windows.
            
            while (index > 0 && this.windowsByZIndex[index - 1].getState().alwaysOnTop) {
                --index;
            }
        }

        if (atFront) {
            this.windowsByZIndex.splice(index, 0, window);
            return index;
        }

        // Now we must insert the window at back of its "kind" (alwaysOnTop or normal).

        if (!alwaysOnTop) {
            // If it is a normal window, we simply insert it at index 0.
            this.windowsByZIndex.splice(0, 0, window);
            return 0;
        }

        // If it is an alwaysOnTop window, then we must insert it after the last normal window, skipping all existing alwaysOnTop windows.

        while (index > 0 && this.windowsByZIndex[index - 1].getState().alwaysOnTop) {
            --index;
        }

        this.windowsByZIndex.splice(index, 0, window);
        return index;
    }

    private fixZIndexes(fromIndex : number) {
        if (fromIndex < 0) {
            return;
        }
        
        for (let i = fromIndex; i < this.windowsByZIndex.length; ++i) {
            this.windowsByZIndex[i].setState({zIndex: i});
        }
    }

    private setFocused(window : Window) {
        if (this.lastFocusedWindow != null) {
            this.lastFocusedWindow.setState({focused: false});
        }

        this.lastFocusedWindow = window;
        window.setState({focused: true});
    }

    addWindow(window : Window, callback : () => void) {
        if (this.state.windows.indexOf(window) >= 0) {
            return;
        }

        this.state.windows.push(window);
        const index = this.insertWindowInZIndexArray(window, true);
        this.fixZIndexes(index);
        this.setFocused(window);

        this.setState({windows: this.state.windows}, callback);
    }

    removeWindow(window : Window) {
        this.blurWindow(window);
        this.removeWindowImpl(this.state.windows, window);
        const index = this.removeWindowImpl(this.windowsByZIndex, window);
        this.fixZIndexes(index);

        this.setState({windows : this.state.windows});
    }

    focusWindow(window : Window) {
        const index = this.removeWindowImpl(this.windowsByZIndex, window);
        this.insertWindowInZIndexArray(window, true);
        this.fixZIndexes(index);
        this.setFocused(window);
    }

    blurWindow(window : Window) {
        if (window != this.lastFocusedWindow) {
            return;
        }

        window.setState({focused: false});

        for (let i = this.windowsByZIndex.length - 1; i >= 0; --i) {
            if (this.windowsByZIndex[i] == window) {
                continue;
            }

            const iWindowState = this.windowsByZIndex[i].getState();

            if (iWindowState.focusable && !iWindowState.minimized) {
                this.setFocused(this.windowsByZIndex[i]);
                this.lastFocusedWindow = this.windowsByZIndex[i];
                return;
            }
        }

        this.lastFocusedWindow = null;
    }

    render() {
        return (
            <ThemeProvider theme={theme}>
                <div className="remolacha_Environment">
                    {this.state.windows.map(x => x.getJSXElement())}
                </div>
            </ThemeProvider>
        );
    }
}

export default class Environment {
    static readonly MAX_APP_INSTANCES = Number.MAX_SAFE_INTEGER;

    readonly events = new EventManager(this);

    private static instance : Environment = null;

    private installedAppManifests : Map<string, AppManifest>;
    private appInstances : Map<number, AppInstance>;
    private appInstancesByAppId : Map<string, Set<AppInstance>>;
    private lastInstanceId : number;
    private appInitializers : Map<string, AppInitializer>;
    private loadedCSS : Map<string, [HTMLElement, Set<AppInstance>]>;
    private loadedJS : Set<string>;
    private environmentComponent : EnvironmentComponent;

    private constructor() {
        this.installedAppManifests = new Map<string, AppManifest>(manifestsJSON.map(x => [x.id, x]));
        this.appInstances = new Map<number, AppInstance>();
        this.appInstancesByAppId = new Map<string, Set<AppInstance>>();
        this.lastInstanceId = 0;
        this.appInitializers = new Map<string, AppInitializer>();
        this.loadedCSS = new Map<string, [HTMLElement, Set<AppInstance>]>();
        this.loadedJS = new Set<string>();

        ReactDOM.render(<EnvironmentComponent ref={x => this.environmentComponent = x} />, document.body);
    }

    static getInstance() : Environment {
        if (Environment.instance == null) {
            Environment.instance = new Environment();
        }

        return Environment.instance;
    }

    private onAppInstanceExit(appInstance : AppInstance) {
        this.unloadAllCSS(appInstance);
        const appId = appInstance.getAppManifest().id;

        if (!this.appInstancesByAppId.has(appId)) {
            return;
        }

        const instances = this.appInstancesByAppId.get(appId);
        instances.delete(appInstance);

        if (instances.size == 0) {
            this.appInstancesByAppId.delete(appId);
        }

        this.appInstances.delete(appInstance.getId());
        this.events.fire('appInstanceExit', appInstance);
    }

    private onWindowDestroy(window : Window) {
        this.removeWindow(window);
    }

    private onWindowFocusRequest(window : Window) {
        this.environmentComponent.focusWindow(window);
    }

    private onWindowBlurRequest(window : Window) {
        this.environmentComponent.blurWindow(window);
    }

    async addWindow(window : Window) : Promise<void> {
        await new Promise(resolve => {
            this.environmentComponent.addWindow(window, () => {
                window.events.on('destroy', emitter => this.onWindowDestroy(emitter));
                window.events.on('focusRequest', emitter => this.onWindowFocusRequest(emitter));
                window.events.on('blurRequest', emitter => this.onWindowBlurRequest(emitter));
                this.events.fire('windowAdd', window);
                resolve(undefined);
            });
        });
    }

    removeWindow(window : Window) {
        this.environmentComponent.removeWindow(window);
        this.events.fire('windowRemove', window);
    }

    getInstalledApps() : Array<AppManifest> {
        return Array.from(this.installedAppManifests.values());
    }

    private async openAppImpl(appManifest : AppManifest, appInstance : AppInstance, initialize : boolean, params : Map<string, any>) {
        await this.appInitializers.get(appManifest.id).open(appInstance, initialize, params);
        this.events.fire('appInstanceOpen', appInstance);
    }

    async openApp(appId : string, params : Map<string, any> = new Map<string, any>()) : Promise<AppInstance> {
        if (!this.installedAppManifests.has(appId)) {
            throw new AppNotFoundError(appId);
        }

        const appManifest : AppManifest = this.installedAppManifests.get(appId);

        if (appManifest.isSingleton && this.appInstancesByAppId.has(appManifest.id)) {
            // It is a singleton and an instance already exists.
            const appInstance : AppInstance = this.appInstancesByAppId.get(appManifest.id).values().next().value;
            await this.openAppImpl(appManifest, appInstance, false, params);
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
            throw new MaxInstancesReachedError('app', Environment.MAX_APP_INSTANCES);
        }
        
        this.lastInstanceId = appInstanceId;
        const appInstance : AppInstance = new AppInstance(appInstanceId, appManifest);
        this.appInstances.set(appInstanceId, appInstance);

        if (!this.appInstancesByAppId.has(appManifest.id)) {
            this.appInstancesByAppId.set(appManifest.id, new Set<AppInstance>());
        }

        this.appInstancesByAppId.get(appManifest.id).add(appInstance);
        appInstance.events.on('exit', emitter => this.onAppInstanceExit(emitter));
        
        if (!this.appInitializers.has(appManifest.id)) {
            await this.loadJS(`apps/${appId}/boot.js`);
        }

        if (!this.appInitializers.has(appManifest.id)) {
            throw new UndefinedAppInitializerError(appManifest.id);
        }

        this.events.fire('appInstanceCreate', appInstance);
        await this.openAppImpl(appManifest, appInstance, true, params);
        return appInstance;
    }

    getRunningAppInstances() : Array<AppInstance> {
        return Array.from(this.appInstances.values());
    }

    setAppInitializer(appId : string, appInitializer : AppInitializer) {
        this.appInitializers.set(appId, appInitializer);
    }

    async callBackend(appId : string, service : string, init : RequestInit = null) : Promise<Response> {
        return await fetch(`apps/${appId}/${service}`, init);
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

        await new Promise(resolve => {
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

    unloadAllCSS(appInstance : AppInstance) {
        for (const url of this.loadedCSS.keys()) {
            this.unloadCSS(appInstance, url);
        }
    }

    async loadJS(url : string, skipIfAlreadyLoaded : boolean = true) : Promise<void> {
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
