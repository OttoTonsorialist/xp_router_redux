import { CurrentGen } from "@main/mon/generation";
import log from 'electron-log';
import { const_xprr } from "@main/utils/constants";
import { read_json_file } from "@main/utils/io_utils";
import fs from 'node:fs';
import path from 'node:path';

class CustomGenInfo {
    path: string;
    base_version:string;
    name: string;
    constructor(path: string, base_version:string, name: string) {
        this.path = path;
        this.base_version = base_version;
        this.name = name;
    }
}


class GenFactory {
    private _all_gens:Map<string, CurrentGen>;
    private _custom_gens:Map<string, CurrentGen>;
    private _cur_gen:CurrentGen | null;
    private _cur_version:string;

    constructor(){
        this._all_gens = new Map<string, CurrentGen>();
        this._custom_gens = new Map<string, CurrentGen>();
        this._cur_gen = null;
        this._cur_version = "";
    }

    register_gen(gen_name:string, gen:CurrentGen) {
        this._all_gens.set(gen_name, gen);
    }

    get_cur_gen():CurrentGen {
        if (this._cur_gen === null) throw new TypeError(`Cannot access current gen before app has finished initializing`);
        return this._cur_gen;
    }

    get_specific_version(version_name:string) {
        if (this._all_gens.has(version_name)) return this._all_gens.get(version_name);
        return this._custom_gens.get(version_name);
    }

    change_version(new_version_name:string) {
        log.info(`Changing to version: ${new_version_name}`);
        if (new_version_name == this._cur_version) return;

        let new_gen = this.get_specific_version(new_version_name);
        if (new_gen === undefined) throw new TypeError(`Unknown version: ${new_version_name}`);

        this._cur_gen = new_gen;
        this._cur_version = new_version_name;
    }

    get_gen_names(real_gens=true, custom_gens=true):string[] {
        let result = [] as string[];
        if (real_gens) result.push(...this._all_gens.keys());
        if (custom_gens) result.push(...this._custom_gens.keys());

        return result;
    }

    reload_all_custom_gens() {
        // NOTE: assumes all base versions have been registered already
        let invalid_custom_gens = [] as [string, string][];
        this._custom_gens = new Map<string, CurrentGen>();
    }

    get_all_custom_gen_info():CustomGenInfo[] {
        let result = [] as CustomGenInfo[];
        if (!fs.existsSync(const_xprr.CUSTOM_GENS_DIR)) return result;

        fs.readdirSync(const_xprr.CUSTOM_GENS_DIR, {recursive: false}).forEach(fragment => {
            if (fragment instanceof Buffer) return;
            let cur_folder_path = path.join(const_xprr.CUSTOM_GENS_DIR, fragment);
            if (!fs.lstatSync(cur_folder_path).isDirectory()) return;

            try {
                let raw_data = read_json_file(path.join(cur_folder_path, const_xprr.CUSTOM_GEN_META_FILE_NAME));
                result.push(
                    new CustomGenInfo(
                        cur_folder_path,
                        raw_data[const_xprr.CUSTOM_GEN_NAME_KEY],
                        raw_data[const_xprr.BASE_GEN_NAME_KEY],
                    )
                );
            } catch(e) {
                log.error(`Failed to load metadata for custom gen with path: ${cur_folder_path}`);
                if (e instanceof Error) log.error(e.stack);
            }
        });

        return result;
    }
}

const _gen_factory = new GenFactory();

export function cur_gen() {
    return _gen_factory.get_cur_gen();
}

export function change_version(new_version_name:string) {
    return _gen_factory.change_version(new_version_name);
}

export function specific_gen(version_name:string) {
    return _gen_factory.get_specific_version(version_name);
}

export function register_gen(version_name:string, gen:CurrentGen) {
    return _gen_factory.register_gen(version_name,gen);
}