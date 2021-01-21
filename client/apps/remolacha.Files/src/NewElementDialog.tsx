import React from 'react';
import { Dialog, DialogContent, DialogContentText, DialogActions, Button, TextField, LinearProgress } from '@material-ui/core';

interface NewElementDialogProps {
    elementName : string;
    loading : boolean;
    onClose : (name : string) => void;
}

interface NewElementDialogState {
    name? : string;
    lastKnownElementName? : string;        // To avoid a weird glitch where the text instantly disappears while the dialog is closing.
}

export class NewElementDialog extends React.Component<NewElementDialogProps, NewElementDialogState> {
    constructor(props : NewElementDialogProps) {
        super(props);
        
        this.state = {
            name: '',
            lastKnownElementName: this.props.elementName
        };
    }

    private onTextFieldChange(e : React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        this.setState({name: e.target.value});
    }

    private onTextFieldKeyPress(e : React.KeyboardEvent<HTMLDivElement>) {
        if (e.key == 'Enter') {
            this.props.onClose(this.state.name);
        }
    }

    componentDidUpdate(prevProps: Readonly<NewElementDialogProps>) {
        if (prevProps.elementName == null && this.props.elementName != null) {
            this.setState({
                name: '',
                lastKnownElementName: this.props.elementName
            });
        }
    }

    render() {
        return (
            <Dialog
                open={this.props.elementName != null}
                disableBackdropClick={this.props.loading}
                disableEscapeKeyDown={this.props.loading}
                onClose={() => this.props.onClose(null)}
            >
                <DialogContent>
                    <DialogContentText>Create {this.state.lastKnownElementName}?</DialogContentText>

                    <TextField
                        autoFocus
                        variant="filled"
                        label="Name"
                        value={this.state.name}
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
                        onClick={() => this.props.onClose(this.state.name)}
                    >
                        Create
                    </Button>
                </DialogActions>

                {this.props.loading &&
                <LinearProgress className="remolacha_app_Files_progressBar" />}
            </Dialog>
        );
    }
}
