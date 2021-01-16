import React from 'react';
import { Button } from '@material-ui/core';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface TaskButtonProps {
    window? : any                    // TODO: use remolacha.Window
}

interface TaskButtonState {
}

export class TaskButton extends React.Component<TaskButtonProps, TaskButtonState> {
    constructor(props : TaskButtonProps) {
        super(props);

        props.window.events.on('focus', () => this.forceUpdate());
        props.window.events.on('blur', () => this.forceUpdate());
        props.window.events.on('titleChange', () => this.forceUpdate());
    }

    private onClick() {
        const windowState = this.props.window.getState();

        if (windowState.minimized) {
            this.props.window.setState({minimized: false});
            this.props.window.requestFocus();
        }
        else if (!windowState.focused) {
            this.props.window.requestFocus();
        }
        else {
            this.props.window.setState({minimized: true});
        }
    }

    render() {
        const windowState = this.props.window.getState();
        
        if (!windowState.showInTaskbar) {
            return null;
        }

        const buttonClasses = remolacha.utils.generateClassName({
            remolacha_app_Taskbar_taskButton: true,
            remolacha_app_Taskbar_focused: windowState.focused,
            remolacha_app_Taskbar_minimized: windowState.minimized
        });

        return (
            <Button
                className={buttonClasses}
                color="inherit"
                startIcon={<remolacha.RemolachaIcon {...windowState.icon} />}
                onClick={() => this.onClick()}
            >{windowState.title}</Button>
        );
    }
}
