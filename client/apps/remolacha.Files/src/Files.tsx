import React from 'react';
import { ThemeProvider, Icon } from '@material-ui/core';
import prettyBytes from 'pretty-bytes';
import { DateTime } from 'luxon';
import { TypeTools } from 'remolacha-commons';
import { ContextMenu } from './ContextMenu';
import { MainToolbar } from './MainToolbar';
import { StatusBar } from './StatusBar';

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
    lastSelected? : number;
    previousPaths? : Array<string>;
    nextPaths? : Array<string>;
    error? : any;
    contextMenuMouseX? : number;
    contextMenuMouseY? : number;
}

export class Files extends React.Component<FilesProps, FilesState> {
    private static readonly PERMISSION_CHARACTERS : string = 'xwrxwrxwr';
    private static readonly SPECIAL_PERMISSION_CHARACTERS : Array<string> = [...'tss'];
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

    private static readonly TYPE_TO_LABEL : Map<string, string> = new Map([
        ['f', 'File'],
        ['d', 'Directory'],
        ['p', 'FIFO pipe'],
        ['s', 'Socket'],
        ['c', 'Character device'],
        ['b', 'Block device'],
        ['u', 'Unknown']
    ]);

    private static readonly TYPE_TO_ICON : Map<string, string> = new Map([
        ['f', 'insert_drive_file'],
        ['d', 'folder'],
        ['p', 'receipt'],
        ['s', 'settings_input_hdmi'],
        ['c', 'sd_storage'],
        ['b', 'sd_storage'],
        ['u', 'help_center']
    ]);

    private readonly COLUMNS : Array<any> = [
        {
            id: 'name',
            content: 'Name',
            descendingComparator: (aRowIndex: number, bRowIndex : number, columnIndex : number) : number => {
                if (this.state.elements[aRowIndex].type != 'd' && this.state.elements[bRowIndex].type == 'd') {
                    return -1;
                }

                if (this.state.elements[aRowIndex].type == 'd' && this.state.elements[bRowIndex].type != 'd') {
                    return 1;
                }

                return remolacha.DataTable.genericDescendingComparator(this.state.elements[aRowIndex].name.toLowerCase(), this.state.elements[bRowIndex].name.toLowerCase());
            }
        },
        {
            id: 'type',
            content: 'Type'
        },
        {
            id: 'size',
            content: 'Size',
            firstOrder: 'desc',
            descendingComparator: (aRowIndex: number, bRowIndex : number, columnIndex : number) : number => remolacha.DataTable.genericDescendingComparator(this.state.elements[aRowIndex].size, this.state.elements[bRowIndex].size)
        },
        {
            id: 'modified',
            content: 'Modified',
            firstOrder: 'desc'
        },
        {
            id: 'mode',
            content: 'Mode',
            descendingComparator: (aRowIndex: number, bRowIndex : number, columnIndex : number) : number => remolacha.DataTable.genericDescendingComparator(this.state.elements[aRowIndex].mode, this.state.elements[bRowIndex].mode)
        }
    ];

    private connection : any;
    private dataTable : any;

    constructor(props : FilesProps) {
        super(props);
        this.connection = null;
        this.dataTable = null;

        this.state = {
            currentPath: null,
            currentPathIsValid: false,
            locationInputValue: '',
            elements: [],
            selected: new Map(),
            lastSelected: null,
            previousPaths: [],
            nextPaths: [],
            error: null,
            contextMenuMouseX: null,
            contextMenuMouseY: null
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
            error: null,
            contextMenuMouseX: null,
            contextMenuMouseY: null
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

    private closeContextMenu() {
        this.setState({
            contextMenuMouseX: null,
            contextMenuMouseY: null
        });
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

    private onLocationInputChange(e : React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        this.setState({locationInputValue: e.target.value});
    }

    private onLocationInputBlur() {
        this.setState({locationInputValue: this.state.currentPath});
    }

    private onBackgroundMouseDown(e : React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (e.target != e.currentTarget || e.ctrlKey) {
            return;
        }

        this.setState({
            selected: new Map(),
            lastSelected: null
        });
    }

    private onBackgroundContextMenu(e : React.MouseEvent<HTMLDivElement, MouseEvent>) {
        e.preventDefault();

        if (this.state.contextMenuMouseX != null) {
            // To avoid opening the same menu somewhere else.
            return;
        }

        this.setState({
            contextMenuMouseX: e.clientX - 2,
            contextMenuMouseY: e.clientY - 4
        });
    }

    private onRowMouseDown(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) {
        if (e.button != 0 && e.ctrlKey) {
            // No effect.
            return;
        }

        const name = this.state.elements[rowIndex].name;

        if (!e.ctrlKey && (e.button == 0 || !this.state.selected.has(name))) {
            this.state.selected.clear();
        }

        const newState : FilesState = {selected: this.state.selected};

        if (e.shiftKey) {
            let from = this.dataTable.getSortedRowIndex(this.state.lastSelected || this.dataTable.getOriginalRowIndex(0));
            let to = this.dataTable.getSortedRowIndex(rowIndex);

            if (to < from) {
                [from, to] = [to, from];
            }

            for (let i = from; i <= to; ++i) {
                const originalI = this.dataTable.getOriginalRowIndex(i);
                this.state.selected.set(this.state.elements[originalI].name, this.state.elements[originalI].size);
            }

            e.preventDefault();     // To avoid text selection.
        }
        else {
            newState.lastSelected = rowIndex;

            if (e.ctrlKey && this.state.selected.has(name)) {
                this.state.selected.delete(name);
            }
            else {
                this.state.selected.set(name, this.state.elements[rowIndex].size);
            }
        }

        this.setState(newState);
    }

    private onRowDoubleMouseDown(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) {
        if (e.button != 0) {
            return;
        }

        e.preventDefault();     // To avoid text selection.

        if (this.state.elements[rowIndex].type == 'd') {
            this.readDirectory(this.resolvePath(this.state.elements[rowIndex].name), true);
        }
    }

    private onContextMenuClose() {
        this.closeContextMenu();
    }

    componentDidMount() {
        const path : string = this.props.params.get('cwd');
        this.readDirectory((TypeTools.isString(path)) ? path : null, false);
    }

    private renderRow(element : any) {
        let type = Files.TYPE_TO_LABEL.get(element.type);
        const icon = Files.TYPE_TO_ICON.get(element.type);

        if (element.type == 'f') {
            const parts : Array<string> = element.name.substr(1).split('.');        // substr(1) to skip first '.' (if present, otherwise it does not matter).

            if (parts.length > 1) {
                type += ` (${parts[parts.length - 1].toUpperCase()})`
            }
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
        }
        
        return [name, type, size, modified, mode];
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

                <div
                    className="remolacha_app_Files_background"
                    onMouseDown={e => this.onBackgroundMouseDown(e)}
                    onContextMenu={e => this.onBackgroundContextMenu(e)}
                >
                    <remolacha.DataTable
                        className="remolacha_app_Files_fileList"
                        columns={this.COLUMNS}
                        rows={this.state.elements.map(x => this.renderRow(x))}
                        size="small"
                        defaultOrderBy={0}
                        rowKey={(rowIndex : number) => this.state.elements[rowIndex].name}
                        rowSelected={(rowIndex : number) => this.state.selected.has(this.state.elements[rowIndex].name)}
                        onRowMouseDown={(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => this.onRowMouseDown(rowIndex, e)}
                        onRowDoubleMouseDown={(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => this.onRowDoubleMouseDown(rowIndex, e)}
                        ref={(x : any) => this.dataTable = x}
                    />

                    <ContextMenu
                        open={this.state.currentPathIsValid}
                        x={this.state.contextMenuMouseX}
                        y={this.state.contextMenuMouseY}
                        elements={this.state.elements}
                        selected={this.state.selected}
                        files={this}
                        onClose={() => this.onContextMenuClose()}
                    />
                </div>

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
