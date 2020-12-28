import Environment from './Environment';
import Window from './Window';
import AppNotFoundError from './AppNotFoundError';
import MaxInstancesReachedError from './MaxInstancesReachedError';
import UndefinedAppInitializerError from './UndefinedAppInitializerError';
import * as utils from './utils';

require('./assets/sass/index.sass');

export {
    Environment,
    Window,
    AppNotFoundError,
    MaxInstancesReachedError,
    UndefinedAppInitializerError,
    utils
};

document.addEventListener('DOMContentLoaded', async () => {
    await Environment.getInstance().openApp('remolacha.System');
}, {once: true});
