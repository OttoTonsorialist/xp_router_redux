import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import log from 'electron-log';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import electron_updater from 'electron-updater';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT_DIR = path.join(__dirname, '../..');
process.env.DIST_DIR = path.join(process.env.APP_ROOT_DIR, 'dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT_DIR, 'public') : process.env.DIST_DIR;

log.transports.file.level = 'info';
electron_updater.autoUpdater.logger = log;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration();
// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

let main_window: BrowserWindow | null = null;
const preload = path.join(__dirname, '../preload/index.mjs');
const index_html = path.join(process.env.DIST_DIR, 'src', 'renderer', 'index.html');

function createWindow() {
    let result = new BrowserWindow({
        width: 900,
        height: 670,
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
        main_window?.show();
    });

    // Test actively push message to the Electron-Renderer
    result.webContents.on('did-finish-load', () => {
        main_window?.webContents.send('main-process-message', new Date().toLocaleString());
    });

    // Make all links open with the browser, not with the application
    result.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url);
        return { action: 'deny' };
    });
    return result;
}

async function main() {
    log.info('App ready');
    electronApp.setAppUserModelId('com.xp_router_redux');
    main_window = createWindow();
    log.info('Launching check for updates, current version: ' + electron_updater.autoUpdater.currentVersion);
    electron_updater.autoUpdater.autoInstallOnAppQuit = false;
    electron_updater.autoUpdater.checkForUpdates();
}

app.whenReady().then(main);

app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
});

app.on('window-all-closed', () => {
    main_window = null;
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
        createWindow();
    }
});

electron_updater.autoUpdater.on('update-downloaded', (info) => {
    log.info('Launching check for updates');
    log.info(JSON.stringify(info));
    if (main_window === null) {
        log.info("main_window doesn't exist, giving up...");
        return;
    }

    dialog
        .showMessageBox(main_window, {
            type: 'question',
            message: 'Install Update?',
            detail: 'Update to new version ' + info.version,
            buttons: ['Update', 'Ignore'],
            defaultId: 0,
            cancelId: 1,
        })
        .then((result) => {
            if (result.response === 0) {
                electron_updater.autoUpdater.quitAndInstall();
            }
        });
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        childWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#${arg}`);
    } else {
        childWindow.loadFile(index_html, { hash: arg });
    }
});
