import { const_xprr } from "main/utils/constants";
import { DamageRange } from "../damage_calc";
import { EnemyMon, Move, PokemonSpecies, StageModifiers } from "../universal_data_objects";
import { sanitize_string } from "main/utils/io_utils";
import { gen_one_const } from "./data_objects";


const MIN_RANGE = 217;
const MAX_RANGE = 255;


export function calculate_gen_one_damage(
    attacking_mon:EnemyMon,
    attacking_species:PokemonSpecies,
    move:Move,
    defending_mon:EnemyMon,
    defending_species:PokemonSpecies,
    special_types:string[],
    type_chart:Map<string, Map<string, string>>,
    attacking_stage_modifiers:StageModifiers,
    defending_stage_modifiers:StageModifiers,
    custom_move_data="",
    is_crit=false,
    defender_has_light_screen=false,
    defender_has_reflect=false,
): DamageRange | null {

    if (move.base_power === 0) return null;

    if (move.effect === const_xprr.FLAVOR_FIXED_DAMAGE) {
        if (sanitize_string(move.name) === sanitize_string(const_xprr.SONICBOOM_MOVE_NAME)) {
            return new DamageRange(new Map([[20, 1]]));
        } else if (sanitize_string(move.name) === sanitize_string(const_xprr.DRAGON_RAGE_MOVE_NAME)) {
            return new DamageRange(new Map([[40, 1]]));
        }
        throw new TypeError(`Do not know damge of unknown move with fixed damage: ${move.name}`);
    } else if (move.effect === const_xprr.FLAVOR_LEVEL_DAMAGE) {
        return new DamageRange(new Map([[attacking_mon.level, 1]]));
    } else if (move.effect === const_xprr.FLAVOR_PSYWAVE) {
        let upper_limit = Math.floor(attacking_mon.level * 1.5);
        let rolls = new Map<number, number>();
        for (let cur_roll = 0; cur_roll < upper_limit; cur_roll++) {
            rolls.set(cur_roll, 1);
        }
        return new DamageRange(rolls);
    }

    let attacking_battle_stats = attacking_mon.get_battle_stats(attacking_stage_modifiers, is_crit);
    let defending_battls_stats = defending_mon.get_battle_stats(defending_stage_modifiers, is_crit);

    let first_type_effectiveness = type_chart.get(move.move_type)?.get(defending_species.first_type);
    let second_type_effectiveness = null;
    if (defending_species.first_type != defending_species.second_type) {
        second_type_effectiveness = type_chart.get(move.move_type)?.get(defending_species.second_type);
    }
    if (first_type_effectiveness === const_xprr.IMMUNE || second_type_effectiveness === const_xprr.IMMUNE) return null;

    let attacking_stat = 0;
    let defending_stat = 0;
    if (special_types.includes(move.move_type)) {
        attacking_stat = attacking_battle_stats.special_attack;
        defending_stat = defending_battls_stats.special_defense;
        if (defender_has_light_screen && !is_crit) defending_stat *= 2;
    } else {
        attacking_stat = attacking_battle_stats.attack;
        defending_stat = defending_battls_stats.defense;
        if (defender_has_reflect && !is_crit) defending_stat *= 2;
    }

    if (
        sanitize_string(move.name) === sanitize_string(const_xprr.EXPLOSION_MOVE_NAME) ||
        sanitize_string(move.name) === sanitize_string(const_xprr.SELFDESTRUCT_MOVE_NAME)
    ) {
        defending_stat = Math.max(Math.floor(defending_stat / 2), 1);
    }

    /*
    // technically this is more accurate to how the game calculates stats from larger values
    // however it is currently unimplemented, as it will only shift things in very rare cases where rounding shakes out differently

    if attacking_stat > 255 or defending_stat > 255:
        # divide each stat by 4, by using 2 integer divisions by 2
        attacking_stat = math.floor(attacking_stat / 2)
        attacking_stat = math.floor(attacking_stat / 2)

        defending_stat = math.floor(defending_stat / 2)
        defending_stat = math.floor(defending_stat / 2)
    */

    let is_stab = (attacking_species.first_type == move.move_type) || (attacking_species.second_type === move.move_type);

    let damage_val = 2 * attacking_mon.level;
    if (is_crit) damage_val *= 2;
    damage_val = Math.floor(damage_val / 5) + 2
    damage_val *= move.base_power;
    damage_val *= attacking_stat;
    damage_val = Math.floor(damage_val / defending_stat);
    damage_val = Math.floor(damage_val / 50);
    damage_val += 2;
    if (is_stab) damage_val = Math.floor(damage_val * 1.5);

    if (first_type_effectiveness === const_xprr.SUPER_EFFECTIVE) damage_val *= 2;
    else if (first_type_effectiveness === const_xprr.NOT_VERY_EFFECTIVE) damage_val = Math.floor(damage_val / 2);

    if (second_type_effectiveness === const_xprr.SUPER_EFFECTIVE) damage_val *= 2;
    else if (second_type_effectiveness === const_xprr.NOT_VERY_EFFECTIVE) damage_val = Math.floor(damage_val / 2);

    if (damage_val === 0) return null;

    // NOTE: in gen one, all multi-hit moves roll damage (including crit) only once
    // so, check whether a multi-hit occurs, and then just multiply the damage by the number of hits to get the final damage amount
    let multi_hit_multiplier = 1;
    if (move.effect === const_xprr.DOUBLE_HIT_FLAVOR) multi_hit_multiplier = 2;
    else if (move.effect === const_xprr.FLAVOR_MULTI_HIT) {
        if (custom_move_data.includes(const_xprr.MULTI_HIT_2)) multi_hit_multiplier = 2;
        else if (custom_move_data.includes(const_xprr.MULTI_HIT_3)) multi_hit_multiplier = 3;
        else if (custom_move_data.includes(const_xprr.MULTI_HIT_4)) multi_hit_multiplier = 4;
        else if (custom_move_data.includes(const_xprr.MULTI_HIT_5)) multi_hit_multiplier = 5;
    }

    let rolls = new Map<number, number>();
    for (let numerator = MIN_RANGE; numerator < MAX_RANGE + 1; numerator++) {
        let cur_damage = Math.max(Math.floor((damage_val * numerator) / MAX_RANGE), 1) * multi_hit_multiplier;

        if (!rolls.has(cur_damage)) rolls.set(cur_damage, 0);
        rolls.set(cur_damage, rolls.get(cur_damage)! + 1);
    }
    return new DamageRange(rolls);
}