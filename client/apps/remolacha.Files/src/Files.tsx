import React from 'react';
import { ThemeProvider, AppBar, Toolbar, IconButton, Icon, InputBase } from '@material-ui/core';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface FilesProps {
    appInstance : any;
    window : any;        // TODO: type remolacha.Window
}

interface FilesState {
    selectedTabIndex? : number;
}

export class Files extends React.Component<FilesProps, FilesState> {
    constructor(props: FilesProps) {
        super(props);
        this.state = {selectedTabIndex: 0};
    }

    render() {
        return (
            <ThemeProvider theme={remolacha.theme}>
                <AppBar position="static">
                    <Toolbar
                        className="remolacha_app_Files_toolbar"
                        variant="dense"
                        disableGutters
                    >
                        <IconButton color="inherit" edge="start">
                            <Icon>arrow_back</Icon>
                        </IconButton>

                        <IconButton color="inherit">
                            <Icon>arrow_forward</Icon>
                        </IconButton>

                        <IconButton color="inherit">
                            <Icon>arrow_upward</Icon>
                        </IconButton>

                        <IconButton color="inherit">
                            <Icon>home</Icon>
                        </IconButton>

                        <InputBase
                            className="remolacha_app_Files_locationInput"
                            placeholder="Location"
                        />
                    </Toolbar>
                </AppBar>
            </ThemeProvider>
        );
    }
}
