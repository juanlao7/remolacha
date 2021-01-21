import React from 'react';
import { Dialog, DialogContent, DialogContentText, DialogActions, Button, TextField, LinearProgress } from '@material-ui/core';

interface RenameDialogProps {
    originalName : string;
    loading : boolean;
    onClose : (newName : string) => void;
}

interface RenameDialogState {
    newName? : string;
    lastKnownOriginalName? : string;        // To avoid a weird glitch where the text instantly disappears while the dialog is closing.
}

export class RenameDialog extends React.Component<RenameDialogProps, RenameDialogState> {
    constructor(props : RenameDialogProps) {
        super(props);
        
        this.state = {
            newName: this.props.originalName,
            lastKnownOriginalName: this.props.originalName
        };
    }

    private onTextFieldChange(e : React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        this.setState({newName: e.target.value});
    }

    private onTextFieldKeyPress(e : React.KeyboardEvent<HTMLDivElement>) {
        if (e.key == 'Enter') {
            this.props.onClose(this.state.newName);
        }
    }

    componentDidUpdate(prevProps: Readonly<RenameDialogProps>) {
        if (prevProps.originalName == null && this.props.originalName != null) {
            this.setState({
                newName: this.props.originalName,
                lastKnownOriginalName: this.props.originalName
            });
        }
    }

    render() {
        return (
            <Dialog
                open={this.props.originalName != null}
                disableBackdropClick={this.props.loading}
                disableEscapeKeyDown={this.props.loading}
                onClose={() => this.props.onClose(null)}
            >
                <DialogContent>
                    <DialogContentText>Rename <strong>{this.props.originalName || this.state.lastKnownOriginalName}</strong>?</DialogContentText>

                    <TextField
                        autoFocus
                        variant="filled"
                        label="New name"
                        value={this.state.newName}
                        fullWidth
                        disabled={this.props.loading}
                        onChange={e => this.onTextFieldChange(e)}
                        onFocus={e => e.target.select()}
                        onKeyPress={e => this.onTextFieldKeyPress(e)}
                    />
                </DialogContent>

                <DialogActions>
                    <Button
                        color="primary"
                        disabled={this.props.loading}
                        onClick={() => this.props.onClose(null)}
                    >
                        Cancel
                    </Button>

                    <Button
                        color="primary"
                        variant="contained"
                        disabled={this.props.loading}
                        onClick={() => this.props.onClose(this.state.newName)}
                    >
                        Rename
                    </Button>
                </DialogActions>

                {this.props.loading &&
                <LinearProgress className="remolacha_app_Files_progressBar" />}
            </Dialog>
        );
    }
}
