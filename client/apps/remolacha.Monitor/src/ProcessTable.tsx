import React from 'react';
import { AppBar, Button, Toolbar, Typography, Checkbox } from '@material-ui/core';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface ProcessTableProps {
}

interface ProcessTableState {
    processes? : Array<Array<any>>;
    selected? : Set<number>;
    error? : Error
}

export default class ProcessTable extends React.Component<ProcessTableProps, ProcessTableState> {
    private static readonly COLUMNS : Array<any> = [
        {
            id: 'selected',
            content: null
        },
        {
            id: 'command',
            content: 'Command'
        },
        {
            id: 'user',
            content: 'User'
        },
        {
            id: 'cpu',
            content: 'CPU'
        },
        {
            id: 'memory',
            content: 'Memory'
        },
        {
            id: 'pid',
            content: 'PID'
        }
    ];

    constructor(props : ProcessTableProps) {
        super(props);
        
        this.state = {
            processes: [],
            selected: new Set(),
            error: null
        };
    }

    private onRowClick(rowIndex : number) {
        const process = this.state.processes[rowIndex];
        const pid : number = process[process.length - 1];

        if (this.state.selected.has(pid)) {
            this.state.selected.delete(pid);
        }
        else {
            this.state.selected.add(pid);
        }

        this.setState({
            selected: this.state.selected,
            error: null
        });
    }

    private onKillClick() {
        let error : Error = null;

        for (const pid of this.state.selected) {
            try {
                // TODO
            }
            catch (e) {
                error = e;
            }
        }

        this.setState({error: error});
    }

    private renderRow(process : Array<any>) {
        const pid = process[process.length - 1];
        const checkbox = <Checkbox size="small" checked={this.state != null && this.state.selected.has(pid)} />;
        return [checkbox, ...process];
    }

    render() {
        return (
            <div className="remolacha_app_Monitor_tableWithFooter">
                <remolacha.DataTable
                    columns={ProcessTable.COLUMNS}
                    rows={this.state.processes.map(process => this.renderRow(process))}
                    size="small"
                    rowKey={(rowIndex : number) => this.state.processes[rowIndex][this.state.processes[rowIndex].length - 1]}
                    rowSelected={(rowIndex : number) => this.state.selected.has(this.state.processes[rowIndex][this.state.processes[rowIndex].length - 1])}
                    onRowClick={(rowIndex : number) => this.onRowClick(rowIndex)}
                />

                <AppBar position="static">
                    <Toolbar variant="dense">
                        <Typography variant="body1" color="inherit">
                            {(this.state.error == null) ?
                                (this.state.selected.size == 0) ?
                                    'Processes running on server-side'
                                :
                                    `${this.state.selected.size} process${(this.state.selected.size == 1) ? '' : 'es'} selected`
                            :
                                this.state.error.message}
                        </Typography>

                        {this.state.selected.size > 0 &&
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => this.onKillClick()}
                        >Kill</Button>}
                    </Toolbar>
                </AppBar>
            </div>
        );
    }
}
