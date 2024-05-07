import { BrowserWindow, ipcMain } from 'electron';


export function configure_ipc(preload:string, index_html:string) {
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
}
