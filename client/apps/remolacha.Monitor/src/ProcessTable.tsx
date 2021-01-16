import React from 'react';
import { AppBar, Button, Toolbar, Typography, Checkbox, LinearProgress } from '@material-ui/core';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

enum KillingState {
    NOT_KILLING,
    KILLING,
    FINISHED_KILLING
}

interface ProcessTableProps {
    appInstance : any;
}

interface ProcessTableState {
    columns? : Array<any>;
    processes? : Array<Array<any>>;
    selected? : Set<number>;
    error? : Error,
    killingState? : KillingState
}

export class ProcessTable extends React.Component<ProcessTableProps, ProcessTableState> {
    private static readonly SELECTED_COLUMN : any = {
        id: 'selected',
        content: null
    };

    private static readonly COLUMNS : Array<any> = [
        {
            id: 'name',
            content: 'Name'
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
            columns: [],
            processes: [],
            selected: new Set(),
            error: null,
            killingState: KillingState.NOT_KILLING
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
        this.setState({killingState: KillingState.KILLING});
        const newState : ProcessTableState = {killingState: KillingState.FINISHED_KILLING};
        const connection = this.props.appInstance.createBackendConnection('killProcesses', {pids: [...this.state.selected]});
        connection.events.on('error', (emitter : any, error : any) => newState.error = error);
        connection.events.on('close', () => this.setState(newState));
        connection.open();
    }

    componentDidMount() {
        const connection = this.props.appInstance.createBackendConnection('getProcesses', null);
        
        connection.events.on('data', (emitter : any, data : any) => {
            const pids = new Set<number>();
            const columns = [ProcessTable.SELECTED_COLUMN];

            for (const column of ProcessTable.COLUMNS) {
                if (column.id in data) {
                    columns.push(column);
                }
            }

            const processes = [];

            for (let i = 0; i < data['pid'].length; ++i) {
                pids.add(data['pid'][i]);
                const process = [];

                for (let j = 1; j < columns.length; ++j) {
                    process.push(data[columns[j].id][i]);
                }

                processes.push(process);
            }

            const newState : ProcessTableState = {
                columns: columns,
                processes: processes
            };

            for (const selectedPID of this.state.selected) {
                if (!pids.has(selectedPID)) {
                    this.state.selected.delete(selectedPID);
                    newState.selected = this.state.selected;
                }
            }

            if (this.state.killingState == KillingState.FINISHED_KILLING) {
                newState.killingState = KillingState.NOT_KILLING;
            }

            this.setState(newState);
        });

        connection.open();
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
                    columns={this.state.columns}
                    rows={this.state.processes.map(process => this.renderRow(process))}
                    size="small"
                    rowKey={(rowIndex : number) => this.state.processes[rowIndex][this.state.processes[rowIndex].length - 1]}
                    rowSelected={(rowIndex : number) => this.state.selected.has(this.state.processes[rowIndex][this.state.processes[rowIndex].length - 1])}
                    onRowClick={(rowIndex : number) => this.onRowClick(rowIndex)}
                />

                <AppBar position="static">
                    <Toolbar variant="dense">
                        <Typography variant="body1" color="inherit">
                            {(this.state.killingState != KillingState.NOT_KILLING) ?
                                `Killing ${this.state.selected.size} process${(this.state.selected.size == 1) ? '' : 'es'}...`
                            :
                                (this.state.error == null) ?
                                    (this.state.selected.size == 0) ?
                                        'Processes running on server-side'
                                    :
                                        `${this.state.selected.size} process${(this.state.selected.size == 1) ? '' : 'es'} selected`
                                :
                                    this.state.error.message}
                        </Typography>

                        {(this.state.selected.size > 0 && this.state.killingState == KillingState.NOT_KILLING) &&
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => this.onKillClick()}
                        >Kill</Button>}
                    </Toolbar>

                    {this.state.killingState != KillingState.NOT_KILLING &&
                    <LinearProgress className="remolacha_app_Monitor_progressBar" color="secondary" />
                    }
                </AppBar>
            </div>
        );
    }
}
