export function generateClassName(classes : {[key: string] : boolean}) : string {
    const className : Array<string> = [];

    for (const key in classes) {
        if (classes[key]) {
            className.push(key);
        }
    }

    return className.join(' ');
}

export function clamp(x : number, min : number, max : number) {
    if (max < min) {
        return x;
    }
    
    if (x < min) {
        return min;
    }

    if (x > max) {
        return max;
    }

    return x;
}
