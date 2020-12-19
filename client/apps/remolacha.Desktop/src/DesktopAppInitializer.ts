export class DesktopAppInitializer {
    open(appInstance : any, initialize : boolean, params : Map<string, any>) {
        if (!initialize) {
            return;
        }

        // TODO: set a background from configuration.
        document.body.style.background = '#FFE5F0';
    }
}