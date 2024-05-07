import { app, Menu } from 'electron';

const template: Electron.MenuItemConstructorOptions[] = [
    {
        label: "File",
        submenu: [
            { label: "New Route" },
            { label: "Load Route" },
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
];

export function set_main_menu(){
    Menu.setApplicationMenu(
        Menu.buildFromTemplate(template)
    );
}
