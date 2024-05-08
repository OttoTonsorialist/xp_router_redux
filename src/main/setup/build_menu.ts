import { Menu } from 'electron';
import { ServerEventController } from '../controllers/server_event_controller';


export function set_main_menu(server_events:ServerEventController){
    Menu.setApplicationMenu(
        Menu.buildFromTemplate([
            {
                label: "File",
                submenu: [
                    { label: "New Route" },
                    {
                        label: "Load Route",
                        accelerator: "Ctrl+L",
                        click: (event, value) => server_events.list_existing_routes()
                    },
                    { label: "Save Route" },
                    { type: "separator" },
                    { label: "Customize DVs" },
                    { label: "Export Notes" },
                    { label: "Screenshot Battle Summary" },
                    { type: "separator" },
                    { label: "Custom Gens" },
                    { label: "App Config" },
                    { label: "Open Data Folder" },
                ]
            },
            {
                label: "Events",
                submenu: [
                    { label: "Move Event Up" },
                    { label: "Move Event Down" },
                    { label: "Enable/Disable" },
                    { label: "Toggle Highlight" },
                    { label: "Transfer Event" },
                    { label: "Delete Event" },
                ]
            },
            {
                label: "Folders",
                submenu: [
                    { label: "New Folder" },
                    { label: "Rename Cur Folder" },
                ]
            },
        ])
    );
}
