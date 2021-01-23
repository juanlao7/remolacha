import React from 'react';
import { Menu, MenuItem, Divider } from '@material-ui/core';
import { Files } from './Files';

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

interface ContextMenuProps {
    open : boolean;
    x : number;
    y : number;
    elements : Array<any>;
    selected : Map<string, number>;
    files : Files;
    onClose : () => void;
}

interface ContextMenuState {
}

export class ContextMenu extends React.Component<ContextMenuProps, ContextMenuState> {
    constructor(props : ContextMenuProps) {
        super(props);
        this.state = {};
    }

    private onNewFileMenuItemClick() {
        this.props.onClose();
        this.props.files.openNewFileDialog();
    }

    private onNewDirectoryMenuItemClick() {
        this.props.onClose();
        this.props.files.openNewDirectoryDialog();
    }

    private onOpenFileMenuItemClick() {
        this.props.onClose();
        const name = this.props.selected.keys().next().value;
        const element = this.props.files.getElementByName(name);

        if (element.type == 'd') {
            this.props.files.readDirectory(this.props.files.resolvePath(name), true);
        }
        else {
            // TODO: open with text editor.
        }
    }

    private onOpenInNewWindowMenuItemClick() {
        this.props.onClose();
        const path = this.props.files.resolvePath(this.props.selected.keys().next().value);
        remolacha.Environment.getInstance().openApp('remolacha.Files', new Map([['cwd', path]]));
    }

    private onOpenAllSelectedMenuItemClick() {
        this.props.onClose();

        for (const name of this.props.selected.keys()) {
            const element = this.props.files.getElementByName(name);
            const path = this.props.files.resolvePath(this.props.selected.keys().next().value);

            if (element.type == 'd') {
                remolacha.Environment.getInstance().openApp('remolacha.Files', new Map([['cwd', path]]));
            }
            else {
                // TODO: open with text editor.
            }
        }
    }

    private onDeleteMenuItemClick() {
        this.props.onClose();
        this.props.files.openDeleteDialog();
    }

    private onRenameMenuItemClick() {
        this.props.onClose();
        this.props.files.openRenameDialog();
    }

    private onOpenTerminalMenuItemClick() {
        this.props.onClose();
        remolacha.Environment.getInstance().openApp('remolacha.Terminal', new Map([['cwd', this.props.files.getCurrentPath()]]));
    }

    render() {
        return (
            <Menu
                anchorReference="anchorPosition"
                anchorPosition={(this.props.x != null) ? {
                    left: this.props.x,
                    top: this.props.y
                } : undefined}
                keepMounted
                open={this.props.open && this.props.x != null}
                onClose={() => this.props.onClose && this.props.onClose()}
            >
                {this.props.selected.size == 0 &&
                <MenuItem onClick={() => this.onNewFileMenuItemClick()}>
                    New file
                </MenuItem>}

                {this.props.selected.size == 0 &&
                <MenuItem onClick={() => this.onNewDirectoryMenuItemClick()}>
                    New directory
                </MenuItem>}

                {this.props.selected.size == 1 &&
                <MenuItem onClick={() => this.onOpenFileMenuItemClick()}>
                    Open
                </MenuItem>}

                {(this.props.selected.size == 1 && this.props.files.getElementByName(this.props.selected.keys().next().value).type == 'd') &&
                <MenuItem onClick={() => this.onOpenInNewWindowMenuItemClick()}>
                    Open in new window
                </MenuItem>}

                {this.props.selected.size > 1 &&
                <MenuItem onClick={() => this.onOpenAllSelectedMenuItemClick()}>
                    Open all selected
                </MenuItem>}

                {(this.props.selected.size > 0 || true) &&
                <Divider className="remolacha_dividerWithMargin" />}

                {this.props.selected.size > 0 &&
                <MenuItem>
                    Cut
                </MenuItem>}

                {this.props.selected.size > 0 &&
                <MenuItem>
                    Copy
                </MenuItem>}

                {(this.props.selected.size == 0 && true) &&
                <MenuItem>
                    Paste
                </MenuItem>}

                {this.props.selected.size > 0 &&
                <Divider className="remolacha_dividerWithMargin" />}

                {this.props.selected.size > 0 &&
                <MenuItem onClick={() => this.onDeleteMenuItemClick()}>
                    Delete
                </MenuItem>}

                {this.props.selected.size == 1 &&
                <MenuItem onClick={() => this.onRenameMenuItemClick()}>
                    Rename
                </MenuItem>}

                {this.props.selected.size == 0 &&
                <Divider className="remolacha_dividerWithMargin" />}

                {this.props.selected.size == 0 &&
                <MenuItem onClick={() => this.onOpenTerminalMenuItemClick()}>
                    Open Terminal here
                </MenuItem>}
            </Menu>
        );
    }
}
