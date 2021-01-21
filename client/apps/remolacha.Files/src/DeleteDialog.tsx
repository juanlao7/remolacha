import React from 'react';
import { Dialog, DialogContent, DialogContentText, DialogActions, Button, TextField, LinearProgress } from '@material-ui/core';

interface DeleteDialogProps {
    names : Array<string>;
    loading : boolean;
    onClose : (deleteConfirmed : boolean) => void;
}

interface DeleteDialogState {
    lastKnownNames? : Array<string>;        // To avoid a weird glitch where the text instantly disappears while the dialog is closing.
}

export class DeleteDialog extends React.Component<DeleteDialogProps, DeleteDialogState> {
    constructor(props : DeleteDialogProps) {
        super(props);
        this.state = {lastKnownNames: this.props.names};
    }

    componentDidUpdate(prevProps: Readonly<DeleteDialogProps>) {
        if (prevProps.names == null && this.props.names != null) {
            this.setState({lastKnownNames: this.props.names});
        }
    }

    render() {
        return (
            <Dialog
                open={this.props.names != null}
                disableBackdropClick={this.props.loading}
                disableEscapeKeyDown={this.props.loading}
                onClose={() => this.props.onClose(false)}
            >
                <DialogContent>
                    {this.state.lastKnownNames != null &&
                    <DialogContentText>Delete <strong>{(this.state.lastKnownNames.length == 1) ? this.state.lastKnownNames[0] : `${this.state.lastKnownNames.length} elements`}</strong>?</DialogContentText>}
                </DialogContent>

                <DialogActions>
                    <Button
                        color="primary"
                        disabled={this.props.loading}
                        onClick={() => this.props.onClose(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        color="primary"
                        variant="contained"
                        disabled={this.props.loading}
                        onClick={() => this.props.onClose(true)}
                    >
                        Delete
                    </Button>
                </DialogActions>

                {this.props.loading &&
                <LinearProgress className="remolacha_app_Files_progressBar" />}
            </Dialog>
        );
    }
}
