import { SystemAppInitializer } from "./SystemAppInitializer";

declare var remolacha : any;

remolacha.Environment.getInstance().setAppInitializer('remolacha.System', new SystemAppInitializer());
