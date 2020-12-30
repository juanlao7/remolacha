import React from 'react';
import { ThemeProvider, AppBar, Tabs, Tab } from '@material-ui/core';
import SwipeableViews from 'react-swipeable-views';
import AppTable from './AppTable';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface MonitorProps {
    window: any;        // TODO: type remolacha.Window
}

interface MonitorState {
    selectedTabIndex? : number;
}

export default class Monitor extends React.Component<MonitorProps, MonitorState> {
    constructor(props: MonitorProps) {
        super(props);
        this.state = {selectedTabIndex: 0};
        this.props.window.events.on('resize', () => this.forceUpdate());    // To update tabs.
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
                        <Tab label="Apps" />
                    </Tabs>
                </AppBar>

                <SwipeableViews
                    className="remolacha_app_Monitor_views"
                    index={this.state.selectedTabIndex}
                    onChangeIndex={(x : number) => this.onTabChange(x)}
                >
                    <div>Processes</div>
                    <AppTable />
                </SwipeableViews>
            </ThemeProvider>
        );
    }
}
