import fs from 'fs-extra';
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
            const elements = await readDirectoryImpl(directoryPath);
            
            connection.send({
                path: directoryPath,
                elements: elements
            });

            // TODO: check changes
        }
        catch (e) {
            connection.fail(e.message);
            connection.close();
        }
    }
};

export default app;
