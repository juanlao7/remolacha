export default class UndefinedAppInitializerError extends Error {
    constructor(appId : string) {
        super(`There is not an AppInitializer defined for app with ID "${appId}".`);
    }
}
