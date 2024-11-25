import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import os from 'node:os';
import log from 'electron-log';
import { electronApp } from '@electron-toolkit/utils';
import { optimizer } from '@electron-toolkit/utils';
import { set_main_menu } from '@main/setup/build_menu';
import { configure_ipc } from '@main/setup/configure_ipc';
import { configure_updater_on_ready } from '@main/setup/configure_auto_update';
import { ServerEventController } from '@main/controllers/server_event_controller';

let main_window: BrowserWindow | null = null;
const server_events: ServerEventController = new ServerEventController();


export function pre_launch_config(preload:string, index_html:string) {
    if (!app.requestSingleInstanceLock()) {
        app.quit();
        process.exit(0);
    }

    // Disable GPU Acceleration for Windows 7
    if (os.release().startsWith('6.1')) app.disableHardwareAcceleration();
    // Set application name for Windows 10+ notifications
    if (process.platform === 'win32') app.setAppUserModelId(app.getName());


    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    configure_ipc(preload, index_html, server_events);
}


export function post_launch_config(preload:string, index_html:string): BrowserWindow {
    log.info('App ready');
    set_main_menu(server_events);
    electronApp.setAppUserModelId('com.xp_router_redux');
    main_window = create_main_window(preload, index_html);
    configure_updater_on_ready(main_window);

    return main_window;
}


export function create_main_window(preload:string, index_html:string) {
    let result = new BrowserWindow({
        width: 2000,
        height: 1200,
        show: false,
        title: 'XP Router',
        icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
        webPreferences: {
            preload,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        result.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        result.loadFile(index_html);
    }

    result.on('ready-to-show', () => {
        result?.show();
    });

    // Test actively push message to the Electron-Renderer
    result.webContents.on('did-finish-load', () => {
        result?.webContents.send('main-process-message', new Date().toLocaleString());
    });

    // Make all links open with the browser, not with the application
    result.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url);
        return { action: 'deny' };
    });

    server_events.configure_main_window(result);
    return result;
}


export function close_main_window() {
    server_events.configure_main_window(null);
}
