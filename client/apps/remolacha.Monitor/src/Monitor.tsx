import React from 'react';
import { ThemeProvider, AppBar, Tabs, Tab } from '@material-ui/core';
import SwipeableViews from 'react-swipeable-views';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface MonitorProps {
}

interface MonitorState {
    selectedTabIndex? : number;
}

export default class Monitor extends React.Component<MonitorProps, MonitorState> {
    constructor(props: MonitorProps) {
        super(props);
        this.state = {selectedTabIndex: 0};
    }

    private onTabChange(newIndex: number) {
        this.setState({selectedTabIndex: newIndex});
    }

    render() {
        return (
            <ThemeProvider theme={remolacha.theme}>
                <AppBar position="static">
                    <Tabs
                        variant="scrollable"
                        scrollButtons="auto"
                        value={this.state.selectedTabIndex}
                        onChange={(e, x) => this.onTabChange(x)}
                    >
                        <Tab label="Processes" />
                        <Tab label="Resources" />
                        <Tab label="Apps" />
                    </Tabs>
                </AppBar>

                <SwipeableViews index={this.state.selectedTabIndex} onChangeIndex={(x : number) => this.onTabChange(x)}>
                    <div><button>A</button></div>
                    <div>B</div>
                    <div>C</div>
                </SwipeableViews>
            </ThemeProvider>
        );
    }
}
