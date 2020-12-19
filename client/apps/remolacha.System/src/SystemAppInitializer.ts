declare var remolacha : any;

export class SystemAppInitializer {
    open(appInstance : any, initialize : boolean, params : Map<string, any>) {
        if (!initialize) {
            // System can be initialized only once.
            return;
        }

        // Startup applications.
        // TODO: load from configuration.
        remolacha.Environment.getInstance().openApp('remolacha.Desktop');
        remolacha.Environment.getInstance().openApp('remolacha.Taskbar');
    }
}