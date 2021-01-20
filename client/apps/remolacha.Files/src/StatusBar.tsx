import React from 'react';
import { AppBar, Toolbar, Typography, LinearProgress } from '@material-ui/core';
import prettyBytes from 'pretty-bytes';

interface StatusBarProps {
    currentPath : string;
    elements : Array<any>;
    selected : Map<string, number>;
    error : string;
}

interface StatusBarState {
}

export class StatusBar extends React.Component<StatusBarProps, StatusBarState> {
    constructor(props : StatusBarProps) {
        super(props);
        this.state = {};
    }

    private sumBytes(numbers : Array<number>) : string {
        return prettyBytes(numbers.filter(x => (x != null)).reduce((a, b) => a + b, 0));
    }

    render() {
        return (
            <AppBar className="remolacha_app_Files_statusBar" position="static">
                <Toolbar variant="dense">
                    <Typography variant="body1" color="inherit">
                        {(this.props.error == null) ?
                            (this.props.currentPath == null) ?
                                'Loading...'
                            :
                                (this.props.selected.size == 0) ?
                                    `${this.props.elements.length} element${(this.props.elements.length != 1) ? 's' : ''}, ${this.sumBytes(this.props.elements.map(x => x.size))}`
                                :
                                    `${this.props.selected.size} element${(this.props.selected.size != 1) ? 's' : ''} selected, ${this.sumBytes([...this.props.selected.values()])}`
                        :
                            this.props.error}
                    </Typography>
                </Toolbar>

                {this.props.currentPath == null &&
                <LinearProgress className="remolacha_app_Files_progressBar" color="secondary" />}
            </AppBar>
        );
    }
}
