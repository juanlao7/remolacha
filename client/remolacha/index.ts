import Environment from './Environment';
import Window from './Window';
import DataTable from './DataTable';
import RemolachaIcon from './RemolachaIcon';
import theme from './theme';
import * as utils from './utils';
import AppNotFoundError from './AppNotFoundError';
import MaxInstancesReachedError from './MaxInstancesReachedError';
import UndefinedAppInitializerError from './UndefinedAppInitializerError';
import PermissionDeniedError from './PermissionDeniedError';

require('./assets/sass/index.sass');

export {
    Environment,
    Window,
    DataTable,
    RemolachaIcon,
    theme,
    utils,
    AppNotFoundError,
    MaxInstancesReachedError,
    UndefinedAppInitializerError,
    PermissionDeniedError
};

document.addEventListener('DOMContentLoaded', async () => {
    await Environment.getInstance().openApp('remolacha.System');
}, {once: true});
