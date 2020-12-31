import React from 'react';
import { AppBar, Button, Toolbar, Typography, Checkbox } from '@material-ui/core';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface AppTableProps {
}

interface AppTableState {
    appInstances? : Array<any>;
    selected? : Set<any>;
    error? : Error
}

export default class AppTable extends React.Component<AppTableProps, AppTableState> {
    private static readonly COLUMNS : Array<any> = [
        {
            id: 'selected',
            content: null
        },
        {
            id: 'appName',
            content: 'Name'
        },
        {
            id: 'appId',
            content: 'ID'
        },
        {
            id: 'appInstanceId',
            content: 'Instance ID'
        }
    ];

    constructor(props : AppTableProps) {
        super(props);
        const environment = remolacha.Environment.getInstance();

        this.state = {
            appInstances: environment.getRunningAppInstances(),
            selected: new Set(),
            error: null
        };

        environment.events.on('appInstanceCreate', (emitter : any, appInstance : any) => this.onAppInstanceCreate(appInstance));
        environment.events.on('appInstanceExit', (emitter : any, appInstance : any) => this.onAppInstanceExit(appInstance));
    }

    private onAppInstanceCreate(appInstance : any) {
        this.state.appInstances.push(appInstance);
        this.setState({appInstances: this.state.appInstances});
    }

    private onAppInstanceExit(appInstance : any) {
        const index = this.state.appInstances.indexOf(appInstance);

        if (index < 0) {
            return;
        }

        this.state.appInstances.splice(index, 1);
        const newState : AppTableState = {appInstances: this.state.appInstances};

        if (this.state.selected.has(appInstance)) {
            this.state.selected.delete(appInstance);
            newState.selected = this.state.selected;
        }

        this.setState(newState);
    }

    private onRowClick(rowIndex : number) {
        const appInstance = this.state.appInstances[rowIndex];

        if (this.state.selected.has(appInstance)) {
            this.state.selected.delete(appInstance);
        }
        else {
            this.state.selected.add(appInstance);
        }

        this.setState({
            selected: this.state.selected,
            error: null
        });
    }

    private onKillClick() {
        let error : Error = null;

        for (const appInstance of this.state.selected) {
            try {
                appInstance.exit();
            }
            catch (e) {
                error = e;
            }
        }

        this.setState({error: error});
    }

    private renderRow(appInstance : any) {
        const appManifest = appInstance.getAppManifest();
        const checkbox = <Checkbox size="small" checked={this.state != null && this.state.selected.has(appInstance)} />;
        return [checkbox, appManifest.name, appManifest.id, appInstance.getId()];
    }

    render() {
        return (
            <div className="remolacha_app_Monitor_tableWithFooter">
                <remolacha.DataTable
                    columns={AppTable.COLUMNS}
                    rows={this.state.appInstances.map(appInstance => this.renderRow(appInstance))}
                    size="small"
                    rowKey={(rowIndex : number) => this.state.appInstances[rowIndex].getId()}
                    rowSelected={(rowIndex : number) => this.state.selected.has(this.state.appInstances[rowIndex])}
                    onRowClick={(rowIndex : number) => this.onRowClick(rowIndex)}
                />

                <AppBar position="static">
                    <Toolbar variant="dense">
                        <Typography variant="body1" color="inherit">
                            {(this.state.error == null) ?
                                (this.state.selected.size == 0) ?
                                    'App instances running on client-side'
                                :
                                    `${this.state.selected.size} app instance${(this.state.selected.size == 1) ? '' : 's'} selected`
                            :
                                this.state.error.message}
                        </Typography>

                        {(this.state.selected.size == 0) ?
                            null
                            /*TODO: run remolacha.Runner when that app exists.
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => this.onRunAppClick()}
                            >Run app</Button>*/
                        :
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
