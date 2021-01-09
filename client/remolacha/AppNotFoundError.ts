export class AppNotFoundError extends Error {
    constructor(appId : string) {
        super(`App with ID "${appId}" could not be found.`);
    }
}