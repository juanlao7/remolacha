import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

require('./assets/sass/index.sass');

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export default class TerminalAppInitializer {
    async open(appInstance : any, initialize : boolean, params : Map<string, any>) : Promise<void> {
        const content = document.createElement('div');
        content.className = 'remolacha_app_Terminal';

        const window = new remolacha.Window({
            title: 'Terminal',
            content: content,
            icon: {
                type: 'material-icon',
                id: 'computer'
            }
        });

        window.events.on('destroy', () => appInstance.exit());

        await Promise.all([
            appInstance.loadCSS('apps/remolacha.Terminal/bundle.css'),
            appInstance.loadCSS('apps/remolacha.Terminal/xterm.css'),
            appInstance.addWindow(window)
        ]);
        
        const term = new Terminal();
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(content);
        fitAddon.fit();
        window.events.on('resize', () => fitAddon.fit());

        term.writeln('Welcome to xterm.js');
        term.writeln('This is a local terminal emulation, without a real terminal in the back-end.');
        term.writeln('Type some keys and commands to play around.');
        term.writeln('');
        this.prompt(term);

        term.onData(e => {
            switch (e) {
                case '\r': // Enter
                case '\u0003': // Ctrl+C
                this.prompt(term);
                break;
            case '\u007F': // Backspace (DEL)
                // Do not delete the prompt
                if ((term as any)._core.buffer.x > 2) {
                    term.write('\b \b');
                }
                break;
            default: // Print all other characters for demo
                term.write(e);
            }
        });
    }

    prompt(term : Terminal) {
        term.write('\r\n$ ');
    }
}
