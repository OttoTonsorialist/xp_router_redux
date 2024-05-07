import log from 'electron-log';
import fs from 'node:fs';
import path from 'node:path';


export class MainController {
    private _route_name:string;

    constructor() {
        this._route_name = "";
    }

    load_route(full_path_to_route:string) {
        try {
            let path_info = path.parse(full_path_to_route);
            this._route_name = path_info.name;
            //self._data.load(full_path_to_route);
            //self._selected_ids = [];
        } catch(e) {
            log.error(`Exception ocurred trying to load route: ${full_path_to_route}`);
            if (e instanceof Error) {
                log.error(e.stack);
            }
            this._route_name = ""
            // load an empty route, just in case. Hardcoded, but wtv, Abra is in every game
            //this._data.new_route("Abra")
            throw e;
        }
    }

    set route_name(new_name:string) {
        this._route_name = new_name;
    }
}