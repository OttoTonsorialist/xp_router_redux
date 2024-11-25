import log from 'electron-log';
import path from 'node:path';
import { ServerEventController } from '@main/controllers/server_event_controller';
import { Router } from '@main/routing/router';


// NOTE: this houses a variety of separate controllers for various things
// This handles the main route interactions, and then just pipes things through to the sub-controllers
export class MainController {
    private _route_name;
    private _server_events;
    private _data;
    private _selected_ids: number[];

    constructor(server_events: ServerEventController) {
        this._route_name = "";
        this._server_events = server_events;
        this._data = new Router();
        this._selected_ids = [];
    }

    load_route(full_path_to_route:string) {
        try {
            log.info(`Trying to load route: ${full_path_to_route}`);
            let path_info = path.parse(full_path_to_route);
            this._route_name = path_info.name;
            this._data.load(full_path_to_route);
            this._selected_ids = [];
        } catch(e) {
            log.error(`Exception ocurred trying to load route: ${full_path_to_route}`);
            if (e instanceof Error) {
                log.error(e.stack);
            }
            this._route_name = ""
            // load an empty route, just in case. Hardcoded, but wtv, Abra is in every game
            this._data.new_route("Abra")
            throw e;
        }
    }

    set route_name(new_name:string) {
        this._route_name = new_name;
    }
}
