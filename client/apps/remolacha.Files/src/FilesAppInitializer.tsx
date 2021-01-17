import React from 'react';
import ReactDOM from 'react-dom';
import { Files } from './Files';

require('./assets/sass/index.sass');

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export class FilesAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) : Promise<void> {
        const content = document.createElement('div');
        content.className = 'remolacha_app_Files';

        const window = new remolacha.Window({
            title: 'Files',
            content: content,
            icon: {
                type: 'material-icon',
                id: 'folder'
            },
            width: 640,
            height: 480,
            className: 'remolacha_app_Files_window'
        });

        window.events.on('destroy', () => appInstance.exit());

        await Promise.all([
            appInstance.loadCSS('apps/remolacha.Files/bundle.css'),
            appInstance.addWindow(window)
        ]);

        ReactDOM.render(<Files appInstance={appInstance} window={window} />, content);
    }
}