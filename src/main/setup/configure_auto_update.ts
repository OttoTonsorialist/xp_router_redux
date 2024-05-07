import { BrowserWindow, dialog } from 'electron';
import electron_updater from 'electron-updater';
import log from 'electron-log';


export function configure_updater_on_ready(main_window:BrowserWindow){
    electron_updater.autoUpdater.logger = log;
    electron_updater.autoUpdater.autoInstallOnAppQuit = false;
    log.info('Launching check for updates, current version: ' + electron_updater.autoUpdater.currentVersion);
    electron_updater.autoUpdater.checkForUpdates();

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
}
