import { AppNotFoundError } from './AppNotFoundError';
import { Environment } from './Environment';
import { MaxAppInstancesReachedError } from './MaxAppInstancesReachedError';
import { UndefinedAppInitializerError } from './UndefinedAppInitializerError';
import { Window } from './Window';

(<any>window).remolacha = {
    'Environment': Environment,
    'Window': Window,
    'AppNotFoundError': AppNotFoundError,
    'UndefinedAppInitializerError': UndefinedAppInitializerError,
    'MaxAppInstancesReachedError': MaxAppInstancesReachedError
}

document.addEventListener('DOMContentLoaded', async () => {
    const environment : Environment = Environment.getInstance();

    await Promise.all([
        environment.loadCSS(null, 'libs/fonts.css'),
        environment.loadCSS(null, 'libs/material-icons/material-icons.css'),
        environment.loadJS('libs/react.production.min.js', true),
        environment.loadJS('libs/react-dom.production.min.js', true),
        environment.loadJS('libs/material-ui.production.min.js', true)
    ]);

    environment.openApp('remolacha.System', new Map<string, any>());
}, {once: true});
