import React from 'react';
import { ThemeProvider, AppBar, Toolbar, IconButton, Icon, InputBase, Typography, LinearProgress } from '@material-ui/core';
import prettyBytes from 'pretty-bytes';
import { DateTime } from 'luxon';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface FilesProps {
    appInstance : any;
    window : any;        // TODO: type remolacha.Window
}

interface FilesState {
    currentPath? : string;
    locationInputValue? : string;
    elements? : Array<any>;
    selected? : Map<string, number>;
    previousPaths? : Array<string>;
    nextPaths? : Array<string>;
    error? : any;
}

export class Files extends React.Component<FilesProps, FilesState> {
    private static readonly PERMISSION_CHARACTERS : string = 'xwrxwrxwr';
    private static readonly SPECIAL_PERMISSION_CHARACTERS : Array<string> = [...'sst'];
    private static readonly MODE_LINK : number = 0o012;
    
    private static readonly MODE_PREFIXES : Map<number, string> = new Map([
        [0o001, 'p'],
        [0o002, 'c'],
        [0o004, 'd'],
        [0o006, 'b'],
        [0o010, '-'],
        [0o012, 'l'],
        [0o014, 's']
    ]);

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
        },
        {
            id: 'modified',
            content: 'Modified'
        },
        {
            id: 'mode',
            content: 'Mode'
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
            selected: new Map(),
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

    private onRowClick(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) {
        const name = this.state.elements[rowIndex].name;

        if (e.ctrlKey) {
            if (this.state.selected.has(name)) {
                this.state.selected.delete(name);
            }
            else {
                this.state.selected.set(name, this.state.elements[rowIndex].size || 0);
            }
        }
        else {
            this.state.selected.clear();
            this.state.selected.set(name, this.state.elements[rowIndex].size || 0);
        }

        this.setState({selected: this.state.selected});
    }

    private onRowDoubleClick(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) {
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
        else if (element.type == 'f') {
            icon = 'insert_drive_file';
            type = 'File';
            const parts : Array<string> = element.name.substr(1).split('.');        // substr(1) to skip first '.' (if present, otherwise it does not matter).

            if (parts.length > 1) {
                type += ` (${parts[parts.length - 1].toUpperCase()})`
            }
        }
        else {
            icon = 'help_center';
            type = 'Unknown';
        }

        let className = `remolacha_app_Files_type_${element.type}`;
        const prefixCode = (element.mode == null) ? 0 : element.mode >> 12;

        if (prefixCode == Files.MODE_LINK) {
            className += ' remolacha_app_Files_symbolicLink';
            type += ' — symbolic link';
        }

        const name = <span className={className}><Icon color="primary">{icon}</Icon> {element.name}</span>;
        const size = (element.size == null) ? null : prettyBytes(element.size);
        const modified = (element.modified == null) ? null : DateTime.fromMillis(element.modified).toFormat('yyyy-LL-dd HH:mm');
        let mode = null;

        if (element.mode != null) {
            const permissionCharacters = [...Files.PERMISSION_CHARACTERS];

            for (let i = 0; i < 3; ++i) {
                const specialPermissionFlag = 1 << (i + 9);

                if (element.mode & specialPermissionFlag) {
                    permissionCharacters[3 * i] = Files.SPECIAL_PERMISSION_CHARACTERS[i];
                }
            }

            const prefix = (Files.MODE_PREFIXES.has(prefixCode)) ? Files.MODE_PREFIXES.get(prefixCode) : '-';
            const permissions = permissionCharacters.map((c, i) => (element.mode & (1 << i)) ? c : '-').reverse().join('');
            mode = <span className="remolacha_app_Files_modeCell">{prefix + permissions}</span>;

            console.log('--------');
            console.log(element.name);
            console.log(element.mode.toString(8));
        }
        
        return [name, type, size, modified, mode];
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
                            disabled={this.state.currentPath == null}
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
                    onRowClick={(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => this.onRowClick(rowIndex, e)}
                    onRowDoubleClick={(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => this.onRowDoubleClick(rowIndex, e)}
                />

                <AppBar className="remolacha_app_Files_statusBar" position="static">
                    <Toolbar variant="dense">
                        <Typography variant="body1" color="inherit">
                            {(this.state.error == null) ?
                                (this.state.currentPath == null) ?
                                    'Loading...'
                                :
                                    (this.state.selected.size == 0) ?
                                        `${this.state.elements.length} element${(this.state.elements.length != 1) ? 's' : ''}`
                                    :
                                        `${this.state.selected.size} element${(this.state.selected.size != 1) ? 's' : ''} selected, ${prettyBytes([...this.state.selected.values()].reduce((a, b) => a + b, 0))}`
                            :
                                this.state.error}
                        </Typography>
                    </Toolbar>

                    {this.state.currentPath == null &&
                    <LinearProgress className="remolacha_app_Files_progressBar" color="secondary" />
                    }
                </AppBar>
            </ThemeProvider>
        );
    }
}
