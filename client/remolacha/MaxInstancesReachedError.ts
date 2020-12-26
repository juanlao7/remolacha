export default class MaxInstancesReachedError extends Error {
    constructor(item : string, maxNumber : number) {
        super(`Maximum number of ${item} instances reached: ${maxNumber}.`);
    }
}