import { IpcRendererEvent } from "electron/renderer";

// TODO: does this need to be a full class? maybe just a module with a single exported configure function...
// unlclear, revisit later
export class IpcEventController {
    constructor() {
        console.log("defining existing routes");
        window.ipcRenderer.on('list_existing_routes', this.handle_existing_routes);
    }

    handle_existing_routes(event:IpcRendererEvent, value:any) {
        console.log("got existing routes info");
        console.log(value);
    }

}
