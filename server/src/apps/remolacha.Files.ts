import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { TypeTools } from 'remolacha-commons';
import { App } from '../App';
import { Connection } from '../Connection';

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
    const names = await fs.readdir(directoryPath);
    const elements : Array<DirectoryElement> = [];
    const promises : Array<Promise<unknown>> = [];

    for (const name of names) {
        const element : DirectoryElement = {name: name};

        promises.push(new Promise(async (resolve) => {
            try {
                const elementPath = path.join(directoryPath, name);
                const lstatResult = await fs.lstat(elementPath);
                const typeStatResult = (lstatResult.isSymbolicLink()) ? await fs.stat(elementPath) as fs.Stats : lstatResult;
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

async function createElementImpl(params : any, connection : Connection, createElement : (path : string) => Promise<void>) {
    if (params == null || typeof params != 'object' || !TypeTools.isString(params.path)) {
        throw new Error('Unexpected params.');
    }

    if (await fs.pathExists(params.path)) {
        throw new Error(`Path already exists: ${params.path}`);
    }

    await createElement(params.path);
    connection.close();
}

const app : App = {
    readDirectory: async (params : any, connection : Connection) => {
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
    },

    createFile: async (params : any, connection : Connection) => {
        await createElementImpl(params, connection, path => fs.ensureFile(path));
    },

    createDirectory: async (params : any, connection : Connection) => {
        await createElementImpl(params, connection, path => fs.ensureDir(path))
    },

    move: async (params : any, connection : Connection) => {
        if (params == null || typeof params != 'object' || !TypeTools.isString(params.from) || !TypeTools.isString(params.to)) {
            throw new Error('Unexpected params.');
        }

        await fs.move(params.from, params.to, {overwrite: true});
        connection.close();
    },

    delete: async (params : any, connection : Connection) => {
        if (params == null || typeof params != 'object' || !Array.isArray(params.paths) || params.paths.some((x : any) => !TypeTools.isString(x))) {
            throw new Error('Unexpected params.');
        }

        await Promise.all(params.paths.map((x : string) => fs.remove(x)));
        connection.close();
    }
};

export default app;
