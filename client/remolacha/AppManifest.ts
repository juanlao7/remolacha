import IconDefinition from './IconDefinition';

export default interface AppManifest {
    id : string;
    name : string;
    isSingleton : boolean;
    showInAppsMenu : boolean;
    icon : IconDefinition;
}