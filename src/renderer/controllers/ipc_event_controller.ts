import { IpcRendererEvent } from "electron/renderer";
import { route_data } from "@renderer/global_state";

// TODO: does this need to be a full class? maybe just a module with a single exported configure function...
// unlclear, revisit later
export class IpcEventController {
    constructor() {
        console.log("defining existing routes");
        window.ipcRenderer.on('list_existing_routes', this.handle_existing_routes);
    }

    handle_existing_routes(event:IpcRendererEvent, value:string[]) {
        console.log("got existing routes info");
        console.log(value);
        route_data.request_load_modal(value);
    }

}
