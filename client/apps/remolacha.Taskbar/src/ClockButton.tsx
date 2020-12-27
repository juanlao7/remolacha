import React from 'react';
import { Button } from '@material-ui/core';

interface ClockButtonProps {
}

interface ClockButtonState {
}

export default class ClockButton extends React.Component<ClockButtonProps, ClockButtonState> {
    constructor(props : ClockButtonProps) {
        super(props);
    }

    render() {
        return (
            <Button color="inherit" className="remolacha_app_Taskbar_clockButton">
                19:34
                <br/>
                2020-12-12
            </Button>
        );
    }
}