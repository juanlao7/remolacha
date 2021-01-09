import React from 'react';
import { Icon } from '@material-ui/core';
import { IconDefinition } from './IconDefinition';

interface RemolachaIconState {
}

export class RemolachaIcon extends React.Component<IconDefinition, RemolachaIconState> {
    render() : JSX.Element {
        if (this.props == null) {
            return null;
        }

        if (this.props.type == 'material-icon') {
            return <Icon>{this.props.id}</Icon>;
        }
        
        if (this.props.type == 'url') {
            // TODO
        }

        return null;
    }
}