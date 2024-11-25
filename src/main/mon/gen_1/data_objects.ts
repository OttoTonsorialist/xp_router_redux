import { const_xprr } from 'main/utils/constants';
import path from 'node:path';
import { BadgeList, EnemyMon, Move, Nature, PokemonSpecies, StageModifiers, StatBlock } from '../universal_data_objects';
import { calc_exp_yield } from '../universal_utils';


//constants first
class GenOneConstants {
    readonly BOULDER_BADGE = "boulder";
    readonly CASCADE_BADGE = "cascade";
    readonly THUNDER_BADGE = "thunder";
    readonly RAINBOW_BADGE = "rainbow";
    readonly SOUL_BADGE = "soul";
    readonly MARSH_BADGE = "marsh";
    readonly VOLCANO_BADGE = "volcano";
    readonly EARTH_BADGE = "earth";
    readonly BAG_LIMIT = 20;
    readonly STAT_XP_CAP = 65535;
    readonly VIT_AMT = 2560;
    readonly VIT_CAP = 25600;
    readonly BASE_STAGE_INDEX = 6;
    readonly STAGE_MODIFIERS = [
        [25, 100],
        [28, 100],
        [33, 100],
        [40, 100],
        [50, 100],
        [66, 100],
        [1, 1],
        [15, 10],
        [2, 1],
        [25, 10],
        [3, 1],
        [35, 10],
        [4, 1],
    ] as [number, number][];
}


export const gen_one_const = new GenOneConstants();


// a few various helper functions
export function calc_battle_stats(
    base_val:number,
    level:number,
    dv:number,
    stat_exp:number,
    stage:number,
    is_badge_boosted=false,
    num_extra_boosts=0,
) {
    let result = _calc_unboosted_stat(base_val, level, dv, stat_exp);
    result = _modify_stat_by_stage(result, stage);

    if (is_badge_boosted) return _badge_boost_single_stat(result, 1 + num_extra_boosts);
    return result;
}


function _calc_stat(
    base_val:number,
    level:number,
    dv:number,
    stat_exp:number,
    is_hp=false,
    is_badge_boosted=false
) {
    let result = _calc_unboosted_stat(base_val, level, dv, stat_exp, is_hp);
    if (is_badge_boosted) return _badge_boost_single_stat(result);
    return result;
}


function _calc_unboosted_stat(
    base_val:number,
    level:number,
    dv:number,
    stat_exp:number,
    is_hp=false
) {
    let temp = (base_val + dv) * 2;
    temp += Math.floor(Math.ceil(Math.sqrt(stat_exp)) / 4);
    temp = Math.floor(temp * level / 100);

    if (is_hp) return temp + level + 5;
    return temp + 5;
}


function _modify_stat_by_stage(raw_stat:number, stage:number) {
    if (stage == 0) return raw_stat;

    let cur_stage = gen_one_const.STAGE_MODIFIERS[gen_one_const.BASE_STAGE_INDEX + stage];
    return Math.floor((raw_stat * cur_stage[0]) / cur_stage[1]);
}


function _badge_boost_single_stat(cur_stat_val:number, num_times=1) {
    if (num_times < 1) return 0;
    for (let boost_count = 0; boost_count < num_times; boost_count++) cur_stat_val = Math.floor(cur_stat_val * 1.125);
    return cur_stat_val
}


export function get_crit_rate(mon:EnemyMon, move:Move) {
    let crit_numerator = Math.floor(mon.base_stats.speed / 2);
    if ( move.effect == const_xprr.FLAVOR_HIGH_CRIT) {
        crit_numerator *= 8;
    }
    crit_numerator = Math.min(Math.floor(crit_numerator), 255);
    return crit_numerator / 256;
}


export function instantiate_trainer_mon(mon_data:PokemonSpecies, target_level:number, special_moves:string[]) {
    return new EnemyMon(
        mon_data.name,
        target_level,
        calc_exp_yield(mon_data.base_exp, target_level, true),
        _get_move_list(mon_data.levelup_moves, target_level, special_moves),
        new GenOneStatBlock(
            _calc_stat( mon_data.stats.hp, target_level, 8, 0, true),
            _calc_stat( mon_data.stats.attack, target_level, 9, 0),
            _calc_stat( mon_data.stats.defense, target_level, 8, 0),
            _calc_stat( mon_data.stats.special_attack, target_level, 8, 0),
            _calc_stat( mon_data.stats.special_defense, target_level, 8, 0),
            _calc_stat( mon_data.stats.speed, target_level, 8, 0),
        ),
        mon_data.stats,
        new GenOneStatBlock(8, 9, 8, 8, 8, 8),
        new GenOneStatBlock(0, 0, 0, 0, 0, 0, true),
        null,
        undefined,
        undefined,
        true
    );
}


export function instantiate_wild_mon(mon_data:PokemonSpecies, target_level:number) {
    return new EnemyMon(
        mon_data.name,
        target_level,
        calc_exp_yield(mon_data.base_exp, target_level, true),
        _get_move_list(mon_data.levelup_moves, target_level, []),
        new GenOneStatBlock(
            _calc_stat( mon_data.stats.hp, target_level, 15, 0, true),
            _calc_stat( mon_data.stats.attack, target_level, 15, 0),
            _calc_stat( mon_data.stats.defense, target_level, 15, 0),
            _calc_stat( mon_data.stats.special_attack, target_level, 15, 0),
            _calc_stat( mon_data.stats.special_defense, target_level, 15, 0),
            _calc_stat( mon_data.stats.speed, target_level, 15, 0),
        ),
        mon_data.stats,
        new GenOneStatBlock(15, 15, 15, 15, 15, 15),
        new GenOneStatBlock(0, 0, 0, 0, 0, 0, true),
        null,
    );
}


function _get_move_list(
    learned_moves:[number, string][],
    target_level:number,
    special_moves:string[],
) {
    let result = [] as string[];
    for (let [cur_level, cur_move] of learned_moves) {
        if (result.includes(cur_move)) continue;
        if (target_level < cur_level) break;
        result.push(cur_move);
    }

    if (result.length > 4) result = result.slice(-4);
    if (special_moves.length === 0) return result;

    while (result.length < 4) result.push("");
    for (let cur_idx = 0; cur_idx < special_moves.length; cur_idx++) {
        if (special_moves[cur_idx].length > 0) result[cur_idx] = special_moves[cur_idx];
    }

    for (let cur_idx = special_moves.length - 1; cur_idx >= 0; cur_idx--) {
        if (result[cur_idx].length == 0) result.splice(cur_idx, 1);
    }
    return result;
}


export class GenOneBadgeList extends BadgeList {
    private _badge_rewards:Map<string, string>;
    boulder:boolean;
    cascade:boolean;
    thunder:boolean;
    rainbow:boolean;
    soul:boolean;
    marsh:boolean;
    volcano:boolean;
    earth:boolean;

    constructor(
        badge_rewards:Map<string, string>,
        boulder:boolean,
        cascade:boolean,
        thunder:boolean,
        rainbow:boolean,
        soul:boolean,
        marsh:boolean,
        volcano:boolean,
        earth:boolean,
    ){
        super();
        this._badge_rewards = badge_rewards;
        this.boulder = boulder;
        this.cascade = cascade;
        this.thunder = thunder;
        this.rainbow = rainbow;
        this.soul = soul;
        this.marsh = marsh;
        this.volcano = volcano;
        this.earth = earth;
    }

    copy(verbose?: boolean): GenOneBadgeList {
        return new GenOneBadgeList(
            this._badge_rewards,
            this.boulder,
            this.cascade,
            this.thunder,
            this.rainbow,
            this.soul,
            this.marsh,
            this.volcano,
            this.earth,
        );
    }

    award_badge(trainer_name: string): GenOneBadgeList {
        let result = this.copy();
        switch (this._badge_rewards.get(trainer_name)) {
            case gen_one_const.BOULDER_BADGE:
                result.boulder = true;
                break;
            case gen_one_const.CASCADE_BADGE:
                result.cascade = true;
                break;
            case gen_one_const.THUNDER_BADGE:
                result.thunder = true;
                break;
            case gen_one_const.RAINBOW_BADGE:
                result.rainbow = true;
                break;
            case gen_one_const.SOUL_BADGE:
                result.soul = true;
                break;
            case gen_one_const.MARSH_BADGE:
                result.marsh = true;
                break;
            case gen_one_const.VOLCANO_BADGE:
                result.volcano = true;
                break;
            case gen_one_const.EARTH_BADGE:
                result.volcano = true;
                break;
            default:
                return this;
        }
        return result;
    }

    is_attack_boosted(): boolean {
        return this.boulder;
    }

    is_defense_boosted(): boolean {
        return this.thunder;
    }

    is_speed_boosted(): boolean {
        return this.soul;
    }

    is_special_attack_boosted(): boolean {
        return this.volcano;
    }

    is_special_defense_boosted(): boolean {
        return this.volcano;
    }

    equals(other: BadgeList): boolean {
        if (!(other instanceof GenOneBadgeList)) return false;

        return (
            this.boulder == other.boulder &&
            this.cascade == other.cascade &&
            this.thunder == other.thunder &&
            this.rainbow == other.rainbow &&
            this.soul == other.soul &&
            this.marsh == other.marsh &&
            this.volcano == other.volcano &&
            this.earth == other.earth
        );
    }
}


export class GenOneStatBlock extends StatBlock {
    constructor(hp:number, attack:number, defense:number, special_attack:number, special_defense:number, speed:number, is_stat_exp=false) {
        super(hp, attack, defense, special_attack, special_defense, speed, is_stat_exp);

        // NOTE: as a general strategy, as GenOne only has one special stat in actuality, this object
        // will use special attack for all "special" calculations. Special defense will still be populated with
        // the same value though. This is done for better compatibility with other generations

        // hard cap STAT XP vals
        if (is_stat_exp) {
            this.hp = Math.min(hp, gen_one_const.STAT_XP_CAP);
            this.attack = Math.min(attack, gen_one_const.STAT_XP_CAP);
            this.defense = Math.min(defense, gen_one_const.STAT_XP_CAP);
            this.special_attack = Math.min(special_attack, gen_one_const.STAT_XP_CAP);
            this.special_defense = Math.min(special_defense, gen_one_const.STAT_XP_CAP);
            this.speed = Math.min(speed, gen_one_const.STAT_XP_CAP);
        }
    }

    calc_level_stats(
        level: number,
        dvs: StatBlock,
        stat_exp: StatBlock,
        badges: BadgeList,
        nature: Nature,
        held_item: string
    ): GenOneStatBlock {
        let special = _calc_stat(this.special_attack, level, dvs.special_attack, stat_exp.special_attack, false, badges.is_special_attack_boosted());
        return new GenOneStatBlock(
            _calc_stat(this.hp, level, dvs.hp, stat_exp.hp, true),
            _calc_stat(this.attack, level, dvs.attack, stat_exp.attack, false, badges.is_attack_boosted()),
            _calc_stat(this.defense, level, dvs.defense, stat_exp.defense, false, badges.is_defense_boosted()),
            special,
            special,
            _calc_stat(this.speed, level, dvs.speed, stat_exp.speed, false, badges.is_speed_boosted()),
        );
    }

    calc_battle_stats(
        level: number,
        dvs: StatBlock,
        stat_exp: StatBlock,
        stage_modifiers: StageModifiers,
        badges: BadgeList | null,
        nature: Nature,
        held_item: string,
        is_crit?: boolean
    ): GenOneStatBlock {
        // TODO: this does not properly replicate any of the jank regarding para/burn/full heal/etc.
        // TODO: need to add support for those stat modifiers (both intended any glitched) in the future
        if (is_crit) {
            // prevent all badge-boosts and stage modifiers whenever a crit occurs
            // by just pretending you don't have any of either
            if (badges !== null) badges = null;
            stage_modifiers = new StageModifiers(0, 0, 0, 0, 0, stage_modifiers.accuracy_stage, stage_modifiers.evasion_stage);
        }

        let result = new GenOneStatBlock(
            _calc_stat(this.hp, level, dvs.hp, stat_exp.hp, true),
            0, 0, 0, 0, 0,
        );

        // note, important to apply stage modifier *first*, then any badge boosts
        // Badge boost counts are properly reset upon stage modification, so any listed are from other stats being boosted after the stage modifier
        result.attack = calc_battle_stats(
            this.attack,
            level,
            dvs.attack,
            stat_exp.attack,
            stage_modifiers.attack_stage,
            (badges !== null && badges.is_attack_boosted()),
            stage_modifiers.attack_badge_boosts,
        );

        result.defense = calc_battle_stats(
            this.defense,
            level,
            dvs.defense,
            stat_exp.defense,
            stage_modifiers.defense_stage,
            (badges !== null && badges.is_defense_boosted()),
            stage_modifiers.defense_badge_boosts,
        );

        result.speed = calc_battle_stats(
            this.speed,
            level,
            dvs.speed,
            stat_exp.speed,
            stage_modifiers.speed_stage,
            (badges !== null && badges.is_speed_boosted()),
            stage_modifiers.speed_badge_boosts,
        );

        result.special_attack = calc_battle_stats(
            this.special_attack,
            level,
            dvs.special_attack,
            stat_exp.special_attack,
            stage_modifiers.special_attack_stage,
            (badges !== null && badges.is_special_attack_boosted()),
            stage_modifiers.special_badge_boosts,
        );
        result.special_defense = result.special_attack;
        return result;
    }
}