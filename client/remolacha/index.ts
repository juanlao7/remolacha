import { theme } from './theme';
import { Environment } from './Environment';
import { Window } from './Window';
import { DataTable } from './DataTable';
import { RemolachaIcon } from './RemolachaIcon';
import * as utils from './utils';
import { AppNotFoundError } from './AppNotFoundError';
import { MaxInstancesReachedError } from './MaxInstancesReachedError';
import { UndefinedAppInitializerError } from './UndefinedAppInitializerError';
import { PermissionDeniedError } from './PermissionDeniedError';

require('./assets/sass/index.sass');

export {
    theme,
    Environment,
    Window,
    DataTable,
    RemolachaIcon,
    utils,
    AppNotFoundError,
    MaxInstancesReachedError,
    UndefinedAppInitializerError,
    PermissionDeniedError
};

document.addEventListener('DOMContentLoaded', async () => {
    await Environment.getInstance().openApp('remolacha.System');
}, {once: true});
