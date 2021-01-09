export class DesktopAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) : Promise<void> {
        if (!initialize) {
            return;
        }

        // TODO: set a background from configuration.
        document.body.style.background = 'url("apps/remolacha.Desktop/backgrounds/4.jpg") center / cover';

        appInstance.events.on('exit', () : any => document.body.style.background = null);
    }
}