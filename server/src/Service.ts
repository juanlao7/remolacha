import { Connection } from './Connection';

export interface Service {
    (params : any, connection : Connection) : void;
}
