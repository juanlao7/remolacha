import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button, Icon } from '@material-ui/core';
import EventManager from './EventManager';
import MaxInstancesReachedError from './MaxInstancesReachedError';
import IconDefinition from './IconDefinition';
import { clamp, generateClassName } from './utils';

interface WindowComponentProps {
    window : Window;
}

type AnchorProperty = 'x' | 'y' | 'width' | 'height' | 'xRight' | 'yBottom';

interface WindowComponentState {
    title? : string;
    content? : HTMLElement;
    showInTaskbar? : boolean;
    showFrame? : boolean;
    resizable? : boolean;
    preventGoingOutOfWindow? : boolean;
    icon? : IconDefinition;
    x? : number;
    y? : number;
    width? : number;
    height? : number;
    xRight? : number;
    yBottom? : number;
    minWidth? : number;
    minHeight? : number;
    minimized? : boolean;
    maximized? : boolean;
}

class WindowComponent extends React.Component<WindowComponentProps, WindowComponentState> {
    private static TASKBAR_HEIGHT = 48;
    private static BOTTOM_MARGIN = WindowComponent.TASKBAR_HEIGHT + 32;     // 32px for appbar.
    private static LEFT_MARGIN = 32 + 32 * 3;                               // 32px arbitrary, 32px for each button.
    private static RIGHT_MARGIN = 32;                                       // 32px arbitrary.
    private static MIN_SIZE = WindowComponent.LEFT_MARGIN;

    private anchorUpdate : (newMouseX : number, newMouseY : number) => void;
    private anchorStoredState : any;

    constructor(props : WindowComponentProps) {
        super(props);
        this.anchorUpdate = null;
        this.anchorStoredState = null;

        this.state = {
            title: '',
            content: null,
            showInTaskbar: true,
            showFrame: true,
            resizable: true,
            preventGoingOutOfWindow: true,
            x: 50,
            y: 50,
            width: 640,
            height: 480,
            xRight: null,
            yBottom: null,
            minWidth: WindowComponent.MIN_SIZE,
            minHeight: WindowComponent.MIN_SIZE,
            minimized: false,
            maximized: false
        };

        // TODO: remove these listeners when the window is closed.
        document.addEventListener('mouseup', e => this.onDocumentMouseUp(e));
        document.addEventListener('mousemove', e => this.onDocumentMouseMove(e));
        window.addEventListener('resize', () => this.forceUpdate());
    }

    private fillWithContent(container : HTMLDivElement) {
        if (this.state.content != null && container != null) {
            container.appendChild(this.state.content);
        }
    }

    private getVerticalPositionBounds() : [number, number] {
        if (!this.state.preventGoingOutOfWindow) {
            return null;
        }

        return [0, document.body.clientHeight - WindowComponent.BOTTOM_MARGIN]
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

    private onDocumentMouseUp(event : MouseEvent) {
        if (this.anchorUpdate != null) {
            event.preventDefault();
            this.anchorUpdate = null;
            this.anchorStoredState = null;
        }
    }

    private onDocumentMouseMove(event : MouseEvent) {
        if (this.anchorUpdate == null) {
            return;
        }

        event.preventDefault();
        this.anchorUpdate(event.clientX, event.clientY);
    }

    private anchorMoveUpdate(newMouseX : number, newMouseY : number) {
        this.setState({
            x: this.anchorStoredState.x + newMouseX,
            y: this.anchorStoredState.y + newMouseY,
            maximized: false
        });
    }

    private anchorResizeUpdateImpl(newState : WindowComponentState, diff : number, startProperty : string, endProperty : string, positionProperty : AnchorProperty, dimensionProperty : AnchorProperty, positionBounds : [number, number], minDimension : number) {
        // TODO: handle xRight and yBottom.

        if (this.anchorStoredState[startProperty]) {
            newState[positionProperty] = this.anchorStoredState[positionProperty] + diff;

            if (positionBounds != null && positionBounds[0] <= positionBounds[1]) {
                // Handling this.state.preventGoingOutOfWindow.
                
                if (newState[positionProperty] < positionBounds[0]) {
                    diff += positionBounds[0] - newState[positionProperty];
                    newState[positionProperty] = positionBounds[0];
                }
                else if (newState[positionProperty] > positionBounds[1]) {
                    diff += positionBounds[1] - newState[positionProperty];
                    newState[positionProperty] = positionBounds[1];
                }
            }
            
            if (this.anchorStoredState[dimensionProperty] != null) {
                newState[dimensionProperty] = this.anchorStoredState[dimensionProperty] - diff;

                if (newState[dimensionProperty] < minDimension) {
                    // Avoiding negative dimensions.
                    newState[positionProperty] -= minDimension - newState[dimensionProperty];
                    newState[dimensionProperty] = minDimension;
                }
            }
        }
        else if (this.anchorStoredState[endProperty]) {
            if (this.anchorStoredState[dimensionProperty] != null) {
                // Negative dimensions are handled in componentDidUpdate.
                newState[dimensionProperty] = this.anchorStoredState[dimensionProperty] + diff;
            }
        }
    }

    private anchorResizeUpdate(newMouseX : number, newMouseY : number) {
        const newState : WindowComponentState = {maximized: false};
        this.anchorResizeUpdateImpl(newState, newMouseX - this.anchorStoredState.mouseX, 'left', 'right', 'x', 'width', null, this.state.minWidth);
        this.anchorResizeUpdateImpl(newState, newMouseY - this.anchorStoredState.mouseY, 'top', 'bottom', 'y', 'height', this.getVerticalPositionBounds(), this.state.minHeight);
        this.setState(newState);
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
            const halfWidth = Math.floor(width / 2);
            
            if (halfWidth > event.clientX) {
                x = 0;
            }
            else if (halfWidth > document.body.clientWidth - event.clientX) {
                x = document.body.clientWidth - width;
            }
            else {
                x = event.clientX - halfWidth;
            }

            y = 0;
        }

        this.anchorUpdate = this.anchorMoveUpdate;

        this.anchorStoredState = {
            x: x - event.clientX,
            y: y - event.clientY
        };
    }

    private onToolbarDoubleClick(event : React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (event.target != event.currentTarget || !this.state.resizable) {
            return;
        }

        this.setState({maximized: !this.state.maximized});
    }

    private onMinimizeButtonClick() {
        this.setState({minimized: true});
    }

    private onMaximizeButtonClick() {
        this.setState({maximized: !this.state.maximized});
    }

    private onCloseButtonClick() {
        
    }

    private onResizerMouseDown(event : React.MouseEvent<HTMLDivElement, MouseEvent>, top : boolean, right : boolean, bottom : boolean, left : boolean) {
        event.preventDefault();
        
        this.anchorUpdate = this.anchorResizeUpdate;

        this.anchorStoredState = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            x: this.state.x,
            y: this.state.y,
            width: this.state.width,
            height: this.state.height,
            xRight: this.state.xRight,
            yBottom: this.state.yBottom,
            top: top,
            right: right,
            bottom: bottom,
            left : left
        };
    }

    componentDidUpdate() {
        const corrections : WindowComponentState = {};

        if (this.state.width < this.state.minWidth) {
            corrections.width = this.state.minWidth;
        }

        if (this.state.height < this.state.minHeight) {
            corrections.height = this.state.minHeight;
        }

        if (Object.keys(corrections).length > 0) {
            this.setState(corrections);
            return;     // We set the new width and height before checking more constraints.
        }

        if (!this.state.preventGoingOutOfWindow) {
            return;
        }

        if (this.state.x != null) {
            const x = clamp(this.state.x, WindowComponent.LEFT_MARGIN - this.getCurrentWidth(), document.body.clientWidth - WindowComponent.RIGHT_MARGIN);
            
            if (x != this.state.x) {
                corrections.x = x;
            }
        }

        if (this.state.y != null) {
            const bounds = this.getVerticalPositionBounds();
            const y = clamp(this.state.y, bounds[0], bounds[1]);

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
            remolacha_Window_showFrame: this.state.showFrame,
            remolacha_Window_minimized: this.state.minimized,
            remolacha_Window_maximized: this.state.maximized
        });

        return (
            <div className={windowClasses} style={style}>
                {this.state.showFrame && 
                <AppBar className="remolacha_Window_topFrame" position="static">
                    <Toolbar
                        variant="dense"
                        disableGutters
                        onMouseDown={e => this.onToolbarMouseDown(e)}
                        onDoubleClick={e => this.onToolbarDoubleClick(e)}
                    >
                        <Box flexGrow="1">
                            <Typography variant="subtitle2" color="inherit">
                                {this.state.title}
                            </Typography>
                        </Box>

                        <Button color="inherit" onClick={() => this.onMinimizeButtonClick()}>
                            <Icon>minimize</Icon>
                        </Button>

                        {this.state.resizable &&
                        <Button color="inherit" onClick={() => this.onMaximizeButtonClick()}>
                            <Icon fontSize="small">{(this.state.maximized) ? 'filter_none' : 'crop_square'}</Icon>
                        </Button>}

                        <Button color="inherit" onClick={() => this.onCloseButtonClick()}>
                            <Icon>close</Icon>
                        </Button>
                    </Toolbar>
                </AppBar>}

                <div className="remolacha_Window_content" ref={x => this.fillWithContent(x)}></div>

                {this.state.showFrame && this.state.resizable && !this.state.maximized &&
                <div className="remolacha_Window_resizers">
                    <div className="remolacha_Window_topResizer" onMouseDown={e => this.onResizerMouseDown(e, true, false, false, false)} />
                    <div className="remolacha_Window_rightResizer" onMouseDown={e => this.onResizerMouseDown(e, false, true, false, false)} />
                    <div className="remolacha_Window_bottomResizer" onMouseDown={e => this.onResizerMouseDown(e, false, false, true, false)} />
                    <div className="remolacha_Window_leftResizer" onMouseDown={e => this.onResizerMouseDown(e, false, false, false, true)} />

                    <div className="remolacha_Window_topRightResizer" onMouseDown={e => this.onResizerMouseDown(e, true, true, false, false)} />
                    <div className="remolacha_Window_bottomRightResizer" onMouseDown={e => this.onResizerMouseDown(e, false, true, true, false)} />
                    <div className="remolacha_Window_topLeftResizer" onMouseDown={e => this.onResizerMouseDown(e, true, false, false, true)} />
                    <div className="remolacha_Window_bottomLeftResizer" onMouseDown={e => this.onResizerMouseDown(e, false, false, true, true)} />
                </div>}
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
        this.jsxElement = <WindowComponent window={this} ref={x => this.onRef(x)} />;
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
