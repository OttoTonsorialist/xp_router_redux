import { sanitize_string } from "main/utils/io_utils";
import { BaseItem, Move, PokemonSpecies, Trainer } from "./universal_data_objects";
import { const_xprr } from "main/utils/constants";


export class MonDatabase {
    private _data:Map<string, PokemonSpecies>;

    constructor(
        data:PokemonSpecies[],
    ) {
        this._data = new Map<string, PokemonSpecies>();
        for (let cur_species of data) this._data.set(sanitize_string(cur_species.name), cur_species);
    }

    validate_moves(move_db:MoveDatabase) {
        let invalid_mons = [] as [string, string][];

        for (let cur_mon of this._data.values()) {
            for (let cur_move of cur_mon.tmhm_moves) {
                if (move_db.get_move(cur_move) === undefined) invalid_mons.push([cur_mon.name, cur_move]);
            }
            for (let [_, cur_move] of cur_mon.levelup_moves) {
                if (move_db.get_move(cur_move) === undefined) invalid_mons.push([cur_mon.name, cur_move]);
            }
        }

        if (invalid_mons.length > 0) {
            throw new TypeError(`Invalid mons detected with unsupported moves: ${invalid_mons}`);
        }
    }

    validate_types(supported_types:string[]) {
        let invalid_mons = [] as [string, string][];

        for (let cur_mon of this._data.values()) {
            if (!supported_types.includes(cur_mon.first_type)) invalid_mons.push([cur_mon.name, cur_mon.first_type]);
            if (!supported_types.includes(cur_mon.second_type)) invalid_mons.push([cur_mon.name, cur_mon.second_type]);
        }

        if (invalid_mons.length > 0) {
            throw new TypeError(`Invalid mons detected with unsupported types: ${invalid_mons}`);
        }
    }

    get_species(name:string) {
        let result = this._data.get(name);
        if (result === undefined) throw new TypeError(`Invalid species: ${name}`);
        return result;
    }

    get_all_names(growth_rate="") {
        let result = [] as string[];
        for (let cur_mon of this._data.values()) {
            if (growth_rate.length === 0 || cur_mon.growth_rate == growth_rate) result.push(cur_mon.name);
        }

        return result;
    }
}


export class TrainerDatabase {
    private _data:Map<string, Trainer>;
    private _id_lookup:Map<number, Trainer>;
    private _loc_oriented_trainers:Map<string, string[]>;
    private _class_oriented_trainers:Map<string, string[]>;

    constructor(
        data:Trainer[],
    ) {
        this._data = new Map<string, Trainer>();
        this._id_lookup = new Map<number, Trainer>();
        this._loc_oriented_trainers = new Map<string, string[]>();
        this._class_oriented_trainers = new Map<string, string[]>();

        for (let cur_trainer of data) {
            this._data.set(sanitize_string(cur_trainer.name), cur_trainer);
            this._id_lookup.set(cur_trainer.trainer_id, cur_trainer);
            if (cur_trainer.location.length > 0) {
                if (!this._loc_oriented_trainers.has(cur_trainer.location)) {
                    this._loc_oriented_trainers.set(cur_trainer.location, [] as string[]);
                }
                this._loc_oriented_trainers.get(cur_trainer.location)!.push(cur_trainer.name);
            }

            if (!this._class_oriented_trainers.has(cur_trainer.trainer_class)) {
                this._class_oriented_trainers.set(cur_trainer.trainer_class, [] as string[]);
            }
            this._class_oriented_trainers.get(cur_trainer.trainer_class)!.push(cur_trainer.name);
        }
    }

    validate_trainers(mon_db:MonDatabase, move_db:MoveDatabase) {
        let invalid_trainers = [] as [string, string, string][];

        for (let cur_trainer of this._data.values()) {
            for (let cur_mon of cur_trainer.mons) {
                if (mon_db.get_species(cur_mon.species) === undefined) {
                    invalid_trainers.push([cur_trainer.name, cur_mon.species, ""]);
                }
                for (let cur_move of cur_mon.move_list) {
                    if (move_db.get_move(cur_move) === undefined) {
                        invalid_trainers.push([cur_trainer.name, cur_mon.species, cur_move]);
                    }
                }
            }
        }

        if (invalid_trainers.length > 0) {
            throw new TypeError(`Invalid trainers found with invalid mons/moves: ${invalid_trainers}`);
        }
    }

    get_trainer(trainer_name:string) {
        let result = this._data.get(sanitize_string(trainer_name));
        if (result === undefined) throw new TypeError(`Invalid trainer: ${trainer_name}`);
        return result;
    }

    get_trainer_by_id(trainer_id:number) {
        return this._id_lookup.get(trainer_id);
    }

    get_all_locations() {
        return Array.from(this._loc_oriented_trainers.keys());
    }

    get_all_classes() {
        return Array.from(this._class_oriented_trainers.keys());
    }

}


export class ItemDatabase {
    private _data:Map<string, BaseItem>;
    private _mart_items:Map<string, string[]>;
    private _key_items:string[];
    private _tms:string[];
    private _other_items:string[];

    constructor(
        data:BaseItem[],
    ){
        this._data = new Map<string, BaseItem>();
        this._mart_items = new Map<string, string[]>();
        this._key_items = [];
        this._tms = [];
        this._other_items = [];

        for (let cur_item of data) {
            this._data.set(sanitize_string(cur_item.name), cur_item);
            let is_other_item = true;
            if (cur_item.is_key_item) {
                this._key_items.push(cur_item.name);
                is_other_item = false;
            }
            if (cur_item.is_tm_hm()) {
                this._tms.push(cur_item.name);
                is_other_item = false;
            }
            if (is_other_item) this._other_items.push(cur_item.name);

            for (let cur_mart of cur_item.marts) {
                if (!this._mart_items.has(cur_mart)) this._mart_items.set(cur_mart, []);
                this._mart_items.get(cur_mart)!.push(cur_item.name);
            }
        }
    }

    validate_tms(move_db:MoveDatabase) {
        let invalid_tms_hms = [] as [string, string][];
        for (let cur_item_name of this._tms) {
            let move_name = this.get_item(cur_item_name).move_name;
            if (move_db.get_move(move_name) === undefined) invalid_tms_hms.push([cur_item_name, move_name]);
        }

        if (invalid_tms_hms.length > 0) throw new TypeError(`Found TM/HM(s) with invalid moves: ${invalid_tms_hms}`);
    }

    get_item(item_name:string): BaseItem {
        let result = this._data.get(item_name);
        if (result === undefined) throw new TypeError(`Invalid item name: ${item_name}`);
        return result;
    }

    get_filtered_names(item_type=const_xprr.ITEM_TYPE_ALL_ITEMS, source_mart=const_xprr.ITEM_TYPE_ALL_ITEMS, name_filter="") {
        let base_list:string[];
        if (item_type === const_xprr.ITEM_TYPE_ALL_ITEMS) {
            base_list = [];
            for (let cur_item of this._data.values()) base_list.push(cur_item.name);
        } else if (item_type === const_xprr.ITEM_TYPE_KEY_ITEMS) base_list = this._key_items;
        else if (item_type === const_xprr.ITEM_TYPE_TM) base_list = this._tms;
        else base_list = this._other_items;

        let result = [] as string[];
        name_filter = sanitize_string(name_filter);
        for (let cur_test of base_list) {
            if (
                (source_mart === const_xprr.ITEM_TYPE_ALL_ITEMS || this._mart_items.get(source_mart)!.includes(cur_test)) &&
                (name_filter.length === 0 || sanitize_string(cur_test).includes(name_filter))
            ) result.push(cur_test);
        }
        return result;
    }

    get_mart_names() {
        return Array.from(this._mart_items.keys());
    }
}


export class MoveDatabase {
    private _data:Map<string, Move>;
    private _stat_mod_moves:Map<string, [string, number][]>;
    private _field_moves:Map<string, Move>;

    constructor(
        data:Move[],
    ) {
        this._data = new Map<string, Move>();
        this._stat_mod_moves = new Map<string, [string, number][]>();

        // parse out stat reduction moves separately so they appear below stat buffing moves
        let stat_reduction_moves = new Map<string, [string, number][]>();
        for  (let cur_move of data) {
            this._data.set(sanitize_string(cur_move.name), cur_move);
            let cur_stat_mods = this._decode_stat_mods(cur_move.effect);
            if (cur_stat_mods.length === 0) break;
            let is_reduction = false;
            for (let [cur_stat, cur_modifier] of cur_stat_mods) {
                if (cur_modifier < 0) is_reduction = true;
            }

            if (is_reduction) stat_reduction_moves.set(sanitize_string(cur_move.name), cur_stat_mods);
            else this._stat_mod_moves.set(sanitize_string(cur_move.name), cur_stat_mods);
        }
        this._stat_mod_moves = new Map<string, [string, number][]>([...this._stat_mod_moves, ...stat_reduction_moves]);

        // set up field moves
        this._field_moves = new Map<string, Move>();
        // TODO: configure moves for real. Right now, just hacking in 2 known cases
        let lightscreen_move = this._data.get("lightscreen");
        if (lightscreen_move !== undefined) {
            this._field_moves.set(sanitize_string(lightscreen_move.move_type), lightscreen_move);
        }
        let reflect_move = this._data.get("reflect");
        if (reflect_move !== undefined) {
            this._field_moves.set(sanitize_string(reflect_move.move_type), reflect_move);
        }
    }

    private _decode_stat_mods(effect:string): [string, number][] {
        // TODO: need to decode all known effects, and return tuples of [modified_stat, modified_quantity]
        throw new TypeError(`Not Implemented`);
    }

    validate_move_types(supported_types:string[]) {
        let invalid_moves = [] as [string, string][];
        for (let cur_move of this._data.values()) {
            if (!supported_types.includes(cur_move.move_type)) {
                invalid_moves.push([cur_move.name, cur_move.move_type]);
            }
        }
        if (invalid_moves.length > 0) {
            throw new TypeError(`Detected moves with invalid types: ${invalid_moves}`);
        }
    }

    get_move(move_name:string): Move {
        let result = this._data.get(sanitize_string(move_name));
        if (result === undefined) throw new TypeError(`Invalid move requested ${move_name}`);
        return result;
    }

    get_stat_mod_names(): string[]{
        let result = [] as string[];
        for (let cur_name of this._stat_mod_moves.keys()) {
            let temp = this.get_move(cur_name);
            if (temp !== undefined) result.push(temp.name);
        }
        return result;
    }

    get_stat_mod(move_name:string): [string, number][] {
        let result = this._stat_mod_moves.get(sanitize_string(move_name));
        if (result === undefined) result = [];
        return result;
    }

    get_filtered_names(filter="") {
        let result = [] as string[];
        if (filter.length === 0) {
            for (let cur_move of this._data.values()) {
                result.push(cur_move.name);
            }
        } else {
            filter = sanitize_string(filter);
            for (let [test_name, test_move] of this._data.entries()) {
                if (test_name.includes(filter)) result.push(test_move.name);
            }
        }

        return result;
    }
}