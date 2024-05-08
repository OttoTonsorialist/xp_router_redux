import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import log from 'electron-log';
import os from 'node:os';
import { get_data_dir } from '../utils/xplatform';

class XpRouterConstants {
    DEBUG_MODE = false;
    DEBUG_RECORDING_MODE = false;
    // TODO: should be pulling this from electron metadata
    APP_NAME = "xp_router_redux";
    APP_DATA_FOLDER_DEFAULT_NAME = this.APP_NAME + "_data";

    _SAVED_ROUTES_FOLDER_NAME = "saved_routes";
    _SAVED_IMAGES_FOLDER_NAME = "images";
    _OUTDATED_ROUTES_FOLDER_NAME = "outdated_routes";
    _CUSTOM_GENS_FOLDER_NAME = "custom_gens";

    CUSTOM_GEN_META_FILE_NAME = "custom_gen.json";
    CUSTOM_GEN_NAME_KEY = "custom_gen_name";
    BASE_GEN_NAME_KEY = "base_gen_name";

    MAJOR_FIGHTS_KEY = "major_fights";
    BADGE_REWARDS_KEY = "badge_rewards";
    FIGHT_REWARDS_KEY = "fight_rewards";
    TYPE_CHART_KEY = "type_chart";
    SPECIAL_TYPES_KEY = "special_types";
    HELD_ITEM_BOOSTS_KEY = "held_item_boosts";
    TRAINER_TIMING_INFO_KEY = "trainer_timing_info";
    INTRO_TIME_KEY = "intro_time";
    OUTRO_TIME_KEY = "outro_time";
    KO_TIME_KEY = "ko_time";
    SEND_OUT_TIME_KEY = "send_out_time";

    ITEM_DB_FILE_NAME = "items.json";
    MOVE_DB_FILE_NAME = "moves.json";
    POKEMON_DB_FILE_NAME = "pokemon.json";
    TRAINERS_DB_FILE_NAME = "trainers.json";
    TYPE_INFO_FILE_NAME = "type_info.json";
    FIGHTS_INFO_FILE_NAME = "fights_info.json";

    SPECIES_KEY = "species";
    NAME_KEY = "name";
    BASE_HP_KEY = "base_hp";
    BASE_ATK_KEY = "base_atk";
    BASE_DEF_KEY = "base_def";
    BASE_SPA_KEY = "base_spc_atk";
    BASE_SPD_KEY = "base_spc_def";
    OLD_BASE_SPD_KEY = "base_spd";
    BASE_SPE_KEY = "base_spe";
    BASE_SPC_KEY = "base_spc";
    EV_YIELD_HP_KEY = "ev_yield_hp";
    EV_YIELD_ATK_KEY = "ev_yield_atk";
    EV_YIELD_DEF_KEY = "ev_yield_def";
    EV_YIELD_SPC_ATK_KEY = "ev_yield_spc_atk";
    EV_YIELD_SPC_DEF_KEY = "ev_yield_spc_def";
    EV_YIELD_SPD_KEY = "ev_yield_spd";
    FIRST_TYPE_KEY = "type_1";
    SECOND_TYPE_KEY = "type_2";
    CATCH_RATE_KEY = "catch_rate";
    BASE_XP_KEY = "base_xp";
    INITIAL_MOVESET_KEY = "initial_moveset";
    LEARNED_MOVESET_KEY = "levelup_moveset";
    GROWTH_RATE_KEY = "growth_rate";
    TM_HM_LEARNSET_KEY = "tm_hm_learnset";
    DVS_KEY = "dv";
    IVS_KEY = "iv";
    HELD_ITEM_KEY = "held_item";
    ABILITY_KEY = "ability";
    ABILITY_LIST_KEY = "abilities";
    STAT_KEY = "stat";
    MODIFIER_KEY = "modifier";
    TARGET_KEY = "target";
    NATURE_KEY = "nature";

    LEVEL = "level";
    HP = "hp";
    ATK = "atk";
    DEF = "def";
    SPA = "spa";
    SPD = "spd";
    SPE = "spe";
    XP = "xp";
    MOVES = "moves";
    EV = "ev";
    ACC = "acc";

    ATTACK = "attack";
    DEFENSE = "defense";
    SPEED = "speed";
    SPECIAL_ATTACK = "special_attack";
    SPECIAL_DEFENSE = "special_defense";

    TRAINER_NAME = "trainer_name";
    SECOND_TRAINER_NAME = "second_trainer_name";
    TRAINER_CLASS = "trainer_class";
    TRAINER_ID = "trainer_id";
    TRAINER_LOC = "trainer_location";
    TRAINER_POKEMON = "pokemon";
    TRAINER_REFIGHTABLE = "refightable";
    TRAINER_DOUBLE_BATTLE = "is_double_battle";
    SPECIAL_MOVES = "special_moves";
    MONEY = "money";
    VERBOSE_KEY = "verbose";
    SETUP_MOVES_KEY = "setup_moves";
    ENEMY_SETUP_MOVES_KEY = "enemy_setup_moves";
    MIMIC_SELECTION = "mimic_selection";
    CUSTOM_MOVE_DATA = "custom_move_data";
    EXP_SPLIT = "exp_split";
    WEATHER = "weather";
    PAY_DAY_AMOUNT = "pay_day_amount";
    MON_ORDER = "mon_order";
    PLAYER_KEY = "player";
    ENEMY_KEY = "enemy";
    EVOLVED_SPECIES = "evolved_species";
    BY_STONE_KEY = "by_stone";

    MOVE_TYPE = "type";
    BASE_POWER = "base_power";
    MOVE_PP = "pp";
    MOVE_ACCURACY = "accuracy";
    MOVE_EFFECTS = "effects";
    MOVE_FLAVOR = "attack_flavor";
    MOVE_TARGET = "target";

    GROWTH_RATE_FAST = "growth_fast";
    GROWTH_RATE_MEDIUM_FAST = "growth_medium_fast";
    GROWTH_RATE_MEDIUM_SLOW = "growth_medium_slow";
    GROWTH_RATE_SLOW = "growth_slow";
    GROWTH_RATE_ERRATIC = "growth_erratic";
    GROWTH_RATE_FLUCTUATING = "growth_fluctuating";

    HP_UP = "HP Up";
    CARBOS = "Carbos";
    IRON = "Iron";
    CALCIUM = "Calcium";
    ZINC = "Zinc";
    PROTEIN = "Protein";
    RARE_CANDY = "Rare Candy";

    HIGHLIGHT_NONE = "Don't Highlight";
    HIGHLIGHT_GUARANTEED_KILL = "Guaranteed Kill";
    HIGHLIGHT_CONSISTENT_KILL = "Consistent Kill";
    HIGHLIGHT_FASTEST_KILL = "Fastest Kill";

    ALL_HIGHLIGHT_STRATS = [
        this.HIGHLIGHT_GUARANTEED_KILL,
        this.HIGHLIGHT_CONSISTENT_KILL,
        this.HIGHLIGHT_FASTEST_KILL,
        this.HIGHLIGHT_NONE,
    ];

    DEFAULT_FOLDER_NAME = "Main";
    EVENT_FOLDER_NAME = "Event Folder Name";
    INVENTORY_EVENT_DEFINITON = "Inventory Event";

    TASK_TRAINER_BATTLE = "Fight Trainer";
    TASK_RARE_CANDY = "Use Rare Candy";
    TASK_VITAMIN = "Use Vitamin";
    TASK_FIGHT_WILD_PKMN = "Fight Wild Pkmn";
    TASK_GET_FREE_ITEM = "Acquire Item";
    TASK_PURCHASE_ITEM = "Purchase Item";
    TASK_USE_ITEM = "Use/Drop Item";
    TASK_SELL_ITEM = "Sell Item";
    TASK_HOLD_ITEM = "Hold Item";
    TASK_LEARN_MOVE_LEVELUP = "Learn Levelup Move";
    TASK_LEARN_MOVE_TM = "Learn TM/HM Move";
    TASK_SAVE = "Game Save";
    TASK_HEAL = "PkmnCenter Heal";
    TASK_BLACKOUT = "Blackout";
    TASK_EVOLUTION = "Evolution";
    TASK_NOTES_ONLY = "Just Notes";

    ITEM_ROUTE_EVENT_TYPES = [
        this.TASK_GET_FREE_ITEM,
        this.TASK_PURCHASE_ITEM,
        this.TASK_USE_ITEM,
        this.TASK_SELL_ITEM,
        this.TASK_HOLD_ITEM,
    ];

    ROUTE_EVENT_TYPES = [
        this.TASK_TRAINER_BATTLE,
        this.TASK_FIGHT_WILD_PKMN,
        this.TASK_LEARN_MOVE_LEVELUP,
        this.TASK_LEARN_MOVE_TM,
        this.TASK_HOLD_ITEM,
        this.TASK_RARE_CANDY,
        this.TASK_VITAMIN,
        this.TASK_GET_FREE_ITEM,
        this.TASK_PURCHASE_ITEM,
        this.TASK_USE_ITEM,
        this.TASK_SELL_ITEM,
        this.TASK_SAVE,
        this.TASK_HEAL,
        this.TASK_BLACKOUT,
        this.TASK_EVOLUTION,
        this.TASK_NOTES_ONLY,
    ];

    ITEM_TYPE_ALL_ITEMS = "All Items";
    ITEM_TYPE_BACKPACK_ITEMS = "Items in Backpack";
    ITEM_TYPE_KEY_ITEMS = "Key Items";
    ITEM_TYPE_TM = "TMs";
    ITEM_TYPE_OTHER = "Other";

    ITEM_TYPES = [
        this.ITEM_TYPE_ALL_ITEMS,
        this.ITEM_TYPE_BACKPACK_ITEMS,
        this.ITEM_TYPE_KEY_ITEMS,
        this.ITEM_TYPE_TM,
        this.ITEM_TYPE_OTHER
    ];

    ALL_TRAINERS = "ALL";
    NO_TRAINERS = "No Valid Trainers";
    NO_POKEMON = "No Valid Pokemon";
    NO_ITEM = "No Valid Items";
    NO_MOVE = "No Valid Moves";
    UNUSED_TRAINER_LOC = "Unused";
    EVENTS = "events";
    ENABLED_KEY = "Enabled";
    EXPANDED_KEY = "Expanded";
    TAGS_KEY = "Tags";
    HIGHLIGHT_LABEL = "highlight";
    IS_KEY_ITEM = "key_item";
    PURCHASE_PRICE = "purchase_price";
    MARTS = "marts";

    EVENT_TAG_IMPORTANT = "important";
    EVENT_TAG_ERRORS = "errors";

    MOVE_KEY = "move_name";
    MOVE_DEST_KEY = "destination_slot";
    MOVE_SOURCE_KEY = "source";
    MOVE_LEVEL_KEY = "level_learned";
    MOVE_MON_KEY = "species_when_learned";

    LEARN_MOVE_KEY = "LearnMove";
    MOVE_SLOT_TEMPLATE = "Move #{} (Over {})";
    MOVE_DONT_LEARN = "Don't Learn";
    MOVE_SOURCE_LEVELUP = "LevelUp";
    MOVE_SOURCE_TUTOR = "Tutor/Deleter";
    MOVE_SOURCE_TM_HM = "TM/HM";
    LEVEL_ANY = "AnyLevel";
    DELETE_MOVE = "Delete Move";

    IMPORTANT_COLOR = "#b3b6b7";
    USER_FLAGGED_COLOR = "#ff8888";
    VALID_COLOR = "#abebc6";
    ERROR_COLOR = "#f9e79f";

    CONFIG_ROUTE_ONE_PATH = "route_one_path";
    CONFIG_WINDOW_GEOMETRY = "tkinter_window_geometry";

    STATE_SUMMARY_LABEL = "State Summary";
    BADGE_BOOST_LABEL = "Badge Boost Calculator";

    ROOT_FOLDER_NAME = "ROOT";
    FORCE_QUIT_EVENT = "<<PkmnXpForceQuit>>";
    ROUTE_LIST_REFRESH_EVENT = "<<RouteListRefresh>>";
    BATTLE_SUMMARY_SHOWN_EVENT = "<<BattleSummaryShown>>";
    BATTLE_SUMMARY_HIDDEN_EVENT = "<<BattleSummaryHidden>>";

    EMPTY_ROUTE_NAME = "Empty Route";
    PRESET_ROUTE_PREFIX = "PRESET: ";
    PKMN_VERSION_KEY = "Version";

    RED_VERSION = "Red";
    BLUE_VERSION = "Blue";
    YELLOW_VERSION = "Yellow";
    GOLD_VERSION = "Gold";
    SILVER_VERSION = "Silver";
    CRYSTAL_VERSION = "Crystal";
    RUBY_VERSION = "Ruby";
    SAPPHIRE_VERSION = "Sapphire";
    EMERALD_VERSION = "Emerald";
    FIRE_RED_VERSION = "FireRed";
    LEAF_GREEN_VERSION = "LeafGreen";

    VERSION_LIST = [
        this.YELLOW_VERSION,
        this.RED_VERSION,
        this.BLUE_VERSION,
        this.GOLD_VERSION,
        this.SILVER_VERSION,
        this.CRYSTAL_VERSION,
        this.RUBY_VERSION,
        this.SAPPHIRE_VERSION,
        this.EMERALD_VERSION,
        this.FIRE_RED_VERSION,
        this.LEAF_GREEN_VERSION,
    ];

    VERSION_COLORS: {[id: string] : string; } = {};

    NO_SAVED_ROUTES = "No Saved Routes";
    NO_FOLDERS = "No Matching Folders";

    TRANSFER_EXISTING_FOLDER = "Existing Folder";
    TRANSFER_NEW_FOLDER = "New Folder";

    MULTI_HIT_2 = "2 Hits";
    MULTI_HIT_3 = "3 Hits";
    MULTI_HIT_4 = "4 Hits";
    MULTI_HIT_5 = "5 Hits";

    MULTI_HIT_CUSTOM_DATA = [
        this.MULTI_HIT_2,
        this.MULTI_HIT_3,
        this.MULTI_HIT_4,
        this.MULTI_HIT_5,
    ];

    DOUBLE_HIT_FLAVOR = "two_hit";
    FLAVOR_MULTI_HIT = "multi_hit";
    FLAVOR_HIGH_CRIT = "high_crit";
    FLAVOR_FIXED_DAMAGE = "fixed_damage";
    FLAVOR_LEVEL_DAMAGE = "level_damage";
    FLAVOR_PSYWAVE = "psywave";
    FLAVOR_RECHARGE = "recharge";
    FLAVOR_TWO_TURN_INVULN = "two_turn_semi_invlunerable";
    FLAVOR_TWO_TURN = "two_turn";

    STRUGGLE_MOVE_NAME = "Struggle";
    MIMIC_MOVE_NAME = "Mimic";
    EXPLOSION_MOVE_NAME = "Explosion";
    SELFDESTRUCT_MOVE_NAME = "thisdestruct";
    FLAIL_MOVE_NAME = "Flail";
    REVERSAL_MOVE_NAME = "Reversal";
    FUTURE_SIGHT_MOVE_NAME = "Future Sight";
    DOOM_DESIRE_MOVE_NAME = "Doom Desire";
    SPIT_UP_MOVE_NAME = "Spit Up";
    HIDDEN_POWER_MOVE_NAME = "Hidden Power";
    SOLAR_BEAM_MOVE_NAME = "SolarBeam";
    AMULET_COIN_ITEM_NAME = "Amulet Coin";
    MACHO_BRACE_ITEM_NAME = "Macho Brace";

    TARGETING_BOTH_ENEMIES = "target_both_enemies";

    TYPE_TYPELESS = "none";
    TYPE_NORMAL = "Normal";
    TYPE_FIGHTING = "Fighting";
    TYPE_FLYING = "Flying";
    TYPE_POISON = "Poison";
    TYPE_GROUND = "Ground";
    TYPE_ROCK = "Rock";
    TYPE_BUG = "Bug";
    TYPE_GHOST = "Ghost";
    TYPE_FIRE = "Fire";
    TYPE_WATER = "Water";
    TYPE_GRASS = "Grass";
    TYPE_ELECTRIC = "Electric";
    TYPE_PSYCHIC = "Psychic";
    TYPE_ICE = "Ice";
    TYPE_DRAGON = "Dragon";
    TYPE_STEEL = "Steel";
    TYPE_DARK = "Dark";

    SUPER_EFFECTIVE = "Super Effective";
    NOT_VERY_EFFECTIVE = "Not Very Effective";
    IMMUNE = "Immune";

    WEATHER_NONE = "None";
    WEATHER_RAIN = "Rain";
    WEATHER_SUN = "Harsh Sunlight";
    WEATHER_SANDSTORM = "Sandstorm";
    WEATHER_HAIL = "Hail";

    DEFAULT_INTRO_TIME = 4.69;
    DEFAULT_OUTRO_TIME = 1.195;
    DEFAULT_KO_TIME = 1.84;
    DEFAULT_SEND_OUT_TIME = 0.75;

    GAME_SAVED_FRAGMENT = "Game Saved: ";
    RECORDING_ERROR_FRAGMENT = "ERROR RECORDING! ";

    RECORDING_STATUS_DISCONNECTED = "Disconnected";
    RECORDING_STATUS_CONNECTED = "Connected";
    RECORDING_STATUS_READY = "Ready";
    RECORDING_STATUS_NO_MAPPER = "Failed to load mapper. Have you loaded it in GameHook?";
    RECORDING_STATUS_WRONG_MAPPER = "Incorrect Mapper Loaded";
    RECORDING_STATUS_FAILED_CONNECTION = "Connection Failed. This usually means GameHook isn't running";;
    RECORDING_STATUS_GAMEHOOK_FAILED = "Reading GameHook data failed. This version of GameHook may be incompatible with the router";

    SOURCE_ROOT_PATH:string;
    GLOBAL_CONFIG_DIR:string;
    GLOBAL_CONFIG_FILE:string;
    POKEMON_RAW_DATA:string;
    ASSETS_PATH:string;
    SAVED_ROUTES_DIR:string;
    SAVED_IMAGES_DIR:string;
    OUTDATED_ROUTES_DIR:string;
    CUSTOM_GENS_DIR:string;
    ALL_USER_DATA_PATHS:Array<string>;

    constructor() {
        this.VERSION_COLORS = {
            [this.RED_VERSION]: "#ff1111",
            [this.BLUE_VERSION]: "#1111ff",
            [this.YELLOW_VERSION]: "#ffd733",

            [this.GOLD_VERSION]: "#daa520",
            [this.SILVER_VERSION]: "#c0c0c0",
            [this.CRYSTAL_VERSION]: "#4FFFFF",

            [this.RUBY_VERSION]: "#a00000",
            [this.SAPPHIRE_VERSION]: "#0000a0",
            [this.EMERALD_VERSION]: "#00a000",

            [this.FIRE_RED_VERSION]: "#ff7327",
            [this.LEAF_GREEN_VERSION]: "#00dd00",
        };

        // TODO: should be importing this from the main.ts file? where we already have it defined
        this.SOURCE_ROOT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
        this.GLOBAL_CONFIG_DIR = path.join(get_data_dir(), this.APP_DATA_FOLDER_DEFAULT_NAME);
        this.GLOBAL_CONFIG_FILE = path.join(this.GLOBAL_CONFIG_DIR, "config.json");
        this.POKEMON_RAW_DATA = path.join(this.SOURCE_ROOT_PATH, "raw_pkmn_data");
        this.ASSETS_PATH = path.join(this.SOURCE_ROOT_PATH, "assets");

        // super dumb, but just make the ts compiler happy
        this.SAVED_ROUTES_DIR = "";
        this.SAVED_IMAGES_DIR = "";
        this.OUTDATED_ROUTES_DIR = "";
        this.CUSTOM_GENS_DIR = "";
        this.ALL_USER_DATA_PATHS = [];
        // now actually configure the user data dir
        this.config_user_data_dir(this._get_default_user_data_dir());
    }
    
    config_user_data_dir(user_data_dir:string) {
        this.SAVED_ROUTES_DIR = path.join(user_data_dir, this._SAVED_ROUTES_FOLDER_NAME)
        this.SAVED_IMAGES_DIR = path.join(user_data_dir, this._SAVED_IMAGES_FOLDER_NAME)
        this.OUTDATED_ROUTES_DIR = path.join(user_data_dir, this._OUTDATED_ROUTES_FOLDER_NAME)
        this.CUSTOM_GENS_DIR = path.join(user_data_dir, this._CUSTOM_GENS_FOLDER_NAME)

        this.ALL_USER_DATA_PATHS = [
            this.SAVED_ROUTES_DIR,
            this.SAVED_IMAGES_DIR,
            this.OUTDATED_ROUTES_DIR,
            this.CUSTOM_GENS_DIR
        ]
    }

    get_existing_route_path(route_name:string) {
        let result = path.join(this.SAVED_ROUTES_DIR, `${route_name}.json`);
        if (!fs.existsSync(result)) {
            result = path.join(this.OUTDATED_ROUTES_DIR, `${route_name}.json`);
        }
        
        return result;
    }

    get_existing_route_names(filter_text:string="", load_backups:boolean=false) {
        let loaded_routes:Array<string> = [];
        filter_text = filter_text.toLocaleLowerCase();

        if (fs.existsSync(this.SAVED_ROUTES_DIR)) {
            fs.readdirSync(this.SAVED_ROUTES_DIR, {recursive: false}).forEach(fragment => {
                if (fragment instanceof Buffer) return;

                let frag_info = path.parse(fragment);
                if (frag_info.ext != ".json") return;
                if (filter_text.length > 0 && frag_info.name.toLowerCase().includes(filter_text)) return;
                loaded_routes.push(frag_info.name);
            });
        }
        
        if (load_backups && fs.existsSync(this.OUTDATED_ROUTES_DIR)) {
            fs.readdirSync(this.OUTDATED_ROUTES_DIR, {recursive: false}).forEach(fragment => {
                if (fragment instanceof Buffer) return;

                let frag_info = path.parse(fragment);
                if (frag_info.ext != ".json") return;
                if (frag_info.name.toLowerCase().includes(filter_text)) return;
                loaded_routes.push(frag_info.name);
            });
        }

        return loaded_routes.sort();
    }

    
    _get_potential_user_data_dirs(potential_user_data_dir:string): { [key: string]: string } {
        return {
            [this.SAVED_ROUTES_DIR]: fs.realpathSync(path.join(potential_user_data_dir, this._SAVED_ROUTES_FOLDER_NAME)),
            [this.SAVED_IMAGES_DIR]: fs.realpathSync(path.join(potential_user_data_dir, this._SAVED_IMAGES_FOLDER_NAME)),
            [this.OUTDATED_ROUTES_DIR]: fs.realpathSync(path.join(potential_user_data_dir, this._OUTDATED_ROUTES_FOLDER_NAME)),
            [this.CUSTOM_GENS_DIR]: fs.realpathSync(path.join(potential_user_data_dir, this._CUSTOM_GENS_FOLDER_NAME)),
        }
    }

    change_user_data_location(orig_dir:string, new_dir:string) {
        try {
            // If the orig dir is invalid for some reason, assume this is first time setup
            // just create the new dir, and return
            if (orig_dir.length == 0 || !fs.existsSync(orig_dir)) {
                if (!fs.existsSync(new_dir)) {
                    fs.mkdirSync(new_dir);
                }
                return true;
            }

            if (!fs.existsSync(new_dir)) {
                fs.mkdirSync(new_dir);
            }

            Object.entries(this._get_potential_user_data_dirs(new_dir)).forEach(
                ([orig_inner_dir, new_inner_dir]) => {
                    if (fs.existsSync(orig_inner_dir)) {
                        fs.cpSync(orig_inner_dir, new_inner_dir, {recursive: true});
                    }
                }
            );
            
            // do these separately so we only remove files after everything has been copied to the new location
            Object.entries(this._get_potential_user_data_dirs(new_dir)).forEach(
                ([orig_inner_dir, _]) => {
                    if (fs.existsSync(orig_inner_dir)) {
                        fs.rmdirSync(orig_inner_dir, {recursive: true});
                    }
                }
            );

            // Only nuke the previous dir if it's now empty
            if (fs.readdirSync(orig_dir).length == 0){
                fs.rmdirSync(orig_dir);
            }

            return true;
        } catch (e) {
            log.error(`Failed to change data location to: ${new_dir}`);
            if (e instanceof Error) {
                log.error(e.stack);
            }
            return false;
        }
    }

    _get_default_user_data_dir():string {
        let result = os.homedir();
        let test = path.join(result, "Documents");
        if (fs.existsSync(test)) {
            result = test;
        }

        return path.join(result, this.APP_DATA_FOLDER_DEFAULT_NAME);
    }
}


export let const_xprr = new XpRouterConstants();
