import { BrowserWindow } from 'electron';
import log from 'electron-log';
import { MainController } from './main_controller';
import { const_xprr } from '../utils/constants';


export class ServerEventController {
    private _main_window:BrowserWindow | null;
    private _main_controller;

    constructor(main_controller:MainController) {
        this._main_window = null;
        this._main_controller = main_controller;
    }

    configure_main_window(main_window:BrowserWindow | null) {
        this._main_window = main_window;
    }

    list_existing_routes() {
        log.info("list existing routes requested");
        this._main_window?.webContents.send('list_existing_routes',
            const_xprr.get_existing_route_names()
        );
    }
}
