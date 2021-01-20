import React from 'react';
import { ThemeProvider } from '@material-ui/core';
import { TypeTools } from 'remolacha-commons';
import { MainToolbar } from './MainToolbar';
import { StatusBar } from './StatusBar';
import { FileList } from './FileList';

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
            error: null
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
                error: null
            };

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

    private onLocationInputChange(e : React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        this.setState({locationInputValue: e.target.value});
    }

    private onLocationInputBlur() {
        this.setState({locationInputValue: this.state.currentPath});
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
            </ThemeProvider>
        );
    }
}
