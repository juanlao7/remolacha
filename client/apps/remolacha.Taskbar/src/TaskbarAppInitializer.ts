export class TaskbarAppInitializer {
    open(appInstance : any, initialize : boolean, params : Map<string, any>) {
        if (!initialize) {
            return;
        }

        console.log('Taskbar!');
    }
}