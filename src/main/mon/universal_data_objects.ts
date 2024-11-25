import { const_xprr } from "@main/utils/constants";
import { sanitize_string } from "@main/utils/io_utils";


const _NEUTRAL_NATURES = [0, 6, 12, 18, 24]
export enum Nature {
    Hardy = 0,
    Lonely,
    Brave,
    Adamant,
    Naughty,
    Bold,
    Docile,
    Relaxed,
    Impish,
    Lax,
    Timid,
    Hasty,
    Serious,
    Jolly,
    Naive,
    Modest,
    Mild,
    Quiet,
    Bashful,
    Rash,
    Calm,
    Gentle,
    Sassy,
    Careful,
    Quirky,
}


export function is_stat_raised(nature:Nature, stat_name:string) {
    if (nature in _NEUTRAL_NATURES) return false;
    else if (nature <= 4) return stat_name === const_xprr.ATTACK;
    else if (nature <= 9) return stat_name === const_xprr.DEFENSE;
    else if (nature <= 14) return stat_name === const_xprr.SPEED;
    else if (nature <= 19) return stat_name === const_xprr.SPECIAL_ATTACK;
    else if (nature <= 23) return stat_name === const_xprr.SPECIAL_DEFENSE;
    return false;
}

export function is_stat_lowered(nature:Nature, stat_name:string) {
    switch (nature) {
        case 1:
        case 11:
        case 16:
        case 21:
            return stat_name === const_xprr.DEFENSE;
        case 2:
        case 7:
        case 17:
        case 22:
            return stat_name === const_xprr.SPEED
        case 3:
        case 8:
        case 13:
        case 23:
            return stat_name === const_xprr.SPECIAL_ATTACK
        case 4:
        case 9:
        case 14:
        case 19:
            return stat_name === const_xprr.SPECIAL_DEFENSE
        case 5:
        case 10:
        case 15:
        case 20:
            return stat_name === const_xprr.ATTACK
        default:
            return false;
    }
}

export class BadgeList {
    award_badge(trainer_name:string): BadgeList {
        throw new TypeError('Not Implemented');
    }
    is_attack_boosted(): boolean {
        throw new TypeError('Not Implemented');
    }
    is_defense_boosted(): boolean {
        throw new TypeError('Not Implemented');
    }
    is_speed_boosted(): boolean {
        throw new TypeError('Not Implemented');
    }
    is_special_attack_boosted(): boolean {
        throw new TypeError('Not Implemented');
    }
    is_special_defense_boosted(): boolean {
        throw new TypeError('Not Implemented');
    }
    copy(): BadgeList {
        throw new TypeError('Not Implemented');
    }
    equals(other:BadgeList):boolean {
        throw new TypeError('Not Implemented');
    }
}

export class StageModifiers {
    attack_stage;
    defense_stage;
    speed_stage;
    special_attack_stage;
    special_defense_stage;
    accuracy_stage;
    evasion_stage;
    attack_badge_boosts;
    defense_badge_boosts;
    speed_badge_boosts;
    special_badge_boosts;

    constructor(
        attack=0,
        defense=0,
        speed=0,
        special_attack=0,
        special_defense=0,
        accuracy=0,
        evasion=0,
        attack_badge_boosts=0,
        defense_badge_boosts=0,
        speed_badge_boosts=0,
        special_badge_boosts=0,
    ) {
        this.attack_stage = StageModifiers.get_valid_stage(attack);
        this.defense_stage = StageModifiers.get_valid_stage(defense);
        this.speed_stage = StageModifiers.get_valid_stage(speed);
        this.special_attack_stage = StageModifiers.get_valid_stage(special_attack);
        this.special_defense_stage = StageModifiers.get_valid_stage(special_defense);
        this.accuracy_stage = StageModifiers.get_valid_stage(accuracy);
        this.evasion_stage = StageModifiers.get_valid_stage(evasion);

        /*
        keep track of which badge boosts are applicable to which stats
        NOTE: the badge-boost tracking is married to the GenOne structure because they only
        occur in gen one. These will just be ignored by all other gens
        SECOND NOTE: this data structure does not care about which badges the player has.
        Instead, this tracks "theoretical" badge boosts,
        which should only apply if the corresponding badge has been earned
        */
        this.attack_badge_boosts = attack_badge_boosts;
        this.defense_badge_boosts = defense_badge_boosts;
        this.speed_badge_boosts = speed_badge_boosts;
        this.special_badge_boosts = special_badge_boosts;
    }

    static get_valid_stage(val:number): number {
        if (val < -6) return -6;
        else if (val > 6) return 6;
        return val
    }

    _copy(): StageModifiers {
        return new StageModifiers(
            this.attack_stage,
            this.defense_stage,
            this.speed_stage,
            this.special_attack_stage,
            this.special_defense_stage,
            this.accuracy_stage,
            this.evasion_stage,
            this.attack_badge_boosts,
            this.defense_badge_boosts,
            this.speed_badge_boosts,
            this.special_badge_boosts,
        )
    }

    clear_badge_boosts(): StageModifiers {
        let result = this._copy();
        result.attack_badge_boosts = 0;
        result.defense_badge_boosts = 0;
        result.speed_badge_boosts = 0;
        result.special_badge_boosts = 0;
        return result;
    }

    apply_stat_mod(all_stat_mods:[string, number][]): StageModifiers {
        if (all_stat_mods.length === 0) return this;

        let result = this._copy();
        result.attack_badge_boosts += 1;
        result.defense_badge_boosts += 1;
        result.speed_badge_boosts += 1;
        result.special_badge_boosts += 1;

        for (const [stat_name, stat_val] of all_stat_mods) {
            switch (stat_name) {
                case const_xprr.ATTACK:
                    result.attack_stage = StageModifiers.get_valid_stage(result.attack_stage + stat_val);
                    if (result.attack_stage === this.attack_stage) break;
                    result.attack_badge_boosts = 0;
                    break;
                case const_xprr.DEFENSE:
                    result.defense_stage = StageModifiers.get_valid_stage(result.defense_stage + stat_val);
                    if (result.defense_stage === this.defense_stage) break;
                    result.defense_badge_boosts = 0;
                    break;
                case const_xprr.SPEED:
                    result.speed_stage = StageModifiers.get_valid_stage(result.speed_stage + stat_val);
                    if (result.speed_stage === this.speed_stage) break;
                    result.speed_badge_boosts = 0;
                    break;
                case const_xprr.SPECIAL_ATTACK:
                    result.special_attack_stage = StageModifiers.get_valid_stage(result.special_attack_stage + stat_val);
                    if (result.special_attack_stage === this.special_attack_stage) break;
                    result.special_badge_boosts = 0;
                    break;
                case const_xprr.SPECIAL_DEFENSE:
                    result.special_defense_stage = StageModifiers.get_valid_stage(result.special_defense_stage + stat_val);
                    if (result.special_defense_stage === this.special_defense_stage) break;
                    result.special_badge_boosts = 0;
                    break;
                case const_xprr.ACC:
                    result.accuracy_stage = StageModifiers.get_valid_stage(result.accuracy_stage + stat_val);
                    break;
                case const_xprr.EV:
                    result.evasion_stage = StageModifiers.get_valid_stage(result.evasion_stage + stat_val);
                    break;
            }
        }
        
        return result;
    }

    equals(other:StageModifiers): boolean {
        return (
            this.attack_stage === other.attack_stage &&
            this.attack_badge_boosts === other.attack_badge_boosts &&
            this.defense_stage === other.defense_stage &&
            this.defense_badge_boosts === other.defense_badge_boosts &&
            this.speed_stage === other.speed_stage &&
            this.speed_badge_boosts === other.speed_badge_boosts &&
            this.special_attack_stage === other.special_attack_stage &&
            this.special_defense_stage === other.special_defense_stage &&
            this.special_badge_boosts === other.special_badge_boosts &&
            this.accuracy_stage === other.accuracy_stage &&
            this.evasion_stage === other.evasion_stage
        );
    }
}

export class StatBlock {
    hp:number;
    attack:number;
    defense:number;
    speed:number;
    special_attack:number;
    special_defense:number;
    _is_stat_exp:boolean;

    constructor(hp:number, attack:number, defense:number, special_attack:number, special_defense:number, speed:number, is_stat_exp=false) {
        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
        this.special_attack = special_attack;
        this.special_defense = special_defense;
        this.speed = speed;
        this._is_stat_exp = is_stat_exp;
    }

    _copy_helper(hp:number, attack:number, defense:number, special_attack:number, special_defense:number, speed:number, is_stat_exp=false): StatBlock {
        // TODO: this is just a way for each sub-type to implement their own custom constructor at runtime
        // if there's a better way to do this in javascript, then we should do that
        throw new TypeError('Not Implemented');
    }

    copy(){
        return this._copy_helper(
            this.hp,
            this.attack,
            this.defense,
            this.special_attack,
            this.special_defense,
            this.speed,
            this._is_stat_exp,
        );
    }

    add(other:StatBlock): StatBlock {
        return this._copy_helper(
            this.hp + other.hp,
            this.attack + other.attack,
            this.defense + other.defense,
            this.special_attack + other.special_attack,
            this.special_defense + other.special_defense,
            this.speed + other.speed,
            this._is_stat_exp,
        );
    }

    subtract(other:StatBlock): StatBlock {
        return this._copy_helper(
            this.hp - other.hp,
            this.attack - other.attack,
            this.defense - other.defense,
            this.special_attack - other.special_attack,
            this.special_defense - other.special_defense,
            this.speed - other.speed,
            this._is_stat_exp,
        );
    }

    equals(other:StatBlock): boolean {
        return (
            this.hp === other.hp &&
            this.attack === other.attack &&
            this.defense === other.defense &&
            this.speed === other.speed &&
            this.special_attack === other.special_attack &&
            this.special_defense === other.special_defense
        );
    }

    serialize() {
        return {
            [const_xprr.HP]: this.hp,
            [const_xprr.ATTACK]: this.attack,
            [const_xprr.DEFENSE]: this.defense,
            [const_xprr.SPEED]: this.speed,
            [const_xprr.SPECIAL_ATTACK]: this.special_attack,
            [const_xprr.SPECIAL_DEFENSE]: this.special_defense,
        }
    }

    toString() {
        return `HP: ${this.hp}, Attack: ${this.attack}, Defense: ${this.defense}, Special Attack: ${this.special_attack}, Special Defense: ${this.special_defense}, Speed: ${this.speed}`;
    }

    calc_level_stats(
        level:number,
        dvs:StatBlock,
        stat_exp:StatBlock,
        badges:BadgeList,
        nature:Nature,
        held_item:string
    ): StatBlock {
        throw new TypeError('Not Implemented');
    }

    calc_battle_stats(
        level:number,
        dvs:StatBlock,
        stat_exp:StatBlock,
        stage_modifiers:StageModifiers,
        badges:BadgeList | null,
        nature:Nature,
        held_item:string,
        is_crit=false
    ): StatBlock {
        throw new TypeError('Not Implemented');
    }

}

export class PokemonSpecies {
    name:string;
    growth_rate:string;
    base_exp:number;
    first_type:string;
    second_type:string;
    stats:StatBlock;
    levelup_moves:[number, string][];
    tmhm_moves:string[];
    stat_exp_yield:StatBlock;
    abilities:string[];

    constructor(
        name:string,
        growth_rate:string,
        base_exp:number,
        first_type:string,
        second_type:string,
        stats:StatBlock,
        levelup_moves:[number, string][],
        tmhm_moves:string[],
        stat_exp_yield:StatBlock,
        abilities:string[],
    ) {
        this.name = name;
        this.growth_rate = growth_rate;
        this.base_exp = base_exp;
        this.first_type = first_type;
        this.second_type = second_type;
        this.stats = stats;
        this.levelup_moves = levelup_moves;
        this.tmhm_moves = tmhm_moves;
        this.stat_exp_yield = stat_exp_yield;
        this.abilities = abilities;
    }
}

export class EnemyMon {
    species:string;
    level:number;
    exp:number;
    move_list:string[];
    cur_stats:StatBlock;
    base_stats:StatBlock;
    dvs:StatBlock;
    stat_exp:StatBlock;
    badges:BadgeList | null;
    held_item:string;
    custom_move_data:Map<string, Map<string, string>>;
    is_trainer_mon:boolean;
    exp_split:number;
    mon_order:number;
    definition_order:number;
    ability:string;
    nature:Nature;

    constructor(
        species:string,
        level:number,
        exp:number,
        move_list:string[],
        cur_stats:StatBlock,
        base_stats:StatBlock,
        dvs:StatBlock,
        stat_exp:StatBlock,
        badges:BadgeList | null,
        held_item:string="",
        custom_move_data:Map<string, Map<string, string>> | null=null,
        is_trainer_mon:boolean=false,
        exp_split:number=1,
        mon_order:number=1,
        definition_order:number=1,
        ability:string="",
        nature:Nature=Nature.Hardy,
    ) {
        this.species = species;
        this.level = level;
        this.exp = exp;
        this.move_list = move_list;
        this.cur_stats = cur_stats;
        this.base_stats = base_stats;
        this.dvs = dvs;
        this.stat_exp = stat_exp;
        this.badges = badges;
        this.held_item = held_item;

        if (custom_move_data === null ) this.custom_move_data = new Map();
        else this.custom_move_data = custom_move_data;

        this.is_trainer_mon = is_trainer_mon;
        this.exp_split = exp_split;
        this.mon_order = mon_order;
        this.definition_order = definition_order;
        this.ability = ability;
        this.nature = nature;
    }

    equals(other:EnemyMon):boolean {
        return (
            this.species === other.species &&
            this.level === other.level &&
            this.cur_stats === other.cur_stats &&
            this.exp === other.exp &&
            this.move_list === other.move_list &&
            this.base_stats === other.base_stats &&
            this.dvs === other.dvs &&
            this.stat_exp === other.stat_exp &&
            this.badges === other.badges &&
            this.held_item === other.held_item &&
            this.nature === other.nature &&
            this.ability === other.ability
        );
    }

    toString() {
        return `Lv ${this.level}: ${this.species}`;
    }

    get_battle_stats(stages:StageModifiers, is_crit=false):StatBlock {
        return this.base_stats.calc_battle_stats(
            this.level,
            this.dvs,
            this.stat_exp,
            stages,
            this.badges,
            this.nature,
            this.held_item,
            is_crit
        )
    }
}

export class Trainer {
    trainer_class:string;
    name:string;
    location:string;
    money:number;
    mons:EnemyMon[];
    rematch:boolean;
    trainer_id:number;
    refightable:boolean;
    double_battle:boolean;

    constructor(
        trainer_class:string,
        name:string,
        location:string,
        money:number,
        mons:EnemyMon[],
        rematch:boolean=false,
        trainer_id:number=-1,
        refightable:boolean=false,
        double_battle:boolean=false,
    ){
        this.trainer_class = trainer_class;
        this.name = name;
        this.location = location;
        this.money = money;
        this.mons = mons;
        this.rematch = rematch;
        this.trainer_id = trainer_id;
        this.refightable = refightable;
        this.double_battle = double_battle;
    }

    can_multi_battle() {
        return this.mons.length <= 3;
    }
}

export class BaseItem {
    name:string;
    is_key_item:boolean;
    purchase_price:number;
    sell_price:number;
    marts:string[];
    move_name:string;

    constructor(
        name:string,
        is_key_item:boolean,
        purchase_price:number,
        marts:string[],
        move_name:string="",
    ){
        this.name = name;
        this.is_key_item = is_key_item;
        this.purchase_price = purchase_price;
        this.sell_price = Math.floor(this.purchase_price / 2);
        this.marts = marts;
        this.move_name = move_name;
    }

    is_tm_hm() {
        return this.name.startsWith("TM") || this.name.startsWith("HM")
    }
}

export class Move {
    name:string;
    accuracy:number;
    pp:number;
    base_power:number;
    move_type:string;
    effect:string;
    target:string;

    constructor(
        name:string,
        accuracy:number,
        pp:number,
        base_power:number,
        move_type:string,
        effect:string,
        target:string="",
    ){
        this.name = name;
        this.accuracy = accuracy;
        this.pp = pp;
        this.base_power = base_power;
        this.move_type = move_type;
        this.effect = effect;
        this.target = target;
    }
}

export class TrainerTimingStats {
    intro_time:number;
    outro_time:number;
    ko_time:number;
    send_out_time:number;

    constructor (
        intro_time:number,
        outro_time:number,
        ko_time:number,
        send_out_time:number,
    ){
        // for all these comments, let N be the # of pokemon an enemy trainer has
        // all times should be duration, in seconds, when played at 4x game speed

        // includes overworld dialogue, battle start animation, and time to send out both pokemon
        // this will always happen 1 time per battle
        this.intro_time = intro_time;

        // includes trainer defeat dialogue, and transition back to overworld
        // this will always happen 1 time per battle
        this.outro_time = outro_time;

        // time required to select a move, ohko the enemy and watch their health drain, and collect experience
        // this will happen N times
        this.ko_time = ko_time;

        // time required for a new enemy mon to come out after lost mon was killed
        // this will happen N-1 times, as the first mon's "send out" is baked in to the intro_time
        this.send_out_time = send_out_time;
    }

    _helper_exp_per_second(num_pokemon:number, total_exp:number) {
        return (
            total_exp / (
                this.intro_time +
                this.outro_time +
                (this.ko_time * num_pokemon) + 
                (this.send_out_time * (num_pokemon - 1))
            )
        )
    }

    optimal_exp_per_second(mon_list:EnemyMon[]) {
        return Math.round(
            this._helper_exp_per_second(
                mon_list.length,
                mon_list.reduce((n, {exp}) =>  n + exp, 0)
            )
        );
    }
}


export class FieldStatus {
    light_screen:boolean;
    reflect:boolean;

    constructor(
        light_screen:boolean=false,
        reflect:boolean=false,
    ) {
        this.light_screen = light_screen;
        this.reflect = reflect;
    }

    _copy() {
        return new FieldStatus(
            this.light_screen,
            this.reflect,
        )
    }

    apply_move(move:Move) {
        // TODO: extract out field effects to be uniquely parseable from effect, instead of basing off of move name
        // TODO: for now, very hacky/gross implementation just caring about reflect and light screen
        let result = this._copy();
        if (sanitize_string(move.name) === "lightscreen") result.light_screen = true;
        if (sanitize_string(move.name) === "reflect") result.reflect = true;

        return result;
    }
}