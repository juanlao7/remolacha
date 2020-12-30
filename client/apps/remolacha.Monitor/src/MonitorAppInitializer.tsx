import React from 'react';
import ReactDOM from 'react-dom';
import Monitor from './Monitor';

require('./assets/sass/index.sass');

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export default class MonitorAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) : Promise<void> {
        if (!initialize) {
            Array.from<any>(appInstance.getWindows())[0].requestFocus();
            return;
        }
        
        const content = document.createElement('div');
        content.className = 'remolacha_app_Monitor';

        const window = new remolacha.Window({
            title: 'Monitor',
            content: content,
            icon: {
                type: 'material-icon',
                id: 'query_stats'
            },
            width: 481,
            height: 645
        });

        window.events.on('destroy', () => appInstance.exit());

        await Promise.all([
            appInstance.loadCSS('apps/remolacha.Monitor/bundle.css'),
            appInstance.addWindow(window)
        ]);

        ReactDOM.render(<Monitor window={window} />, content);
    }
}