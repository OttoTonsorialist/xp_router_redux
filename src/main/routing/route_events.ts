import log from 'electron-log';
import { const_xprr } from "@main/utils/constants";
import { BaseEventDefinition, EventItemArgs, LearnMoveEventDefinition, LevelUpKey, TrainerEventDefinition } from "@main/routing/event_definition";
import { RouteState } from "@main/routing/full_route_state";
import { cur_gen } from "@main/mon/gen_factory";

let _event_id_counter = 0;


export class BaseEvent {
    event_id: number;
    parent: EventFolder | null;
    event_definition:BaseEventDefinition;
    children: BaseEvent[];
    init_state:RouteState | null;
    final_state:RouteState | null;
    enabled:boolean;
    name: string;

    constructor(parent:EventFolder | null, event_definition:BaseEventDefinition) {
        this.event_id = _event_id_counter;
        _event_id_counter += 1;
        this.event_definition = event_definition;
        this.parent = parent;
        this.children = [];
        this.init_state = null;
        this.final_state = null;
        this.enabled = true;
        this.name = "";
    }

    apply(cur_state: RouteState, level_up_learn_event_defs:(Map<LevelUpKey, LearnMoveEventDefinition> | null)=null): RouteState {
        throw new TypeError('No apply function defined');
    }

    serialize(): any {
        throw new TypeError('No serialize function defined');
    }

    contains_id(id_val: number): boolean {
        if (id_val === this.event_id) return true;

        for (let child of this.children) {
            if (child.is_enabled()) return true;
        }
        return false;
    }

    has_errors(): boolean {
        for (let cur_child of this.children) {
            if (cur_child.has_errors()) return true;
        }
        return false;
    }

    get_error_message(): string {
        return '';
    }

    mon_after_levelups(): string {
        return '';
    }

    mon_level(): number {
        if (!this.is_enabled() || this.final_state === null) return -1;
        return this.final_state.solo_mon.cur_level;
    }

    exp_to_next_level(): number {
        if (!this.is_enabled() || this.final_state === null) return -1;
        return this.final_state.solo_mon.exp_to_next_level;
    }

    percent_exp_to_next_level(): number {
        if (!this.is_enabled() || this.final_state === null) return -1;
        return this.final_state.solo_mon.percent_exp_to_next_level;
    }

    exp_gain(): number {
        if (!this.is_enabled() || this.final_state === null || this.init_state === null) return -1;
        return this.final_state.solo_mon.cur_exp - this.init_state.solo_mon.cur_exp;
    }

    total_exp(): number {
        if (!this.is_enabled() || this.final_state === null) return -1;
        return this.final_state.solo_mon.cur_exp;
    }

    experience_per_second(): number {
        if (!this.is_enabled() || this.final_state === null) return -1;
        return this.event_definition.experience_per_second();
    }

    is_enabled(): boolean {
        return (
            this.enabled &&
            (this.parent === null || this.parent.is_enabled())
        );
    }

    set_enabled_status(is_enabled:boolean): void{
        this.enabled = is_enabled;
    }

    do_render(search: string, filter_types: string[]): boolean {
        return true;
    }

    get_tags(): string[] {
        return this.event_definition.tags;
    }

    is_major_fight(): boolean {
        return false;
    }
}


export class EventFolder extends BaseEvent{
    expanded:boolean;

    constructor(parent:EventFolder | null, name:string, notes:string, expanded=true, enabled=true) {
        super(parent, new BaseEventDefinition(notes, true, null));
        this.expanded = expanded;
        this.enabled = enabled;
    }

    apply(cur_state: RouteState, level_up_learn_event_defs:(Map<LevelUpKey, LearnMoveEventDefinition> | null)=null): RouteState {
        this.init_state = cur_state;

        if (!this.is_enabled()) {
            this.final_state = this.init_state;
            return this.final_state;
        }

        for (let cur_event of this.children) {
            if (cur_event instanceof EventGroup) cur_state = this._calc_single_event(cur_event, cur_state, level_up_learn_event_defs);
            else cur_state = cur_event.apply(cur_state, level_up_learn_event_defs);
        }

        this.final_state = cur_state;
        return this.final_state;
    }

    private _calc_single_event(event_group:EventGroup, prev_state:RouteState, level_up_learn_event_defs:(Map<LevelUpKey, LearnMoveEventDefinition> | null)=null): RouteState {
        // kind of ugly, we're going to double-calculate some events this way
        // but basically, need to run once, and see if a particular event causes a level up that results in a new move
        let post_state = event_group.apply(prev_state);
        if (level_up_learn_event_defs === null) return post_state;

        // handle the case where we level up multiple times in battle, enumerate all gained levels
        let to_learn = [] as LearnMoveEventDefinition[];
        for (let cur_new_level = prev_state.solo_mon.cur_level + 1; cur_new_level < post_state.solo_mon.cur_level + 1; cur_new_level++) {
            for (let test_event of level_up_learn_event_defs.values()) {
                if (test_event.matches(cur_new_level, prev_state.solo_mon.name)) {
                    to_learn.push(test_event);
                }
            }
        }

        // handle evolutions
        if (post_state.solo_mon.name != prev_state.solo_mon.name) {
            for (let test_event of level_up_learn_event_defs.values()) {
                if (test_event.matches(post_state.solo_mon.cur_level, post_state.solo_mon.name)) {
                    to_learn.push(test_event);
                }
            }
        }

        if (to_learn.length > 0) {
            post_state = event_group.apply(
                prev_state,
                to_learn.reduce(
                    (result, x) => {
                        result.set(x.get_level_up_key(), x);
                        return result;
                    },
                    new Map<LevelUpKey, LearnMoveEventDefinition>()
                )
            );
        }
        return post_state;
    }

    serialize(): any {
        return {
            [const_xprr.EVENT_FOLDER_NAME]: this.name,
            [const_xprr.TASK_NOTES_ONLY]: this.event_definition.notes,
            [const_xprr.EVENTS]: this.children.map(x => x.serialize()),
            [const_xprr.EXPANDED_KEY]: this.expanded,
            [const_xprr.ENABLED_KEY]: this.enabled,
        }
    }

    do_render(search: string, filter_types: string[]): boolean {
        // make sure to show empty filters when no filters are set
        if (
            this.children.length === 0 &&
            search.length === 0 &&
            filter_types.length === 0
        ) return true;

        for (let cur_event of this.children) {
            if (cur_event.do_render(search, filter_types)) return true;
        }

        return false;
    }

    get_tags(): string[] {
        if (this.has_errors()) return [const_xprr.EVENT_TAG_ERRORS];
        if (this.expanded) return [];

        let result = [] as string[];
        for (let cur_event of this.children) {
            if (cur_event.get_tags().includes(const_xprr.HIGHLIGHT_LABEL)) {
                result.push(const_xprr.HIGHLIGHT_LABEL);
                break;
            }
        }
        return result
    }

    add_child(child_obj:BaseEvent) {
        this.children.push(child_obj);
        child_obj.parent = this;
    }

    insert_child_after(
        child_obj:BaseEvent,
        after_obj:BaseEvent | null=null,
        before_obj:BaseEvent | null=null
    ) {
        if (after_obj === null && before_obj === null) this.add_child(child_obj);
        else if (after_obj !== null) {
            // TODO: do we need a custom comparator to make this work properly?
            let after_idx = this.children.indexOf(after_obj);
            if (after_idx === -1) throw new TypeError(`Could not find object to insert after: ${after_obj}`)
            this.children.splice(after_idx + 1, 0, child_obj);
            child_obj.parent = this;
        } else if (before_obj !== null) {
            // TODO: do we need a custom comparator to make this work properly?
            let before_idx = this.children.indexOf(before_obj)
            if (before_idx === -1) throw new TypeError(`Could not find object to insert before: ${after_obj}`)
            this.children.splice(before_idx, 0, child_obj);
            child_obj.parent = this;
        }
    }

    move_child(child_obj:BaseEvent, move_up_flag:boolean) {
        let idx = this.children.indexOf(child_obj);
        if (idx === -1) throw new TypeError(`EventFolder ${this.name} does not have child object: ${child_obj}`);
        let new_idx = move_up_flag ? Math.max(idx - 1, 0) : Math.min(idx + 1, this.children.length - 1);
        this.children.splice(new_idx, 0, this.children.splice(idx, 1)[0]);
    }

    remove_child(child_obj:BaseEvent) {
        let to_remove = this.children.indexOf(child_obj);
        if (to_remove === -1) throw new TypeError(`EventFolder ${this.name} does not have child object: ${child_obj}`);
        this.children.splice(to_remove, 1);
        child_obj.parent = null;
    }

    mon_level(): number {
        return -1;
    }

    exp_to_next_level(): number {
        return -1;
    }

    percent_exp_to_next_level(): number {
        return -1;
    }

    exp_gain(): number {
        return -1;
    }

    total_exp(): number {
        return -1;
    }

    experience_per_second(): number {
        return -1;
    }
}


export class EventGroup extends BaseEvent{
    mons_after_levelups: string[];
    error_messages: string[];
    level_up_learn_event_defs: LearnMoveEventDefinition[];

    constructor(parent:EventFolder, event_definition:BaseEventDefinition) {
        super(parent, event_definition);
        this.name = "";
        this.mons_after_levelups = [];
        this.error_messages = [];
        this.level_up_learn_event_defs = [];
    }

    apply(cur_state: RouteState, level_up_learn_event_defs:(Map<LevelUpKey, LearnMoveEventDefinition> | null)=null): RouteState {
        try {
            this.init_state = cur_state;
            this.name = this.event_definition.describe();
            this.mons_after_levelups = [];
            this.children = [];
            this.enabled = this.event_definition.enabled;

            if (!this.is_enabled()) {
                this.final_state = cur_state;
                this.error_messages = [];
                this.name = `Disabled: ${this.event_definition.describe()}`;
                return this.final_state;
            }

            // NOTE: assuming the items are passed in order of level up
            if (level_up_learn_event_defs === null) this.level_up_learn_event_defs = [];
            else this.level_up_learn_event_defs = Array.from(level_up_learn_event_defs.values());
            let learn_idx = 0;

            let event_item_args = this.event_definition.generate_event_item_args();
            let mon_counter = new Map<string, number>();

            for (let [cur_idx, cur_item_args] of event_item_args.entries()) {
                if (cur_item_args !== null) {
                    let cur_mon = cur_item_args.to_defeat_mon.species;
                    if (mon_counter.has(cur_mon)) mon_counter.set(cur_mon, mon_counter.get(cur_mon)! + 1);
                    else mon_counter.set(cur_mon, 1);
                }

                // first apply the actual event item
                this.children.push(new EventItem(this.parent, this, this.event_definition, cur_item_args));
                let next_state = this.children[-1].apply(cur_state);

                if (next_state.solo_mon.cur_level != cur_state.solo_mon.cur_level) {
                    // if a level up occurred, check for any relevant learn move events, processing them as needed
                    while (
                        learn_idx < this.level_up_learn_event_defs.length &&
                        this.level_up_learn_event_defs[learn_idx].level === next_state.solo_mon.cur_level
                    ) {
                        this.children.push(
                            new EventItem(
                                this.parent,
                                this,
                                this.level_up_learn_event_defs[learn_idx],
                                this.level_up_learn_event_defs[learn_idx].generate_event_item_args()[0]
                            )
                        );
                        next_state = this.children[-1].apply(next_state);
                        learn_idx += 1;
                    }

                    // if a level up occurred and we're in battle, save the mons we level up against
                    if (this.event_definition.is_battle()) {
                        if (cur_idx + 1 < event_item_args.length) {
                            let next_mon_name = event_item_args[cur_idx + 1]!.to_defeat_mon.species;
                            let next_mon_count = mon_counter.get(next_mon_name);
                            if (next_mon_count === undefined) next_mon_count = 1;
                            else next_mon_count += 1;
                            this.mons_after_levelups.push(`#${next_mon_count} ${next_mon_name}`);
                        } else {
                            this.mons_after_levelups.push("after_final_mon");
                        }
                    }
                }

                cur_state = next_state;
            }

            // if we get to the end, and there are still learn move events, just shove them at the end
            while (learn_idx < this.level_up_learn_event_defs.length) {
                this.children.push(
                    new EventItem(
                        this.parent,
                        this,
                        this.level_up_learn_event_defs[learn_idx],
                        this.level_up_learn_event_defs[learn_idx].generate_event_item_args()[0]
                    )
                );
                cur_state = this.children[-1].apply(cur_state);
                learn_idx += 1;
            }

            for (let cur_child of this.children) {
                if (cur_child.has_errors()) this.error_messages.push(cur_child.get_error_message());
            }
            if (this.has_errors()) this.name = this.get_error_message();
            else this.name = this.event_definition.describe();

            this.final_state = cur_state;
            return this.final_state;
        } catch (e) {
            log.error(`Exception encountered with event ${this.event_definition.describe()}`);
            if (e instanceof Error) log.error(e.stack);
            return cur_state;
        }
    }

    serialize() {
        return this.event_definition.serialize();
    }

    mon_after_levelups(): string {
        return this.mons_after_levelups.join(",");
    }

    has_errors(): boolean {
        if (this.error_messages.length > 0) return true;
        return super.has_errors();
    }

    get_error_message(): string {
        return this.error_messages.join(", ");
    }

    is_major_fight(): boolean {
        if (!(this.event_definition instanceof TrainerEventDefinition)) return false;
        return cur_gen().is_major_fight(this.event_definition.trainer_name);
    }

    do_render(search: string, filter_types: string[]): boolean {
        for (let cur_learn of this.level_up_learn_event_defs) {
            // TODO: pretty hacky, but fixing this requires updating the entire way we handle level-up moves
            // TODO: unclear if the change is actually worth it
            if (cur_learn.do_render(search, filter_types)) return true;
        }

        return this.event_definition.do_render(search, filter_types);
    }

}

export class EventItem extends BaseEvent{
    args:(EventItemArgs | null);
    error_message:string;
    // weird architectural concession. Basically, we always want parent to be EventFolder
    // but we still want to know what the "real" parent of an EventItem is. so store it separately
    container:EventGroup;

    constructor(parent:EventFolder | null, container:EventGroup, event_definition:BaseEventDefinition, args:(EventItemArgs | null)) {
        // NOTE: EventItems cannot have children. However, it is easiest to still have `children` on the base type
        // and just never populate any children for EventItem
        super(parent, event_definition);
        this.container = container;
        this.args = args;
        this.error_message = "";
    }

    apply(cur_state: RouteState, level_up_learn_event_defs:(Map<LevelUpKey, LearnMoveEventDefinition> | null)=null): RouteState {
        this.init_state = cur_state;
        this.enabled = this.event_definition.enabled;
        if (!this.is_enabled()) {
            this.final_state = this.init_state;
            this.error_message = "";
            this.name = `Disabled: ${this.event_definition.describe_item()}`;
            return this.final_state;
        }
        [this.final_state, this.error_message] = this.event_definition.apply(this.init_state, this.args);

        // check for recorder errors. These will technically overwrite any "actua" errors, but that should be fine
        // they should only apply to notes events, anyways
        if (this.event_definition.notes.startsWith(const_xprr.RECORDING_ERROR_FRAGMENT)) {
            this.error_message = this.event_definition.notes;
        }
        return this.final_state;
    }

    has_errors(): boolean {
        return (this.error_message.length === 0);
    }

    get_error_message(): string {
        return this.error_message;
    }

    experience_per_second(): number {
        return -1;
    }
}
