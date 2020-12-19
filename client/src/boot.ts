import { AppInitializer } from './AppInitializer';
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

document.addEventListener('DOMContentLoaded', () => {
    Environment.getInstance().openApp('remolacha.System', new Map<string, any>());
}, {once: true});
