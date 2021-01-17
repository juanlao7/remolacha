import React from 'react';
import { ThemeProvider, AppBar, Toolbar, IconButton, Icon, InputBase, Typography } from '@material-ui/core';
import prettyBytes from 'pretty-bytes';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface FilesProps {
    appInstance : any;
    window : any;        // TODO: type remolacha.Window
}

interface FilesState {
    currentPath? : string;
    locationInputValue? : string;
    elements? : Array<any>;
    selected? : Set<string>;
    previousPaths? : Array<string>;
    nextPaths? : Array<string>;
    error? : any;
}

export class Files extends React.Component<FilesProps, FilesState> {
    private static readonly COLUMNS : Array<any> = [
        {
            id: 'name',
            content: 'Name'
        },
        {
            id: 'type',
            content: 'Type'
        },
        {
            id: 'size',
            content: 'Size'
        }
    ];

    private connection : any;

    constructor(props: FilesProps) {
        super(props);
        this.connection = null;

        this.state = {
            currentPath: null,
            locationInputValue: '',
            elements: [],
            selected: new Set(),
            previousPaths: [],
            nextPaths: [],
            error: null
        };
    }

    private splitPath(absolutePath : string) : [Array<string>, string] {
        let separator = null;

        for (const character of absolutePath) {
            if (character == '/' || character == '\\') {
                separator = character;
                break;
            }
        }

        return [absolutePath.split(separator), separator];
    }

    private readDirectory(directoryPath : string, deleteNextPaths : boolean, input : HTMLInputElement = null) {
        if (this.connection != null) {
            this.connection.close();
        }

        const newState : FilesState = {
            currentPath: null,
            elements: [],
            selected: new Set(),
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
        const connection = this.props.appInstance.createBackendConnection('readDirectory', params);

        connection.events.on('error', (emitter : any, error : any) => {
            if (input != null) {
                input.select();
            }

            this.setState({error: error});
        });

        connection.events.on('data', (emitter : any, data : any) => {
            if (input != null) {
                input.blur();
            }

            const newState : FilesState = {
                currentPath: data.path,
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

        connection.open();
    }

    private canGoBack() : boolean {
        return (this.state.currentPath != null && this.state.previousPaths.length > 1);
    }

    private canGoForward() : boolean {
        return (this.state.currentPath != null && this.state.nextPaths.length > 0);
    }

    private canGoUp() : boolean {
        if (this.state.currentPath == null) {
            return false;
        }

        const [parts] = this.splitPath(this.state.currentPath);
        return (parts[parts.length - 1].length > 0);
    }

    private onRowClick(rowIndex : number) {
        const name = this.state.elements[rowIndex].name;

        if (this.state.selected.has(name)) {
            this.state.selected.delete(name);
        }
        else {
            this.state.selected.add(name);
        }

        this.setState({selected: this.state.selected});
    }

    private onRowDoubleClick(rowIndex : number) {
        if (this.state.elements[rowIndex].type == 'd') {
            const [parts, separator] = this.splitPath(this.state.currentPath);

            if (parts[parts.length - 1].length == 0) {
                // This happens only when the current path is the root ("/" or "X:\").
                parts[parts.length - 1] = this.state.elements[rowIndex].name;
            }
            else {
                parts.push(this.state.elements[rowIndex].name);
            }

            this.readDirectory(parts.join(separator), true);
        }
    }

    private onLocationInputChange(e : React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        this.setState({locationInputValue: e.target.value});
    }

    private onLocationInputBlur() {
        if (this.state.currentPath != null) {
            this.setState({locationInputValue: this.state.currentPath});
        }
    }

    private onLocationInputKeyPress(e : React.KeyboardEvent<HTMLDivElement>) {
        if (e.key == 'Enter') {
            const input = e.target as HTMLInputElement;
            this.readDirectory(input.value, true, input);
        }
    }

    private onBackButtonClick() {
        this.state.nextPaths.push(this.state.previousPaths.pop());
        this.readDirectory(this.state.previousPaths[this.state.previousPaths.length - 1], false);
    }

    private onForwardButtonClick() {
        const directoryPath = this.state.nextPaths.pop();
        this.readDirectory(directoryPath, false);
    }

    private onUpButtonClick() {
        const [parts, separator] = this.splitPath(this.state.currentPath);
        parts[parts.length - 1] = '';       // We do not remove the element because on Windows we want to go to "X:\", and not "X:".
        this.readDirectory(parts.join(separator), true);
    }

    private onHomeButtonClick() {
        this.readDirectory(null, true);
    }

    componentDidMount() {
        this.readDirectory(null, false);
    }

    private renderRow(element : any) {
        let icon : string;
        let type : string;

        if (element.type == 'd') {
            icon = 'folder';
            type = 'Directory';
        }
        else {
            icon = 'insert_drive_file';
            type = 'File';
        }

        const size = (element.size == null) ? null : prettyBytes(element.size);
        return [<span><Icon className={element.type} color="primary">{icon}</Icon> {element.name}</span>, type, size];
    }

    render() {
        return (
            <ThemeProvider theme={remolacha.theme}>
                <AppBar position="static">
                    <Toolbar
                        className="remolacha_app_Files_toolbar"
                        variant="dense"
                        disableGutters
                    >
                        <IconButton
                            color="inherit"
                            edge="start"
                            disabled={!this.canGoBack()}
                            onClick={() => this.onBackButtonClick()}
                        >
                            <Icon>arrow_back</Icon>
                        </IconButton>

                        <IconButton
                            color="inherit"
                            disabled={!this.canGoForward()}
                            onClick={() => this.onForwardButtonClick()}
                        >
                            <Icon>arrow_forward</Icon>
                        </IconButton>

                        <IconButton
                            color="inherit"
                            disabled={!this.canGoUp()}
                            onClick={() => this.onUpButtonClick()}
                        >
                            <Icon>arrow_upward</Icon>
                        </IconButton>

                        <IconButton
                            color="inherit"
                            disabled={this.state.currentPath == null}
                            onClick={() => this.onHomeButtonClick()}
                        >
                            <Icon>home</Icon>
                        </IconButton>

                        <InputBase
                            className="remolacha_app_Files_locationInput"
                            placeholder="Location"
                            spellCheck="false"
                            value={this.state.locationInputValue}
                            onChange={e => this.onLocationInputChange(e)}
                            onBlur={() => this.onLocationInputBlur()}
                            onKeyPress={e => this.onLocationInputKeyPress(e)}
                        />
                    </Toolbar>
                </AppBar>

                <remolacha.DataTable
                    className="remolacha_app_Files_fileList"
                    columns={Files.COLUMNS}
                    rows={this.state.elements.map(x => this.renderRow(x))}
                    size="small"
                    rowKey={(rowIndex : number) => this.state.elements[rowIndex].name}
                    rowSelected={(rowIndex : number) => this.state.selected.has(this.state.elements[rowIndex].name)}
                    onRowClick={(rowIndex : number) => this.onRowClick(rowIndex)}
                    onRowDoubleClick={(rowIndex : number) => this.onRowDoubleClick(rowIndex)}
                />

                <AppBar className="remolacha_app_Files_statusBar" position="static">
                    <Toolbar variant="dense">
                        <Typography variant="body1" color="inherit">
                            {(this.state.error == null) ?
                                `${this.state.elements.length} element${(this.state.elements.length != 1) ? 's' : ''}`
                            :
                                this.state.error}
                        </Typography>
                    </Toolbar>
                </AppBar>
            </ThemeProvider>
        );
    }
}
