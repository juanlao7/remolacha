export default class DesktopAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) {
        if (!initialize) {
            return;
        }

        // TODO: set a background from configuration.
        document.body.style.background = 'url("apps/remolacha.Desktop/backgrounds/4.jpg") center / cover';
    }
}