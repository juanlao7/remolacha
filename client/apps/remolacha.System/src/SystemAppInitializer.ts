declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export class SystemAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) : Promise<void> {
        if (!initialize) {
            // System can be initialized only once.
            return;
        }

        // Startup applications.
        // TODO: load from configuration.

        await Promise.all([
            remolacha.Environment.getInstance().openApp('remolacha.Desktop'),
            remolacha.Environment.getInstance().openApp('remolacha.Taskbar')
        ]);
    }
}