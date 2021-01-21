import { TypeTools } from 'remolacha-commons';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

const XtermWebfont = require('xterm-webfont');

require('./assets/sass/index.sass');

declare var remolacha : any;        // TODO: https://github.com/juanlao7/remolacha/issues/1

export class TerminalAppInitializer {
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
        
        const term = new Terminal({
            fontFamily: 'Roboto Mono',
            fontSize: 14
        });
        
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.loadAddon(new XtermWebfont());
        await (term as any).loadWebfontAndOpen(content);

        fitAddon.fit();
        window.events.on('resize', () => fitAddon.fit());
        window.events.on('focus', () => term.focus());

        const cwd : string = params.get('cwd');

        const connection = appInstance.createBackendConnection('openShell', {
            columns: term.cols,
            rows: term.rows,
            cwd: (TypeTools.isString(cwd)) ? cwd : null
        });

        connection.events.on('data', (emitter : any, data : any) => term.write(data));
        connection.events.once('close', () => window.destroy());

        term.onData(data => connection.send({
            type: 'content',
            content: data
        }));

        term.onResize(size => connection.send({
            type: 'size',
            columns: size.cols,
            rows: size.rows
        }));

        connection.open();
        term.focus();
    }
}
