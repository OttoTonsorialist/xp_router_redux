import log from 'electron-log';
import { BadgeList, BaseItem, EnemyMon, Nature, PokemonSpecies, StageModifiers, StatBlock, Trainer } from "@main/mon/universal_data_objects";
import { calc_exp_yield, level_lookups } from "@main/mon/universal_utils";
import { const_xprr } from "@main/utils/constants";
import { cur_gen } from "@main/mon/gen_factory";


export class BagItem {
    base_item:BaseItem;
    quantity:number;

    constructor(
        base_item:BaseItem,
        quantity:number,
    ){
        this.base_item = base_item;
        this.quantity = quantity;
    }

    equals(other:BagItem): boolean {
        return (
            this.base_item.name === other.base_item.name &&
            this.quantity === other.quantity
        );
    }
}


export class Inventory {
    money:number;
    items:BagItem[];
    _bag_limit:number | null;
    _item_lookup:Map<string, number>;

    constructor(
        money:number=3000,
        items:BagItem[] | null=null,
        bag_limit:number | null=null,
    ){
        this.money = money;
        this._bag_limit = bag_limit;
        if (items === null) this.items = [];
        else this.items = items;

        this._item_lookup = new Map<string, number>();
        this._reindex_lookup();
    }

    _reindex_lookup() {
        this._item_lookup.clear();
        this.items.reduce(
            (map, x, idx) => {
                map.set(x.base_item.name, idx);
                return map;
            },
            this._item_lookup,
        );
    }

    _copy() {
        return new Inventory(this.money, this.items, this._bag_limit);
    }

    add_item(base_item:BaseItem, quantity:number, is_purchase=false, force=false) {
        let result = this._copy();
        if (is_purchase) {
            let total_cost = quantity * base_item.purchase_price;
            if (!force && total_cost > result.money) {
                throw new TypeError(`Cannot purchase ${quantity} ${base_item.name} for ${total_cost} with only ${this.money} money`);
            }
            result.money -= total_cost;
        }
        
        if (this._item_lookup.has(base_item.name)) {
            if (!force && base_item.is_key_item) {
                throw new TypeError(`Cannot have multiple of the same key item: ${base_item.name}`);
            }
        } else if (
            !force &&
            this._bag_limit !== null &&
            result.items.length >= this._bag_limit
        ) {
            throw new TypeError(`Cannot add more than ${this._bag_limit} items to bag`);
        } else {
            result._item_lookup.set(base_item.name, result.items.length);
            result.items.push(new BagItem(base_item, quantity));
        }

        return result;
    }

    remove_item(base_item:BaseItem, quantity:number, is_sale=false, force=false) {
        if (!this._item_lookup.has(base_item.name)) {
            if (force) {
                if (!is_sale) return this;
                let result = this._copy();
                result.money += (base_item.sell_price * quantity);
                return result;
            }
        }

        if (!force && base_item.is_key_item && is_sale) {
            throw new TypeError(`Cannot sell key item: ${base_item.name}`);
        }

        let result = this._copy();
        let item_idx = result._item_lookup.get(base_item.name) as number
        let bag_item = result.items[item_idx];
        if (!force && bag_item.quantity < quantity) {
            throw new TypeError(`Cannot sell/use ${quantity} ${base_item.name} when you only have ${bag_item.quantity}`);
        }

        bag_item.quantity -= quantity;
        if (bag_item.quantity <= 0) {
            result.items.splice(item_idx, 1);
            result._reindex_lookup();
        }

        if (is_sale) result.money += (base_item.sell_price * quantity);

        return result;
    }

    equals(other:Inventory):boolean {
        if (this.money != other.money) return false;
        if (this.items.length != other.items.length) return false;

        for (let i = 0; i < this.items.length; i++) {
            if (!this.items[i].equals(other.items[i])) return false;
        }
        return true;
    }
}


export class SoloMon {
    name:string;
    species_def:PokemonSpecies;
    dvs:StatBlock;
    badges:BadgeList;
    _empty_stat_block:StatBlock;
    ability_idx:number;
    ability:string;
    nature:Nature;
    held_item:string;
    move_list:string[];
    cur_exp:number;
    cur_level:number;
    exp_to_next_level:number;
    percent_exp_to_next_level:number;
    realized_stat_exp:StatBlock;
    unrealized_stat_exp:StatBlock;
    cur_stats:StatBlock;

    constructor(
        name:string,
        species_def:PokemonSpecies,
        dvs:StatBlock,
        badges:BadgeList,
        empty_stat_block:StatBlock,
        ability_idx:number,
        nature:Nature,
        held_item="",
        cur_exp:number=0,
        move_list:string[] | null=null,
        realized_stat_exp:StatBlock | null=null,
        unrealized_stat_exp:StatBlock | null=null,
        gained_exp:number=0,
        gained_stat_exp:StatBlock | null=null,
    ) {
        this.name = name;
        this.species_def = species_def;
        this.dvs = dvs;
        this.badges = badges
        this.held_item = held_item;
        this.ability_idx = ability_idx;
        this.nature = nature;
        this._empty_stat_block = empty_stat_block;

        if (this.species_def.abilities.length > 0) this.ability = this.species_def.abilities[this.ability_idx];
        else this.ability = "";

        if (cur_exp === 0) {
            try {
                this.cur_exp = level_lookups[this.species_def.growth_rate].get_exp_for_level(5);
            } catch (err) {
                throw new TypeError(`Invalid growth rate: ${this.species_def.growth_rate}`);
            }
        } else {
            this.cur_exp = cur_exp;
        }

        [this.cur_level, this.exp_to_next_level] = level_lookups[this.species_def.growth_rate].get_level_info(this.cur_exp);

        if (move_list === null) {
            this.move_list = [];
            for (let [target_level, new_move] of this.species_def.levelup_moves) {
                if (target_level > this.cur_level) break;
                if (!this.move_list.includes(new_move)) this.move_list.push(new_move);
                if (this.move_list.length > 4) this.move_list.slice(0, 1);
            }

            while (this.move_list.length < 4) this.move_list.push("");
        } else {
            this.move_list = move_list;
        }

        if (realized_stat_exp === null) {
            realized_stat_exp = this._empty_stat_block.copy();
            realized_stat_exp._is_stat_exp = true;
        }
        this.realized_stat_exp = realized_stat_exp;

        if (gained_stat_exp === null) {
            gained_stat_exp = this._empty_stat_block.copy();
            gained_stat_exp._is_stat_exp = true;
        }

        if (unrealized_stat_exp === null) unrealized_stat_exp = realized_stat_exp.copy();
        this.unrealized_stat_exp = unrealized_stat_exp.add(gained_stat_exp);

        this.cur_exp += gained_exp;
        if (gained_exp < this.exp_to_next_level) {
            // gained xp did not cause a level up
            // just keep collecting unrealized stat xp, and keep track of new XP
            this.exp_to_next_level -= gained_exp;
        } else {
            // either gained xp caused a level up
            // or, we're at level 100
            [this.cur_level, this.exp_to_next_level] = level_lookups[this.species_def.growth_rate].get_level_info(this.cur_exp);
            if (this.cur_level === 100) {
                // level 100. We aren't technically gaining experience anymore, so just override the xp values
                // keep track of stat xp, but have to rely on vitamins to "realize" them
                this.cur_exp = level_lookups[this.species_def.growth_rate].get_exp_for_level(100);
            } else {
                // gained xp DID cause a level up
                // realize stat XP at this point
                this.realized_stat_exp = this.unrealized_stat_exp.copy();
            }
        }

        if (this.exp_to_next_level <= 0) {
            this.percent_exp_to_next_level = -1;
        } else {
            let last_level_exp = level_lookups[this.species_def.growth_rate].get_exp_for_level(this.cur_level);
            this.percent_exp_to_next_level = Math.floor((this.exp_to_next_level / (this.cur_exp + this.exp_to_next_level - last_level_exp)) * 100);
        }
        this.cur_stats = this.species_def.stats.calc_level_stats(
            this.cur_level,
            this.dvs,
            this.realized_stat_exp,
            this.badges,
            this.nature,
            this.held_item
        );
    }

    equals(other:SoloMon):boolean {
        if (
            this.species_def.name != other.species_def.name ||
            this.cur_level != other.cur_level ||
            this.cur_exp != other.cur_exp ||
            this.dvs != other.dvs ||
            this.realized_stat_exp != other.realized_stat_exp ||
            this.unrealized_stat_exp != other.unrealized_stat_exp ||
            this.cur_stats != other.cur_stats ||
            this.held_item != other.held_item ||
            !this.badges.equals(other.badges)
        ) return false;
        if (this.move_list.length != other.move_list.length) return false;
        for (let i = 0; i < this.move_list.length; i++) {
            if (this.move_list[i] != other.move_list[i]) return false;
        }

        return true;
    }

    get_net_gain_from_stat_exp() {
        return this.cur_stats.subtract(
            this.species_def.stats.calc_level_stats(
                this.cur_level,
                this.dvs,
                this._empty_stat_block,
                this.badges,
                this.nature,
                this.held_item,
            )
        );
    }

    get_mon_obj(stage_modifiers:StageModifiers | null=null) {
        if (stage_modifiers === null) stage_modifiers = new StageModifiers();

        return new EnemyMon(
            this.name,
            this.cur_level,
            -1,
            this.move_list,
            this.species_def.stats.calc_battle_stats(this.cur_level, this.dvs, this.realized_stat_exp, stage_modifiers, this.badges, this.nature, this.held_item),
            this.species_def.stats,
            this.dvs,
            this.realized_stat_exp,
            this.badges,
            this.held_item,
            undefined,
            true,
            undefined,
            undefined,
            undefined,
            this.ability,
            this.nature
        );
    }

    get_move_destination(move_name:string, dest:number):[number, boolean] {
        // if one were to attempt to learn a move defined by the params
        // return what would the actual destination would be
        
        // if we are forgetting the move, always respect dest
        if (move_name === "") return [dest, true];

        // if we already know the move, ignore dest entirely and just don't learn it
        if (this.move_list.includes(move_name)) return [-1, false];

        for (let i = 0; i < this.move_list.length; i++) {
            // if we're learning the move and we have empty slots, always learn the move
            if (this.move_list[i] === "") return [i, false];
        }

        // if we have 4 moves already, and none of those moves are what we're trying to learn
        // then we finally care bout the destination being passed in
        return [dest, true];
    }

}


export class RouteState {
    solo_mon:SoloMon;
    inventory:Inventory;

    constructor(
        solo_mon:SoloMon,
        inventory:Inventory,
    ) {
        this.solo_mon = solo_mon;
        this.inventory = inventory;
    }

    equals(other:RouteState):boolean {
        return (
            this.solo_mon.equals(other.solo_mon) &&
            this.inventory.equals(other.inventory)
        );
    }

    learn_move(move_name:string, dest:number, source:string): [RouteState, string] {
        let error_message = "";
        let inv:Inventory;
        if (source === const_xprr.MOVE_SOURCE_LEVELUP || source === const_xprr.MOVE_SOURCE_TUTOR) inv = this.inventory;
        else {
            let consume_item = false;
            try {
                consume_item =  !(cur_gen().item_db().get_item(source).is_key_item);
            } catch (e) {
                error_message = `Could not get valid item for move ${move_name} source: ${source}`;
            }

            if (consume_item) {
                try {
                    inv = this.inventory.remove_item(cur_gen().item_db().get_item(source), 1, undefined, false);
                } catch(e) {
                    error_message = JSON.stringify(e);
                    inv = this.inventory.remove_item(cur_gen().item_db().get_item(source), 1, false, true);
                }
            } else {
                inv = this.inventory;
            }
        }

        return [
            new RouteState(_learn_move(this.solo_mon, move_name, dest), inv),
            error_message
        ];
    }

    vitamin(vitamin_name:string): [RouteState, string] {
        let error_messages = [] as string[];
        let new_mon:SoloMon;
        try {
            new_mon = _take_vitamin(this.solo_mon, vitamin_name);
        } catch (e) {
            error_messages.push(JSON.stringify(e));
            new_mon = _take_vitamin(this.solo_mon, vitamin_name, true);
        }

        let inv:Inventory;
        try {
            inv = this.inventory.remove_item(cur_gen().item_db().get_item(vitamin_name), 1, false);
        } catch (e) {
            error_messages.push(JSON.stringify(e));
            inv = this.inventory.remove_item(cur_gen().item_db().get_item(vitamin_name), 1, false, true);
        }

        return [
            new RouteState(new_mon, inv),
            error_messages.join(", ")
        ];
    }

    rare_candy(): [RouteState, string] {
        let error_message = "";

        let inv:Inventory;
        try {
            inv = this.inventory.remove_item(cur_gen().item_db().get_item(const_xprr.RARE_CANDY), 1, false);
        } catch (e) {
            error_message = JSON.stringify(e);
            inv = this.inventory.remove_item(cur_gen().item_db().get_item(const_xprr.RARE_CANDY), 1, false, true);
        }

        return [
            new RouteState(_rare_candy(this.solo_mon), inv),
            error_message
        ];
    }

    defeat_mon(enemy_mon:EnemyMon, trainer_name="", exp_split=1, pay_day_amount=0): [RouteState, string] {
        return [
            new RouteState(
                _defeat_mon(this.solo_mon, enemy_mon, exp_split, trainer_name),
                _defeat_trainer(this.inventory, this.solo_mon, cur_gen().trainer_db().get_trainer(trainer_name), pay_day_amount),
            ),
            "",
        ];
    }

    add_item(item_name:string, amount:number, is_purchase:boolean): [RouteState, string] {
        let error_message = "";

        let inv:Inventory;
        try {
            inv = this.inventory.add_item(cur_gen().item_db().get_item(item_name), amount, is_purchase);
        } catch (e) {
            error_message = JSON.stringify(e);
            inv = this.inventory.add_item(cur_gen().item_db().get_item(item_name), amount, is_purchase, true);
        }

        return [
            new RouteState(this.solo_mon, inv),
            error_message,
        ];
    }

    remove_item(item_name:string, amount:number, is_purchase:boolean): [RouteState, string] {
        let error_message = "";

        let inv:Inventory;
        try {
            inv = this.inventory.remove_item(cur_gen().item_db().get_item(item_name), amount, is_purchase);
        } catch (e) {
            error_message = JSON.stringify(e);
            inv = this.inventory.remove_item(cur_gen().item_db().get_item(item_name), amount, is_purchase, true);
        }

        return [
            new RouteState(this.solo_mon, inv),
            error_message,
        ];
    }

    hold_item(item_name:string, is_consumed:boolean): [RouteState, string] {
        let error_messages = [] as string[];

        let inv:Inventory = this.inventory;
        let existing_held = this.solo_mon.held_item;

        if ((existing_held.length > 0) && (existing_held !== "None") && (existing_held !== const_xprr.NO_ITEM) && !is_consumed) {
            try {
                inv = inv.add_item(cur_gen().item_db().get_item(existing_held), 1, false);
            } catch (e) {
                error_messages.push(JSON.stringify(e));
                inv = inv.add_item(cur_gen().item_db().get_item(existing_held), 1, false, true);
            }
        }

        if ((item_name.length > 0) && (item_name !== "None") && (item_name !== const_xprr.NO_ITEM)) {
            try {
                inv = this.inventory.remove_item(cur_gen().item_db().get_item(item_name), 1);
            } catch (e) {
                error_messages.push(JSON.stringify(e));
                inv = this.inventory.remove_item(cur_gen().item_db().get_item(item_name), 1, false, true);
            }
        }

        return [
            new RouteState(_hold_item(this.solo_mon, item_name), inv),
            error_messages.join(", "),
        ];
    }

    blackout(): [RouteState, string] {
        let inv = this.inventory._copy();
        inv.money = Math.floor(inv.money / 2);
        // TODO: validate rounding is correct here...
        return [
            new RouteState(this.solo_mon, inv),
            "",
        ];
    }

    evolve(evolved_species:string, by_stone=""): [RouteState, string] {
        let error_messages = [] as string[];
        let result_mon = this.solo_mon;

        if ((evolved_species.length > 0) && (evolved_species === const_xprr.NO_POKEMON)) {
            let new_species = this.solo_mon.species_def;
            try {
                new_species = cur_gen().mon_db().get_species(evolved_species);
                if (new_species.growth_rate !== this.solo_mon.species_def.growth_rate) {
                    error_messages.push(`Cannot evolve into species (${new_species.name}) with different growth rate: ${new_species.growth_rate}`);
                } else {
                    result_mon = _evolve(this.solo_mon, new_species);
                }
            } catch (e) {
                error_messages.push(JSON.stringify(e));
            }
        }

        let inv:Inventory = this.inventory;
        if (by_stone.length > 0) {
            try {
                inv = this.inventory.remove_item(cur_gen().item_db().get_item(by_stone), 1);
            } catch (e) {
                error_messages.push(JSON.stringify(e));
                inv = this.inventory.remove_item(cur_gen().item_db().get_item(by_stone), 1, false, true);
            }
        }

        return [
            new RouteState(result_mon, inv),
            error_messages.join(", "),
        ];
    }
}


function _defeat_trainer(
    inventory:Inventory,
    solo_mon:SoloMon,
    trainer_obj:Trainer | null,
    pay_day_amount:number
) {
    if (trainer_obj === null) return inventory;
    let result = inventory._copy();
    let reward_money = trainer_obj.money;
    if (solo_mon.held_item === const_xprr.AMULET_COIN_ITEM_NAME) reward_money *= 2;
    result.money += reward_money + pay_day_amount;

    let fight_reward = cur_gen().get_fight_reward(trainer_obj.name);
    if (fight_reward.length > 0) {
        // it's ok to fail to add a fight reward to your bag
        try {
            result = result.add_item(cur_gen().item_db().get_item(fight_reward), 1);
        } catch (e) {}
    }
    return result;
}


function _defeat_mon(cur_mon:SoloMon, enemy_mon:EnemyMon, exp_split:number, trainer_name:string) {
    let gained_exp = enemy_mon.exp;
    if (exp_split != 1) {
        gained_exp = calc_exp_yield(
            cur_gen().mon_db().get_species(enemy_mon.species).base_exp,
            enemy_mon.level,
            enemy_mon.is_trainer_mon,
            exp_split,
        )
    }
    return new SoloMon(
        cur_mon.name,
        cur_mon.species_def,
        cur_mon.dvs,
        cur_mon.badges.award_badge(trainer_name),
        cur_mon._empty_stat_block,
        cur_mon.ability_idx,
        cur_mon.nature,
        cur_mon.held_item,
        cur_mon.cur_exp,
        cur_mon.move_list,
        cur_mon.realized_stat_exp,
        cur_mon.unrealized_stat_exp,
        gained_exp,
        cur_gen().get_stat_xp_yield(enemy_mon.species, exp_split, cur_mon.held_item),
    );
}


function _rare_candy(cur_mon:SoloMon) {
    return new SoloMon(
        cur_mon.name,
        cur_mon.species_def,
        cur_mon.dvs,
        cur_mon.badges,
        cur_mon._empty_stat_block,
        cur_mon.ability_idx,
        cur_mon.nature,
        cur_mon.held_item,
        cur_mon.cur_exp,
        cur_mon.move_list,
        cur_mon.realized_stat_exp,
        cur_mon.unrealized_stat_exp,
        cur_mon.exp_to_next_level,
    );
}


function _learn_move(cur_mon:SoloMon, move_name:string, dest:number) {
    let new_movelist = cur_mon.move_list;
    let actual_dest = cur_mon.get_move_destination(move_name, dest)[0];
    if (actual_dest !== null) {
        new_movelist = structuredClone(cur_mon.move_list);
        new_movelist[actual_dest] = move_name;
    }

    return new SoloMon(
        cur_mon.name,
        cur_mon.species_def,
        cur_mon.dvs,
        cur_mon.badges,
        cur_mon._empty_stat_block,
        cur_mon.ability_idx,
        cur_mon.nature,
        cur_mon.held_item,
        cur_mon.cur_exp,
        new_movelist,
        cur_mon.realized_stat_exp,
        cur_mon.unrealized_stat_exp,
    );
}


function _take_vitamin(cur_mon:SoloMon, vit_name:string, force=false) {
    // NOTE: some potentially buggy reporting of how much stat xp is actually possible when nearing the stat XP cap
    // this is due to the fact that we are keeping unrealized stat XP separate,
    // so any stat XP over the hard cap won't be properly ignored until it's realized
    // however, this bug is both minor (won't ever be reported in the actual pkmn stats) and rare (only when nearing stat XP cap, which is uncommon in solo playthroughs) 
    // intentionally ignoring for now
    let vit_cap = cur_gen().get_vitamin_cap();
    let vit_boost = cur_gen().get_vitamin_amount();
    let final_realized_stat_exp = cur_mon.unrealized_stat_exp.copy();

    for (let boosted_stat of cur_gen().get_stats_boosted_by_vitamin(vit_name)) {
        if (boosted_stat === const_xprr.HP) {
            if (cur_mon.unrealized_stat_exp.hp >= vit_cap && !force) throw new TypeError(`Ineffective Vitamin: ${vit_name} (Already above vitamin cap)`);
            final_realized_stat_exp = final_realized_stat_exp.add(cur_gen().make_stat_block(vit_boost, 0, 0, 0, 0, 0, true));
        } else if (boosted_stat === const_xprr.ATTACK) {
            if (cur_mon.unrealized_stat_exp.attack >= vit_cap && !force) throw new TypeError(`Ineffective Vitamin: ${vit_name} (Already above vitamin cap)`);
            final_realized_stat_exp = final_realized_stat_exp.add(cur_gen().make_stat_block(0, vit_boost, 0, 0, 0, 0, true));
        } else if (boosted_stat === const_xprr.DEFENSE) {
            if (cur_mon.unrealized_stat_exp.defense >= vit_cap && !force) throw new TypeError(`Ineffective Vitamin: ${vit_name} (Already above vitamin cap)`);
            final_realized_stat_exp = final_realized_stat_exp.add(cur_gen().make_stat_block(0, 0, vit_boost, 0, 0, 0, true));
        } else if (boosted_stat === const_xprr.SPECIAL_ATTACK) {
            if (cur_mon.unrealized_stat_exp.special_attack >= vit_cap && !force) throw new TypeError(`Ineffective Vitamin: ${vit_name} (Already above vitamin cap)`);
            final_realized_stat_exp = final_realized_stat_exp.add(cur_gen().make_stat_block(0, 0, 0, vit_boost, 0, 0, true));
        } else if (boosted_stat === const_xprr.SPECIAL_DEFENSE) {
            if (cur_mon.unrealized_stat_exp.special_defense >= vit_cap && !force) throw new TypeError(`Ineffective Vitamin: ${vit_name} (Already above vitamin cap)`);
            final_realized_stat_exp = final_realized_stat_exp.add(cur_gen().make_stat_block(0, 0, 0, 0, vit_boost, 0, true));
        } else if (boosted_stat === const_xprr.SPEED) {
            if (cur_mon.unrealized_stat_exp.speed >= vit_cap && !force) throw new TypeError(`Ineffective Vitamin: ${vit_name} (Already above vitamin cap)`);
            final_realized_stat_exp = final_realized_stat_exp.add(cur_gen().make_stat_block(0, 0, 0, 0, 0, vit_boost, true));
        } else {
            throw new TypeError(`Unknown vitamin: ${vit_name}`);
        }
    }

    return new SoloMon(
        cur_mon.name,
        cur_mon.species_def,
        cur_mon.dvs,
        cur_mon.badges,
        cur_mon._empty_stat_block,
        cur_mon.ability_idx,
        cur_mon.nature,
        cur_mon.held_item,
        cur_mon.cur_exp,
        cur_mon.move_list,
        final_realized_stat_exp,
    );
}


function _hold_item(cur_mon:SoloMon, item_name:string) {
    return new SoloMon(
        cur_mon.name,
        cur_mon.species_def,
        cur_mon.dvs,
        cur_mon.badges,
        cur_mon._empty_stat_block,
        cur_mon.ability_idx,
        cur_mon.nature,
        item_name,
        cur_mon.cur_exp,
        cur_mon.move_list,
        cur_mon.realized_stat_exp,
        cur_mon.unrealized_stat_exp,
    );
}


function _evolve(cur_mon:SoloMon, new_mon:PokemonSpecies) {
    return new SoloMon(
        new_mon.name,
        new_mon,
        cur_mon.dvs,
        cur_mon.badges,
        cur_mon._empty_stat_block,
        cur_mon.ability_idx,
        cur_mon.nature,
        cur_mon.held_item,
        cur_mon.cur_exp,
        cur_mon.move_list,
        cur_mon.realized_stat_exp,
        cur_mon.unrealized_stat_exp,
    );
}
