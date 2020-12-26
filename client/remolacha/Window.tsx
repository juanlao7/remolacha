import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button, Icon } from '@material-ui/core';
import EventManager from './EventManager';
import MaxInstancesReachedError from './MaxInstancesReachedError';
import IconDefinition from './IconDefinition';
import { generateClassName } from './utils';

interface WindowComponentProps {
}

interface WindowComponentState {
    title? : string;
    content? : HTMLElement;
    showInTaskbar? : boolean;
    showFrame? : boolean;
    icon? : IconDefinition;
    x? : number;
    y? : number;
    width? : number;
    height? : number;
    x2? : number;
    y2? : number;
    mouseAnchor? : {
        xDiff : number,
        yDiff : number
    }
}

class WindowComponent extends React.Component<WindowComponentProps, WindowComponentState> {
    constructor(props : WindowComponentProps) {
        super(props);

        this.state = {
            title: '',
            content: null,
            showInTaskbar: true,
            showFrame: true,
            x: 50,
            y: 50,
            width: 640,
            height: 480,
            x2: null,
            y2: null,
            mouseAnchor: null
        };

        document.addEventListener('mouseup', e => this.onDocumentMouseUp(e));
        document.addEventListener('mousemove', e => this.onDocumentMouseMove(e));
    }

    private fillWithContent(container : HTMLDivElement) {
        if (this.state.content != null && container != null) {
            container.appendChild(this.state.content);
        }
    }

    private onToolbarMouseDown(event : React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (event.target != event.currentTarget) {
            return;
        }

        event.preventDefault();

        this.setState({
            mouseAnchor: {
                xDiff: this.state.x - event.clientX,
                yDiff: this.state.y - event.clientY
            }
        });
    }

    private onDocumentMouseUp(event : MouseEvent) {
        if (this.state.mouseAnchor != null) {
            event.preventDefault();
            this.setState({mouseAnchor: null});
        }
    }

    private onDocumentMouseMove(event : MouseEvent) {
        if (this.state.mouseAnchor == null) {
            return;
        }

        event.preventDefault();

        this.setState({
            x: event.clientX + this.state.mouseAnchor.xDiff,
            y: event.clientY + this.state.mouseAnchor.yDiff
        });
    }

    private onMinimizeButtonClick() {
        
    }

    private onMaximizeButtonClick() {
        
    }

    private onCloseButtonClick() {
        
    }

    render() {
        const style : React.CSSProperties = {};

        if (this.state.x != null) {
            style.left = `${this.state.x}px`;
        }

        if (this.state.y != null) {
            style.top = `${this.state.y}px`;
        }

        if (this.state.x2 != null) {
            style.right = `${this.state.x2}px`;
        }
        else if (this.state.width != null) {
            style.width = `${this.state.width}px`;
        }

        if (this.state.y2 != null) {
            style.bottom = `${this.state.y2}px`;
        }
        else if (this.state.height != null) {
            style.height = `${this.state.height}px`;
        }

        const windowClasses = generateClassName({
            remolacha_Window: true,
            remolacha_WindowShowFrame: this.state.showFrame
        });

        return (
            <div className={windowClasses} style={style}>
                <AppBar className="remolacha_topFrame" position="static">
                    <Toolbar
                        variant="dense"
                        disableGutters
                        onMouseDown={e => this.onToolbarMouseDown(e)}
                    >
                        <Box flexGrow="1">
                            <Typography variant="subtitle2" color="inherit">
                                {this.state.title}
                            </Typography>
                        </Box>

                        <Button color="inherit" onClick={() => this.onMinimizeButtonClick()}>
                            <Icon>minimize</Icon>
                        </Button>

                        <Button color="inherit" onClick={() => this.onMaximizeButtonClick()}>
                            <Icon fontSize="small">crop_square</Icon>
                        </Button>

                        <Button color="inherit" onClick={() => this.onCloseButtonClick()}>
                            <Icon>close</Icon>
                        </Button>
                    </Toolbar>
                </AppBar>
                <div ref={x => this.fillWithContent(x)}></div>
            </div>
        );
    }
}

export default class Window {
    static readonly MAX_INSTANCES = Number.MAX_SAFE_INTEGER;

    private static instances : Map<number, Window> = new Map<number, Window>();
    private static lastInstanceId : number = 0;

    readonly events = new EventManager(this);

    private id : number;
    private windowComponent : WindowComponent;
    private jsxElement : JSX.Element;
    private pendingState : WindowComponentState;

    constructor(state : WindowComponentState) {
        this.id = Window.lastInstanceId + 1;

        while (Window.instances.has(this.id) && this.id != Window.lastInstanceId) {
            ++this.id;

            if (this.id >= Window.MAX_INSTANCES) {
                this.id = 0;
            }
        }

        if (this.id == Window.lastInstanceId) {
            throw new MaxInstancesReachedError('window', Window.MAX_INSTANCES);
        }

        Window.lastInstanceId = this.id;
        this.windowComponent = null;
        this.pendingState = {};
        this.jsxElement = <WindowComponent ref={x => this.onRef(x)} />;
        this.setState(state);
    }

    private onRef(windowComponent : WindowComponent) {
        this.windowComponent = windowComponent;
        this.windowComponent.setState(this.pendingState);
    }

    getId() : number {
        return this.id;
    }

    setState(state : WindowComponentState) {
        if (this.windowComponent == null) {
            Object.assign(this.pendingState, state);
        }
        else {
            this.windowComponent.setState(state);
        }
    }

    getState() : WindowComponentState {
        if (this.windowComponent == null) {
            return this.pendingState;
        }

        return this.windowComponent.state;
    }

    getJSXElement() : JSX.Element {
        return this.jsxElement;
    }

    close() {
        this.events.fire('close');
    }
}
