import { EnemyMon, Trainer } from "@main/mon/universal_data_objects";
import { const_xprr } from "@main/utils/constants";
import { RouteState } from "@main/routing/full_route_state";
import { cur_gen } from "@main/mon/gen_factory";
import { sanitize_string } from "@main/utils/io_utils";


export class EventItemArgs {
    to_defeat_mon:EnemyMon;
    exp_split:number;
    pay_day_amount:number;
    defeating_trainer:boolean;

    constructor(
        to_defeat_mon:EnemyMon,
        exp_split:number=1,
        pay_day_amount:number=0,
        defeating_trainer:boolean=false,
    ) {
        this.to_defeat_mon = to_defeat_mon;
        this.exp_split = exp_split;
        this.pay_day_amount = pay_day_amount;
        this.defeating_trainer = defeating_trainer;
    }
}


export class BaseEventDefinition {
    enabled:boolean;
    notes:string;
    tags:string[];

    constructor(notes:string, enabled:boolean, tags:(string[] | null)) {
        this.notes = notes;
        this.enabled = enabled;
        if (tags === null) this.tags = [];
        else this.tags = tags;
    }

    generate_event_item_args(): (EventItemArgs | null)[] {
        return [null];
    }

    apply(cur_state:RouteState, args:EventItemArgs | null): [RouteState, string] {
        return [cur_state, ""];
    }

    static get_event_key(): string {
        return const_xprr.TASK_NOTES_ONLY;
    }

    get_event_type(): string {
        return const_xprr.TASK_NOTES_ONLY;
    }

    protected _base_serialize(payload:any): any {
        let result:any = {
            [const_xprr.ENABLED_KEY]: this.enabled,
            [const_xprr.TAGS_KEY]: this.tags,
        };
        if (this.notes.length > 0) result[const_xprr.TASK_NOTES_ONLY] = this.notes;

        return {...result, ...payload};
    }

    serialize(): any {
        return this._base_serialize({});
    }

    protected static _base_deserialize(payload:any): [string, boolean, (string[] | null)] {
        let result = ["", payload[const_xprr.ENABLED_KEY], payload[const_xprr.TAGS_KEY]] as [string, boolean, (string[] | null)];
        if (const_xprr.TASK_NOTES_ONLY in payload) result[0] = payload[const_xprr.TASK_NOTES_ONLY];
        return result;
    }

    static deserialize(raw:any): BaseEventDefinition {
        return new BaseEventDefinition(...this._base_deserialize(raw));
    }

    describe():string {
        return `Notes: ${this.notes}`;
    }

    describe_item():string {
        return this.describe();
    }

    get_pokemon_list(definition_order=false): [number, EnemyMon][] {
        return [];
    }

    experience_per_second(): number {
        return -1;
    }

    is_highlighted(): boolean {
        return this.tags.includes(const_xprr.HIGHLIGHT_LABEL);
    }

    toggle_highlight() {
        let tag_idx = this.tags.indexOf(const_xprr.HIGHLIGHT_LABEL);
        if (tag_idx !== -1) this.tags.splice(tag_idx, 1);
        else this.tags.push(const_xprr.HIGHLIGHT_LABEL);
    }

    do_render(search:string, filter_types:string[]): boolean {
        if (
            (filter_types.length > 0) &&
            (!filter_types.includes(this.get_event_type()))
        ) return false;

        if (search.length === 0) return true;
        search = search.toLowerCase();
        return (
            this.describe().toLowerCase().includes(search) ||
            this.notes.toLowerCase().includes(search)
        );
    }

    is_battle() {
        return false;
    }
}

export class InventoryEventDefinition extends BaseEventDefinition{
    name:string;
    quantity:number;
    is_acquire:boolean;
    with_money:boolean;

    constructor(name:string, amount:number, is_acquire:boolean, with_money:boolean, notes="", enabled=true, tags:(string[] | null)=null) {
        super(notes, enabled, tags);
        this.name = name;
        this.quantity = amount;
        this.is_acquire = is_acquire;
        this.with_money = with_money;
    }

    static get_event_key(): string {
        return const_xprr.INVENTORY_EVENT_DEFINITON;
    }

    apply(cur_state: RouteState, args: EventItemArgs | null): [RouteState, string] {
        if (this.is_acquire) return cur_state.add_item(this.name, this.quantity, this.with_money);
        return cur_state.remove_item(this.name, this.quantity, this.with_money);
    }

    get_event_type(): string {
        if (this.is_acquire && this.with_money) return const_xprr.TASK_PURCHASE_ITEM;
        else if (this.is_acquire) return const_xprr.TASK_GET_FREE_ITEM;
        else if (this.with_money) return const_xprr.TASK_SELL_ITEM;
        return const_xprr.TASK_USE_ITEM;
    }

    serialize() {
        return this._base_serialize(
            {[InventoryEventDefinition.get_event_key()] :[this.name, this.quantity, this.is_acquire, this.with_money]}
        );
    }

    static deserialize(raw_base: any): InventoryEventDefinition {
        let raw = raw_base[InventoryEventDefinition.get_event_key()];
        if (Array.isArray(raw)){
            return new InventoryEventDefinition(
                raw[0] as string,
                raw[1] as number,
                raw[2] as boolean,
                raw[3] as boolean,
                ...BaseEventDefinition._base_deserialize(raw_base),
            );
        }
        throw new TypeError('Could not deserialize the following data into an InventoryEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        let action = "Use/Drop";
        if (this.is_acquire && this.with_money) action = "Purchase";
        else if (this.is_acquire && !this.with_money) action = "Find";
        else if (!this.is_acquire && this.with_money) action = "Sell";

        return `${action} ${this.name} ${this.quantity}`;
    }

    describe_item(): string {
        return this.describe();
    }
}

export class HoldItemEventDefinition extends BaseEventDefinition{
    name:string;
    consumed:boolean;

    constructor(name:string, consumed=false, notes="", enabled=true, tags:(string[] | null)=null){
        super(notes, enabled, tags);
        this.name = name;
        this.consumed = consumed;
    }

    static get_event_key(): string {
        return const_xprr.TASK_HOLD_ITEM;
    }

    apply(cur_state: RouteState, args: EventItemArgs | null): [RouteState, string] {
        return cur_state.hold_item(this.name, this.consumed);
    }

    serialize() {
        return this._base_serialize(
            {[HoldItemEventDefinition.get_event_key()]: [this.name, this.consumed]}
        );
    }

    static deserialize(raw_base: any): HoldItemEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (Array.isArray(raw)) {
            if (raw.length === 1) return new HoldItemEventDefinition(raw[0] as string, undefined, ...BaseEventDefinition._base_deserialize(raw_base));
            return new HoldItemEventDefinition(raw[0] as string, raw[1] as boolean, ...BaseEventDefinition._base_deserialize(raw_base));
        }
        throw new TypeError('Could not deserialize the following data into an HoldItemEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        return `Hold ${this.name}`;
    }

    describe_item(): string {
        return this.describe();
    }
}

export class VitaminEventDefinition extends BaseEventDefinition{
    vitamin:string;
    quantity:number;

    constructor(vitamin:string, quantity:number, notes="", enabled=true, tags:(string[] | null)=null) {
        super(notes, enabled, tags);
        this.vitamin = vitamin;
        this.quantity = quantity;
    }

    static get_event_key(): string {
        return const_xprr.TASK_VITAMIN;
    }

    generate_event_item_args(): EventItemArgs[] {
        // create an instance for each vitamin taken, since vitamins get applied one at a time
        return new Array(this.quantity).fill(null);
    }

    apply(cur_state: RouteState, args: EventItemArgs | null): [RouteState, string] {
        // NOTE: deliberately ignoring amount here, since that's handled at the group level
        // just apply one vitamin at a time in this function, since each vitamin application gets its
        // own EventItem instance
        return cur_state.vitamin(cur_gen().item_db().get_item(this.vitamin).name);
    }

    serialize() {
        return this._base_serialize(
            {[VitaminEventDefinition.get_event_key()]: [this.vitamin, this.quantity]}
        );
    }

    static deserialize(raw_base: any): VitaminEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (Array.isArray(raw)) {
            return new VitaminEventDefinition(raw[0] as string, raw[1] as number, ...BaseEventDefinition._base_deserialize(raw_base));
        } else if (typeof raw === "string") {
            return new VitaminEventDefinition(raw, 1, ...BaseEventDefinition._base_deserialize(raw_base));
        }
        throw new TypeError('Could not deserialize the following data into an VitaminEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        return `Vitamin ${this.vitamin} x${this.quantity}`;
    }

    describe_item(): string {
        return `Vitamin ${this.vitamin} x1`;
    }
}

export class RareCandyEventDefinition extends BaseEventDefinition {
    quantity:number;

    constructor(quantity:number, notes="", enabled=true, tags:(string[] | null)=null) {
        super(notes, enabled, tags);
        this.quantity = quantity;
    }

    static get_event_key(): string {
        return const_xprr.TASK_RARE_CANDY;
    }

    generate_event_item_args(): (EventItemArgs | null)[] {
        return new Array(this.quantity).fill(null);
    }

    apply(cur_state: RouteState, args: EventItemArgs | null): [RouteState, string] {
        return cur_state.rare_candy();
    }

    serialize() {
        return this._base_serialize(
            {[RareCandyEventDefinition.get_event_key()]: this.quantity}
        );
    }

    static deserialize(raw_base: any): RareCandyEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (typeof raw === "boolean") {
            return new RareCandyEventDefinition(1, ...BaseEventDefinition._base_deserialize(raw_base));
        } else if (typeof raw === "number") {
            return new RareCandyEventDefinition(raw as number, ...BaseEventDefinition._base_deserialize(raw_base));
        }
        throw new TypeError('Could not deserialize the following data into an RareCandyEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        return `Rare Candy, x${this.quantity}`;
    }

    describe_item(): string {
        return `Rare Candy, x1`;
    }
}

export class SaveEventDefinition extends BaseEventDefinition {
    location:string;

    constructor(location:string, notes="", enabled=true, tags:(string[] | null)=null) {
        super(notes, enabled, tags);
        this.location = location;
    }

    static get_event_key(): string {
        return const_xprr.TASK_SAVE;
    }

    serialize() {
        return this._base_serialize(
            {[SaveEventDefinition.get_event_key()]: [this.location]}
        );
    }

    static deserialize(raw_base: any): SaveEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (Array.isArray(raw)) {
            return new SaveEventDefinition(raw[0] as string, ...BaseEventDefinition._base_deserialize(raw_base));
        }
        throw new TypeError('Could not deserialize the following data into an SaveEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        return `Game Saved at: ${this.location}`;
    }

    describe_item(): string {
        return this.describe();
    }
}

export class HealEventDefinition extends BaseEventDefinition {
    location:string;

    constructor(location:string, notes="", enabled=true, tags:(string[] | null)=null) {
        super(notes, enabled, tags);
        this.location = location;
    }

    static get_event_key(): string {
        return const_xprr.TASK_HEAL;
    }

    serialize() {
        return this._base_serialize(
            {[HealEventDefinition.get_event_key()]: [this.location]}
        );
    }

    static deserialize(raw_base: any): HealEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (Array.isArray(raw)) {
            return new HealEventDefinition(raw[0] as string, ...BaseEventDefinition._base_deserialize(raw_base));
        }
        throw new TypeError('Could not deserialize the following data into an HealEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        return `PkmnCenter Heal at: ${this.location}`;
    }

    describe_item(): string {
        return this.describe();
    }
}

export class BlackoutEventDefinition extends BaseEventDefinition {
    location:string;

    constructor(location:string, notes="", enabled=true, tags:(string[] | null)=null) {
        super(notes, enabled, tags);
        this.location = location;
    }

    static get_event_key(): string {
        return const_xprr.TASK_HEAL;
    }

    apply(cur_state: RouteState, args: EventItemArgs | null): [RouteState, string] {
        return cur_state.blackout();
    }

    serialize() {
        return this._base_serialize(
            {[BlackoutEventDefinition.get_event_key()]: [this.location]}
        );
    }

    static deserialize(raw_base: any): BlackoutEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (Array.isArray(raw)) {
            return new BlackoutEventDefinition(raw[0] as string, ...BaseEventDefinition._base_deserialize(raw_base));
        }
        throw new TypeError('Could not deserialize the following data into an BlackoutEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        return `Black Out back to: ${this.location}`;
    }

    describe_item(): string {
        return this.describe();
    }
}

export class EvolutionEventDefinition extends BaseEventDefinition {
    evolved_species:string;
    by_stone:string;

    constructor(evolved_species:string, by_stone:string, notes="", enabled=true, tags:(string[] | null)=null) {
        super(notes, enabled, tags);
        this.evolved_species = evolved_species;
        this.by_stone = by_stone;
    }

    static get_event_key(): string {
        return const_xprr.TASK_EVOLUTION;
    }

    apply(cur_state: RouteState, args: EventItemArgs | null): [RouteState, string] {
        return cur_state.evolve(this.evolved_species, this.by_stone);
    }

    serialize() {
        return this._base_serialize(
            {
                [EvolutionEventDefinition.get_event_key()]: {
                    [const_xprr.EVOLVED_SPECIES]: this.evolved_species,
                    [const_xprr.BY_STONE_KEY]: this.by_stone,
                }
            }
        );
    }

    static deserialize(raw_base: any): EvolutionEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (const_xprr.EVOLVED_SPECIES in raw && const_xprr.BY_STONE_KEY in raw) {
            return new EvolutionEventDefinition(raw[const_xprr.EVOLVED_SPECIES], raw[const_xprr.BY_STONE_KEY], ...BaseEventDefinition._base_deserialize(raw_base));
        }
        throw new TypeError('Could not deserialize the following data into an EvolutionEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        return `Evolve into: ${this.evolved_species}`;
    }

    describe_item(): string {
        return this.describe();
    }
}

export class LevelUpKey {
    mon:string;
    level:number;
    move_name:string;

    constructor(
        mon:string,
        level:number,
        move_name:string,
    ) {
        this.mon = sanitize_string(mon);
        this.level = level;
        this.move_name = sanitize_string(move_name);
    }

}

export class LearnMoveEventDefinition extends BaseEventDefinition {
    move_to_learn:string;
    destination:number;
    source:string;
    level:number;
    mon:string;

    constructor(move_to_learn:string | null, destination:number | null, source:string, level=const_xprr.LEVEL_ANY_NUMBER, mon="", notes="", enabled=true, tags:(string[] | null)=null) {
        super(notes, enabled, tags);
        if (move_to_learn === null) this.move_to_learn = "";
        else this.move_to_learn = move_to_learn;

        if (destination === null) this.destination = -1;
        else this.destination = destination;

        this.source = source;
        this.level = level;
        this.mon = mon;
    }

    static get_event_key(): string {
        return const_xprr.LEARN_MOVE_KEY;
    }

    apply(cur_state: RouteState, args: EventItemArgs | null): [RouteState, string] {
        // do a bit fo book keeping. Manually update the definition to accurately reflect what happened to the move
        this.destination = cur_state.solo_mon.get_move_destination(this.move_to_learn, this.destination)[0];
        return cur_state.learn_move(this.move_to_learn, this.destination, this.source);
    }

    get_event_type(): string {
        if (this.source === const_xprr.MOVE_SOURCE_LEVELUP) return const_xprr.TASK_LEARN_MOVE_LEVELUP;
        return const_xprr.TASK_LEARN_MOVE_TM;
    }

    serialize() {
        return this._base_serialize(
            {
                [LearnMoveEventDefinition.get_event_key()]: {
                    [const_xprr.LEARN_MOVE_KEY]: this.move_to_learn,
                    [const_xprr.MOVE_DEST_KEY]: this.destination,
                    [const_xprr.MOVE_SOURCE_KEY]: this.source,
                    [const_xprr.MOVE_LEVEL_KEY]: this.is_any_level() ? const_xprr.LEVEL_ANY_STRING : this.level,
                    // TODO: do we need to coerce "" to null here? (mostly for backwards compatibility)
                    [const_xprr.MOVE_MON_KEY]: this.mon,
                }
            }
        );
    }

    static deserialize(raw_base: any, mon_default:string=""): LearnMoveEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (Array.isArray(raw)) {
            let level_val = raw[3];
            if (typeof level_val === "string") {
                level_val = const_xprr.LEVEL_ANY_NUMBER;
            }
            return new LearnMoveEventDefinition(
                raw[0] as (string | null),
                raw[1] as (number | null),
                raw[2] as string,
                level_val as number,
                mon_default,
                ...BaseEventDefinition._base_deserialize(raw_base),
            );
        } else if (
            const_xprr.LEARN_MOVE_KEY in raw &&
            const_xprr.MOVE_DEST_KEY in raw &&
            const_xprr.MOVE_SOURCE_KEY in raw &&
            const_xprr.MOVE_LEVEL_KEY in raw
        ) {
            let mon_val:string = mon_default;
            if (const_xprr.MOVE_MON_KEY in raw && raw[const_xprr.MOVE_MON_KEY] !== null) mon_val = raw[const_xprr.MOVE_MON_KEY];
            let level_val:number = const_xprr.LEVEL_ANY_NUMBER;
            if (typeof raw[const_xprr.MOVE_LEVEL_KEY] === "number") level_val = raw[const_xprr.MOVE_LEVEL_KEY];
            return new LearnMoveEventDefinition(
                raw[const_xprr.LEARN_MOVE_KEY] as (string | null),
                raw[const_xprr.MOVE_DEST_KEY] as (number | null),
                raw[const_xprr.MOVE_SOURCE_KEY] as string,
                level_val,
                mon_val,
                ...BaseEventDefinition._base_deserialize(raw_base),
            );
        }
        throw new TypeError('Could not deserialize the following data into an LearnMoveEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        if (this.destination === null) {
            return `Ignoring ${this.move_to_learn}, from ${this.source} (mon: ${this.mon})`;
        } else if (this.move_to_learn === null && typeof this.destination === "number") {
            return `Deleting move in slot #: ${this.destination + 1}`;
        } else if (typeof this.destination === "number") {
            return `Learning ${this.move_to_learn} in slot #: ${this.destination + 1}, from ${this.source} (mon: ${this.mon})`;
        }

        return `Learning ${this.move_to_learn} over: ${this.destination}, fomr ${this.source} (mon: ${this.mon})`;
    }

    describe_item(): string {
        return this.describe();
    }

    is_any_level(){
        return this.level === const_xprr.LEVEL_ANY_NUMBER;
    }

    get_level_up_key(): LevelUpKey {
        return new LevelUpKey(this.mon, this.level, this.move_to_learn);
    }

    matches(level:number, mon:string) {
        return (
            (level === this.level) &&
            (sanitize_string(this.mon) === sanitize_string(mon))
        );
    }
}

export class WildMonEventDefinition extends BaseEventDefinition {
    mon_species:string;
    level:number;
    quantity:number;
    trainer_mon:boolean;

    constructor(mon_species:string, level:number, quantity=1, trainer_mon=false, notes="", enabled=true, tags:(string[] | null)=null) {
        super(notes, enabled, tags);
        this.mon_species = mon_species;
        this.level = level;
        this.quantity = quantity;
        this.trainer_mon = trainer_mon;
    }

    static get_event_key(): string {
        return const_xprr.TASK_FIGHT_WILD_PKMN;
    }

    get_mon_obj(): EnemyMon {
        if (this.trainer_mon) return cur_gen().create_trainer_mon(this.mon_species, this.level);
        else return cur_gen().create_wild_mon(this.mon_species, this.level);
    }

    get_pokemon_list(definition_order=false): [number, EnemyMon][]{
        let mon_obj = this.get_mon_obj();
        let result = [] as [number, EnemyMon][];
        for (let i = 0; i < this.quantity; i++) {
            result.push([i, mon_obj]);
        }
        return result;
    }

    generate_event_item_args(): (EventItemArgs | null)[] {
        return new Array(this.quantity).fill(
            new EventItemArgs(this.get_mon_obj())
        );
    }

    apply(cur_state: RouteState, args: EventItemArgs | null): [RouteState, string] {
        if (args === null) return [cur_state, "Router Error: Cannot apply wild mon event without proper args"];
        return cur_state.defeat_mon(args.to_defeat_mon)
    }

    serialize() {
        return this._base_serialize(
            {
                [WildMonEventDefinition.get_event_key()]: [this.mon_species, this.level, this.quantity, this.trainer_mon]
            }
        );
    }

    static deserialize(raw_base: any): WildMonEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (Array.isArray(raw)) {
            let quantity = 1;
            if (raw.length > 2) quantity = raw[2] as number;
            let trainer_mon = false;
            if (raw.length > 3) trainer_mon = raw[3] as boolean;
            return new WildMonEventDefinition(
                raw[0] as string,
                raw[1] as number,
                quantity,
                trainer_mon,
                ...BaseEventDefinition._base_deserialize(raw_base),
            );
        } 
        throw new TypeError('Could not deserialize the following data into an WildMonEventDefinition: ' + JSON.stringify(raw));
    }

    describe(): string {
        let mon_type = "WildPkmn";
        if (this.trainer_mon) mon_type = "TrainerPkmn";
        return `${mon_type} ${this.mon_species}, LV: ${this.level}, x${this.quantity}`;
    }

    describe_item(): string {
        let mon_type = "WildPkmn";
        if (this.trainer_mon) mon_type = "TrainerPkmn";
        return `${mon_type}: ${this.mon_species}`;
    }

    is_battle(): boolean {
        return true;
    }
}

export class TrainerEventDefinition extends BaseEventDefinition {
    trainer_name:string;
    second_trainer_name:string;
    verbose_export:boolean;
    setup_moves:string[];
    mimic_selection:string;
    custom_move_data:Map<string, Map<string, string>>[];
    enemy_setup_moves:string[];
    exp_split:number[];
    weather:string;
    pay_day_amount:number;
    mon_order:number[];

    constructor(
        trainer_name:string,
        second_trainer_name="",
        verbose_export=false,
        setup_moves:(null | string[])=null,
        mimic_selection="",
        custom_move_data:(null | Map<string, Map<string, string>>[])=null,
        enemy_setup_moves:(null | string[])=null,
        exp_split:(null | number[])=null,
        weather=const_xprr.WEATHER_NONE,
        pay_day_amount=0,
        mon_order:(null | number[])=null,
        notes="",
        enabled=true,
        tags:(string[] | null)=null,
    ) {
        super(notes, enabled, tags);
        this.trainer_name = trainer_name;
        this.second_trainer_name = second_trainer_name;
        this.verbose_export = verbose_export;
        this.mimic_selection = mimic_selection;
        this.weather = weather;
        this.pay_day_amount = pay_day_amount;

        if (setup_moves !== null) this.setup_moves = setup_moves;
        else this.setup_moves = [];

        if (custom_move_data !== null) this.custom_move_data = custom_move_data;
        else this.custom_move_data = [];

        if (enemy_setup_moves !== null) this.enemy_setup_moves = enemy_setup_moves;
        else this.enemy_setup_moves = [];

        if (exp_split !== null) this.exp_split = exp_split;
        else this.exp_split = [];

        if (mon_order !== null) this.mon_order = mon_order;
        else this.mon_order = [];
    }

    static get_event_key(): string {
        return const_xprr.TASK_TRAINER_BATTLE;
    }

    get_first_trainer_obj(): Trainer {
        return cur_gen().trainer_db().get_trainer(this.trainer_name);
    }

    get_second_trainer_obj(): Trainer | null {
        try {
            return cur_gen().trainer_db().get_trainer(this.second_trainer_name);
        } catch (e) {
            return null;
        }
    }

    get_pokemon_list(definition_order=false): [number, EnemyMon][]{
        let trainer = this.get_first_trainer_obj();
        let second_trainer = this.get_second_trainer_obj();

        let mon_list: EnemyMon[];
        if (second_trainer === null) mon_list = trainer.mons;
        else {
            mon_list = [];
            // the goal is that the default order should have the mons interleaved from each trainer
            // alternating first and then second
            for (let i = 0; i < 3; i++) {
                if (i < trainer.mons.length) mon_list.push(trainer.mons[i]);
                if (i < second_trainer.mons.length) mon_list.push(second_trainer.mons[i]);
            }
        }

        let mon_order:number[];
        if (definition_order || this.mon_order.length === 0) mon_order = [...Array(this.mon_order.length).keys()].map(x => x+1);
        else mon_order = this.mon_order;

        let result = [] as [number, EnemyMon][];
        // 1-based, because the values are user-facing
        // TODO: I believe there is some sort of bug here... not sure what though
        let order_idx = 1;
        while (order_idx <= mon_order.length) {
            for (let lookup_idx = 0; lookup_idx < mon_order.length; lookup_idx++) {
                let test_idx = mon_order[lookup_idx];
                if (order_idx != test_idx) continue;
                let cur_result = structuredClone(mon_list[lookup_idx]);
                if (this.custom_move_data.length > lookup_idx) cur_result.custom_move_data = this.custom_move_data[lookup_idx];
                if (this.exp_split.length > lookup_idx) cur_result.exp_split = this.exp_split[lookup_idx];
                // grab the intended mon order from the actual object, not the customized mon_order
                // if the definition_order is true, we still want the mon_order field to be accurate
                if (this.mon_order.length > lookup_idx) cur_result.mon_order = this.mon_order[lookup_idx];
                else cur_result.mon_order = order_idx;
                cur_result.definition_order = lookup_idx;
                result.push([test_idx - 1, cur_result]);
            }
        }
        return result;
    }

    generate_event_item_args(): (EventItemArgs | null)[] {
        let mons_to_fight = this.get_pokemon_list();
        let result = [] as EventItemArgs[];
        for (let order_idx = 0; order_idx < mons_to_fight.length; order_idx++) {
            let exp_split = 1;
            let definition_idx = mons_to_fight[order_idx][0];
            if (this.exp_split.length > definition_idx) exp_split = this.exp_split[definition_idx];
            let pay_day_amount = 0;
            let defeating_trainer = false;
            // only grant pay day money and flag the trainer as defeated on the final mon
            if (order_idx == (mons_to_fight.length - 1)) {
                pay_day_amount = this.pay_day_amount;
                defeating_trainer = true;
            }

            result.push(
                new EventItemArgs(
                    mons_to_fight[order_idx][1],
                    exp_split,
                    pay_day_amount,
                    defeating_trainer
                )
            );
        }
        return result;
    }

    apply(cur_state: RouteState, args: EventItemArgs | null): [RouteState, string] {
        if (args === null) return [cur_state, "Router Error: Cannot apply trainer mon event without proper args"];
        let trainer_name = "";
        if (args.defeating_trainer) trainer_name = this.trainer_name;
        return cur_state.defeat_mon(args.to_defeat_mon, trainer_name, args.exp_split, args.pay_day_amount);
    }

    serialize() {
        return this._base_serialize(
            {
                [TrainerEventDefinition.get_event_key()]: {
                    [const_xprr.TRAINER_NAME]: this.trainer_name,
                    [const_xprr.SECOND_TRAINER_NAME]: this.second_trainer_name,
                    [const_xprr.VERBOSE_KEY]: this.verbose_export,
                    [const_xprr.SETUP_MOVES_KEY]: this.setup_moves,
                    [const_xprr.ENEMY_SETUP_MOVES_KEY]: this.enemy_setup_moves,
                    [const_xprr.MIMIC_SELECTION]: this.mimic_selection,
                    [const_xprr.CUSTOM_MOVE_DATA]: this.custom_move_data,
                    [const_xprr.EXP_SPLIT]: this.exp_split,
                    [const_xprr.WEATHER]: this.weather,
                    [const_xprr.PAY_DAY_AMOUNT]: this.pay_day_amount,
                    [const_xprr.MON_ORDER]: this.mon_order,
                }
            }
        );
    }

    static deserialize(raw_base: any): TrainerEventDefinition {
        let raw = raw_base[HoldItemEventDefinition.get_event_key()];
        if (typeof raw === "string") {
            return new TrainerEventDefinition(
                raw,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                ...BaseEventDefinition._base_deserialize(raw_base),
            );
        }
        else if (Array.isArray(raw)) {
            let setup_moves: (null | string[]) = null;
            if (raw.length > 2) setup_moves = raw[2] as string[];
            return new TrainerEventDefinition(
                raw[0] as string,
                "",
                raw[1] as boolean,
                setup_moves,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                ...BaseEventDefinition._base_deserialize(raw_base),
            );
        }  else {
            let custom_move_data: (null | Map<string, Map<string, string>>[]) = null;
            if (const_xprr.CUSTOM_MOVE_DATA in raw) custom_move_data = raw[const_xprr.CUSTOM_MOVE_DATA];

            let enemy_setup_moves: (null | string[]) = null;
            if (const_xprr.ENEMY_SETUP_MOVES_KEY in raw) enemy_setup_moves = raw[const_xprr.ENEMY_SETUP_MOVES_KEY];

            let exp_split: (null | number[]) = null;
            if (const_xprr.EXP_SPLIT in raw) exp_split = raw[const_xprr.EXP_SPLIT];

            let weather = const_xprr.WEATHER_NONE;
            if (const_xprr.WEATHER in raw) weather = raw[const_xprr.WEATHER];

            let pay_day_amount = 0;
            if (const_xprr.PAY_DAY_AMOUNT in raw) pay_day_amount = raw[const_xprr.PAY_DAY_AMOUNT];

            let mon_order: (null | number[]) = null;
            if (const_xprr.MON_ORDER in raw) mon_order = raw[const_xprr.MON_ORDER];

            return new TrainerEventDefinition(
                raw[const_xprr.TRAINER_NAME],
                raw[const_xprr.SECOND_TRAINER_NAME],
                raw[const_xprr.VERBOSE_KEY],
                raw[const_xprr.SETUP_MOVES_KEY],
                raw[const_xprr.MIMIC_SELECTION],
                custom_move_data,
                enemy_setup_moves,
                exp_split,
                weather,
                pay_day_amount,
                mon_order,
                ...BaseEventDefinition._base_deserialize(raw_base),
            );
        }
    }

    describe(): string {
        if (this.second_trainer_name.length > 0) return `Multi: ${this.trainer_name}, ${this.second_trainer_name}`;
        return `Trainer: ${this.trainer_name}`;
    }

    describe_item(): string {
        // TODO: fix, need to pass in event item args... ugh
        return this.describe();
    }

    is_battle(): boolean {
        return true;
    }

    experience_per_second(): number {
        return cur_gen().get_trainer_timing_info().optimal_exp_per_second(
            this.get_pokemon_list().map(x => x[1])
        );
    }
}


// TODO: how do I do this for real? Ideally I create a list of all types
// and then iterate over them, find which one is in the raw data, and then instantiate that way
// but typescript complains they don't have identical constructor signatures....
// even though I'm using a static method to initialize them, not a constructor.
// Why does it care if constructors match anyways?
class EventFactory {

    load_event(raw:any): BaseEventDefinition {
        if (InventoryEventDefinition.get_event_key() in raw) {
            return InventoryEventDefinition.deserialize(raw);
        } else if (HoldItemEventDefinition.get_event_key() in raw) {
            return HoldItemEventDefinition.deserialize(raw);
        } else if (VitaminEventDefinition.get_event_key() in raw) {
            return VitaminEventDefinition.deserialize(raw);
        } else if (RareCandyEventDefinition.get_event_key() in raw) {
            return RareCandyEventDefinition.deserialize(raw);
        } else if (SaveEventDefinition.get_event_key() in raw) {
            return SaveEventDefinition.deserialize(raw);
        } else if (HealEventDefinition.get_event_key() in raw) {
            return HealEventDefinition.deserialize(raw);
        } else if (BlackoutEventDefinition.get_event_key() in raw) {
            return BlackoutEventDefinition.deserialize(raw);
        } else if (EvolutionEventDefinition.get_event_key() in raw) {
            return EvolutionEventDefinition.deserialize(raw);
        } else if (LearnMoveEventDefinition.get_event_key() in raw) {
            return LearnMoveEventDefinition.deserialize(raw);
        } else if (WildMonEventDefinition.get_event_key() in raw) {
            return WildMonEventDefinition.deserialize(raw);
        } else if (TrainerEventDefinition.get_event_key() in raw) {
            return TrainerEventDefinition.deserialize(raw);
        }

        return BaseEventDefinition.deserialize(raw);
    }
}

export const event_factory = new EventFactory();
