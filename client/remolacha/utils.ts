export function generateClassName(classes : {[key: string] : boolean}) : string {
    const className : Array<string> = [];

    for (const key in classes) {
        if (classes[key]) {
            className.push(key);
        }
    }

    return className.join(' ');
}
