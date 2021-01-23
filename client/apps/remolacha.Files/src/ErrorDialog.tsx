import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

interface ErrorDialogProps {
    error : string;
    onClose : () => void;
}

interface ErrorDialogState {
    lastKnownError? : string;        // To avoid a weird glitch where the text instantly disappears while the dialog is closing.
}

export class ErrorDialog extends React.Component<ErrorDialogProps, ErrorDialogState> {
    constructor(props : ErrorDialogProps) {
        super(props);
        this.state = {lastKnownError: this.props.error};
    }

    componentDidUpdate(prevProps: Readonly<ErrorDialogProps>) {
        if (prevProps.error == null && this.props.error != null) {
            this.setState({lastKnownError: this.props.error});
        }
    }

    render() {
        return (
            <Dialog
                open={this.props.error != null}
                disableBackdropClick
                disableEscapeKeyDown
                onClose={() => this.props.onClose()}
            >
                <DialogTitle>Oops!</DialogTitle>

                <DialogContent>
                    <DialogContentText>{this.state.lastKnownError}</DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button color="primary" onClick={() => this.props.onClose()}>
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
