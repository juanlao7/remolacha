import React from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export class TaskbarAppInitializer {
    open(appInstance : any, initialize : boolean, params : Map<string, any>) {
        if (!initialize) {
            return;
        }

        const content = document.createElement('div');
        ReactDOM.render(<Button>This will be the taskbar</Button>, content);

        const window = new remolacha.Window();
        window.setContent(content);
        appInstance.addWindow(window);
    }
}