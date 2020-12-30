import React from 'react';
import { AppBar, Toolbar, Box } from '@material-ui/core';
import StartButton from './StartButton';
import ClockButton from './ClockButton';
import TaskButton from './TaskButton';

require('./assets/sass/index.sass');

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface TaskbarProps {
}

interface TaskbarState {
    windows? : Array<any>      // TODO: use remolacha.Window
}

export default class Taskbar extends React.Component<TaskbarProps, TaskbarState> {
    constructor(props : TaskbarProps) {
        super(props);

        this.state = {
            windows: new Array<any>()
        };

        const environment = remolacha.Environment.getInstance();

        for (const runningAppInstance of environment.getRunningAppInstances()) {
            for (const window of runningAppInstance.getWindows()) {
                this.state.windows.push(window);
            }
        }

        environment.events.on('windowAdd', (emitter : any, window : any) => this.onEnvironmentWindowAdd(window));
        environment.events.on('windowRemove', (emitter : any, window : any) => this.onEnvironmentWindowRemove(window));
    }

    private onEnvironmentWindowAdd(window : any) {
        this.state.windows.push(window);
        this.setState({windows: this.state.windows});
    }

    private onEnvironmentWindowRemove(window : any) {
        const index = this.state.windows.indexOf(window);

        if (index < 0) {
            return;
        }

        this.state.windows.splice(index, 1);
        this.setState({windows: this.state.windows});
    }

    render() {
        return (
            <AppBar position="static" className="remolacha_app_Taskbar_appBar">
                <Toolbar variant="dense" disableGutters>
                    <StartButton />

                    <div className="remolacha_app_Taskbar_tasks">
                        {this.state.windows.map(window => (
                        <TaskButton key={'' + window.getId()} window={window} />))}
                    </div>

                    <ClockButton />
                </Toolbar>
            </AppBar>
        );
    }
}
