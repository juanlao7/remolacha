import { Environment } from './Environment';
import { Window } from './Window';
import { AppNotFoundError } from './AppNotFoundError';
import { MaxAppInstancesReachedError } from './MaxAppInstancesReachedError';
import { UndefinedAppInitializerError } from './UndefinedAppInitializerError';

export {
    Environment,
    Window,
    AppNotFoundError,
    MaxAppInstancesReachedError,
    UndefinedAppInitializerError
};

document.addEventListener('DOMContentLoaded', async () => {
    await Environment.getInstance().openApp('remolacha.System');
}, {once: true});
