import { const_xprr } from "./constants";
import fs from "node:fs";
import { get_data_dir } from "./xplatform";


// dto object for reading/writing json
class ConfigDTO {
    window_geometry = "";
    user_data_location = "";
    player_highlight_strategy = const_xprr.HIGHLIGHT_CONSISTENT_KILL;
    enemy_highlight_strategy = const_xprr.HIGHLIGHT_FASTEST_KILL;
    consistent_highlight_threshold = 90;
    ignore_accuracy_in_damage_calcs = false;
    force_full_search = false;
    damage_search_depth = 20;
    debug_mode = false;
    auto_switch = true;
    notes_visibility = false;
}

class Config{
    private data:ConfigDTO;

    constructor() {
        this.data = new ConfigDTO();
        this.reload()
    }
    
    reload() {
        try {
            this.data = require(const_xprr.GLOBAL_CONFIG_FILE);
        } catch(e) {
            this.data = new ConfigDTO();
        }
        
        if (this.data.user_data_location.length === 0) {
            this.data.user_data_location = get_data_dir();
        }

        const_xprr.config_user_data_dir(this.data.user_data_location)
    }
    
    _save() {
        if (!fs.existsSync(const_xprr.GLOBAL_CONFIG_DIR)) {
            fs.mkdirSync(const_xprr.GLOBAL_CONFIG_DIR);
        }
        fs.writeFileSync(const_xprr.GLOBAL_CONFIG_FILE, JSON.stringify(this.data, null, 4));
    }

    set window_geometry(new_geometry:string) {
        this.data.window_geometry = new_geometry;
        this._save();
    }
    get window_geometry() {
        return this.data.window_geometry;
    }

    set user_data_dir(new_dir:string) {
        this.data.user_data_location = new_dir;
        const_xprr.config_user_data_dir(new_dir);
        this._save();
    }
    get user_data_dir(){
        return this.data.user_data_location;
    }

    set player_highlight_strategy(strat:string) {
        this.data.player_highlight_strategy = strat;
        this._save();
    }
    get player_highlight_strategy() {
        let result = this.data.player_highlight_strategy;
        if (!const_xprr.ALL_HIGHLIGHT_STRATS.includes(result)) {
            result = const_xprr.HIGHLIGHT_NONE;
        }
        return result;
    }

    set enemy_highlight_strategy(strat:string){
        this.data.enemy_highlight_strategy = strat;
        this._save();
    }
    get enemy_highlight_strategy() {
        let result = this.data.enemy_highlight_strategy;
        if (!const_xprr.ALL_HIGHLIGHT_STRATS.includes(result)) {
            result = const_xprr.HIGHLIGHT_NONE;
        }
        return result;
    }
    

    set consistent_threshold(threshold:number) {
        this.data.consistent_highlight_threshold = threshold;
        this._save();
    }
    get consistent_threshold() {
        let result = this.data.consistent_highlight_threshold;
        if (result < 0 || result > 99) {
            result = 90;
        }
        return result;
    }

    set ignore_accuracy(do_include:boolean) {
        this.data.ignore_accuracy_in_damage_calcs = do_include;
        this._save();
    }
    get ignore_accuracy() {
        return this.data.ignore_accuracy_in_damage_calcs;
    }

    set damage_search_depth(depth:number) {
        this.data.damage_search_depth = depth;
        this._save();
    }
    get damage_search_depth() {
        let result = this.data.damage_search_depth;
        if (result <= 0) {
            result = 20;
        }
        return result;
    }

    set force_full_search(do_force:boolean) {
        this.data.force_full_search = do_force;
        this._save();
    }
    get force_full_search() {
        return this.data.force_full_search;
    }

    set debug_mode(is_debug_mode:boolean) {
        this.data.debug_mode = is_debug_mode;
        this._save();
    }
    get debug_mode() {
        return this.data.debug_mode;
    }

    set auto_switch(do_auto_switch:boolean) {
        this.data.auto_switch = do_auto_switch;
        this._save();
    }
    get auto_switch() {
        return this.data.auto_switch;
    }

    set notes_visibility_in_battle_summary(are_notes_visible:boolean) {
        this.data.notes_visibility = are_notes_visible;
        this._save();
    }
    get notes_visibility_in_battle_summary() {
        return this.data.notes_visibility;
    }
}

export let xp_cfg = new Config();
