import { TaskbarAppInitializer } from "./TaskbarAppInitializer";

declare var remolacha : any;

remolacha.Environment.getInstance().setAppInitializer('remolacha.Taskbar', new TaskbarAppInitializer());
