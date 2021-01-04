import React from 'react';
import { Button, Menu, MenuItem, Icon, ListItemIcon } from '@material-ui/core';
import remolachaIconCode from '!raw-loader!../../../icons/remolacha.svg';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface StartButtonProps {
}

interface StartButtonState {
    anchorElement : HTMLElement;
}

export default class StartButton extends React.Component<StartButtonProps, StartButtonState> {
    constructor(props : StartButtonProps) {
        super(props);
        this.state = {anchorElement: null};
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

    private onMenuItemClick(appId : string) {
        remolacha.Environment.getInstance().openApp(appId);
        this.closeMenu();
    }

    private renderMenuItem(manifest : any) : JSX.Element {
        if (!manifest.showInAppsMenu) {
            return null;
        }

        return (
            <MenuItem
                className="remolacha_app_Taskbar_startMenuItem"
                onClick={() => this.onMenuItemClick(manifest.id)}
            >
                <ListItemIcon>
                    <remolacha.RemolachaIcon {...manifest.icon} />
                </ListItemIcon>

                {manifest.name}
            </MenuItem>
        );
    }

    render() {
        return (
            <div className="remolacha_app_Taskbar_startButton">
                <Button color="inherit" onClick={e => this.onButtonClick(e)}>
                    <Icon dangerouslySetInnerHTML={{__html: remolachaIconCode}} />
                </Button>

                <Menu
                    anchorEl={this.state.anchorElement}
                    keepMounted
                    open={Boolean(this.state.anchorElement)}
                    onClose={() => this.onMenuClose()}
                >
                    {remolacha.Environment.getInstance().getInstalledApps().map((x : any) => this.renderMenuItem(x))}
                </Menu>
            </div>
        );
    }
}