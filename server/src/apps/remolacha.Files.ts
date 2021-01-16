import fs from 'fs-extra';
import { connect } from 'http2';
import path from 'path';
import { promisify } from 'util';
import { App } from '../App';
import { Connection } from '../Connection';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

enum DirectoryElementType {
    FILE = 'f',
    DIRECTORY = 'd'
}

interface DirectoryElement {
    name : string;
    type? : DirectoryElementType;
    size? : number;
}

async function readDirectoryImpl(directoryPath : string) : Promise<Array<DirectoryElement>> {
    const names = await readdir(directoryPath) as Array<string>;
    const elements : Array<DirectoryElement> = [];
    const promises : Array<Promise<unknown>> = [];

    for (const name of names) {
        const element : DirectoryElement = {name: name};

        promises.push(new Promise(async (resolve) => {
            try {
                const statResult = await stat(path.join(directoryPath, name)) as fs.Stats;

                if (statResult.isDirectory()) {
                    element.type = DirectoryElementType.DIRECTORY;
                }
                else {
                    element.type = DirectoryElementType.FILE;
                    element.size = statResult.size;
                }
            }
            catch (e) {
                // Nothing to do.
            }

            resolve(undefined);
        }));

        elements.push(element);
    }

    await Promise.all(promises);
    return elements;
}

const app : App = {
    readDirectory: async (params : any, connection : Connection) => {
        try {
            if (params == null || typeof params != 'object' || !(typeof params.path == 'string' || params.path instanceof String)) {
                throw new Error('Unexpected params.');
            }

            const directoryPath = path.resolve(params.path);
            let elements : Array<DirectoryElement> = [];
            let error : string = null;

            try {
                elements = await readDirectoryImpl(directoryPath);
            }
            catch (e) {
                // We want to send the error, but also update the UI with the resolved path.
                error = e.message;
            }
            
            connection.send({
                path: directoryPath,
                elements: elements
            });

            if (error != null) {
                connection.fail(error);
            }

            // TODO: check changes
        }
        catch (e) {
            connection.fail(e.message);
            connection.close();
        }
    }
};

export default app;
