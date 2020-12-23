declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export class TaskbarAppInitializer {
    open(appInstance : any, initialize : boolean, params : Map<string, any>) {
        if (!initialize) {
            return;
        }

        const element = document.createElement('div');
        element.textContent = 'This is a taskbar';

        const window = new remolacha.Window();
        window.setContent(element);
        appInstance.addWindow(window);
    }
}