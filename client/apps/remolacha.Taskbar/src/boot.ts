import TaskbarAppInitializer from './TaskbarAppInitializer';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

remolacha.Environment.getInstance().setAppInitializer('remolacha.Taskbar', new TaskbarAppInitializer());
