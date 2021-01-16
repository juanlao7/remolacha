import React from 'react';
import { ThemeProvider, AppBar, Toolbar, IconButton, Icon, InputBase, List, Typography } from '@material-ui/core';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface FilesProps {
    appInstance : any;
    window : any;        // TODO: type remolacha.Window
}

interface FilesState {
    currentPath? : string;
    elements? : Array<any>,
    selected? : Set<string>;
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
            currentPath: '.',
            elements: [],
            selected: new Set(),
        };
    }

    private readDirectory() {
        if (this.connection != null) {
            this.connection.close();
        }

        const connection = this.props.appInstance.createBackendConnection('readDirectory', {path: this.state.currentPath});
        //connection.events.on('error', (emitter : any, error : any) => newState.error = error);

        connection.events.on('data', (emitter : any, data : any) => {
            this.setState({
                currentPath: data.path,
                elements: data.elements
            });
        });

        connection.open();
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

    componentDidMount() {
        this.readDirectory();
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

        return [<span><Icon className={element.type} color="primary">{icon}</Icon> {element.name}</span>, type, element.size];
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
                        <IconButton color="inherit" edge="start">
                            <Icon>arrow_back</Icon>
                        </IconButton>

                        <IconButton color="inherit">
                            <Icon>arrow_forward</Icon>
                        </IconButton>

                        <IconButton color="inherit">
                            <Icon>arrow_upward</Icon>
                        </IconButton>

                        <IconButton color="inherit">
                            <Icon>home</Icon>
                        </IconButton>

                        <InputBase
                            className="remolacha_app_Files_locationInput"
                            placeholder="Location"
                            spellCheck="false"
                            value={this.state.currentPath}
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
                />

                <AppBar className="remolacha_app_Files_statusBar" position="static">
                    <Toolbar variant="dense">
                        <Typography variant="body1" color="inherit">
                            45 elements
                        </Typography>
                    </Toolbar>
                </AppBar>
            </ThemeProvider>
        );
    }
}
