import { Environment } from "./Environment";

export class MaxAppInstancesReachedError extends Error {
    constructor() {
        super(`Maximum number of app instances reached: ${Environment.MAX_APP_INSTANCES}.`);
    }
}