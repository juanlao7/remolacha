import { IconDefinition } from './IconDefinition';

export interface AppManifest {
    id : string;
    name : string;
    isSingleton : boolean;
    showInAppsMenu : boolean;
    icon : IconDefinition;
}