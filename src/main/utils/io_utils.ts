import path from 'node:path';
import fs from 'node:fs';


export function sanitize_string(to_sanitize:string):string {
    return to_sanitize.replace(/[^a-z0-9]/gi, '');
}


export function get_path_safe_string(raw_string:string):string {
    return raw_string.replace(/[^a-z0-9]/gi, '_').trim().toLocaleLowerCase();
}


export function get_safe_path_no_collision(base_folder:string, name:string, ext:string=""):string {
    name = get_path_safe_string(name);
    let result = path.join(base_folder, `${name}${ext}`);
    if (fs.existsSync(result)) {
        let counter = 0;
        while (fs.existsSync(result)) {
            counter += 1;
            result = path.join(base_folder, `${name}_${counter}${ext}`);
        }
    }

    return result;
}


export function save_route(data:any, route_name:string, dir_path:string, backup_dir_path:string) {
    if (!fs.existsSync(dir_path)) fs.mkdirSync(dir_path);

    let final_path = path.join(dir_path, `${route_name}.json`);
    backup_file_if_exists(final_path, backup_dir_path);

    fs.writeFileSync(
        final_path,
        JSON.stringify(data, null, 4),
        "utf-8"
    );
}


export function backup_file_if_exists(orig_path:string, backup_dir:string) {
    if (fs.existsSync(orig_path)) {
        let new_backup_loc = get_safe_backup_path(orig_path, backup_dir);
        fs.renameSync(orig_path, new_backup_loc);
    }
}


export function get_safe_backup_path(orig_path:string, backup_dir:string):string {
    if (!fs.existsSync(backup_dir)) {
        fs.mkdirSync(backup_dir);
    }

    let info = path.parse(orig_path);
    let counter = 1;
    while (true) {
        let result = path.join(info.base, `${info.name}_${counter}${info.ext}`);
        if (fs.existsSync(result)) {
            return result;
        }
        counter += 1;
    }
}


export function read_json_file(path:string):any {
    // apparently typescript doesn't like parsing dynamic json files? idk
    // https://stackoverflow.com/a/70602109
    return JSON.parse(
        fs.readFileSync(path, "utf8")
    );
}
