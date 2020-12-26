import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button, Icon } from '@material-ui/core';
import EventManager from './EventManager';
import MaxInstancesReachedError from './MaxInstancesReachedError';
import IconDefinition from './IconDefinition';
import { clamp, generateClassName } from './utils';

interface WindowComponentProps {
}

interface WindowComponentState {
    title? : string;
    content? : HTMLElement;
    showInTaskbar? : boolean;
    showFrame? : boolean;
    sanitizeDimensions? : boolean;
    icon? : IconDefinition;
    x? : number;
    y? : number;
    width? : number;
    height? : number;
    xRight? : number;
    yBottom? : number;
    maximized? : boolean;
    mouseAnchor? : {
        xDiff : number;
        yDiff : number;
    };
    window? : Window;
}

class WindowComponent extends React.Component<WindowComponentProps, WindowComponentState> {
    private static TASKBAR_HEIGHT = 48;
    private static BOTTOM_MARGIN = WindowComponent.TASKBAR_HEIGHT + 32 + 1;     // 32px for appbar, 1px for border.
    private static LEFT_MARGIN = 32 + 32 * 3 + 1;                               // 32px arbitrary, 32px for each button, 1px for border.
    private static RIGHT_MARGIN = 32 + 1;                                       // 32px arbitrary, 1px for border.

    constructor(props : WindowComponentProps) {
        super(props);

        this.state = {
            title: '',
            content: null,
            showInTaskbar: true,
            showFrame: true,
            sanitizeDimensions: true,
            x: 50,
            y: 50,
            width: 640,
            height: 480,
            xRight: null,
            yBottom: null,
            maximized: false,
            mouseAnchor: null,
            window : null
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
        let x = this.state.x;
        let y = this.state.y;
        
        if (this.state.maximized) {
            const width = this.getCurrentWidth();
            
            if (width > event.clientX) {
                x = 0;
            }
            else if (width > document.body.clientWidth - event.clientX) {
                x = document.body.clientWidth - width;
            }
            else {
                x = event.clientX - Math.floor(width / 2);
            }

            y = 0;
        }

        this.setState({
            mouseAnchor: {
                xDiff: x - event.clientX,
                yDiff: y - event.clientY
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
            y: event.clientY + this.state.mouseAnchor.yDiff,
            maximized: false
        });
    }

    private onMinimizeButtonClick() {
        
    }

    private onMaximizeButtonClick() {
        this.setState({maximized: !this.state.maximized});
    }

    private onCloseButtonClick() {
        
    }

    private getCurrentWidth() {
        if (this.state.xRight != null) {
            return (document.body.clientWidth - this.state.xRight) - this.state.x;
        }
        
        if (this.state.width != null) {
            return this.state.width;
        }

        return 0;
    }

    componentDidUpdate() {
        if (!this.state.sanitizeDimensions) {
            return;
        }

        const corrections : WindowComponentState = {};

        if (this.state.x != null) {
            const x = clamp(this.state.x, WindowComponent.LEFT_MARGIN - this.getCurrentWidth(), document.body.clientWidth - WindowComponent.RIGHT_MARGIN);
            
            if (x != this.state.x) {
                corrections.x = x;
            }
        }

        if (this.state.y != null) {
            const y = clamp(this.state.y, 0, document.body.clientHeight - WindowComponent.BOTTOM_MARGIN);

            if (y != this.state.y) {
                corrections.y = y;
            }
        }

        if (Object.keys(corrections).length > 0) {
            this.setState(corrections);
        }
    }

    render() {
        const style : React.CSSProperties = {};

        if (this.state.maximized) {
            style.left = '0';
            style.right = '0';
            style.top = '0';
            style.bottom = `${WindowComponent.TASKBAR_HEIGHT}px`;
        }
        else {
            if (this.state.x != null) {
                style.left = `${this.state.x}px`;
            }
            
            if (this.state.y != null) {
                style.top = `${this.state.y}px`;
            }
            
            if (this.state.xRight != null) {
                style.right = `${this.state.xRight}px`;
            }
            else if (this.state.width != null) {
                style.width = `${this.state.width}px`;
            }

            if (this.state.yBottom != null) {
                style.bottom = `${this.state.yBottom}px`;
            }
            else if (this.state.height != null) {
                style.height = `${this.state.height}px`;
            }
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
                            <Icon fontSize="small">{(this.state.maximized) ? 'filter_none' : 'crop_square'}</Icon>
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
        state.window = this;
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
