import path from 'node:path';
import child_process from 'node:child_process';
import log from 'electron-log';
import os from 'node:os';


const SIMPLE_PLATFORM = os.platform().toLowerCase().replace(/[0-9]/g, "");

export function get_data_dir():string {
    let result = "";
    switch (SIMPLE_PLATFORM) {
        case "win":
            result = process.env.APPDATA || "";
            break;
        case "linux":
            result = process.env.HOME || "";
            if (result.length > 0) {
                result = path.join(result, "/.local/share");
            }
            break;
    }

    if (result === "") throw new Error("Couldn't get data dir for app");

    return result;
}


export function open_explorer(path:string):boolean {
    try {
        let cmd = "";
        switch (SIMPLE_PLATFORM) {
            case "win":
                cmd = "explorer";
                break;
            case "linux":
                cmd = "xdg-open";
                break;
        }

        let process = child_process.spawn(cmd, [path]);
        process.on('error', (err) => {
            log.error(`Failed to open explorer to location: ${err}`)
            process.kill();
            return false;
        });
        
        return true;
    } catch (e) {
        log.error(`Failed to open explorer to location: ${path}`)
        if (e instanceof Error) {
            log.error(e.stack);
        }
        return false;
    }
}