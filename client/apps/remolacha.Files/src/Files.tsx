import React from 'react';
import { ThemeProvider } from '@material-ui/core';
import { TypeTools } from 'remolacha-commons';
import { MainToolbar } from './MainToolbar';
import { StatusBar } from './StatusBar';
import { FileList } from './FileList';
import { RenameDialog } from './RenameDialog';
import { OverwriteDialog } from './OverwriteDialog';
import { ErrorDialog } from './ErrorDialog';
import { DeleteDialog } from './DeleteDialog';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface FilesProps {
    appInstance : any;
    window : any;        // TODO: type remolacha.Window
    params : Map<string, any>;
}

interface FilesState {
    currentPath? : string;
    currentPathIsValid? : boolean;
    locationInputValue? : string;
    elements? : Array<any>;
    selected? : Map<string, number>;
    previousPaths? : Array<string>;
    nextPaths? : Array<string>;
    error? : any;
    dialogError? : string;
    deleteNames? : Array<string>;
    renameName? : string;
    overwriteName? : string;
    dialogLoading? : boolean;
    onOverwriteDialogClose? : (overwrite : boolean) => void
}

export class Files extends React.Component<FilesProps, FilesState> {
    private connection : any;

    constructor(props : FilesProps) {
        super(props);
        this.connection = null;

        this.state = {
            currentPath: null,
            currentPathIsValid: false,
            locationInputValue: '',
            elements: [],
            selected: new Map(),
            previousPaths: [],
            nextPaths: [],
            error: null,
            renameName: null,
            overwriteName: null,
            dialogLoading: false,
            onOverwriteDialogClose: null
        };
    }

    splitPath(absolutePath : string) : [Array<string>, string] {
        let separator = null;

        for (const character of absolutePath) {
            if (character == '/' || character == '\\') {
                separator = character;
                break;
            }
        }

        return [absolutePath.split(separator), separator];
    }

    getCurrentPath() : string {
        return this.state.currentPath;
    }

    resolvePath(relativePath : string) {
        const [parts, separator] = this.splitPath(this.state.currentPath);

        if (parts[parts.length - 1].length == 0) {
            // This happens only when the current path is the root ("/" or "X:\").
            parts[parts.length - 1] = relativePath;
        }
        else {
            parts.push(relativePath);
        }

        return parts.join(separator);
    }

    readDirectory(directoryPath : string, deleteNextPaths : boolean, input : HTMLInputElement = null) {
        if (this.connection != null) {
            this.connection.close();
        }

        const newState : FilesState = {
            currentPath: null,
            currentPathIsValid: false,
            elements: [],
            selected: new Map(),
            error: null
        };

        if (deleteNextPaths) {
            newState.nextPaths = [];
        }

        let params : any = {cwd: this.state.currentPath};

        if (directoryPath == null) {
            params.goHome = true;
            newState.locationInputValue = '';
        }
        else {
            params.path = directoryPath;
            newState.locationInputValue = directoryPath;
        }

        this.setState(newState);
        this.connection = this.props.appInstance.createBackendConnection('readDirectory', params);

        this.connection.events.on('error', (emitter : any, error : any) => {
            if (input != null) {
                input.select();
            }

            this.setState({
                currentPathIsValid: false,
                error: error
            });
        });

        this.connection.events.on('data', (emitter : any, data : any) => {
            if (input != null) {
                input.blur();
            }

            const newState : FilesState = {
                currentPath: data.path,
                currentPathIsValid: true,
                locationInputValue: data.path,
                elements: data.elements,
                selected: new Map(),
                error: null
            };

            const elementNames = new Set<string>(newState.elements.map(x => x.name));

            for (const [name, size] of this.state.selected) {
                if (elementNames.has(name)) {
                    newState.selected.set(name, size);
                }
            }

            if (this.state.previousPaths.length == 0 || this.state.previousPaths[this.state.previousPaths.length - 1] != data.path) {
                this.state.previousPaths.push(data.path);
                newState.previousPaths = this.state.previousPaths;
            }

            this.setState(newState);
            const [parts] = this.splitPath(data.path);
            let title = parts[parts.length - 1];

            if (title.length == 0) {
                // This happens on the root, when the path is "/" or "X:\".
                title = data.path;
            }

            this.props.window.setState({title: title});
        });

        this.connection.open();
    }

    getElementByName(name : string) : any {
        // TODO: store elements in a Map for reducing the complexity of this method from linear to constant.

        for (const element of this.state.elements) {
            if (element.name == name) {
                return element;
            }
        }

        return null;
    }

    setSelected(selected : Map<string, number>) {
        this.setState({selected: selected});
    }

    openDeleteDialog() {
        this.setState({deleteNames: [...this.state.selected.keys()]});
    }

    openRenameDialog() {
        this.setState({renameName: this.state.selected.keys().next().value});
    }

    private onLocationInputChange(e : React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        this.setState({locationInputValue: e.target.value});
    }

    private onLocationInputBlur() {
        this.setState({locationInputValue: this.state.currentPath});
    }

    private async onDeleteDialogClose(deleteConfirmed : boolean) {
        if (!deleteConfirmed) {
            this.setState({deleteNames: null});
            return;
        }

        this.setState({dialogLoading: true});

        try {
            await this.props.appInstance.callBackend('delete', {paths: this.state.deleteNames.map(x => this.resolvePath(x))});
        }
        catch (e) {
            this.setState({dialogError: e.message});
        }

        this.setState({
            deleteNames: null,
            dialogLoading: false
        });
    }

    private async onRenameDialogCloseImpl(newName : string) {
        try {
            await this.props.appInstance.callBackend('move', {
                from: this.resolvePath(this.state.renameName),
                to: this.resolvePath(newName)
            });

            this.setState({
                renameName: null,
                dialogLoading: false
            });
        }
        catch (e) {
            this.setState({
                dialogError: e.message,
                dialogLoading: false
            });
        }
    }

    private async onRenameDialogClose(newName : string) {
        if (newName == null || newName == this.state.renameName) {
            this.setState({renameName: null});
            return;
        }
        
        this.setState({dialogLoading: true});

        if (this.getElementByName(newName) == null) {
            this.onRenameDialogCloseImpl(newName);
            return;
        }

        this.setState({
            overwriteName: newName,

            onOverwriteDialogClose: async (overwrite) => {
                this.setState({overwriteName: null});

                if (overwrite) {
                    this.onRenameDialogCloseImpl(newName);
                }
                else {
                    this.setState({dialogLoading: false});
                }
            }
        });
    }

    componentDidMount() {
        const path : string = this.props.params.get('cwd');
        this.readDirectory((TypeTools.isString(path)) ? path : null, false);
    }

    render() {
        return (
            <ThemeProvider theme={remolacha.theme}>
                <MainToolbar
                    currentPath={this.state.currentPath}
                    locationInputValue={this.state.locationInputValue}
                    previousPaths={this.state.previousPaths}
                    nextPaths={this.state.nextPaths}
                    files={this}
                    onLocationInputChange={e => this.onLocationInputChange(e)}
                    onLocationInputBlur={() => this.onLocationInputBlur()}
                />

                <FileList
                    currentPathIsValid={this.state.currentPathIsValid}
                    elements={this.state.elements}
                    selected={this.state.selected}
                    files={this}
                />

                <StatusBar
                    currentPath={this.state.currentPath}
                    elements={this.state.elements}
                    selected={this.state.selected}
                    error={this.state.error}
                />

                <DeleteDialog
                    names={this.state.deleteNames}
                    loading={this.state.dialogLoading}
                    onClose={deleteConfirmed => this.onDeleteDialogClose(deleteConfirmed)}
                />

                <RenameDialog
                    originalName={this.state.renameName}
                    loading={this.state.dialogLoading}
                    onClose={newName => this.onRenameDialogClose(newName)}
                />

                <OverwriteDialog name={this.state.overwriteName} onClose={overwrite => this.state.onOverwriteDialogClose(overwrite)} />

                <ErrorDialog error={this.state.dialogError} onClose={() => this.setState({dialogError: null})} />
            </ThemeProvider>
        );
    }
}
