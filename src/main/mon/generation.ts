import { Inventory } from "main/routing/full_route_state";
import { DamageRange } from "./damage_calc";
import { ItemDatabase, MonDatabase, MoveDatabase, TrainerDatabase } from "@main/mon/databases";
import { BadgeList, EnemyMon, FieldStatus, Move, StageModifiers, StatBlock, TrainerTimingStats } from "@main/mon/universal_data_objects";


export class CurrentGen {
    version_name():string {
        throw new TypeError(`Not Implemented`);
    }

    base_version_name():string {
        throw new TypeError(`Not Implemented`);
    }

    get_generation():number {
        throw new TypeError(`Not Implemented`);
    }
    
    mon_db():MonDatabase {
        throw new TypeError(`Not Implemented`);
    }

    item_db():ItemDatabase {
        throw new TypeError(`Not Implemented`);
    }

    trainer_db():TrainerDatabase {
        throw new TypeError(`Not Implemented`);
    }

    move_db():MoveDatabase {
        throw new TypeError(`Not Implemented`);
    }

    get_recorder_client():null {
        throw new TypeError(`Not Implemented`);
    }

    create_trainer_mon(mon_species:string, level:number):EnemyMon {
        throw new TypeError(`Not Implemented`);
    }

    create_wild_mon(mon_species:string, level:number):EnemyMon {
        throw new TypeError(`Not Implemented`);
    }

    calculate_damage(
        attacking_mon:EnemyMon,
        move:Move,
        defending_mon:EnemyMon,
        attacking_stage_modifiers:StageModifiers,
        defending_stage_modifiers:StageModifiers,
        attacking_field:FieldStatus,
        defending_field:FieldStatus,
        custom_move_data:string,
        weather:string,
        is_double_battle:boolean,
        is_crit=false,
    ):DamageRange {
        throw new TypeError(`Not Implemented`);
    }

    get_crit_rate(
        mon:EnemyMon,
        move:Move,
        custom_move_data:string,
    ):number {
        throw new TypeError(`Not Implemented`);
    }

    get_move_accuracy(
        mon:EnemyMon,
        move:Move,
        custom_move_data:string,
        defending_mon:EnemyMon,
        weather:string,
    ):number {
        throw new TypeError(`Not Implemented`);
    }

    make_stat_block(
        hp:number,
        attack:number,
        defense:number,
        special_attack:number,
        special_defense:number,
        speed:number,
        is_stat_exp=false,
    ):StatBlock {
        throw new TypeError(`Not Implemented`);
    }

    make_badge_list():BadgeList {
        throw new TypeError(`Not Implemented`);
    }

    make_inventory():Inventory {
        throw new TypeError(`Not Implemented`);
    }

    get_stat_modifier_moves():string[] {
        throw new TypeError(`Not Implemented`);
    }

    get_fight_reward(trainer_name:string):string {
        throw new TypeError(`Not Implemented`);
    }

    is_major_fight(trainer_name:string):boolean {
        throw new TypeError(`Not Implemented`);
    }

    get_move_custom_data(move_name:string):string[] {
        throw new TypeError(`Not Implemented`);
    }

    get_hidden_power(dvs:StatBlock):[string, number] {
        throw new TypeError(`Not Implemented`);
    }

    get_valid_weather():string[] {
        throw new TypeError(`Not Implemented`);
    }

    get_stats_boosted_by_vitamin(vit_name:string):string[] {
        throw new TypeError(`Not Implemented`);
    }

    get_valid_vitamins():string[] {
        throw new TypeError(`Not Implemented`);
    }

    get_vitamin_amount():number {
        throw new TypeError(`Not Implemented`);
    }

    get_vitamin_cap():number {
        throw new TypeError(`Not Implemented`);
    }

    create_new_custom_gen(new_version_name:string) {
        throw new TypeError(`Not Implemented`);
    }

    load_custom_gen(custom_version_name:string, root_path:string):CurrentGen {
        throw new TypeError(`Not Implemented`);
    }

    get_trainer_timing_info():TrainerTimingStats {
        throw new TypeError(`Not Implemented`);
    }

    get_stat_xp_yield(mon_name:string, exp_split:number, held_item:string):StatBlock {
        throw new TypeError(`Not Implemented`);
    }
}
