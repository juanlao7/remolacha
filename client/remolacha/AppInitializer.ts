import { AppInstance } from './AppInstance';

export interface AppInitializer {
    open(appInstance : AppInstance, initialize : boolean, params : Map<string, any>) : Promise<void>;
}
