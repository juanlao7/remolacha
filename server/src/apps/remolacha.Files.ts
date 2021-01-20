import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { TypeTools } from 'remolacha-commons';
import { App } from '../App';
import { Connection } from '../Connection';

const readdir = promisify(fs.readdir);
const lstat = promisify(fs.lstat);
const stat = promisify(fs.stat);

enum DirectoryElementType {
    FILE = 'f',
    DIRECTORY = 'd',
    FIFO = 'p',
    SOCKET = 's',
    CHARACTER_DEVICE = 'c',
    BLOCK_DEVICE = 'b',
    UNKNOWN = 'u'
}

interface DirectoryElement {
    name : string;
    type? : DirectoryElementType;
    size? : number;
    modified? : number;
    mode? : number;
}

const DIRECTORY_ELEMENT_TYPE_FUNCTIONS : Array<[keyof fs.Stats, DirectoryElementType]> = [
    ['isDirectory', DirectoryElementType.DIRECTORY],
    ['isFIFO', DirectoryElementType.FIFO],
    ['isSocket', DirectoryElementType.SOCKET],
    ['isCharacterDevice', DirectoryElementType.CHARACTER_DEVICE],
    ['isBlockDevice', DirectoryElementType.BLOCK_DEVICE]
];

async function getDirectoryElements(directoryPath : string) : Promise<Array<DirectoryElement>> {
    const names = await readdir(directoryPath) as Array<string>;
    const elements : Array<DirectoryElement> = [];
    const promises : Array<Promise<unknown>> = [];

    for (const name of names) {
        const element : DirectoryElement = {name: name};

        promises.push(new Promise(async (resolve) => {
            try {
                const elementPath = path.join(directoryPath, name);
                const lstatResult = await lstat(elementPath) as fs.Stats;
                const typeStatResult = (lstatResult.isSymbolicLink()) ? await stat(elementPath) as fs.Stats : lstatResult;
                element.type = DirectoryElementType.FILE;

                for (const [func, elementType] of DIRECTORY_ELEMENT_TYPE_FUNCTIONS) {
                    if ((typeStatResult[func] as () => boolean)()) {
                        element.type = elementType;
                        break;
                    }
                }
                
                element.size = lstatResult.size;
                element.modified = lstatResult.mtime.getTime();
                element.mode = lstatResult.mode;
            }
            catch (e) {
                element.type = DirectoryElementType.UNKNOWN;
            }

            resolve(undefined);
        }));

        elements.push(element);
    }

    await Promise.all(promises);
    return elements;
}

async function readDirectoryImpl(directoryPath : string, connection : Connection) {
    connection.send({
        path: directoryPath,
        elements: await getDirectoryElements(directoryPath)
    });
}

const app : App = {
    readDirectory: async (params : any, connection : Connection) => {
        try {
            if (params == null || typeof params != 'object' || !('goHome' in params || TypeTools.isString(params.path))) {
                throw new Error('Unexpected params.');
            }

            let directoryPath = ('goHome' in params) ? os.homedir() : params.path;

            if (path.isAbsolute(directoryPath)) {
                directoryPath = path.resolve(directoryPath);
            }
            else if (params.cwd != null) {
                directoryPath = path.resolve(path.join(params.cwd, directoryPath));
            }

            try {
                function onWatch() {
                    try {
                        readDirectoryImpl(directoryPath, connection);
                        watcher.close();
                        startWatcher();
                    }
                    catch (e) {
                        console.log(1);
                        connection.fail(e.message);
                        connection.close();
                    }
                }

                function startWatcher() {
                    watcher = fs.watch(directoryPath, onWatch);
                }

                let watcher : fs.FSWatcher;
                startWatcher();
                connection.events.once('close', () => watcher.close());

                await readDirectoryImpl(directoryPath, connection);
            }
            catch (e) {
                connection.send({
                    path: directoryPath,
                    elements: []
                });

                throw e;
            }
        }
        catch (e) {
            connection.fail(e.message);
            connection.close();
        }
    }
};

export default app;
