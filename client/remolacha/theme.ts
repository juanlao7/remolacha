import { createMuiTheme } from '@material-ui/core';

export var theme = createMuiTheme({
    palette: {
        primary: {
            main: '#cc2f70',
            light: '#ff669e',
            dark: '#960045'
        },
        secondary: {
            main: '#960045',
            light: '#cc2f70',
            dark: '#62001f'
        }
    },
    overrides: {
        MuiTabs: {
            indicator: {
                height: '3px'
            }
        }
    }
});
