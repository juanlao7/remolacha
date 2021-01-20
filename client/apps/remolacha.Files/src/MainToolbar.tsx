import React from 'react';
import { AppBar, Toolbar, IconButton, Icon, InputBase } from '@material-ui/core';
import { Files } from './Files';

interface MainToolbarProps {
    currentPath : string;
    locationInputValue : string;
    previousPaths : Array<string>;
    nextPaths : Array<string>;
    files : Files;
    onLocationInputChange : (e : React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
    onLocationInputBlur : () => void;
}

interface MainToolbarState {
}

export class MainToolbar extends React.Component<MainToolbarProps, MainToolbarState> {
    constructor(props : MainToolbarProps) {
        super(props);
        this.state = {};
    }

    private canGoBack() : boolean {
        return (this.props.currentPath != null && this.props.previousPaths.length > 1);
    }

    private canGoForward() : boolean {
        return (this.props.currentPath != null && this.props.nextPaths.length > 0);
    }

    private canGoUp() : boolean {
        if (this.props.currentPath == null) {
            return false;
        }

        const [parts] = this.props.files.splitPath(this.props.currentPath);
        return (parts[parts.length - 1].length > 0);
    }

    private onBackButtonClick() {
        this.props.nextPaths.push(this.props.previousPaths.pop());
        this.props.files.readDirectory(this.props.previousPaths[this.props.previousPaths.length - 1], false);
    }

    private onForwardButtonClick() {
        const directoryPath = this.props.nextPaths.pop();
        this.props.files.readDirectory(directoryPath, false);
    }

    private onUpButtonClick() {
        const [parts, separator] = this.props.files.splitPath(this.props.currentPath);
        parts[parts.length - 1] = '';       // We do not remove the element because on Windows we want to go to "X:\", and not "X:".
        this.props.files.readDirectory(parts.join(separator), true);
    }

    private onHomeButtonClick() {
        this.props.files.readDirectory(null, true);
    }

    private onLocationInputKeyPress(e : React.KeyboardEvent<HTMLDivElement>) {
        if (e.key == 'Enter') {
            const input = e.target as HTMLInputElement;
            this.props.files.readDirectory(input.value, true, input);
        }
    }

    render() {
        return (
            <AppBar position="static">
                <Toolbar
                    className="remolacha_app_Files_toolbar"
                    variant="dense"
                    disableGutters
                >
                    <IconButton
                        title="Back"
                        color="inherit"
                        edge="start"
                        disabled={!this.canGoBack()}
                        onClick={() => this.onBackButtonClick()}
                    >
                        <Icon>arrow_back</Icon>
                    </IconButton>

                    <IconButton
                        title="Forward"
                        color="inherit"
                        disabled={!this.canGoForward()}
                        onClick={() => this.onForwardButtonClick()}
                    >
                        <Icon>arrow_forward</Icon>
                    </IconButton>

                    <IconButton
                        title="Go up"
                        color="inherit"
                        disabled={!this.canGoUp()}
                        onClick={() => this.onUpButtonClick()}
                    >
                        <Icon>arrow_upward</Icon>
                    </IconButton>

                    <IconButton
                        title="Go to home directory"
                        color="inherit"
                        disabled={this.props.currentPath == null}
                        onClick={() => this.onHomeButtonClick()}
                    >
                        <Icon>home</Icon>
                    </IconButton>

                    <InputBase
                        className="remolacha_app_Files_locationInput"
                        placeholder="Location"
                        spellCheck="false"
                        value={this.props.locationInputValue}
                        disabled={this.props.currentPath == null}
                        onChange={e => this.props.onLocationInputChange(e)}
                        onBlur={() => this.props.onLocationInputBlur()}
                        onKeyPress={e => this.onLocationInputKeyPress(e)}
                    />
                </Toolbar>
            </AppBar>
        );
    }
}
