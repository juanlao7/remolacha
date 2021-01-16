import React from 'react';
import { ThemeProvider, AppBar, Toolbar, IconButton, Icon, InputBase, Typography } from '@material-ui/core';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface FilesProps {
    appInstance : any;
    window : any;        // TODO: type remolacha.Window
}

interface FilesState {
    locationInputValue? : string;
    elements? : Array<any>,
    selected? : Set<string>;
    error? : any
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
    private currentPath : string;

    constructor(props: FilesProps) {
        super(props);
        this.connection = null;

        this.state = {
            locationInputValue: '.',
            elements: [],
            selected: new Set(),
            error: null
        };
    }

    private readDirectory(directoryPath : string, input : HTMLInputElement = null) {
        this.currentPath = directoryPath;

        if (this.connection != null) {
            this.connection.close();
        }

        const connection = this.props.appInstance.createBackendConnection('readDirectory', {path: directoryPath});

        connection.events.on('error', (emitter : any, error : any) => {
            if (input != null) {
                input.select();
            }

            this.setState({
                elements: [],
                selected: new Set(),
                error: error
            });
        });

        connection.events.on('data', (emitter : any, data : any) => {
            if (input != null) {
                input.blur();
            }

            this.currentPath = data.path;

            this.setState({
                locationInputValue: data.path,
                elements: data.elements,
                selected: new Set(),
                error: null
            });

            let parts = data.path.split('/');
            parts = parts[parts.length - 1].split('\\');
            let title = parts[parts.length - 1];

            if (title.length == 0) {
                // This happens on Windows, when the path is "X:\".
                title = data.path;
            }

            this.props.window.setState({title: title});
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

    private onRowDoubleClick(rowIndex : number) {
        if (this.state.elements[rowIndex].type == 'd') {
            this.readDirectory(`${this.currentPath}/${this.state.elements[rowIndex].name}`);
        }
    }

    private onLocationInputChange(e : React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        this.setState({locationInputValue: e.target.value});
        //this.readDirectory(e.target.value);
    }

    private onLocationInputBlur() {
        this.setState({locationInputValue: this.currentPath});
    }

    private onLocationInputKeyPress(e : React.KeyboardEvent<HTMLDivElement>) {
        if (e.key == 'Enter') {
            const input = e.target as HTMLInputElement;
            this.readDirectory(input.value, input);
        }
    }

    componentDidMount() {
        this.readDirectory(this.state.locationInputValue);
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
