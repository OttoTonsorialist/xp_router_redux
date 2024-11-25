import { const_xprr } from "@main/utils/constants";
import { RouteState, SoloMon } from "@main/routing/full_route_state";
import { BaseEvent, EventFolder, EventGroup, EventItem } from "./route_events";
import { BaseEventDefinition, LearnMoveEventDefinition, LevelUpKey, TrainerEventDefinition, event_factory } from "@main/routing/event_definition";
import { change_version, cur_gen } from "@main/mon/gen_factory";
import { Nature, PokemonSpecies, StatBlock } from "@main/mon/universal_data_objects";
import { read_json_file, save_route } from "@main/utils/io_utils";


export class Router {
    init_route_state:(RouteState | null);
    game_version:string;
    root_folder:EventFolder;
    folder_lookup:Map<string, EventFolder>;
    event_lookup:Map<number, BaseEvent>;
    level_up_move_defs:Map<LevelUpKey, LearnMoveEventDefinition>;
    defeated_trainers:Set<string>;

    constructor() {
        this.init_route_state = null;
        this.game_version = "";
        this.root_folder = new EventFolder(null, const_xprr.ROOT_FOLDER_NAME, "");
        this.folder_lookup = new Map();
        this.folder_lookup.set(const_xprr.ROOT_FOLDER_NAME, this.root_folder);
        this.event_lookup = new Map();
        this.level_up_move_defs = new Map();
        this.defeated_trainers = new Set();
    }

    private _reset_events() {
        this.root_folder = new EventFolder(null, const_xprr.ROOT_FOLDER_NAME, "");
        this.folder_lookup = new Map();
        this.folder_lookup.set(const_xprr.ROOT_FOLDER_NAME, this.root_folder);
        this.event_lookup = new Map();
        this.defeated_trainers = new Set();
    }

    private _change_version(new_version:string) {
        this.game_version = new_version;
        change_version(new_version);
    }

    get_event_object(event_id:number): BaseEvent | undefined {
        return this.event_lookup.get(event_id);
    }

    get_final_state(): RouteState | null {
        if (this.root_folder.children.length > 0) return this.root_folder.final_state;
        return this.init_route_state;
    }

    set_solo_mon(
        mon_name:string,
        level_up_moves:(LearnMoveEventDefinition[] | null)=null,
        custom_dvs:(Map<string, number> | null)=null,
        custom_ability_idx=0,
        custom_nature:Nature=Nature.Hardy,
    ) {
        let base_mon = cur_gen().mon_db().get_species(mon_name);

        let dvs_statblock:StatBlock;
        if (custom_dvs !== null) {
            dvs_statblock = cur_gen().make_stat_block(
                custom_dvs.get(const_xprr.HP)!,
                custom_dvs.get(const_xprr.ATTACK)!,
                custom_dvs.get(const_xprr.DEFENSE)!,
                custom_dvs.get(const_xprr.SPECIAL_ATTACK)!,
                custom_dvs.get(const_xprr.SPECIAL_DEFENSE)!,
                custom_dvs.get(const_xprr.SPEED)!,
            );
        } else {
            if (cur_gen().get_generation() <= 2) {
                dvs_statblock = cur_gen().make_stat_block(15, 15, 15, 15, 15, 15);
            } else {
                dvs_statblock = cur_gen().make_stat_block(31, 31, 31, 31 ,31, 31);
            }
        }

        this.init_route_state = new RouteState(
            new SoloMon(
                mon_name,
                base_mon,
                dvs_statblock,
                cur_gen().make_badge_list(),
                cur_gen().make_stat_block(0, 0, 0, 0, 0, 0, true),
                custom_ability_idx,
                custom_nature
            ),
            cur_gen().make_inventory(),
        );

        if (level_up_moves === null) {
            this.level_up_move_defs = new Map();
        } else {
            this.level_up_move_defs = level_up_moves.reduce(
                (result, x) => {
                    result.set(x.get_level_up_key(), x);
                    return result;
                },
                new Map<LevelUpKey, LearnMoveEventDefinition>(),
            );
        }
        this._add_level_up_moves_for_mon(base_mon);

        this._recalc();
    }

    private _add_level_up_moves_for_mon(mon:PokemonSpecies) {
        for (let cur_move of mon.levelup_moves) {
            let cur_def = new LearnMoveEventDefinition(
                cur_move[1],
                null,
                const_xprr.MOVE_SOURCE_LEVELUP,
                cur_move[0],
                mon.name
            );
            let cur_key = cur_def.get_level_up_key();
            if (!this.level_up_move_defs.has(cur_key)) {
                this.level_up_move_defs.set(cur_key, cur_def);
            }
        }
    }

    change_innate_stats(new_dvs:StatBlock, new_ability_idx:number, new_nature:Nature) {
        if (this.init_route_state === null) return;
        let cur_mon = this.init_route_state.solo_mon;

        this.init_route_state = new RouteState(
            new SoloMon(
                cur_mon.name,
                cur_mon.species_def,
                new_dvs,
                this.init_route_state.solo_mon.badges,
                cur_gen().make_stat_block(0, 0, 0, 0, 0, 0, true),
                new_ability_idx,
                new_nature,
            ),
            this.init_route_state.inventory,
        );
        this._recalc();
    }

    private _recalc() {
        if (this.init_route_state === null) return;
        // TODO: only recalc what's necessary, based on a passed-in index
        // TODO: need to figure out how to determine that index
        // TODO: would also need to only partially update map... seems hard
        this.root_folder.apply(this.init_route_state!, this.level_up_move_defs);
        this.event_lookup = new Map();
        this._build_lookup(this.root_folder);
    }

    private _build_lookup(event_obj:BaseEvent) {
        if (!(event_obj instanceof EventFolder)) this.event_lookup.set(event_obj.event_id, event_obj);
        for (let cur_child of event_obj.children) this._build_lookup(cur_child);
    }

    private _handle_adding_trainer_event(event_def:BaseEventDefinition) {
        if (event_def instanceof TrainerEventDefinition) {
            if (!event_def.get_first_trainer_obj().refightable) this.defeated_trainers.add(event_def.trainer_name);
            let second_trainer = event_def.get_second_trainer_obj();
            if (second_trainer !== null && !second_trainer.refightable) this.defeated_trainers.add(event_def.trainer_name);
        }
    }

    add_event_object(
        event_def:(BaseEventDefinition | null)=null,
        new_folder_name="",
        insert_before=-1,
        insert_after=-1,
        dest_folder_name=const_xprr.ROOT_FOLDER_NAME,
        folder_expanded=true,
        folder_enabled=true,
        recalc=true,
    ): number {
        if (this.init_route_state === null) throw new TypeError(`Cannot add an event when solo mon is not yet selected`);
        if (event_def === null && new_folder_name.length === 0) throw new TypeError(`Must define either folder name or event definition`);

        let parent_obj:(EventFolder | null | undefined)=null;
        let insert_after_obj = this.get_event_object(insert_after);
        let insert_before_obj = this.get_event_object(insert_before);
        if (insert_after_obj !== undefined && !(insert_after_obj instanceof EventItem)) parent_obj = insert_after_obj.parent;
        else if (insert_before_obj !== undefined && !(insert_before_obj instanceof EventItem)) parent_obj = insert_before_obj.parent;
        else parent_obj = this.folder_lookup.get(dest_folder_name);

        if (parent_obj === null || parent_obj === undefined) throw new TypeError(`Cannot find folder with name: ${dest_folder_name}`);

        let new_obj:BaseEvent;
        if (new_folder_name.length > 0) {
            new_obj = new EventFolder(
                parent_obj,
                new_folder_name,
                "",
                folder_expanded,
                folder_enabled,
            );
            this.folder_lookup.set(new_folder_name, new_obj as EventFolder);
        } else if (event_def !== null) {
            this._handle_adding_trainer_event(event_def);
            new_obj = new EventGroup(parent_obj, event_def);
        } else { throw new TypeError(`impossible to hit due to check at top of function. just adding so typescript understands new_obj must be defined below`); }

        this.event_lookup.set(new_obj.event_id, new_obj);
        parent_obj.insert_child_after(
            new_obj,
            insert_after_obj,
            insert_before_obj,
        );

        if (recalc) this._recalc();
        return new_obj.event_id;
    }

    private _handle_removing_trainer_event(event_def:BaseEventDefinition) {
        if (event_def instanceof TrainerEventDefinition) {
            this.defeated_trainers.delete(event_def.trainer_name);
            this.defeated_trainers.delete(event_def.second_trainer_name);
        }
    }

    remove_event_object(event_id:number, recalc=true) {
        let cur_event = this.get_event_object(event_id);
        if (cur_event === undefined) return;
        else if (cur_event instanceof EventItem) throw new TypeError(`Cannot remove Event Item objects: ${cur_event.name}`);

        this._handle_removing_trainer_event(cur_event.event_definition);
        cur_event.parent?.remove_child(cur_event);
        this.event_lookup.delete(cur_event.event_id);

        if (cur_event instanceof EventFolder) {
            this.folder_lookup.delete(cur_event.name);
            this.batch_remove_events(cur_event.children.map(x => x.event_id), false);
        }
        if (recalc) this._recalc;
    }

    batch_remove_events(event_id_list:number[], recalc=true) {
        for (let cur_event of event_id_list) this.remove_event_object(cur_event, false);
        if (recalc) this._recalc();
    }

    move_event_object(event_id:number, move_up_flag:boolean) {
        let obj_to_move = this.get_event_object(event_id);
        if (obj_to_move === undefined) return;
        obj_to_move.parent?.move_child(obj_to_move, move_up_flag);
        this._recalc();
    }

    toggle_event_highlight(event_id:number) {
        let cur_obj = this.get_event_object(event_id);
        if (cur_obj instanceof EventGroup ) cur_obj.event_definition.toggle_highlight();
    }

    get_invalid_folder_transfers(event_id:number) {
        let result = [] as string[];
        let cur_obj = this.get_event_object(event_id);
        if (cur_obj === undefined) return result;

        this._get_child_folder_names_recursive(cur_obj, result);
        return result;
    }

    private _get_child_folder_names_recursive(cur_obj:BaseEvent, result:string[]) {
        if (cur_obj instanceof EventFolder) {
            result.push(cur_obj.name);
            for (let cur_child of cur_obj.children) this._get_child_folder_names_recursive(cur_child, result);
        }
    }

    transfer_events(event_id_list:number[], dest_folder_name:string) {
        let dest_folder = this.folder_lookup.get(dest_folder_name);
        if (dest_folder === undefined) {
            this.add_event_object(undefined, dest_folder_name);
            dest_folder = this.folder_lookup.get(dest_folder_name)!;
        }

        for (let cur_event_id of event_id_list) {
            if (this.get_invalid_folder_transfers(cur_event_id).includes(dest_folder_name)) {
                throw new TypeError(`Cannot transfer a folder into itself or a child folder`);
            }
        }

        for (let cur_event_id of event_id_list) {
            let cur_event = this.get_event_object(cur_event_id);
            if (cur_event === undefined) continue;
            cur_event.parent?.remove_child(cur_event);
            dest_folder.insert_child_after(cur_event);
        }

        this._recalc();
    }

    replace_event_group(event_id:number, new_event_def:BaseEventDefinition) {
        let cur_obj = this.get_event_object(event_id);
        if (cur_obj === undefined) return;

        if (cur_obj instanceof EventFolder) {
            cur_obj.event_definition = new_event_def;
        } else if (cur_obj instanceof EventGroup) {
            this._handle_removing_trainer_event(cur_obj.event_definition);
            this._handle_adding_trainer_event(new_event_def);
            cur_obj.event_definition = new_event_def;
        } else if (cur_obj instanceof EventItem) {
            // TODO: kinda gross, we allow updating some items (just levelup learn moves)
            // TODO: so we need this one extra processing hook here to handle when the "group"
            // TODO: being replaced is actually an item, not a group

            // NOTE: this is more precise than just checking the type, since it also guarantees the source
            // is from a level up
            if (
                (cur_obj.event_definition.get_event_type() == const_xprr.TASK_LEARN_MOVE_LEVELUP) &&
                (new_event_def instanceof LearnMoveEventDefinition)
            ) {
                // in this case, we don't actually change the event item, but the definition in our own map
                this.level_up_move_defs.set(new_event_def.get_level_up_key(), new_event_def);
            }
        }

        this._recalc();
    }

    replace_level_up_move_event(new_event_def:LearnMoveEventDefinition) {
        this.level_up_move_defs.set(new_event_def.get_level_up_key(), new_event_def);
        this._recalc();
    }

    is_valid_level_up_move(new_event_def:LearnMoveEventDefinition) {
        return this.level_up_move_defs.has(new_event_def.get_level_up_key());
    }

    rename_event_folder(cur_name:string, new_name:string) {
        let folder_obj = this.folder_lookup.get(cur_name);
        if (folder_obj === undefined) return;
        folder_obj.name = new_name;
        this.folder_lookup.delete(cur_name);
        this.folder_lookup.set(new_name, folder_obj);
    }

    save(name:string) {
        if (this.init_route_state === null) return;
        save_route(
            {
                [const_xprr.NAME_KEY]: this.init_route_state.solo_mon.name,
                [const_xprr.DVS_KEY]: this.init_route_state.solo_mon.dvs.serialize(),
                [const_xprr.ABILITY_KEY]: this.init_route_state.solo_mon.ability_idx,
                [const_xprr.NATURE_KEY]: this.init_route_state.solo_mon.nature,
                [const_xprr.VERSION_KEY]: this.game_version,
                [const_xprr.TASK_LEARN_MOVE_LEVELUP]: Array.from(this.level_up_move_defs.values()).map(x => x.serialize()),
                [const_xprr.EVENTS]: [this.root_folder.serialize()],
            },
            name,
            const_xprr.SAVED_ROUTES_DIR,
            const_xprr.OUTDATED_ROUTES_DIR,
        );
    }

    new_route(
        solo_mon:string,
        base_route_path:string="",
        game_version=const_xprr.YELLOW_VERSION,
        custom_dvs:(Map<string, number> | null)=null,
        custom_ability_idx=0,
        custom_nature:Nature=Nature.Hardy,
    ) {
        this._change_version(game_version);
        this._reset_events();
        this.set_solo_mon(
            solo_mon,
            undefined,
            custom_dvs,
            custom_ability_idx,
            custom_nature,
        );

        if (base_route_path.length > 0) {
            this.load(base_route_path, true);
        }
    }

    load(route_path:string, load_events_only=false) {
        this._reset_events();
        let raw = read_json_file(route_path);

        // NOTE: gross section, lots of any's as we translate a raw JSON into the actual type
        if (!load_events_only) {
            this._change_version(raw[const_xprr.VERSION_KEY]);
            let raw_level_up_moves:any = null;
            if (const_xprr.TASK_LEARN_MOVE_LEVELUP in raw) {
                raw_level_up_moves = raw[const_xprr.TASK_LEARN_MOVE_LEVELUP].map((x:any) => LearnMoveEventDefinition.deserialize(x, raw[const_xprr.NAME_KEY]));
            }

            let custom_dvs = null;
            if (const_xprr.DVS_KEY in raw) custom_dvs = raw[const_xprr.DVS_KEY];

            let ability_idx = 0;
            if (const_xprr.ABILITY_KEY in raw) ability_idx = raw[const_xprr.ABILITY_KEY];

            let custom_nature = Nature.Hardy;
            if (const_xprr.NATURE_KEY in raw) custom_nature = raw[const_xprr.NATURE_KEY];

            this.set_solo_mon(
                raw[const_xprr.NAME_KEY],
                raw_level_up_moves,
                custom_dvs,
                ability_idx,
                custom_nature,
            );
        }

        if (raw[const_xprr.EVENTS].length > 0) this._load_events_recursive(this.root_folder, raw[const_xprr.EVENTS][0]);
        this._recalc();
    }

    _load_events_recursive(parent_folder:EventFolder, json_obj:any) {
        // NOTE: another gross section, still translating any's to actual types
        for (let event_json of json_obj[const_xprr.EVENTS]) {
            if (const_xprr.EVENT_FOLDER_NAME in event_json) {
                let expanded = true;
                if (const_xprr.EXPANDED_KEY in event_json) expanded = event_json[const_xprr.EXPANDED_KEY];
                let enabled = true;
                if (const_xprr.ENABLED_KEY in event_json) enabled = event_json[const_xprr.ENABLED_KEY];
                this.add_event_object(
                    event_factory.load_event(event_json),
                    event_json[const_xprr.EVENT_FOLDER_NAME],
                    undefined,
                    undefined,
                    parent_folder.name,
                    expanded,
                    enabled,
                    false,
                )
                let inner_parent = this.folder_lookup.get(event_json[const_xprr.EVENT_FOLDER_NAME])!;
                this._load_events_recursive(inner_parent, event_json);
            } else {
                this.add_event_object(
                    event_factory.load_event(event_json),
                    undefined,
                    undefined,
                    undefined,
                    parent_folder.name,
                    undefined,
                    undefined,
                    false,
                );
            }
        }
    }
}
