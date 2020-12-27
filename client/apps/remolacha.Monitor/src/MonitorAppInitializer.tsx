declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export default class MonitorAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) {
        if (!initialize) {
            return;
        }
        
        const content = document.createElement('div');
        content.textContent = 'Monitor!';

        const window = new remolacha.Window({
            title: 'Monitor',
            content: content,
            icon: {
                type: 'material-icon',
                id: 'query_stats'
            }
        });

        window.events.on('destroy', () => appInstance.exit());
        appInstance.addWindow(window);
    }
}