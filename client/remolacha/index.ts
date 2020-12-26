import Environment from './Environment';
import Window from './Window';
import AppNotFoundError from './AppNotFoundError';
import MaxInstancesReachedError from './MaxInstancesReachedError';
import UndefinedAppInitializerError from './UndefinedAppInitializerError';

require('./assets/sass/index.sass');

export {
    Environment,
    Window,
    AppNotFoundError,
    MaxInstancesReachedError,
    UndefinedAppInitializerError
};

document.addEventListener('DOMContentLoaded', async () => {
    await Environment.getInstance().openApp('remolacha.System');
}, {once: true});
