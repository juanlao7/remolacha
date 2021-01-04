import React from 'react';
import { Button, CircularProgress, Menu, Typography, CardContent, FormControl, RadioGroup, Radio, FormControlLabel, FormLabel, Divider } from '@material-ui/core';
import { DateTime, Duration } from 'luxon';

interface ClockButtonProps {
    appInstance? : any;
}

interface ClockButtonState {
    timestamp? : number;
    anchorElement? : HTMLElement;
    onTaskbarZone? : string;
}

export default class ClockButton extends React.Component<ClockButtonProps, ClockButtonState> {
    private static readonly REMOTE_UPDATE_INTERVAL = 5000;

    private clientOffset : number;
    private utcOffset : number;
    private zone : string;
    private setTimeInterval : NodeJS.Timeout;

    constructor(props : ClockButtonProps) {
        super(props);

        this.state = {
            timestamp: null,
            anchorElement: null,
            onTaskbarZone: 'server'
        };

        this.clientOffset = null;
        this.utcOffset = null;
        this.zone = null;
        this.setTimeInterval = null;
    }

    private async updateTime() {
        if (!this.props.appInstance.isRunning()) {
            return;
        }

        const response : Response = await this.props.appInstance.callBackend('getCurrentTime');

        if (response.ok) {
            const responseJSON = await response.json();
            this.clientOffset = responseJSON.timestamp - Date.now();
            this.utcOffset = responseJSON.utcOffset;
            this.zone = responseJSON.zone;

            if (this.setTimeInterval == null) {
                this.setTime();
                this.setTimeInterval = setInterval(() => this.setTime(), 1000);
            }

            setTimeout(() => this.updateTime(), ClockButton.REMOTE_UPDATE_INTERVAL);
        }
    }

    private setTime() {
        if (!this.props.appInstance.isRunning()) {
            clearInterval(this.setTimeInterval);
            return;
        }

        if (this.clientOffset != null) {
            this.setState({timestamp: Date.now() + this.clientOffset});
        }
    }

    private getUTCOffsetAsString() {
        const offsetAsString = Duration.fromMillis(Math.abs(this.utcOffset)).toFormat('hh:mm');
        return `UTC${(this.utcOffset < 0) ? '-' : '+'}${offsetAsString}`;
    }

    private z(input : number) : string {
        if (input >= 10) {
            return '' + input;
        }

        return '0' + input;
    }

    private closeMenu() {
        this.setState({anchorElement: null});
    }

    private onButtonClick(e : React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        this.setState({anchorElement: e.currentTarget});
    }

    private onMenuClose() {
        this.closeMenu();
    }

    private onRadioGroupChange(newValue : string) {
        this.setState({onTaskbarZone: newValue});
    }

    componentDidMount() {
        this.updateTime().then()
    }

    render() {
        if (this.clientOffset == null) {
            return (
                <CircularProgress
                    className="remolacha_app_Taskbar_clockLoading"
                    size="25px"
                    color="inherit"
                />
            );
        }

        const utcOffsetString = this.getUTCOffsetAsString();
        const serverDate = DateTime.fromMillis(this.state.timestamp).setZone(utcOffsetString);
        let taskbarDate;

        if (this.state.onTaskbarZone == 'server') {
            taskbarDate = serverDate;
        }
        else if (this.state.onTaskbarZone == 'client') {
            taskbarDate = DateTime.fromMillis(this.state.timestamp);
        }
        else {
            taskbarDate = DateTime.fromMillis(this.state.timestamp).setZone('UTC');
        }

        return (
            <div className="remolacha_app_Taskbar_clockButton">
                <Button color="inherit" onClick={e => this.onButtonClick(e)}>
                    {taskbarDate.toFormat('HH:mm')}
                    <br/>
                    {taskbarDate.toFormat('yyyy-LL-dd')}
                </Button>

                <Menu
                    className="remolacha_app_Taskbar_clockMenu"
                    anchorEl={this.state.anchorElement}
                    keepMounted
                    open={Boolean(this.state.anchorElement)}
                    onClose={() => this.onMenuClose()}
                >
                    <CardContent>
                        <Typography variant="subtitle2">
                            Server date and time
                        </Typography>

                        <Typography variant="h3">
                            {serverDate.toFormat('hh:mm:ss a')}
                        </Typography>

                        <Typography variant="subtitle1">
                            {serverDate.toFormat('cccc, LLLL d, yyyy')}
                        </Typography>

                        <Typography variant="subtitle2" color="textSecondary">
                            {this.zone} ({utcOffsetString})
                        </Typography>

                        <Divider />
                    
                        <FormControl component="fieldset">
                            <FormLabel>
                                <Typography variant="subtitle2" color="textPrimary">
                                    On taskbar
                                </Typography>
                            </FormLabel>

                            <RadioGroup value={this.state.onTaskbarZone} onChange={(e, v) => this.onRadioGroupChange(v)}>
                                <FormControlLabel value="server" control={<Radio />} label="Display in server's timezone" />
                                <FormControlLabel value="client" control={<Radio />} label="Display in client's timezone" />
                                <FormControlLabel value="utc" control={<Radio />} label="Display in UTC" />
                            </RadioGroup>
                        </FormControl>
                    </CardContent>
                </Menu>
            </div>
        );
    }
}