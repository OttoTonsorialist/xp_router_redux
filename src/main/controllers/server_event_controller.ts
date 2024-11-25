import { BrowserWindow } from 'electron';
import log from 'electron-log';
import { MainController } from '@main/controllers/main_controller';
import { const_xprr } from '@main/utils/constants';


export class ServerEventController {
    private _main_window:BrowserWindow | null;
    private _main_controller;

    constructor() {
        // TODO: in order to support multiple instances, should pair up windows + controllers
        this._main_window = null;
        this._main_controller = new MainController(this);
    }

    configure_main_window(main_window:BrowserWindow | null) {
        this._main_window = main_window;
    }

    list_existing_routes() {
        log.info("list existing routes requested");
        log.info(`main controller is: ${this._main_controller}`)
        this._main_window?.webContents.send('list_existing_routes',
            const_xprr.get_existing_route_names()
        );
    }

    load_route(route_name:string) {
        log.info(`received event to load route with name: ${route_name}`);
        let final_path = const_xprr.get_existing_route_path(route_name);
        log.info(`received event to load route with name: ${route_name}, which resovled to path: ${final_path}`);
        this._main_controller.load_route(final_path);
        // TODO: try to send it back?
    }
}
