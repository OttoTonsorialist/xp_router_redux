import { CurrentGen } from "@main/mon/generation";
import { ItemDatabase, MonDatabase, MoveDatabase, TrainerDatabase } from "@main/mon/databases";
import { BaseItem, Move, PokemonSpecies, Trainer } from "@main/mon/universal_data_objects";


export class GenOne extends CurrentGen {
    private _version_name;
    private _base_version_name;
    private _all_flat_files;

    private _mon_db;
    private _trainer_db;
    private _item_db;
    private _move_db;
    private _special_types;
    private _type_chart;
    private _badge_rewards;
    private _major_fights;
    private _fight_rewards;
    private _trainer_timing_info;

    constructor(
        mon_db_path:string,
        trainer_db_path:string,
        item_path:string,
        move_path:string,
        type_info_path:string,
        fight_info_path:string,
        min_battles_path:string,
        version_name:string,
        base_version_name:string | null,
    ) {
        super();
        this._version_name = version_name;
        this._base_version_name = base_version_name;

        this._all_flat_files = [
            mon_db_path,
            trainer_db_path,
            item_path,
            move_path,
            type_info_path,
            fight_info_path,
        ];
    }
}


function _load_mon_db_path(path:string): MonDatabase {
    return new MonDatabase(
        require(path)["pokemon"]
    );
}
