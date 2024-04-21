import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import log from 'electron-log';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { autoUpdater } from 'electron-updater';
import icon from '../../resources/icon.png?asset';

log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
        },
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
}

app.whenReady().then(() => {
    log.info('App ready');
    electronApp.setAppUserModelId('com.xp_router_redux');

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    ipcMain.on('ping', () => console.log('pong'));
    createWindow();
    log.info('Launching check for updates, current version: ' + autoUpdater.currentVersion);
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.checkForUpdates();
    log.info('donezo');

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Launching check for updates');
    log.info(JSON.stringify(info));
    dialog.showMessageBox(
        mainWindow,
        {
            type: 'question',
            message: 'Install Update?',
            detail: 'Update to new version ' + info.version,
            buttons: ['Update', 'Ignore'],
            defaultId: 0,
            cancelId: 1,
        }
    ).then(result => {
        if (result.response == 0) {
            autoUpdater.quitAndInstall();
        }
    });
});
