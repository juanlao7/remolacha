import { DesktopAppInitializer } from "./DesktopAppInitializer";

declare var remolacha : any;

remolacha.Environment.getInstance().setAppInitializer('remolacha.Desktop', new DesktopAppInitializer());
