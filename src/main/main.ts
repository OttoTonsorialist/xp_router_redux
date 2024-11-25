import 'source-map-support/register';
import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import log from 'electron-log';
import { pre_launch_config, post_launch_config, create_main_window, close_main_window } from './setup/configure_base_app';

log.transports.file.level = 'info';
const __dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.APP_ROOT_DIR = path.join(__dirname, '..');
process.env.DIST_DIR = path.join(process.env.APP_ROOT_DIR, 'dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT_DIR, 'public') : process.env.DIST_DIR;

const preload = path.join(process.env.DIST_DIR, 'preload/preload.js');
const index_html = path.join(process.env.DIST_DIR, 'index.html');

let main_window: BrowserWindow | null = null;

pre_launch_config(preload, index_html);

app.whenReady().then(() => {
    main_window = post_launch_config(preload, index_html)
});


app.on('window-all-closed', () => {
    main_window = null;
    close_main_window();
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
        main_window = create_main_window(preload, index_html);
    }
});
