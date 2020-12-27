import React from 'react';
import ReactDOM from 'react-dom';
import Taskbar from './Taskbar';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export default class TaskbarAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) {
        if (!initialize) {
            return;
        }

        await appInstance.loadCSS('apps/remolacha.Taskbar/bundle.css');

        const content = document.createElement('div');
        ReactDOM.render(<Taskbar />, content);

        appInstance.addWindow(new remolacha.Window({
            title: 'Taskbar',
            content: content,
            showInTaskbar: false,
            showFrame: false,
            preventGoingOutOfWindow: false,
            x: 0,
            y: null,
            xRight: 0,
            yBottom: 0
        }));
    }
}