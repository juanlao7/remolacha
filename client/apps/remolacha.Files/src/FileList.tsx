import React from 'react';
import { Icon } from '@material-ui/core';
import { DateTime } from 'luxon';
import prettyBytes from 'pretty-bytes';
import { ContextMenu } from './ContextMenu';
import { Files } from './Files';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface FileListProps {
    currentPathIsValid : boolean;
    elements : Array<any>;
    selected : Map<string, number>;
    files : Files;
}

interface FileListState {
    lastSelected? : number;
    contextMenuMouseX? : number;
    contextMenuMouseY? : number;
}

export class FileList extends React.Component<FileListProps, FileListState> {
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
                if (this.props.elements[aRowIndex].type != 'd' && this.props.elements[bRowIndex].type == 'd') {
                    return -1;
                }

                if (this.props.elements[aRowIndex].type == 'd' && this.props.elements[bRowIndex].type != 'd') {
                    return 1;
                }

                return remolacha.DataTable.genericDescendingComparator(this.props.elements[aRowIndex].name.toLowerCase(), this.props.elements[bRowIndex].name.toLowerCase());
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
            descendingComparator: (aRowIndex: number, bRowIndex : number, columnIndex : number) : number => remolacha.DataTable.genericDescendingComparator(this.props.elements[aRowIndex].size, this.props.elements[bRowIndex].size)
        },
        {
            id: 'modified',
            content: 'Modified',
            firstOrder: 'desc'
        },
        {
            id: 'mode',
            content: 'Mode',
            descendingComparator: (aRowIndex: number, bRowIndex : number, columnIndex : number) : number => remolacha.DataTable.genericDescendingComparator(this.props.elements[aRowIndex].mode, this.props.elements[bRowIndex].mode)
        }
    ];

    private dataTable : any;

    constructor(props : FileListProps) {
        super(props);
        this.dataTable = null;

        this.state = {
            lastSelected: null,
            contextMenuMouseX: null,
            contextMenuMouseY: null
        };
    }

    private closeContextMenu() {
        this.setState({
            contextMenuMouseX: null,
            contextMenuMouseY: null
        });
    }

    private onBackgroundMouseDown(e : React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (e.target != e.currentTarget || e.ctrlKey) {
            return;
        }

        this.setState({lastSelected: null});
        this.props.files.setSelected(new Map());
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

        const name = this.props.elements[rowIndex].name;

        if (!e.ctrlKey && (e.button == 0 || !this.props.selected.has(name))) {
            this.props.selected.clear();
        }

        if (e.shiftKey) {
            let from = this.dataTable.getSortedRowIndex(this.state.lastSelected || this.dataTable.getOriginalRowIndex(0));
            let to = this.dataTable.getSortedRowIndex(rowIndex);

            if (to < from) {
                [from, to] = [to, from];
            }

            for (let i = from; i <= to; ++i) {
                const originalI = this.dataTable.getOriginalRowIndex(i);
                this.props.selected.set(this.props.elements[originalI].name, this.props.elements[originalI].size);
            }

            e.preventDefault();     // To avoid text selection.
        }
        else {
            this.setState({lastSelected: rowIndex});

            if (e.ctrlKey && this.props.selected.has(name)) {
                this.props.selected.delete(name);
            }
            else {
                this.props.selected.set(name, this.props.elements[rowIndex].size);
            }
        }

        this.props.files.setSelected(this.props.selected);
    }

    private onRowDoubleMouseDown(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) {
        if (e.button != 0) {
            return;
        }

        e.preventDefault();     // To avoid text selection.

        if (this.props.elements[rowIndex].type == 'd') {
            this.props.files.readDirectory(this.props.files.resolvePath(this.props.elements[rowIndex].name), true);
        }
    }

    private onContextMenuClose() {
        this.closeContextMenu();
    }

    componentDidUpdate() {
        if (!this.props.currentPathIsValid && this.state.contextMenuMouseX != null) {
            this.closeContextMenu();
        }
    }

    private renderRow(element : any) {
        let type = FileList.TYPE_TO_LABEL.get(element.type);
        const icon = FileList.TYPE_TO_ICON.get(element.type);

        if (element.type == 'f') {
            const parts : Array<string> = element.name.substr(1).split('.');        // substr(1) to skip first '.' (if present, otherwise it does not matter).

            if (parts.length > 1) {
                type += ` (${parts[parts.length - 1].toUpperCase()})`
            }
        }

        let className = `remolacha_app_Files_type_${element.type}`;
        const prefixCode = (element.mode == null) ? 0 : element.mode >> 12;

        if (prefixCode == FileList.MODE_LINK) {
            className += ' remolacha_app_Files_symbolicLink';
            type += ' — symbolic link';
        }

        const name = <span className={className}><Icon color="primary">{icon}</Icon> {element.name}</span>;
        const size = (element.size == null) ? null : prettyBytes(element.size);
        const modified = (element.modified == null) ? null : DateTime.fromMillis(element.modified).toFormat('yyyy-LL-dd HH:mm');
        let mode = null;

        if (element.mode != null) {
            const permissionCharacters = [...FileList.PERMISSION_CHARACTERS];

            for (let i = 0; i < 3; ++i) {
                const specialPermissionFlag = 1 << (i + 9);

                if (element.mode & specialPermissionFlag) {
                    permissionCharacters[3 * i] = FileList.SPECIAL_PERMISSION_CHARACTERS[i];
                }
            }

            const prefix = (FileList.MODE_PREFIXES.has(prefixCode)) ? FileList.MODE_PREFIXES.get(prefixCode) : '-';
            const permissions = permissionCharacters.map((c, i) => (element.mode & (1 << i)) ? c : '-').reverse().join('');
            mode = <span className="remolacha_app_Files_modeCell">{prefix + permissions}</span>;
        }
        
        return [name, type, size, modified, mode];
    }
    
    render() {
        return (
            <div
                className="remolacha_app_Files_background"
                onMouseDown={e => this.onBackgroundMouseDown(e)}
                onContextMenu={e => this.onBackgroundContextMenu(e)}
            >
                <remolacha.DataTable
                    className="remolacha_app_Files_fileList"
                    columns={this.COLUMNS}
                    rows={this.props.elements.map(x => this.renderRow(x))}
                    size="small"
                    defaultOrderBy={0}
                    rowKey={(rowIndex : number) => this.props.elements[rowIndex].name}
                    rowSelected={(rowIndex : number) => this.props.selected.has(this.props.elements[rowIndex].name)}
                    onRowMouseDown={(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => this.onRowMouseDown(rowIndex, e)}
                    onRowDoubleMouseDown={(rowIndex : number, e : React.MouseEvent<HTMLTableRowElement, MouseEvent>) => this.onRowDoubleMouseDown(rowIndex, e)}
                    ref={(x : any) => this.dataTable = x}
                />

                <ContextMenu
                    open={this.props.currentPathIsValid}
                    x={this.state.contextMenuMouseX}
                    y={this.state.contextMenuMouseY}
                    elements={this.props.elements}
                    selected={this.props.selected}
                    files={this.props.files}
                    onClose={() => this.onContextMenuClose()}
                />
            </div>
        );
    }
}
