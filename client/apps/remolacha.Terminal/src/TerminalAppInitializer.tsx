declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export default class TerminalAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) {
        const content = document.createElement('div');
        content.textContent = 'Terminal!';

        const window = new remolacha.Window({
            title: 'Terminal',
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