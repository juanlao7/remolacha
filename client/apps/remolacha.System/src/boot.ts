import { SystemAppInitializer } from "./SystemAppInitializer";

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

remolacha.Environment.getInstance().setAppInitializer('remolacha.System', new SystemAppInitializer());
