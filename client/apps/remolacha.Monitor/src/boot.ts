import MonitorAppInitializer from './MonitorAppInitializer';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

remolacha.Environment.getInstance().setAppInitializer('remolacha.Monitor', new MonitorAppInitializer());
