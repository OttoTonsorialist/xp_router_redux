import 'source-map-support/register';
import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import log from 'electron-log';
import { electronApp } from '@electron-toolkit/utils';
import { set_main_menu } from './setup/build_menu';
import { configure_updater_on_ready } from './setup/configure_auto_update';
import { configure_ipc } from './setup/configure_ipc';
import { global_config, create_main_window } from './setup/configure_base_app';
import { MainController } from './controllers/main_controller';
import { ServerEventController } from './controllers/server_event_controller';

log.transports.file.level = 'info';
const __dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.APP_ROOT_DIR = path.join(__dirname, '..');
process.env.DIST_DIR = path.join(process.env.APP_ROOT_DIR, 'dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT_DIR, 'public') : process.env.DIST_DIR;

const preload = path.join(process.env.DIST_DIR, 'preload/preload.js');
const index_html = path.join(process.env.DIST_DIR, 'index.html');

let main_window: BrowserWindow | null = null;
let main_controller: MainController = new MainController()
let server_events: ServerEventController = new ServerEventController(main_controller);

global_config();
configure_ipc(preload, index_html);

async function main() {
    log.info('App ready');
    set_main_menu(server_events);
    electronApp.setAppUserModelId('com.xp_router_redux');
    main_window = create_main_window(preload, index_html, server_events);
    configure_updater_on_ready(main_window);
}

app.whenReady().then(main);

app.on('window-all-closed', () => {
    main_window = null;
    server_events.configure_main_window(main_window);
    if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
    if (main_window) {
        // Focus on the main window if the user tried to open another
        if (main_window.isMinimized()) main_window.restore();
        main_window.focus();
    }
});

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
        main_window = create_main_window(preload, index_html, server_events);
    }
});
