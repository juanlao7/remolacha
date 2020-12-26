import React from 'react';
import { Button, Menu, MenuItem, Icon, ListItemIcon } from '@material-ui/core';
import remolachaIconCode from '!raw-loader!../../../icons/remolacha.svg';
import RemolachaIcon from '../../../remolacha/RemolachaIcon';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface StartButtonProps {
}

interface StartButtonState {
    anchorElement : HTMLElement
}

export default class StartButton extends React.Component<StartButtonProps, StartButtonState> {
    constructor(props : StartButtonProps) {
        super(props);
        this.state = {anchorElement: null};
    }

    private renderMenuItem(manifest : any) : JSX.Element {
        if (!manifest.showInAppsMenu) {
            return null;
        }

        return (
            <MenuItem
                className="remolacha_Taskbar_startMenuItem"
                onClick={() => this.openApp(manifest.id)}
            >
                <ListItemIcon>
                    <RemolachaIcon {...manifest.icon} />
                </ListItemIcon>

                {manifest.name}
            </MenuItem>
        );
    }

    private openApp(appId : string) {
        remolacha.Environment.getInstance().openApp(appId);
        this.close();
    }

    private close() {
        this.setState({anchorElement: null});
    }

    render() {
        return (
            <div className="remolacha_Taskbar_startButton">
                <Button
                    onClick={(e) => this.setState({anchorElement: e.currentTarget})}
                    color="inherit"
                >
                    <Icon dangerouslySetInnerHTML={{__html: remolachaIconCode}} />
                </Button>

                <Menu
                    anchorEl={this.state.anchorElement}
                    keepMounted
                    open={Boolean(this.state.anchorElement)}
                    onClose={() => this.close()}
                >
                    {remolacha.Environment.getInstance().getInstalledApps().map((x : any) => this.renderMenuItem(x))}
                </Menu>
            </div>
        );
    }
}