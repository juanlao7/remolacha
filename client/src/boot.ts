import { AppInitializer } from './AppInitializer';
import { AppNotFoundError } from './AppNotFoundError';
import { Environment } from './Environment';
import { MaxAppInstancesReachedError } from './MaxAppInstancesReachedError';
import { UndefinedAppInitializerError } from './UndefinedAppInitializerError';
import { Window } from './Window';

declare global {
    interface remolacha {
        'Window': Window,
        'AppInitializer': AppInitializer,
        'AppNotFoundError': AppNotFoundError,
        'UndefinedAppInitializerError': UndefinedAppInitializerError,
        'MaxAppInstancesReachedError': MaxAppInstancesReachedError
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const environment = new Environment();
    environment.openApp('remolacha.System', new Map<string, any>());
}, {once: true});
