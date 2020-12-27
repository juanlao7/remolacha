import React from 'react';
import { AppBar, Toolbar, Box, Button } from '@material-ui/core';
import StartButton from './StartButton';
import ClockButton from './ClockButton';
import RemolachaIcon from '../../../remolacha/RemolachaIcon';

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
                if (window.getState().showInTaskbar) {
                    this.state.windows.push(window);
                }
            }
        }

        environment.events.on('windowAdd', (emitter : any, window : any) => this.onEnvironmentWindowAdd(window));
        environment.events.on('windowRemove', (emitter : any, window : any) => this.onEnvironmentWindowRemove(window));
    }

    private onEnvironmentWindowAdd(window : any) {
        if (!window.getState().showInTaskbar) {
            return;
        }

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

    private onRenderTaskButtonClick(window : any) {
        if (window.getState().minimized) {
            window.setState({minimized: false});
        }
        else if (false) {
            // TODO: if window is not focused, give focus.
        }
        else {
            window.setState({minimized: true});
        }
    }

    private renderTaskButton(window : any) : JSX.Element {
        const windowState = window.getState();
        
        if (!windowState.showInTaskbar) {
            return null;
        }

        return (
            <Button
                key={window.getId()}
                className="remolacha_app_Taskbar_taskButton"
                color="inherit"
                startIcon={<RemolachaIcon {...windowState.icon} />}
                onClick={() => this.onRenderTaskButtonClick(window)}
            >{windowState.title}</Button>
        );
    }

    render() {
        return (
            <AppBar position="static" className="remolacha_app_Taskbar_appBar">
                <Toolbar variant="dense" disableGutters>
                    <StartButton />

                    <Box flexGrow="1">
                        {this.state.windows.map(x => this.renderTaskButton(x))}
                    </Box>

                    <ClockButton />
                </Toolbar>
            </AppBar>
        );
    }
}
