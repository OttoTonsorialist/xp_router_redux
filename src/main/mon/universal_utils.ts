import { const_xprr } from "@main/utils/constants";


export function calc_exp_yield(base_yield:number, level:number, is_trainer_battle:boolean, exp_split=1) {
    // NOTE: assumes playerr's pokemon are not traded
    let result = base_yield * level;
    result = Math.floor(result / 7);
    result = Math.floor(result / exp_split);

    if (is_trainer_battle) result = Math.floor((result * 3) / 2);

    return result;
}

export function exp_needed_for_level(target_level:number, growth_rate:string) {
    switch (growth_rate) {
        case const_xprr.GROWTH_RATE_FAST:
            return Math.floor(
                (4 * Math.pow(target_level, 3)) / 5
            );
        case const_xprr.GROWTH_RATE_MEDIUM_FAST:
            return Math.pow(target_level, 3);
        case const_xprr.GROWTH_RATE_MEDIUM_SLOW:
            let result = (6 * Math.pow(target_level, 3)) / 5;
            result -= 15 * Math.pow(target_level, 2);
            result += 100 * target_level;
            result -= 140;
            return Math.floor(result);
        case const_xprr.GROWTH_RATE_SLOW:
            return Math.floor(
                (5 * Math.pow(target_level, 3)) / 4
            );
        case const_xprr.GROWTH_RATE_ERRATIC:
            if (target_level < 50) {
                return Math.floor(
                    (Math.pow(target_level, 3) * (100 - target_level)) / 50
                );
            } else if (target_level < 68) {
                return Math.floor(
                    (Math.pow(target_level, 3) * (150 - target_level)) / 100
                );
            } else if (target_level < 98) {
                let result = Math.pow(target_level, 3);
                result *= Math.floor((1911 - (10 * target_level)) / 3);
                result /= 500;
                return Math.floor(result);
            } else {
                return Math.floor(
                    (Math.pow(target_level, 3) * (100 - target_level)) / 100
                );
            }
        case const_xprr.GROWTH_RATE_FLUCTUATING:
            if (target_level < 15) {
                let result = Math.pow(target_level, 3);
                let partial = Math.floor((target_level + 1) / 3);
                result = (result * (partial + 24)) / 50;
                return Math.floor(result);
            } else if (target_level < 36) {
                return Math.floor(
                    (Math.pow(target_level, 3) * (target_level + 14)) / 50
                );
            } else {
                let result = Math.pow(target_level, 3);
                let partial = Math.floor(target_level / 2);
                result = (result * (partial + 32)) / 50;
                return Math.floor(result);
            }
        default:
            throw new TypeError(`Unknown growth rate: ${growth_rate}`);
    }
}

export class LevelLookup {
    growth_rate:string;
    thresholds:number[];

    constructor(growth_rate:string) {
        this.growth_rate = growth_rate;
        this.thresholds = [];

        for (let i = 0; i < 100; i++) {
            this.thresholds.push(exp_needed_for_level(i + 1, growth_rate));
        }
    }

    get_exp_for_level(target_level:number) {
        if (target_level <= 0 || target_level > 100) throw new TypeError(`Pkmn cannot be level ${target_level}, cannot get EXP needed for invalid level`);
        return this.thresholds[target_level - 1];
    }

    get_level_info(cur_exp:number): [number, number] {
        let cur_level:number;
        let req_exp = 0;
        let did_break = false;

        for (cur_level = 0; cur_level < this.thresholds.length; cur_level++) {
            req_exp = this.thresholds[cur_level];
            if (cur_exp < req_exp) {
                // list indices are 0-index, levels are 1-index
                // so breaking out like this means cur_level is the correct level of the pokemon
                did_break = true;
                break;
            }
        }

        if (!did_break) return [100, 0];
        return [cur_level, req_exp - cur_exp];
    }
}

export const level_lookups = {
    [const_xprr.GROWTH_RATE_FAST]: new LevelLookup(const_xprr.GROWTH_RATE_FAST),
    [const_xprr.GROWTH_RATE_MEDIUM_FAST]: new LevelLookup(const_xprr.GROWTH_RATE_MEDIUM_FAST),
    [const_xprr.GROWTH_RATE_MEDIUM_SLOW]: new LevelLookup(const_xprr.GROWTH_RATE_MEDIUM_SLOW),
    [const_xprr.GROWTH_RATE_SLOW]: new LevelLookup(const_xprr.GROWTH_RATE_SLOW),
    [const_xprr.GROWTH_RATE_ERRATIC]: new LevelLookup(const_xprr.GROWTH_RATE_ERRATIC),
    [const_xprr.GROWTH_RATE_FLUCTUATING]: new LevelLookup(const_xprr.GROWTH_RATE_FLUCTUATING),
}
