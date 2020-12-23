const React = window.React;

export interface WindowParams {
    // TODO
}

interface WindowComponentProps {
}

interface WindowComponentState {
    content? : HTMLElement;
}

class WindowComponent extends React.Component<WindowComponentProps, WindowComponentState> {
    constructor(props : WindowComponentProps) {
        super(props);
        this.setState({content: null});
    }

    private fillWithContent(container : HTMLDivElement) {
        if (this.state.content != null) {
            container.appendChild(this.state.content);
        }
    }

    render() {
        if (this.state == null) {
            // First render has state == null and I don't know why.
            return null;
        }

        return (
            <div ref={x => this.fillWithContent(x)}></div>
        );
    }
}

export class Window {
    private windowComponent : WindowComponent;
    private jsxElement : JSX.Element;
    private pendingState : WindowComponentState;

    constructor(params : WindowParams) {
        this.windowComponent = null;
        this.pendingState = {};
        this.jsxElement = <WindowComponent ref={x => this.onRef(x)} />;
    }

    private setState(state : WindowComponentState) {
        if (this.windowComponent == null) {
            Object.assign(this.pendingState, state);
        }
        else {
            this.windowComponent.setState(state);
        }
    }

    private onRef(windowComponent : WindowComponent) {
        this.windowComponent = windowComponent;
        this.windowComponent.setState(this.pendingState);
    }

    getJSXElement() : JSX.Element {
        return this.jsxElement;
    }

    setContent(content : HTMLElement) {
        this.setState({content: content});
    }

    close() {
        // TODO: emit close event.
    }

    maximize() {
        // TODO: emit maximize event.
    }

    restoreDown() {
        // TODO: emit restoreDown event.
    }

    minimize() {
        // TODO: emit minimize event.
    }

    isMinimized() : boolean {
        // TODO
        return false;
    }

    isMaximized() : boolean {
        // TODO
        return false;
    }

    move(x : number, y : number) {
        // TODO
    }

    resize(width : number, height : number) {
        // TODO
    }  
}
