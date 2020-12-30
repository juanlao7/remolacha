import React from 'react';
import ReactDOM from 'react-dom';
import Taskbar from './Taskbar';

require('./assets/sass/index.sass');

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export default class TaskbarAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) : Promise<void> {
        if (!initialize) {
            return;
        }

        const content = document.createElement('div');

        await Promise.all([
            appInstance.loadCSS('apps/remolacha.Taskbar/bundle.css'),
            appInstance.addWindow(new remolacha.Window({
                title: 'Taskbar',
                content: content,
                showInTaskbar: false,
                showFrame: false,
                preventGoingOutOfWindow: false,
                x: 0,
                y: null,
                xRight: 0,
                yBottom: 0,
                focusable: false,
                alwaysOnTop: true
            }))
        ]);

        ReactDOM.render(<Taskbar />, content);
    }
}