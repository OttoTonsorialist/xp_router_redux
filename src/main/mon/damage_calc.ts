import { combinations, round } from 'mathjs';

export class DamageRange {
    damage_vals: Map<number, number>;
    min_damage:number;
    max_damage:number;
    size:number;
    num_attacks:number;

    constructor(
        damage_vals:Map<number, number>,
        num_attacks=1,
    ) {
        this.damage_vals = damage_vals;
        this.min_damage = -1;
        this.max_damage = -1;
        this.size = 0;
        this.num_attacks = num_attacks;

        for (let [cur_damage, num_rolls] of damage_vals.entries()) {
            this.size += num_rolls;
            if (this.min_damage == -1 || cur_damage < this.min_damage) this.min_damage = cur_damage;
            if (this.max_damage == -1 || cur_damage > this.max_damage) this.max_damage = cur_damage;
        }
    }

    add(other:DamageRange) {
        let result_damage_vals = new Map<number, number>();
        for (let [my_cur_damage, my_rolls] of this.damage_vals.entries()) {
            for (let [other_cur_damage, other_rolls] of other.damage_vals.entries()) {
                let cur_total_damage = my_cur_damage + other_cur_damage;
                if (!result_damage_vals.has(cur_total_damage)) result_damage_vals.set(cur_total_damage, 0);
                result_damage_vals.set(cur_total_damage, result_damage_vals.get(cur_total_damage)! + my_rolls + other_rolls);
            }
        }
        return new DamageRange(result_damage_vals, this.num_attacks + other.num_attacks);
    }

    split_kills(hp_threshold:number):[DamageRange | null, DamageRange | null] {
        if (hp_threshold > this.max_damage) {
            return [null, this];
        } else if (hp_threshold <= this.min_damage) {
            return [this, null];
        }

        let kill_damage_vals = new Map<number, number>();
        let non_kill_damage_vals = new Map<number, number>();
        for (let [cur_damage, cur_rolls] of this.damage_vals.entries()) {
            if (cur_damage >= hp_threshold) {
                kill_damage_vals.set(cur_damage, cur_rolls);
            } else {
                non_kill_damage_vals.set(cur_damage, cur_rolls);
            }
        }
        return [
            new DamageRange(kill_damage_vals, this.num_attacks),
            new DamageRange(non_kill_damage_vals, this.num_attacks),
        ];
    }
}


export class KillChance {
    num_attacks:number
    probability:number
    constructor(num_attacks:number, probability:number){
        this.num_attacks = num_attacks;
        this.probability = probability;
    }
}


export function find_kill(
    damage_range:DamageRange,
    crit_damage_range:DamageRange,
    crit_chance:number,
    accuracy:number,
    target_hp:number,
    attack_depth:number,
    force_full_search:boolean,
    percent_cutoff=0.1
) {
    // NOTE: if attack_depth is too deep, (10+ is where I started to notice the issues), you quickly get overflow issues
    // return type is
    let result = [] as KillChance[];

    let min_possible_damage = Math.min(damage_range.min_damage, crit_damage_range.min_damage);
    let max_possible_damage = Math.max(damage_range.max_damage, crit_damage_range.max_damage);
    let highest_found_kill_pct = 0;
    let memoization = new Map<[number, number, number, number], number>();
    let hits_to_kill = new Map<number, number>();

    // this is a quick and dirty way to ignore calculating psywave, which has vastly more possible rolls, and thus takes much longer to calculate
    // also, don't endlessly search for a move that can't find a guaranteed kill even if it hits every time
    if ( 
        force_full_search ||
        (damage_range.size <= 200 && (min_possible_damage * attack_depth) > target_hp)
    ) {
        for (let cur_num_attacks = 1; cur_num_attacks <= attack_depth; cur_num_attacks++) {
            if ((max_possible_damage * cur_num_attacks) < target_hp) continue;

            // a kill is possible, but not guaranteed
            // find the exact kill percent if all the swings actually hit
            let all_hits_kill_pct = 0
            for (let cur_num_crits = 0; cur_num_crits <= cur_num_attacks; cur_num_crits++) {
                // calculate the probability of this exact configuration of swings occurring (i.e. actually getting this many crits)
                let swing_probability = (
                    combinations(cur_num_attacks, cur_num_crits) *
                    Math.pow(crit_chance, cur_num_crits) *
                    Math.pow(1 - crit_chance, cur_num_attacks - cur_num_crits)
                );
                // TODO: we blindly calculate all probabilities, even if every hit might be a crit.
                // TODO: These probabilities get vanishingly small quickly, maybe we can short cut once the cumulative probability of that many crits is <0.01%?
                // if (swing_probability < 0.01) continue;

                // get the kill percent for this exact combination of crits + non-crits
                let kill_percent = _percent_rolls_kill(
                    cur_num_attacks - cur_num_crits,
                    damage_range,
                    cur_num_crits,
                    crit_damage_range,
                    target_hp,
                    memoization,
                );

                // and multiply that kill percent by the probability of actually getting this combination of crits + non-crits
                all_hits_kill_pct += kill_percent * swing_probability;
            }

            hits_to_kill.set(cur_num_attacks, all_hits_kill_pct);
            let cur_total_kill_pct = 0;
            // now iterate through all possibilities of connecting with this many swings
            for (let cur_num_hits = 1; cur_num_hits <= cur_num_attacks; cur_num_hits++) {
                let cur_hits_to_kill = hits_to_kill.get(cur_num_hits);
                if (cur_hits_to_kill === undefined) cur_hits_to_kill = 0;
                cur_total_kill_pct += (
                    cur_hits_to_kill *
                    combinations(cur_num_attacks, cur_num_hits) *
                    Math.pow(accuracy, cur_num_hits) *
                    Math.pow(1 - accuracy, cur_num_attacks - cur_num_hits)
                );
            }

            if (cur_total_kill_pct > highest_found_kill_pct) highest_found_kill_pct = cur_total_kill_pct;
            if (cur_total_kill_pct > percent_cutoff) result.push(new KillChance(cur_num_attacks, cur_total_kill_pct));
            if (cur_total_kill_pct > 99) break;
        }
    }

    if (highest_found_kill_pct < 99 && highest_found_kill_pct < round(accuracy * 100)) {
        // if we haven't found close enough to a kill, get the guaranteed kill
        result.push(new KillChance(Math.ceil(target_hp / damage_range.min_damage), -1));
    }
    return result;
}


function _percent_rolls_kill(
    num_non_crits:number,
    damage_range:DamageRange,
    num_crits:number,
    crit_damage_range:DamageRange,
    target_hp:number,
    memoization:Map<[number, number, number, number], number>,
) {
    let num_kill_rolls = _percent_rolls_kill_recursive(
        num_non_crits,
        damage_range,
        num_crits,
        crit_damage_range,
        target_hp,
        1,
        0,
        memoization,
    );

    return (100.0 * (num_kill_rolls) / Math.pow(damage_range.size, num_non_crits + num_crits));
}


function _percent_rolls_kill_recursive(
    num_non_crits:number,
    damage_range:DamageRange,
    num_crits:number,
    crit_damage_range:DamageRange,
    target_hp:number,
    num_roll_multiplier:number,
    total_damage:number,
    memoization:Map<[number, number, number, number], number>,
):number {
    let cur_key = [num_non_crits, num_crits, num_roll_multiplier, total_damage] as [number, number, number, number];
    if (memoization.has(cur_key)) return memoization.get(cur_key)!;

    let min_damage_left = (
        (num_non_crits * damage_range.min_damage) +
        (num_crits * crit_damage_range.min_damage)
    );

    let max_damage_left = (
        (num_non_crits * damage_range.max_damage) +
        (num_crits * crit_damage_range.max_damage)
    );

    if (total_damage + min_damage_left >= target_hp) {
        // if kill is guaranteed, add all rolls for this and future attacks
        // NOTE: use the number of rolls in the provided damage_range, so that special moves like psywave still work properly
        let result = num_roll_multiplier * Math.pow(damage_range.size, num_crits + num_non_crits);
        memoization.set(cur_key, result);
        return result;
    } else if (num_crits == 0 && num_non_crits == 0) {
        // ran out of attacks without a kill being found, no kill rolls found
        memoization.set(cur_key, 0);
        return 0;
    } else if (total_damage + max_damage_left < target_hp) {
        // kill is impossible even with future rolls, just quit and don't bother calculating
        memoization.set(cur_key, 0);
        return 0;
    }

    // recursive case: a kill is possiblle, but not found yet
    let result = 0;
    let next_damage_range:DamageRange;
    if (num_crits > 0) {
        next_damage_range = crit_damage_range;
        num_crits -= 1;
    } else {
        next_damage_range = damage_range;
        num_non_crits -= 1;
    }
    
    // find all possible kills from this point forward
    for (let [next_damage_val, next_num_rolls] of next_damage_range.damage_vals.entries()) {
        result += _percent_rolls_kill_recursive(
            num_non_crits,
            damage_range,
            num_crits,
            crit_damage_range,
            target_hp,
            next_num_rolls,
            total_damage + next_damage_val,
            memoization
        );
    }

    result *= num_roll_multiplier;
    memoization.set(cur_key, result);
    return result;
}
