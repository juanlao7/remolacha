import React from 'react';
import { Dialog, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

interface OverwriteDialogProps {
    name : string;
    onClose : (overwrite : boolean) => void;
}

interface OverwriteDialogState {
    lastKnownName? : string;        // To avoid a weird glitch where the text instantly disappears while the dialog is closing.
}

export class OverwriteDialog extends React.Component<OverwriteDialogProps, OverwriteDialogState> {
    constructor(props : OverwriteDialogProps) {
        super(props);
        
        this.state = {lastKnownName: this.props.name};
    }

    componentDidUpdate(prevProps: Readonly<OverwriteDialogProps>) {
        if (prevProps.name == null && this.props.name != null) {
            this.setState({lastKnownName: this.props.name});
        }
    }

    render() {
        return (
            <Dialog
                open={this.props.name != null}
                disableBackdropClick
                disableEscapeKeyDown
                onClose={() => this.props.onClose(false)}
            >
                <DialogContent>
                    <DialogContentText>File <strong>{this.state.lastKnownName}</strong> already exists. Overwrite?</DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button color="primary" onClick={() => this.props.onClose(false)}>
                        No
                    </Button>

                    <Button color="primary" onClick={() => this.props.onClose(true)}>
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
