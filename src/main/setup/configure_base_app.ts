import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import os from 'node:os';
import { optimizer } from '@electron-toolkit/utils';
import { ServerEventController } from '../controllers/server_event_controller';


export function global_config() {
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
}

export function create_main_window(preload:string, index_html:string, sec:ServerEventController) {
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

    sec.configure_main_window(result);
    return result;
}
