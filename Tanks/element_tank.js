const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");

// Rock Paper Scissors Logic + Light/Dark
const TYPE_CHART = {
    "Fire": "Wind", "Wind": "Earth", "Earth": "Water", "Water": "Fire",
    "Light": "Dark", "Dark": "Light", "Neutral": "None"
};

// Full Relics Array by Rarity
const RELICS_DATA = {
    "Common": [
        { name: "Iron Plating", desc: "+10% Max HP", type: "stat_hp", val: 1.1 },
        { name: "Bandage", desc: "Heal +5% Lifesteal", type: "lifesteal", val: 0.05 },
        { name: "Rusty Spur", desc: "+10% Speed", type: "stat_spd", val: 1.1 }
    ],
    "Uncommon": [
        { name: "Lucky Coin", desc: "+15% Crit Chance", type: "crit_chance", val: 15 },
        { name: "Whetstone", desc: "+20% Base DMG", type: "stat_dmg", val: 1.2 },
        { name: "Giant's Belt", desc: "+20% Max HP", type: "stat_hp", val: 1.2 }
    ],
    "Rare": [
        { name: "Vampire Tooth", desc: "+10% Lifesteal", type: "lifesteal", val: 0.10 },
        { name: "Hermes Boots", desc: "+30% Speed", type: "stat_spd", val: 1.3 },
        { name: "Executioner Axe", desc: "+30% Base DMG", type: "stat_dmg", val: 1.3 }
    ],
    "Epic": [
        { name: "Assassin's Dagger", desc: "+50% Crit Damage", type: "crit_dmg", val: 0.5 },
        { name: "Bloodthirster", desc: "+20% Lifesteal", type: "lifesteal", val: 0.20 },
        { name: "Warmog's Armor", desc: "+50% Max HP", type: "stat_hp", val: 1.5 }
    ],
    "Legendary": [
        { name: "Trinity Force", desc: "+40% All Stats", type: "stat_all", val: 1.4 },
        { name: "Infinity Edge", desc: "+40% Crit Chance & +100% Crit DMG", type: "crit_both", val: {chance: 40, dmg: 1.0} }
    ],
    "Mythical": [
        { name: "Heart of Tarrasque", desc: "+100% Max HP", type: "stat_hp", val: 2.0 },
        { name: "Scythe of Vyse", desc: "+100% Base DMG", type: "stat_dmg", val: 2.0 }
    ],
    "Divine": [
        { name: "Aegis of the Immortal", desc: "+200% Max HP", type: "stat_hp", val: 3.0 },
        { name: "Divine Rapier", desc: "+300% Base DMG", type: "stat_dmg", val: 4.0 }
    ],
    "Celestial": [
        { name: "Starforge Core", desc: "+300% All Stats", type: "stat_all", val: 4.0 }
    ],
    "Omega": [
        { name: "The Singularity", desc: "+1000% All Stats", type: "stat_all", val: 11.0 }
    ],
    "Cursed": [
        { name: "Ring of Pain", desc: "+200% DMG, -50% Max HP", type: "stat_dmg", val: 3.0, penalty: { type: "stat_hp", val: 0.5 } },
        { name: "Blood Contract", desc: "+50% Lifesteal, lose 2% HP per turn", type: "lifesteal", val: 0.5, penalty: { type: "dot", val: 0.02 } },
        { name: "Glass Cannon", desc: "+500% DMG, but 1 Max HP", type: "stat_dmg", val: 6.0, penalty: { type: "fixed_hp", val: 1 } },
        { name: "The Maw", desc: "Devours a random relic every 5 battles to grow infinitely.", type: "parasite", val: 1.0, parasitic: true }
    ]
};

function formatNum(n) {
    if (n < 1000000) return Math.floor(n).toLocaleString();
    return n.toExponential(2);
}
const LIFESTEAL_ELEMENTS = ["Crimson", "Blood", "Vampiric", "Titan"];

const BIOMES = [
    { 
        name: "Green Plains", 
        ground: "#1b5e20", 
        sky: "#2b3a42" 
    },
    { 
        name: "Blazing Volcano", 
        ground: "#3e2723", 
        sky: "#1a0a0a" 
    },
    { 
        name: "Frozen Tundra", 
        ground: "#e1f5fe", 
        sky: "#01579b" 
    },
    { 
        name: "Corrupted Void", 
        ground: "#212121", 
        sky: "#12005e" 
    },
    { 
        name: "Golden Palace", 
        ground: "#fbc02d", 
        sky: "#fff9c4" 
    }
];

function logMessage(msg) {
    const log = document.getElementById("combat-log");
    if (!log) return;
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerText = `[${battleState.active ? "Battle" : "System"}] ${msg}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function getBiome() {
    let idx = Math.floor(player.streak / 10) % BIOMES.length;
    return BIOMES[idx];
}

const COMPANIONS_DATA = {
    "Medic Drone": { 
        desc: "Heals you for 5% HP every 3 turns.", 
        type: "heal", 
        val: 0.05, 
        freq: 3, 
        color: "#4caf50" 
    },
    "Laser Drone": { 
        desc: "Deals 20% of your DMG every 2 turns.", 
        type: "attack", 
        val: 0.2, 
        freq: 2, 
        color: "#f44336" 
    },
    "Shield Drone": { 
        desc: "+10% Permanent Max HP.", 
        type: "buff_hp", 
        val: 1.1, 
        freq: 0, 
        color: "#2196f3" 
    },
    "Gold Drone": { 
        desc: "+20% Gold from battles.", 
        type: "buff_gold", 
        val: 1.2, 
        freq: 0, 
        color: "#ffd700" 
    }
};

const TAROT_CARDS = {
    "The Fool": { desc: "+100% Gold, -50% XP Gain", goldMod: 1.0, xpMod: -0.5 },
    "The Tower": { desc: "All battles are ELITE, +100% Gold", eliteForce: true, goldMod: 1.0 },
    "The Lovers": { desc: "+50% Echo Chance, -25% DMG", echoMod: 50, dmgMod: -0.25 },
    "Death": { desc: "Gain 20 Hero Souls on death, -20% Max HP", soulsOnDeath: 20, hpMod: -0.2 },
    "The Sun": { desc: "Permanent Day bonuses, +20% HP & DMG", forcedCycle: "Day", hpMod: 0.2, dmgMod: 0.2 },
    "The Moon": { desc: "Permanent Night bonuses, +20% HP & DMG", forcedCycle: "Night", hpMod: 0.2, dmgMod: 0.2 }
};

const BLACK_MARKET_DATA = [
    { name: "Forbidden Scroll", desc: "+500% DMG, -100 Max HP", type: "stat_dmg", val: 6.0, cost_hp: 100 },
    { name: "Soul Harvester", desc: "+50% Echo Chance, -50 Max HP", type: "echo", val: 50, cost_hp: 50 },
    { name: "Void Core", desc: "+100% All Stats, -200 Max HP", type: "stat_all", val: 2.0, cost_hp: 200 }
];

const SKILL_TREE = [
    { id: "gold_gain", name: "Fortune's Favor", desc: "+10% Permanent Gold Gain", cost: 50 },
    { id: "xp_gain", name: "Eternal Wisdom", desc: "+10% Permanent XP Gain", cost: 50 },
    { id: "shield_start", name: "Aegis Mount", desc: "Start every battle with +200 extra Shield", cost: 100 },
    { id: "bribe_disc", name: "Silver Tongue", desc: "-20% Bribe Costs", cost: 150 },
    { id: "auto_merge", name: "Relic Master", desc: "Relics gain double levels on merge", cost: 200 }
];

const SAVE_KEY = "elemental_tanks_rpg_save_v1";

// --- TALENT DATA ---
const TALENTS = [
    { 
        id: 'bulk', 
        name: 'Titan Armor', 
        desc: '+15% Max HP', 
        req: 3, 
        mult: [1.15, 1.0, 1.0] 
    },
    { 
        id: 'sharp', 
        name: 'Sharpened Rounds', 
        desc: '+15% DMG', 
        req: 3, 
        mult: [1.0, 1.15, 1.0] 
    },
    { 
        id: 'turbo', 
        name: 'Turbo Engines', 
        desc: '+15% SPD', 
        req: 3, 
        mult: [1.0, 1.0, 1.15] 
    },
    { 
        id: 'gold1', 
        name: 'Midas Touch', 
        desc: '+25% Gold Gain', 
        req: 5, 
        goldMult: 0.25 
    },
    { 
        id: 'xp1', 
        name: 'Scholar', 
        desc: '+25% XP Gain', 
        req: 5, 
        xpMult: 0.25 
    },
    { 
        id: 'vamp', 
        name: 'Sanguine Core', 
        desc: '+10% Lifesteal', 
        req: 10, 
        lifesteal: 0.1 
    },
    { 
        id: 'crit', 
        name: 'Precision Sight', 
        desc: '+10% Crit Chance', 
        req: 10, 
        crit: 10 
    },
    { 
        id: 'status1', 
        name: 'Potent Elements', 
        desc: '+50% Status Effect Power', 
        req: 12, 
        statusPower: 0.5 
    },
    { 
        id: 'ult1', 
        name: 'Overcharge', 
        desc: '+30% Ult Charge Speed', 
        req: 15, 
        ultSpeed: 1.3 
    },
    { 
        id: 'bulk2', 
        name: 'Colossus Plating', 
        desc: '+50% Max HP', 
        req: 20, 
        mult: [1.5, 1.0, 1.0] 
    },
    { 
        id: 'sharp2', 
        name: 'Nuclear Payload', 
        desc: '+50% DMG', 
        req: 20, 
        mult: [1.0, 1.5, 1.0] 
    },
    { 
        id: 'god', 
        name: 'Ascension', 
        desc: '+100% All Stats', 
        req: 30, 
        mult: [2.0, 2.0, 2.0] 
    }
];

// --- DUNGEON DATA ---
let dungeon = {
    active: false,
    floor: 1,
    nodes: [],
    currentNode: -1
};

const PROFESSIONS = {
    "Common": [
        { 
            name: "Farmer", 
            desc: "+10% HP, +1 Point/Lv", 
            stats: [1.1, 1.0, 1.0], 
            pointsMod: 1 
        },
        { 
            name: "Miner", 
            desc: "+15% DMG, -10% SPD", 
            stats: [1.0, 1.15, 0.9], 
            pointsMod: 0 
        },
    ],
    "Uncommon": [
        { 
            name: "Blacksmith", 
            desc: "+25% HP & DMG, 0 Points/Lv", 
            stats: [1.25, 1.25, 1.0], 
            pointsMod: -3 
        },
        { 
            name: "Hunter", 
            desc: "+15% DMG & SPD", 
            stats: [1.0, 1.15, 1.15], 
            pointsMod: 0 
        },
        { 
            name: "Tinker", 
            desc: "-10% HP, +2 Points/Lv", 
            stats: [0.9, 1.0, 1.0], 
            pointsMod: 2 
        }
    ],
    "Rare": [
        { 
            name: "Alchemist", 
            desc: "+30% HP, +20% DMG, -1 Point/Lv", 
            stats: [1.3, 1.2, 1.0], 
            pointsMod: -1 
        },
        { 
            name: "Gladiator", 
            desc: "+30% DMG, +20% SPD, -2 Pts/Lv", 
            stats: [1.0, 1.3, 1.2], 
            pointsMod: -2 
        },
        { 
            name: "Merchant", 
            desc: "-20% All Stats, +4 Pts/Lv", 
            stats: [0.8, 0.8, 0.8], 
            pointsMod: 4 
        }
    ],
    "Epic": [
        { 
            name: "Runesmith", 
            desc: "+40% HP & DMG, 0 Pts/Lv", 
            stats: [1.4, 1.4, 1.0], 
            pointsMod: -3 
        },
        { 
            name: "Assassin", 
            desc: "+50% DMG, +30% SPD, -50% HP", 
            stats: [0.5, 1.5, 1.3], 
            pointsMod: 0 
        },
        { 
            name: "Nobleman", 
            desc: "-30% All Stats, +6 Pts/Lv", 
            stats: [0.7, 0.7, 0.7], 
            pointsMod: 6 
        }
    ],
    "Legendary": [
        { 
            name: "Grandmaster", 
            desc: "+60% All Stats, 0 Pts/Lv", 
            stats: [1.6, 1.6, 1.6], 
            pointsMod: -3 
        },
        { 
            name: "Dragon Slayer", 
            desc: "+80% DMG, +40% HP, -2 Pts/Lv", 
            stats: [1.4, 1.8, 1.0], 
            pointsMod: -2 
        },
        { 
            name: "Philosopher", 
            desc: "-50% All Stats, +10 Pts/Lv", 
            stats: [0.5, 0.5, 0.5], 
            pointsMod: 10 
        }
    ],
    "Mythical": [
        { 
            name: "Immortal", 
            desc: "+150% HP, -2 Pts/Lv", 
            stats: [2.5, 1.0, 1.0], 
            pointsMod: -2 
        },
        { 
            name: "Omniscient", 
            desc: "-80% All Stats, +20 Pts/Lv", 
            stats: [0.2, 0.2, 0.2], 
            pointsMod: 20 
        }
    ],
    "Divine": [
        { 
            name: "Creator's Hand", 
            desc: "+200% All Stats, 0 Pts/Lv", 
            stats: [3.0, 3.0, 3.0], 
            pointsMod: -3 
        }
    ],
    "Celestial": [
        { 
            name: "Weaver of Fate", 
            desc: "+400% All Stats, +10 Pts/Lv", 
            stats: [5.0, 5.0, 5.0], 
            pointsMod: 10 
        }
    ],
    "Omega": [
        { 
            name: "System Admin", 
            desc: "+500% All Stats, +50 Pts/Lv", 
            stats: [6.0, 6.0, 6.0], 
            pointsMod: 50 
        }
    ]
};

const ELEMENTS_DATA = {
    "Common": {
        "Fire": { stats: [1.0, 1.2, 1.0], attack: "Fireball", color: "#F44336", type: "Fire", effect: "burn" },
        "Water": { stats: [1.1, 1.0, 1.0], attack: "Water Cannon", color: "#2196F3", type: "Water", effect: "none" },
        "Earth": { stats: [1.2, 1.0, 1.0], attack: "Rock Toss", color: "#795548", type: "Earth", effect: "none" },
        "Wind": { stats: [1.0, 1.0, 1.2], attack: "Gale Blast", color: "#B0BEC5", type: "Wind", effect: "none" },
        "Iron": { stats: [1.3, 1.1, 1.0], attack: "Iron Shell", color: "#434b4d", type: "Earth", effect: "none" },
        "Wood": { stats: [1.1, 1.0, 1.0], attack: "Splinter Shot", color: "#4CAF50", type: "Earth", effect: "none" },
        "Stone": { stats: [1.2, 1.0, 1.0], attack: "Boulder Launch", color: "#9E9E9E", type: "Earth", effect: "none" },
        "Ice": { stats: [1.0, 1.1, 1.0], attack: "Ice Shard", color: "#00BCD4", type: "Water", effect: "slow" }
    },
    "Uncommon": {
        "Spark": { stats: [1.0, 1.1, 1.2], attack: "Static Shock", color: "#FFEB3B", type: "Light", effect: "stun" },
        "Mud": { stats: [1.3, 1.0, 1.0], attack: "Mud Fling", color: "#5c4033", type: "Earth", effect: "slow" },
        "Sand": { stats: [1.0, 1.0, 1.1], attack: "Sandstorm", color: "#FFC107", type: "Earth", effect: "none" },
        "Steam": { stats: [1.0, 1.0, 1.4], attack: "Scalding Cloud", color: "#CFD8DC", type: "Water", effect: "burn" },
        "Nature": { stats: [1.0, 1.0, 1.3], attack: "Nature's Wrath", color: "#228b22", type: "Earth", effect: "none" }
    },
    "Rare": {
        "Glass": { stats: [1.0, 1.4, 1.1], attack: "Shatter Shot", color: "#E0F7FA", type: "Neutral", effect: "none" },
        "Poison": { stats: [1.1, 1.2, 1.1], attack: "Toxic Sludge", color: "#9C27B0", type: "Dark", effect: "burn" },
        "Acid": { stats: [1.0, 1.4, 1.0], attack: "Corrosive Spit", color: "#CCFF90", type: "Water", effect: "burn" },
        "Clay": { stats: [1.4, 1.0, 1.0], attack: "Heavy Mudslide", color: "#8D6E63", type: "Earth", effect: "none" },
        "Crimson": { stats: [1.3, 1.1, 1.0], attack: "Sanguine Drain", color: "#880E4F", type: "Dark", effect: "none" }
    },
    "Epic": {
        "Lightning": { stats: [1.0, 1.4, 1.4], attack: "Thunderbolt Strike", color: "#FFEE58", type: "Light", effect: "stun" },
        "Magma": { stats: [1.4, 1.3, 1.0], attack: "Lava Eruption", color: "#BF360C", type: "Fire", effect: "burn" },
        "Shadow": { stats: [1.1, 1.4, 1.2], attack: "Shadow Pulse", color: "#424242", type: "Dark", effect: "none" }
    },
    "Legendary": {
        "Light": { stats: [1.3, 1.3, 1.5], attack: "Holy Ray", color: "#FFF59D", type: "Light", effect: "none" },
        "Plasma": { stats: [1.2, 1.6, 1.3], attack: "Superheated Plasma", color: "#E040FB", type: "Light", effect: "burn" }
    },
    "Mythical": {
        "Time": { stats: [1.5, 1.5, 2.0], attack: "Chrono Distortion", color: "#009688", type: "Neutral", effect: "slow" },
        "Gravity": { stats: [2.0, 1.8, 1.0], attack: "Singularity Collapse", color: "#311B92", type: "Dark", effect: "stun" }
    },
    "Divine": {
        "Blood": { stats: [3.0, 2.0, 2.5], attack: "Blood Boil", color: "#ff0000", type: "Dark", effect: "none" }
    },
    "Celestial": {
        "Void": { stats: [4.0, 4.0, 4.0], attack: "Total Erasure", color: "#111111", type: "Dark", effect: "none" }
    },
    "Omega": {
        "Titan": { stats: [10.0, 10.0, 10.0], attack: "World Cleaver", color: "#ff0000", type: "Earth", effect: "stun" } 
    }
};

const BASE_CLASSES = {
    "Common": [
        { archetype: "Warrior", desc: "Balanced and reliable combatant.", stats: [1.1, 1.1, 1.1] }, 
        { archetype: "Mage", desc: "Sacrifices defense for raw magical power.", stats: [1.0, 1.3, 1.0] },
        { archetype: "Defender", desc: "Prioritizes survivability and armor.", stats: [1.3, 1.0, 1.0] }, 
        { archetype: "Scout", desc: "Highly agile but fragile chassis.", stats: [1.0, 1.0, 1.4] }
    ],
    "Uncommon": [
        { archetype: "Bruiser", desc: "Heavily armored frontliner with solid damage.", stats: [1.3, 1.2, 1.0] }, 
        { archetype: "Ranger", desc: "Strikes quickly from afar with precision.", stats: [1.0, 1.2, 1.3] },
        { archetype: "Acolyte", desc: "Channels powerful elemental forces.", stats: [1.1, 1.4, 1.1] }
    ],
    "Rare": [
        { archetype: "Paladin", desc: "A holy juggernaut with massive health.", stats: [1.5, 1.2, 1.0] }, 
        { archetype: "Assassin", desc: "Unmatched speed and critical strike setups.", stats: [1.0, 1.3, 1.6] },
        { archetype: "Sorcerer", desc: "Devastating damage output, ignoring safety.", stats: [1.0, 1.6, 1.2] }
    ],
    "Epic": [
        { archetype: "Juggernaut", desc: "An unstoppable force on the battlefield.", stats: [1.8, 1.4, 1.0] }, 
        { archetype: "Sniper", desc: "Fires catastrophic rounds at a distance.", stats: [1.0, 2.0, 1.2] },
        { archetype: "Warlock", desc: "Bends forbidden magics for pure damage.", stats: [1.2, 1.8, 1.2] }
    ],
    "Legendary": [
        { archetype: "Warlord", desc: "Commands the arena with overwhelming stats.", stats: [2.0, 2.0, 1.0] }, 
        { archetype: "Shadow", desc: "Moves faster than the eye can track.", stats: [1.0, 1.8, 2.2] },
        { archetype: "Archmage", desc: "The pinnacle of magical destruction.", stats: [1.2, 2.5, 1.5] }
    ],
    "Mythical": [
        { archetype: "Leviathan", desc: "An unkillable titan from the deep.", stats: [3.0, 2.0, 1.0] }, 
        { archetype: "Reaper", desc: "Harvests souls with terrifying speed and force.", stats: [1.0, 3.0, 2.5] }
    ],
    "Divine": [ 
        { archetype: "Demigod", desc: "Possesses power bordering on the divine.", stats: [4.0, 4.0, 2.0] } 
    ],
    "Celestial": [ 
        { archetype: "Archon", desc: "A being of pure, concentrated energy.", stats: [5.0, 5.0, 5.0] } 
    ],
    "Omega": [ 
        { archetype: "Worldbreaker", desc: "Existence itself fractures in its wake.", stats: [10.0, 10.0, 10.0] } 
    ]
};

const SPECIAL_CLASS_NAMES = {
    "Fire Mage": "Pyromancer", "Water Mage": "Aquamancer", "Earth Mage": "Geomancer",
    "Wind Mage": "Aeromancer", "Ice Mage": "Cryomancer", "Iron Juggernaut": "Dreadnought",
    "Nature Mage": "Druid", "Poison Assassin": "Toxicologist", "Shadow Mage": "Necromancer",
    "Light Paladin": "Holy Crusader", "Time Mage": "Chronomancer", "Gravity Juggernaut": "Singularity Guard",
    "Titan Worldbreaker": "The True Boss"
};

const RARITY_WEIGHTS = { 
    "Common": 500, 
    "Uncommon": 400, 
    "Rare": 300, 
    "Epic": 200, 
    "Legendary": 100, 
    "Mythical": 50, 
    "Divine": 20, 
    "Celestial": 10, 
    "Omega": 5 
};

let player; let enemies = []; let enemy = null;
let ghost = null;
let battleState = { active: false, speed: 1, skip: false, auto: false, pickingClass: false, isBoss: false, isRift: false, isCasino: false, fleeTriggered: false };
let projectiles = []; let floatingTexts = []; let particles = []; let cameraShake = 0;
let playerHistory = [];

function saveGame() {
    player.lastTimestamp = Date.now();
    const saveData = {
        player: player,
        dungeon: dungeon,
        timestamp: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    localStorage.setItem("elemental_tanks_history", JSON.stringify(playerHistory));
}

function resetGame() {
    if(confirm("Are you sure you want to reset everything?")) {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem("elemental_tanks_history");
        location.reload();
    }
}

function initPlayer() {
    const saved = localStorage.getItem(SAVE_KEY);
    const histSaved = localStorage.getItem("elemental_tanks_history");
    if (histSaved) playerHistory = JSON.parse(histSaved);

    let baseData = {
        level: 1, xp: 0, xp_to_next: 100, gold: 0, streak: 0, relics: [], talents: [],
        heroSouls: 0, permStats: { hp: 1, dmg: 1, spd: 1 },
        companions: [], limitBreak: 0, shield: 0, autoBuyRelics: false, auras: [],
        base_hp: 100, base_dmg: 15, base_spd: 10, free_points: 0, alloc_hp: 0, alloc_dmg: 0, alloc_spd: 0,
        element_name: "None", rarity: "None", class_name: "None", type: "Neutral", effect: "none",
        prof1: null, prof2: null, attack_name: "Basic", color: "#555",
        base_multipliers: [1.0, 1.0, 1.0], current_mults: [1.0, 1.0, 1.0], hp: 100, max_hp: 100, dmg: 15, spd: 10, ultimate: 0, status: [],
        recoil: 0, tracks: 0, visualHP: 100, maxHit: 0, combo: 0, rollHistory: [],
        tarot: null, lastKiller: "Void Tank", echoChance: 5, turnCounter: 0, cycle: "Day",
        elementMastery: {}, ascendedElements: [], stance: "Balanced", combatDegradation: 0,
        karma: 0, corruption: 0, entropyShards: [], battleCount: 0, fleeingEnemy: null,
        lastTimestamp: Date.now(),
        skillTree: [], inventory: ["Time Rewind", "Liquid Gold"], achievements: []
    };
    player = baseData;
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(player, data.player);
            if (data.dungeon) Object.assign(dungeon, data.dungeon);

            // Offline Gains
            const now = Date.now();
            const diff = now - (player.lastTimestamp || now);
            const hours = Math.min(24, diff / (1000 * 60 * 60));
            if (hours > 0.5) {
                const offGold = Math.floor(hours * 100 * player.level);
                const offXP = Math.floor(hours * 50);
                player.gold += offGold;
                player.xp += offXP;
                setTimeout(() => {
                    alert(`OFFLINE EXPEDITION COMPLETE!\nYou were away for ${hours.toFixed(1)} hours.\nGained: ${formatNum(offGold)} Gold and ${formatNum(offXP)} XP.`);
                }, 1000);
            }
        } catch (e) { console.error("Load failed", e); }
    }

    if (!player.tarot) rollTarot();
    recalculateStats();
    updateUI();
}
initPlayer(); 

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    const btn = document.querySelector(`[onclick="showTab('${id}')"]`);
    if (btn) btn.classList.add('active');
}

function generateMap() {
    dungeon.nodes = [];
    const types = ["Battle", "Battle", "Elite", "Rest", "Treasure", "RIFT", "CASINO"];
    for(let i=0; i<10; i++) {
        let type = types[Math.floor(Math.random() * types.length)];
        if (i === 9) type = "BOSS";
        dungeon.nodes.push({ type: type, completed: false });
    }
    dungeon.currentNode = 0;
    dungeon.active = true;
    renderMap();
    saveGame();
}

function renderMap() {
    const container = document.getElementById("ui-map");
    if (!container) return;
    if (!dungeon.nodes.length) {
        container.innerHTML = `<button onclick="generateMap()" class="btn-battle">ENTER NEW DUNGEON</button>`;
        return;
    }
    container.innerHTML = dungeon.nodes.map((n, i) => {
        let style = "";
        if (n.type === "RIFT") style = "border-color: #ff00ff; box-shadow: 0 0 15px #ff00ff;";
        if (n.type === "CASINO") style = "border-color: #ffd700; box-shadow: 0 0 15px #ffd700;";
        return `
            <div class="map-node ${n.completed ? 'completed' : ''} ${i === dungeon.currentNode ? 'active' : (i > dungeon.currentNode ? 'locked' : '')}" 
                 onclick="handleNode(${i})" style="${style}">
                <div class="node-type">${n.type}</div>
                <div style="font-size:12px;">F${i+1}</div>
            </div>
        `;
    }).join("");
}

function handleNode(idx) {
    if (idx !== dungeon.currentNode || battleState.active) return;
    const node = dungeon.nodes[idx];
    if (node.type === "Battle" || node.type === "Elite" || node.type === "BOSS" || node.type === "RIFT") {
        battleState.isBoss = (node.type === "BOSS" || node.type === "Elite");
        battleState.isRift = (node.type === "RIFT");
        startBattle();
    } else if (node.type === "Rest") {
        applyHealing(Math.floor(player.max_hp * 0.3));
        showMessage("Rested at the spring. +30% HP!", "#4caf50");
        node.completed = true; dungeon.currentNode++; renderMap(); updateUI(); saveGame();
    } else if (node.type === "Treasure") {
        let gold = 100 + Math.floor(Math.random() * 200);
        player.gold += gold;
        showMessage(`Found a chest! +${gold} Gold`, "#ffd700");
        node.completed = true; dungeon.currentNode++; renderMap(); updateUI(); saveGame();
    } else if (node.type === "CASINO") {
        document.getElementById("casino-modal").style.display = "flex";
    }
}

function resolveCasino(choice) {
    if (choice === 'gold') {
        if (player.gold < 1000) { showMessage("Need 1000g!", "#ff3c3c"); return; }
        player.gold -= 1000;
        if (Math.random() < 0.2) {
            let pool = RELICS_DATA["Divine"];
            let relicData = pool[Math.floor(Math.random() * pool.length)];
            player.relics.push({ ...relicData, rarity: "Divine", level: 1 });
            showMessage("JACKPOT! Divine Relic Acquired!", "#ffff00");
        } else { showMessage("Bust! Better luck next time.", "#888"); }
    } else {
        if (player.relics.length === 0) { showMessage("No relics to bet!", "#ff3c3c"); return; }
        const idx = Math.floor(Math.random() * player.relics.length);
        const lost = player.relics.splice(idx, 1)[0];
        if (Math.random() < 0.4) {
            let pool = RELICS_DATA["Divine"];
            let relicData = pool[Math.floor(Math.random() * pool.length)];
            player.relics.push({ ...relicData, rarity: "Divine", level: 1 });
            showMessage(`UPGRADED ${lost.name} into Divine!`, "#ffff00");
        } else { showMessage(`The house took your ${lost.name}...`, "#f44336"); }
    }
    document.getElementById("casino-modal").style.display = "none";
    dungeon.nodes[dungeon.currentNode].completed = true;
    dungeon.currentNode++;
    renderMap(); updateUI(); saveGame();
    if (battleState.auto) setTimeout(startBattle, 1000);
}

function renderTalents() {
    const container = document.getElementById("ui-talents");
    if (!container) return;
    container.innerHTML = TALENTS.map(t => {
        const owned = player.talents.includes(t.id);
        const canAfford = player.level >= t.req;
        return `
            <div class="talent-card ${owned ? 'owned' : (canAfford ? '' : 'locked')}" onclick="buyTalent('${t.id}')">
                <strong>${t.name}</strong><br>
                <span>${t.desc}</span><br>
                <small>Req: Lv ${t.req}</small>
            </div>
        `;
    }).join("");
}

function buyTalent(id) {
    if (player.talents.includes(id)) return;
    const t = TALENTS.find(x => x.id === id);
    if (player.level < t.req) { showMessage("Level too low!", "#ff3c3c"); return; }
    player.talents.push(id);
    recalculateStats(); renderTalents(); saveGame();
    showMessage(`Learned ${t.name}!`, "#00e676");
}

function checkRelicMerging() {
    const counts = {};
    player.relics.forEach(r => counts[r.name] = (counts[r.name] || 0) + 1);
    for (let name in counts) {
        if (counts[name] >= 2) {
            const indices = [];
            let firstMatch;
            player.relics.forEach((r, i) => { 
                if(r.name === name) {
                    indices.push(i);
                    if (!firstMatch) firstMatch = r;
                }
            });
            indices.slice(0, 2).reverse().forEach(i => player.relics.splice(i, 1));

            const upgraded = { 
                ...firstMatch,
                level: (firstMatch.level || 1) + 1,
                val: firstMatch.val * 1.3,
                rarity: firstMatch.rarity === "Cursed" ? "Cursed" : "Legendary"
            };
            player.relics.push(upgraded);
            logMessage(`AUTO-MERGE: ${name} upgraded to Lvl ${upgraded.level}!`);
            checkRelicMerging(); break;
        }
    }
}
function performFusion() {
    if (player.element_name === "None" || battleState.active) return;
    const rarities = Object.keys(RARITY_WEIGHTS);
    const currentIdx = rarities.indexOf(player.rarity);
    if (currentIdx === rarities.length - 1) { showMessage("Already at max rarity!", "#ff3c3c"); return; }
    const cost = 1000 * Math.pow(4, currentIdx);
    if (player.gold < cost) { showMessage(`Need ${cost} Gold!`, "#ff3c3c"); return; }
    player.gold -= cost;
    const nextRarity = rarities[currentIdx + 1];
    const elementKeys = Object.keys(ELEMENTS_DATA[nextRarity]);
    const element = elementKeys[Math.floor(Math.random() * elementKeys.length)];
    const data = ELEMENTS_DATA[nextRarity][element];
    player.element_name = element; player.rarity = nextRarity; player.attack_name = data.attack; player.color = data.color; player.type = data.type; player.effect = data.effect;
    player.base_multipliers = [...data.stats];
    if (player.archetype) { let genName = `${element} ${player.archetype}`; player.class_name = SPECIAL_CLASS_NAMES[genName] || genName; }
    recalculateStats(); updateUI(); saveGame();
    showMessage(`Fusion Successful! Evolved into ${element}!`, data.color);
}

function buyHeal() {
    if(player.gold >= 50 && player.hp < player.max_hp && !battleState.active) {
        player.gold -= 50; applyHealing(Math.floor(player.max_hp * 0.5)); updateUI(); showMessage("Healed 50% HP!", "#4caf50");
    }
}

function buyRelic() {
    if(player.gold >= 200 && !battleState.active) {
        player.gold -= 200;
        let rarity = getWeightedRandomRarity();
        let pool = RELICS_DATA[rarity];
        let relicData = pool[Math.floor(Math.random() * pool.length)];
        player.relics.push({ ...relicData, rarity: rarity, level: 1 });
        checkRelicMerging(); recalculateStats();
        showMessage(`Rolled [${rarity}] Relic: ${relicData.name}!`, "#ba68c8");
    }
}

function levelUpRelic(idx) {
    const r = player.relics[idx];
    const cost = Math.floor(100 * Math.pow(1.5, r.level || 1));
    if (player.gold >= cost) {
        player.gold -= cost; r.level = (r.level || 1) + 1; r.val *= 1.1;
        logMessage(`Leveled up ${r.name} to Lvl ${r.level}!`); recalculateStats(); saveGame();
    } else showMessage(`Need ${cost} Gold!`, "#ff3c3c");
}

function toggleAutoRelic() { player.autoBuyRelics = !player.autoBuyRelics; updateUI(); }

function applyHealing(amount) {
    const overheal = (player.hp + amount) - player.max_hp;
    if (overheal > 0) {
        player.hp = player.max_hp; player.shield = (player.shield || 0) + overheal;
        floatingTexts.push({ x: player.x+30, y: player.y-20, text: `+${Math.floor(overheal)} SHIELD`, color: "#03a9f4", alpha: 1.0, vx: 0, vy: -1.5 });
    } else player.hp += amount;
}

function triggerLimitBreak() {
    if (!battleState.active || !enemies.length) return;
    
    // Blood Magic
    if (player.limitBreak < 100) {
        const hpCost = Math.floor(player.hp * 0.25);
        if (player.hp <= hpCost + 1) { showMessage("Too weak for Blood Magic!", "#ff3c3c"); return; }
        if (confirm(`FORCE LIMIT BREAK? (Sacrifice ${hpCost} HP)`)) {
            player.hp -= hpCost;
            player.limitBreak = 100;
            logMessage("BLOOD MAGIC: Exchanged life for power!");
        } else return;
    }

    player.limitBreak = 0; cameraShake = 30;
    let lbDmg = player.dmg * 10; logMessage(`LIMIT BREAK: ${player.element_name} Judgement deals ${Math.floor(lbDmg)} AoE!`);
    enemies.forEach(t => {
        if (t.hp <= 0) return;
        t.hp -= lbDmg; spawnParticles(t.x+30, t.y+15, player.color, 50);
        floatingTexts.push({ x: t.x, y: t.y-40, text: `LIMIT BREAK! -${Math.floor(lbDmg)}`, color: "#ff00ff", alpha: 1.0, vx: 0, vy: -3, font: "bold 40px Arial" });
    });
    updateUI(); if (enemies.every(t => t.hp <= 0)) endBattle(true);
}

function buyCompanion() {
    if(player.gold >= 1000 && !battleState.active) {
        player.gold -= 1000;
        const keys = Object.keys(COMPANIONS_DATA);
        const name = keys[Math.floor(Math.random() * keys.length)];
        const data = COMPANIONS_DATA[name];
        player.companions.push({ name: name, ...data, turnCount: 0 });
        recalculateStats(); showMessage(`New Companion: ${name}!`, data.color); saveGame();
    } else if (player.gold < 1000) showMessage("Need 1000 gold for a companion!", "#ff3c3c");
}

function rollProfession(slot) {
    if (battleState.active || player.element_name === "None" || player.xp < 50) return;
    player.xp -= 50; const rarity = getWeightedRandomRarity();
    player[`prof${slot}`] = { ...PROFESSIONS[rarity][Math.floor(Math.random() * PROFESSIONS[rarity].length)], rarity: rarity };
    recalculateStats(); showMessage(`Rolled [${rarity}] ${player[`prof${slot}`].name}!`, "#ff9800");
}

function setSpeed(s) {
    battleState.speed = s;
    document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('speed-' + s);
    if (btn) btn.classList.add('active');
}

function toggleSkip() { battleState.skip = !battleState.skip; document.getElementById('btn-skip-toggle').classList.toggle('active'); }

function toggleAuto() {
    battleState.auto = !battleState.auto;
    const btn = document.getElementById('btn-auto-toggle');
    if (btn) { btn.classList.toggle('active'); btn.innerText = battleState.auto ? "Auto: ON" : "Auto: OFF"; }
    if (battleState.auto && !battleState.active && player.element_name !== "None" && !battleState.pickingClass) startBattle();
}

function showMessage(msg, color="#fff") {
    const el = document.getElementById("message-overlay");
    if (el) { el.innerHTML = msg; el.style.color = color; }
}

function spawnParticles(x, y, color, count=10) {
    if(battleState.skip) return;
    for(let i=0; i<count; i++) {
        particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1.0, decay: 0.02 + Math.random() * 0.05, color: color, size: 2 + Math.random() * 3 });
    }
}

function getWeightedRandomRarity() {
    let totalWeight = 0;
    for (let rarity in RARITY_WEIGHTS) totalWeight += RARITY_WEIGHTS[rarity];
    let r = Math.random() * totalWeight;
    for (let rarity in RARITY_WEIGHTS) { if (r < RARITY_WEIGHTS[rarity]) return rarity; r -= RARITY_WEIGHTS[rarity]; }
    return "Common"; 
}

function buyGodRelic() {
    if(player.gold < 5000 || battleState.active) { showMessage("Need at least 5000 gold!", "#ff3c3c"); return; }
    const goldSpent = player.gold; player.gold = 0; const power = 1 + (goldSpent / 50000);
    player.relics.push({ name: "Divine Aura", desc: `+${((power-1)*100).toFixed(1)}% All Stats (Sacrificed ${goldSpent}g)`, type: "stat_all", val: power, rarity: "Divine", level: 1 });
    recalculateStats(); updateUI(); saveGame(); showMessage(`Forged Divine Aura!`, "#ffff00");
}

function buyPermUpgrade(stat) {
    if (!player.permStats) player.permStats = { hp: 1, dmg: 1, spd: 1 };
    const cost = 10; 
    if ((player.heroSouls || 0) >= cost) {
        player.heroSouls -= cost; player.permStats[stat] = (player.permStats[stat] || 1) + 0.05;
        recalculateStats(); updateUI(); saveGame(); showMessage(`Upgraded Perm ${stat.toUpperCase()}!`, "#ffff00");
    } else showMessage("Need 10 Hero Souls!", "#ff3c3c");
}

function rollLoadedDice() {
    if (player.gold < 500 || battleState.active) return;
    player.gold -= 500;
    if (Math.random() < 0.5) {
        player.gold *= 2;
        showMessage("GAMBLER'S LUCK! Gold Doubled!", "#ffd700");
    } else {
        player.gold = Math.floor(player.gold / 2);
        showMessage("SNAKE EYES! Lost half your gold!", "#f44336");
    }
    updateUI(); saveGame();
}

function useBlacksmith() {
    if (player.relics.length === 0 || player.gold < 300 || battleState.active) return;
    player.gold -= 300;
    const idx = Math.floor(Math.random() * player.relics.length);
    const oldR = player.relics[idx];
    const pool = RELICS_DATA[oldR.rarity] || RELICS_DATA["Common"];
    const newR = pool[Math.floor(Math.random() * pool.length)];
    player.relics[idx] = { ...newR, rarity: oldR.rarity, level: oldR.level };
    recalculateStats(); updateUI(); saveGame();
    showMessage(`Anvil: Rerolled ${oldR.name} into ${newR.name}!`, "#607d8b");
}

function ascend() {
    if (player.streak < 10) { showMessage("Need at least 10 Streak to Ascend!", "#ff3c3c"); return; }
    const soulsEarned = Math.floor(player.streak / 2);
    if (confirm(`Ascend now for ${soulsEarned} Hero Souls? This will reset your current run.`)) {
        // Save to History
        if (player.element_name !== "None") {
            playerHistory.push({ ...player, relics: [...player.relics], talents: [...player.talents] });
            if (playerHistory.length > 5) playerHistory.shift();
        }

        player.heroSouls = (player.heroSouls || 0) + soulsEarned;
        player.streak = 0;
        player.level = 1;
        player.xp = 0;
        player.xp_to_next = 100;
        player.gold = 0;
        player.relics = [];
        player.talents = [];
        player.element_name = "None";
        player.rarity = "None";
        player.class_name = "None";
        player.prof1 = null;
        player.prof2 = null;
        player.combo = 0;
        recalculateStats();
        updateUI();
        saveGame();
        showMessage(`ASCENDED! Gained ${soulsEarned} Souls.`, "#ff5252");
    }
}


function resolveKarma(choice) {
    document.getElementById("karma-modal").style.display = "none";
    const d = player.fleeingEnemy;
    if (!d) return;
    if (choice === 'spare') {
        player.karma++;
        player.xp += 200;
        logMessage(`MERCY: Spared ${d.name}. Karma: ${player.karma}`);
    } else {
        player.karma--;
        player.combo += 10;
        logMessage(`MALICE: Executed ${d.name}! Combo +10. Karma: ${player.karma}`);
    }
    player.fleeingEnemy = null;
    battleState.active = true;
    if (enemies.some(e => e.hp > 0)) {
        setTimeout(() => executeTurn(player, enemies.find(e => e.hp > 0)), 500 / battleState.speed);
    } else {
        endBattle(true);
    }
}

    function rollTarot() {
        const keys = Object.keys(TAROT_CARDS);
        const choice = keys[Math.floor(Math.random() * keys.length)];
        player.tarot = choice;
        logMessage(`DESTINY DRAW: ${choice} - ${TAROT_CARDS[choice].desc}`);
    }

    function buyBlackMarketItem(idx) {
        const item = BLACK_MARKET_DATA[idx];
        if (player.max_hp <= item.cost_hp + 10) { showMessage("Too risky! Need more Max HP.", "#ff3c3c"); return; }
        player.base_hp -= item.cost_hp;
        if (item.type === "echo") player.echoChance += item.val;
        else {
            player.relics.push({ name: item.name, desc: item.desc, type: item.type, val: item.val, rarity: "Cursed", level: 1 });
        }
        recalculateStats(); updateUI(); saveGame();
        showMessage(`BLOOD TRADE: Acquired ${item.name}!`, "#ff00ff");
    }

    function recalculateStats() {
        let relicHp = 1, relicDmg = 1, relicSpd = 1;
        player.goldBonus = 1; player.xpBonus = 1; player.statusBonus = 1; player.ultSpeedBonus = 1;
        player.critChance = 5; player.critDmg = 1.5; player.lifesteal = 0;
        player.dotPenalty = 0;
        player.echoChance = 5; // Base
        let fixedHp = null;

        // Tarot Modifiers
        const t = player.tarot ? TAROT_CARDS[player.tarot] : null;
        if (t) {
            if (t.hpMod) relicHp += t.hpMod;
            if (t.dmgMod) relicDmg += t.dmgMod;
            if (t.goldMod) player.goldBonus += t.goldMod;
            if (t.xpMod) player.xpBonus += t.xpMod;
            if (t.echoMod) player.echoChance += t.echoMod;
        }

        if (player.permStats) { 
            relicHp *= player.permStats.hp || 1; 
            relicDmg *= player.permStats.dmg || 1; 
            relicSpd *= player.permStats.spd || 1; 
        }

        let greedMult = 1 + (Math.floor(player.gold / 1000) * 0.01); 
        relicDmg *= greedMult;

        player.relics.forEach(r => {
            const levelMult = 1 + ((r.level - 1) * 0.1);
            if(r.type === 'stat_hp') relicHp *= (r.val * levelMult);
            else if(r.type === 'stat_dmg') relicDmg *= (r.val * levelMult);
            else if(r.type === 'stat_spd') relicSpd *= (r.val * levelMult);
            else if(r.type === 'stat_all') { 
                relicHp *= (r.val * levelMult); 
                relicDmg *= (r.val * levelMult); 
                relicSpd *= (r.val * levelMult); 
            }
            else if(r.type === 'crit_chance') player.critChance += r.val;
            else if(r.type === 'crit_dmg') player.critDmg += r.val;
            else if(r.type === 'lifesteal') player.lifesteal += r.val;
            else if(r.type === 'crit_both') { 
                player.critChance += r.val.chance; 
                player.critDmg += r.val.dmg; 
            }

            if (r.penalty) {
                if (r.penalty.type === 'stat_hp') relicHp *= r.penalty.val;
                if (r.penalty.type === 'dot') player.dotPenalty += r.penalty.val;
                if (r.penalty.type === 'fixed_hp') fixedHp = r.penalty.val;
            }
        });

        player.auras = []; 
        const tCounts = {}; 
        player.relics.forEach(r => tCounts[r.type] = (tCounts[r.type] || 0) + 1);
        if (tCounts['lifesteal'] >= 3) player.auras.push("Vampiric");
        if (tCounts['stat_spd'] >= 5) player.auras.push("Speedforce");

        if (player.companions) { 
            player.companions.forEach(c => { 
                if (c.type === "buff_hp") relicHp *= c.val; 
                if (c.type === "buff_gold") player.goldBonus *= c.val; 
            }); 
        }

        // Skill Tree Bonuses
        if (player.skillTree.includes("gold_gain")) player.goldBonus *= 1.1;
        if (player.skillTree.includes("xp_gain")) player.xpBonus *= 1.1;
        if (player.skillTree.includes("shield_start")) player.shield = (player.shield || 0) + 200;

        if (player.auras.includes("Solar Flare")) player.statusBonus += 0.5;

        player.talents.forEach(tid => {
            const tl = TALENTS.find(x => x.id === tid);
            if(tl.mult) { relicHp *= tl.mult[0]; relicDmg *= tl.mult[1]; relicSpd *= tl.mult[2]; }
            if(tl.goldMult) player.goldBonus += tl.goldMult;
            if(tl.xpMult) player.xpBonus += tl.xpMult;
            if(tl.statusPower) player.statusBonus += tl.statusPower;
            if(tl.ultSpeed) player.ultSpeedBonus *= tl.ultSpeed;
            if(tl.lifesteal) player.lifesteal += tl.lifesteal;
            if(tl.crit) player.critChance += tl.crit;
        });

        const p1 = player.prof1 ? player.prof1.stats : [1, 1, 1]; 
        const p2 = player.prof2 ? player.prof2.stats : [1, 1, 1];

        let runewordSpd = 1.0;
        if (player.auras.includes("Arctic Gale")) runewordSpd = 1.3;

        // Day/Night Damage Bonus
        let cycleDmg = 1.0;
        const currentCycle = t?.forcedCycle || player.cycle;
        if (currentCycle === "Day" && ["Light", "Fire", "Wind"].includes(player.type)) cycleDmg = 1.25;
        if (currentCycle === "Night" && ["Dark", "Water", "Earth"].includes(player.type)) cycleDmg = 1.25;

        // Weather Bonuses
        let weatherDmg = 1.0;
        if (battleState.weather === "Rain" && player.type === "Water") weatherDmg = 1.25;
        if (battleState.weather === "Snow" && player.element_name === "Ice") weatherDmg = 1.25;
        if (battleState.weather === "Sandstorm" && player.type === "Earth") weatherDmg = 1.25;

        // Artifact Set Bonuses
        let ultMult = 1.0;
        const rarityCounts = {};
        player.relics.forEach(r => rarityCounts[r.rarity] = (rarityCounts[r.rarity] || 0) + 1);
        if (Object.values(rarityCounts).some(count => count >= 3)) {
            ultMult = 2.0; // Artifact Set Bonus
        }
        player.ultDmgMult = ultMult;

        player.current_mults = [
            player.base_multipliers[0] * p1[0] * p2[0] * relicHp, 
            player.base_multipliers[1] * p1[1] * p2[1] * relicDmg * cycleDmg * weatherDmg, 
            player.base_multipliers[2] * p1[2] * p2[2] * relicSpd * runewordSpd
        ];
        let oldMax = player.max_hp; 
        player.max_hp = fixedHp !== null ? fixedHp : Math.max(1, Math.floor((player.base_hp + player.alloc_hp*10) * player.current_mults[0]));

        let comboMult = 1 + (player.combo * 0.05);
        if (comboMult > 5) comboMult = 5;
        player.dmg = Math.max(1, Math.floor((player.base_dmg + player.alloc_dmg*2) * player.current_mults[1] * comboMult));
        player.spd = Math.max(1, Math.floor((player.base_spd + player.alloc_spd*1) * player.current_mults[2]));

        if(!battleState.active) { player.hp = player.max_hp; player.combatDegradation = 0; }
        else if (player.max_hp > oldMax) player.hp += (player.max_hp - oldMax); 

        player.hp = Math.min(player.hp, player.max_hp);
        updateUI();
    }
function rollGacha() {
    if (battleState.active || (player.element_name !== "None" && player.xp < 100)) return;
    if (player.element_name !== "None") player.xp -= 100;
    player.base_multipliers = [1.0, 1.0, 1.0]; const rarity = getWeightedRandomRarity();
    const elementKeys = Object.keys(ELEMENTS_DATA[rarity]); const element = elementKeys[Math.floor(Math.random() * elementKeys.length)];
    const data = ELEMENTS_DATA[rarity][element]; player.element_name = element; player.rarity = rarity; player.attack_name = data.attack; player.color = data.color; player.type = data.type; player.effect = data.effect;
    player.base_multipliers[0] *= data.stats[0]; player.base_multipliers[1] *= data.stats[1]; player.base_multipliers[2] *= data.stats[2]; recalculateStats();
    battleState.pickingClass = true; document.getElementById("class-modal").style.display = "flex";
    const options = document.getElementById("class-options"); options.innerHTML = "";
    for(let i=0; i<3; i++) {
        let cr = getWeightedRandomRarity(); let classes = BASE_CLASSES[cr] || BASE_CLASSES["Common"];
        let cd = classes[Math.floor(Math.random() * classes.length)]; let genName = `${element} ${cd.archetype}`; let finalName = SPECIAL_CLASS_NAMES[genName] || genName;
        let btn = document.createElement("div"); btn.className = "class-card";
        btn.innerHTML = `<h3 class="rarity-${cr.toLowerCase()}">[${cr}]<br>${finalName}</h3><div class="desc">${cd.desc}</div><p>HP x${cd.stats[0]} | DMG x${cd.stats[1]} | SPD x${cd.stats[2]}</p>`;
        btn.onclick = () => selectClass(cr, cd, finalName); options.appendChild(btn);
    }
    showMessage(`Absorbed ${element}! Pick a class.`, data.color);
}

function selectClass(rarity, classData, finalName) {
    player.class_name = finalName; player.class_rarity = rarity; player.archetype = classData.archetype;
    player.base_multipliers[0] *= classData.stats[0]; player.base_multipliers[1] *= classData.stats[1]; player.base_multipliers[2] *= classData.stats[2];

    // Runeword System
    player.rollHistory.push(player.element_name);
    if (player.rollHistory.length > 3) player.rollHistory.shift();

    const history = player.rollHistory.join("-");
    if (history === "Fire-Fire-Fire") {
        if (!player.auras.includes("Solar Flare")) {
            player.auras.push("Solar Flare");
            showMessage("RUNEWORD UNLOCKED: Solar Flare (+50% Burn DMG)!", "#F44336");
        }
    } else if (history === "Water-Ice-Wind") {
        if (!player.auras.includes("Arctic Gale")) {
            player.auras.push("Arctic Gale");
            showMessage("RUNEWORD UNLOCKED: Arctic Gale (+30% SPD)!", "#00BCD4");
        }
    }

    recalculateStats(); document.getElementById("class-modal").style.display = "none"; battleState.pickingClass = false; updateUI();
    saveGame();
    showMessage(`Class chosen: ${finalName}`, player.color);
    if (battleState.auto) setTimeout(startBattle, 500);
}
function evolveClass() {
    if (player.level < 10 || player.gold < 1000 || battleState.active) return;
    const rarities = Object.keys(RARITY_WEIGHTS); const currentIdx = rarities.indexOf(player.class_rarity || "Common");
    if (currentIdx === rarities.length - 1) { showMessage("Class at max rarity!", "#ff3c3c"); return; }
    player.gold -= 1000; const nextRarity = rarities[currentIdx + 1]; const pool = BASE_CLASSES[nextRarity] || BASE_CLASSES["Common"]; const cd = pool[Math.floor(Math.random() * pool.length)];
    player.class_rarity = nextRarity; player.archetype = cd.archetype; let genName = `${player.element_name} ${cd.archetype}`; player.class_name = SPECIAL_CLASS_NAMES[genName] || genName;
    player.base_multipliers[0] *= cd.stats[0]; player.base_multipliers[1] *= cd.stats[1]; player.base_multipliers[2] *= cd.stats[2]; recalculateStats(); updateUI(); saveGame();
    showMessage(`Class Evolved to ${nextRarity} ${cd.archetype}!`, "#9c27b0");
}

function triggerCampfire() { document.getElementById("campfire-modal").style.display = "flex"; }
function restAtCamp() { player.hp = player.max_hp; document.getElementById("campfire-modal").style.display = "none"; showMessage("Fully Rested!", "#4caf50"); if (battleState.auto) setTimeout(startBattle, 1000); updateUI(); saveGame(); }
function forgeRelic() {
    const commonRelics = player.relics.filter(r => r.rarity === "Common");
    if (commonRelics.length > 0) { const r = commonRelics[0]; r.rarity = "Uncommon"; r.val *= 1.5; showMessage(`Forged ${r.name}!`, "#81c784"); }
    else { showMessage("No Common relics!", "#ff9800"); applyHealing(Math.floor(player.max_hp * 0.2)); }
    document.getElementById("campfire-modal").style.display = "none"; if (battleState.auto) setTimeout(startBattle, 1000); recalculateStats(); saveGame();
}
function sellRelic(idx) { const r = player.relics.splice(idx, 1)[0]; const gold = r.rarity === "Common" ? 50 : r.rarity === "Uncommon" ? 100 : 250; player.gold += gold; recalculateStats(); saveGame(); }

function startBattle() {
    if (player.element_name === "None" || battleState.active || battleState.pickingClass) return;

    // Mount: Ablative Shield
    player.shield = (player.shield || 0) + 100;

    // Weather System
    const weathers = ["Clear", "Rain", "Snow", "Sandstorm"];
    battleState.weather = weathers[Math.floor(Math.random() * weathers.length)];
    const arenaEl = document.getElementById("arena-wrapper");
    if (arenaEl) {
        arenaEl.classList.remove("weather-rain", "weather-snow", "weather-sandstorm");
        if (battleState.weather !== "Clear") arenaEl.classList.add(`weather-${battleState.weather.toLowerCase()}`);
    }
    logMessage(`WEATHER REPORT: It is currently ${battleState.weather}.`);

    // Bounty Board: Battle Objective
    battleState.bounty = { type: "Speedrun", goal: 10, reward: 1000, currentTurns: 0 };
    logMessage(`BOUNTY: Finish in ${battleState.bounty.goal} turns for ${battleState.bounty.reward} Gold!`);

    // Ghost Summoning
    ghost = null;
    if (playerHistory.length > 0 && Math.random() < 0.1) {
        const build = playerHistory[Math.floor(Math.random() * playerHistory.length)];
        ghost = { ...build, x: 20, y: canvas.height - 100, isGhost: true, visualHP: build.hp };
        logMessage(`LINEAGE GHOST: ${build.element_name} has returned to aid you!`);
    }

    const tarot = player.tarot ? TAROT_CARDS[player.tarot] : null;
    let isMirror = !battleState.isRift && Math.random() < 0.05;
    let isNemesis = !isMirror && !battleState.isRift && Math.random() < 0.05;

    battleState.isBoss = (player.streak % 5 === 4) || isMirror || isNemesis || battleState.isBoss; 
    let isHorde = !isMirror && !isNemesis && (player.streak % 10 === 9); 
    let isElite = !isMirror && !isNemesis && !battleState.isBoss && !isHorde && (Math.random() < 0.2 || tarot?.eliteForce);

    player.x = 60; player.y = canvas.height - 70; player.facingRight = true; player.status = []; enemies = [];
    const spawnCount = isHorde ? (3 + Math.floor(Math.random()*3)) : 1;

    for(let i=0; i<spawnCount; i++) {
        let e;
        if (isMirror) {
            e = { 
                name: "DARK MIRROR", 
                max_hp: player.max_hp, 
                hp: player.max_hp, 
                dmg: Math.floor(player.dmg * 0.8), 
                spd: player.spd, 
                color: "#000", 
                type: player.type, 
                effect: player.effect, 
                x: canvas.width - 150, 
                y: canvas.height - 90, 
                facingRight: false, 
                status: [], 
                isBoss: true, 
                isElite: false, 
                isMirror: true,
                ultimate: 0, 
                relics: [...player.relics] 
            };
        } else if (isNemesis) {
            e = {
                name: `NEMESIS: ${player.lastKiller || "Void Tank"}`,
                max_hp: player.max_hp * 2,
                hp: player.max_hp * 2,
                dmg: Math.floor(player.dmg * 1.5),
                spd: player.spd,
                color: "#f44336",
                type: "Dark",
                effect: "stun",
                x: canvas.width - 150,
                y: canvas.height - 90,
                facingRight: false,
                status: [],
                isBoss: true,
                isNemesis: true,
                ultimate: 0,
                relics: []
            };
        } else {
            let enemyRarity = getWeightedRandomRarity(); 
            let eKeys = Object.keys(ELEMENTS_DATA[enemyRarity]); 
            let eElement = eKeys[Math.floor(Math.random() * eKeys.length)]; 
            let eData = ELEMENTS_DATA[enemyRarity][eElement];

            let riftMult = battleState.isRift ? 3 : 1;
            let bossMult = battleState.isBoss ? 2 : (isElite ? 1.5 : (isHorde ? 0.5 : 1));

            e = { 
                name: battleState.isBoss ? `BOSS: ${eElement} Goliath` : (isElite ? `ELITE: ${eElement}` : (isHorde ? `Horde ${i+1}` : `${eElement} Tank`)), 
                max_hp: Math.floor(player.max_hp * (0.8 + Math.random()*0.4) * bossMult * riftMult), 
                hp: 0, 
                dmg: Math.floor(player.dmg * (0.6 + Math.random()*0.3) * (battleState.isBoss ? 1.2 : (isElite ? 1.1 : 1)) * (battleState.isRift ? 1.5 : 1)), 
                spd: Math.floor(player.spd * 0.9), 
                color: eData.color, 
                type: eData.type, 
                effect: eData.effect, 
                x: canvas.width - (battleState.isBoss ? 150 : (120 + i*40)), 
                y: canvas.height - (battleState.isBoss ? 90 : (70 + (i%2)*20)), 
                facingRight: false, 
                status: [], 
                isBoss: battleState.isBoss, 
                isElite: isElite, 
                isRift: battleState.isRift,
                ultimate: 0, 
                relics: [] 
            };

            if (battleState.isBoss || isElite || battleState.isRift) {
                const relicCount = battleState.isBoss ? 3 : (battleState.isRift ? 5 : 1);
                for(let r=0; r<relicCount; r++) {
                    let rRarity = getWeightedRandomRarity();
                    let pool = RELICS_DATA[rRarity];
                    e.relics.push({...pool[Math.floor(Math.random() * pool.length)], rarity: rRarity});
                }
            }
        }
        e.hp = e.max_hp; enemies.push(e);
    }

    enemy = enemies[0]; battleState.active = true; 
    updateUI(); 
    logMessage(`Encountered ${isMirror ? "YOURSELF!" : (isNemesis ? "YOUR NEMESIS!" : (enemies.length > 1 ? "a Horde!" : enemies[0].name))}!`);

    if (battleState.skip) { instantResolve(); return; }
    let startMsg = isMirror ? "VOID ANOMALY: MIRROR MATCH" : (isNemesis ? "VENGEANCE: NEMESIS SPAWNED" : (battleState.isRift ? "DIMENSIONAL RIFT DETECTED" : (battleState.isBoss ? `WARNING: BOSS APPROACHING!` : (isHorde ? "HORDE DETECTED!" : `Battle Start!`))));
    showMessage(startMsg, "#ff5252");
    setTimeout(() => executeTurn(player.spd >= enemies[0].spd ? player : enemies[0], player.spd >= enemies[0].spd ? enemies[0] : player), 1000 / battleState.speed);
}function instantResolve() {
    let loops = 0; let turn = 0;
    while(player.hp > 0 && enemies.some(e => e.hp > 0) && loops < 2000) {
        loops++; let a = turn === 0 ? player : enemies.find(e => e.hp > 0); let d = turn === 0 ? enemies.find(e => e.hp > 0) : player;
        if(!a || !d) break;
        let dodgeChance = Math.min(95, Math.floor((d.spd / (d.spd + 100)) * 100));
        if(Math.random()*100 >= dodgeChance) { let dmg = a.dmg; if(TYPE_CHART[a.type] === d.type) dmg *= 1.5; else if(TYPE_CHART[d.type] === a.type) dmg *= 0.5; d.hp -= Math.floor(dmg); }
        turn = turn === 0 ? 1 : 0;
    }
    endBattle(player.hp > 0);
}

function applyStatusEffects(tank) {
    if(!tank || tank.hp <= 0) return false;
    let skipTurn = false;
    const sBonus = tank === player ? (player.statusBonus || 1) : 1;

    // Cursed DOT Penalty
    if (tank === player && player.dotPenalty > 0) {
        let penaltyDmg = Math.max(1, Math.floor(player.max_hp * player.dotPenalty));
        player.hp -= penaltyDmg;
        floatingTexts.push({ x: player.x+20, y: player.y-30, text: `-${penaltyDmg} (CURSE)`, color: "#ff00ff", alpha: 1.0, vx: 0, vy: -1 });
    }

    for(let i = tank.status.length - 1; i >= 0; i--) {
        let s = tank.status[i];
        if(s.type === 'burn') { 
            let dmg = Math.max(1, Math.floor(tank.max_hp * 0.05 * sBonus)); 
            tank.hp -= dmg; 
            floatingTexts.push({ x: tank.x+20, y: tank.y-10, text: `-${dmg} (Burn)`, color: "#ff9800", alpha: 1.0, vx: 0, vy: -0.5 }); 
        }
        else if (s.type === 'stun') { 
            skipTurn = true; 
            floatingTexts.push({ x: tank.x+20, y: tank.y-10, text: `STUNNED!`, color: "#ffee58", alpha: 1.0, vx: 0, vy: -0.5 }); 
        }
        s.turns--; if(s.turns <= 0) tank.status.splice(i, 1);
    }
    
    if (tank === player && player.limitBreak >= 100 && battleState.auto) {
        triggerLimitBreak();
    }
    
    return skipTurn;
}

function executeTurn(attacker, defender) {
    if (!battleState.active || attacker.hp <= 0 || enemies.every(e => e.hp <= 0)) return;

    // Day/Night Progression
    player.turnCounter++;
    if (player.turnCounter % 5 === 0) {
        player.cycle = player.cycle === "Day" ? "Night" : "Day";
        logMessage(`The sky shifts... It is now ${player.cycle}.`);
        recalculateStats();
    }

    let skip = applyStatusEffects(attacker);
    if(attacker.hp <= 0) { endBattle(attacker !== player); return; }
    if(skip) { 
        let nextA = (attacker === player) ? (enemies.find(e => e.hp > 0)) : player; 
        let nextD = (nextA === player) ? (enemies.find(e => e.hp > 0)) : player;
        if (nextA && nextD) {
            setTimeout(() => executeTurn(nextA, nextD), 800 / battleState.speed); 
        } else if (enemies.every(e => e.hp <= 0)) {
            endBattle(true);
        }
        return; 
    }
    if (attacker !== player && attacker.isBoss && Math.random() < 0.2) {
        let skill = Math.random() < 0.5 ? "Vampiric Bite" : "Turtle Shell";
        if (skill === "Vampiric Bite") { let heal = Math.floor(attacker.max_hp * 0.15); attacker.hp = Math.min(attacker.max_hp, attacker.hp + heal); }
        else { attacker.hp = Math.min(attacker.max_hp, attacker.hp + Math.floor(attacker.max_hp * 0.2)); }
        setTimeout(() => executeTurn(player, attacker), 1000 / battleState.speed); return;
    }
    attacker.ultimate += 25 * (attacker === player ? (player.ultSpeedBonus || 1) : 1); 
    let isUlt = attacker.ultimate >= 100; if(isUlt) {
        attacker.ultimate = 0;
        if (attacker === player) {
            const prefix = player.rarity === "Omega" ? "Infinite" : (player.rarity === "Divine" ? "Celestial" : "Hyper");
            const ultName = `${prefix} ${player.attack_name} Burst`;
            logMessage(`ULTIMATE READY: Unleashing ${ultName}!`);
        }
    }
    if (attacker === player && player.companions) {
        player.companions.forEach(c => {
            c.turnCount++; if (c.freq > 0 && c.turnCount >= c.freq) {
                c.turnCount = 0; if (c.type === "heal") applyHealing(Math.floor(player.max_hp * c.val));
                else if (c.type === "attack") { const alive = enemies.filter(e => e.hp > 0); if (alive.length) { let t = alive[0]; t.hp -= Math.floor(player.dmg * c.val); } }
            }
        });
    }
    let target = defender; if (attacker === player) { const alive = enemies.filter(e => e.hp > 0); target = alive[0]; }
    if (!target) {
        if (attacker === player) endBattle(true);
        return;
    }

    // Base Attack
    projectiles.push({ x: attacker.x + 30, y: attacker.y, targetX: target.x + 30, targetY: target.y + 20, speed: (attacker.facingRight ? 15 : -15) * battleState.speed, color: attacker.color, dmg: attacker.dmg, attacker: attacker, defender: target, isUlt: isUlt });

    // Ghost Support Attack
    if (attacker === player && ghost) {
        setTimeout(() => {
            if (target.hp > 0) {
                projectiles.push({ x: ghost.x + 30, y: ghost.y, targetX: target.x + 30, targetY: target.y + 20, speed: 15 * battleState.speed, color: "rgba(255,255,255,0.5)", dmg: Math.floor(ghost.dmg * 0.5), attacker: player, defender: target, isUlt: false, isGhost: true });
            }
        }, 100 / battleState.speed);
    }

    // Echo Strike
    if (attacker === player && Math.random() * 100 < (player.echoChance || 0)) {
        setTimeout(() => {
            if (target.hp > 0) {
                logMessage("ECHO STRIKE!");
                projectiles.push({ x: attacker.x + 30, y: attacker.y, targetX: target.x + 30, targetY: target.y + 20, speed: (attacker.facingRight ? 15 : -15) * battleState.speed, color: attacker.color, dmg: Math.floor(attacker.dmg * 0.5), attacker: attacker, defender: target, isUlt: false, isEcho: true });
            }
        }, 200 / battleState.speed);
    }
}
function resolveHit(p) {
    const d = p.defender; const a = p.attacker;
    let dodge = Math.min(95, Math.floor((d.spd / (d.spd + 100)) * 100));

    if ((Math.random() * 100) < dodge && !p.isUlt) { 
        floatingTexts.push({ x: d.x, y: d.y, text: `DODGE!`, color: "#00e5ff", alpha: 1.0, vx: 0, vy: -2 }); 
        if (d === player) {
            // Player dodged, combo stays
        } else if (a === player) {
            player.combo = 0; // Miss resets combo
        }
    }
        else {
            let dmg = p.dmg; 
            if (TYPE_CHART[a.type] === d.type) dmg *= 1.5; 
            else if (TYPE_CHART[d.type] === a.type) dmg *= 0.5;
            
            // Elemental Chain Reactions
            if (a === player) {
                const targetStatus = d.status.map(s => s.type);
                if (targetStatus.includes('burn') && (player.type === 'Water' || player.element_name === 'Ice')) {
                    dmg *= 3;
                    d.status = d.status.filter(s => s.type !== 'burn');
                    logMessage("CHAIN REACTION: THERMAL SHOCK!");
                    floatingTexts.push({ x: d.x, y: d.y-40, text: `THERMAL SHOCK!`, color: "#00e5ff", alpha: 1.0, vx: 0, vy: -3 });
                }
                if (targetStatus.includes('slow') && (player.element_name === 'Spark' || player.element_name === 'Lightning')) {
                    logMessage("CHAIN REACTION: CONDUCTIVITY!");
                    enemies.forEach(e => { if (e.hp > 0) e.status.push({ type: 'stun', turns: 1 }); });
                }
            }

        let isCrit = false;
        if (a === player) {
            if (Math.random() * 100 < player.critChance) {
                isCrit = true;
                dmg *= player.critDmg;
            }
            player.combo++;
        } else if (d === player) {
            player.combo = 0; // Getting hit resets combo
        }

        if (p.isUlt) { dmg *= 3; cameraShake = 15; }

        if (a === player) { 
            player.maxHit = Math.max(player.maxHit || 0, dmg); 
            player.limitBreak = Math.min(100, (player.limitBreak || 0) + 5); // Increased LB gain

            // Enemy Adaptation (Bosses)
            if (d.isBoss) {
                d.resistances = d.relics || {};
                d.resistances[a.type] = (d.resistances[a.type] || 0) + 0.05;
                if (d.resistances[a.type] > 0.5) d.resistances[a.type] = 0.5;
                dmg *= (1 - d.resistances[a.type]);
            }

            // Bounty Tracking
            if (battleState.bounty) battleState.bounty.currentTurns++;
        }

        if (d === player && player.shield > 0) { 
            let abs = Math.min(player.shield, dmg); 
            player.shield -= abs; 
            dmg -= abs; 
        }

        let excessDmg = Math.max(0, dmg - d.hp);
        d.hp -= Math.floor(dmg); 
        spawnParticles(p.x, p.y, p.color, 20);

        // Corpse Explosion
        if (d.hp <= 0 && enemies.length > 1 && d !== player) {
            const explosionDmg = Math.floor(d.max_hp * 0.2);
            logMessage(`CORPSE EXPLOSION: ${d.name} detonates!`);
            enemies.forEach(e => {
                if (e !== d && e.hp > 0) {
                    e.hp -= explosionDmg;
                    floatingTexts.push({ x: e.x, y: e.y - 10, text: `-${formatNum(explosionDmg)} (BOOM)`, color: "#ff5722", alpha: 1.0, vx: (Math.random()-0.5)*4, vy: -5, gravity: 0.3 });
                }
            });
        }

        // Physics-based arcing text
        floatingTexts.push({ 
            x: d.x + 30, y: d.y, 
            text: `${isCrit ? 'CRIT! ' : ''}${formatNum(dmg)}`, 
            color: isCrit ? "#ffeb3b" : (p.isGhost ? "#40c4ff" : "#ff3c3c"), 
            alpha: 1.0, 
            vx: (Math.random() - 0.5) * 8, 
            vy: -8 - Math.random() * 5,
            gravity: 0.4,
            rotation: (Math.random() - 0.5) * 0.2,
            font: isCrit ? "bold 24px Courier" : "bold 16px Courier"
        });


        if (a === player) {
            let totalLifesteal = player.lifesteal || 0;
            if (player.auras.includes("Vampiric")) totalLifesteal += 0.05;
            
            if (totalLifesteal > 0) {
                const hVal = Math.floor(dmg * totalLifesteal);
                if (player.ascendedElements.includes("Water")) {
                    const oVal = (player.hp + hVal) - player.max_hp;
                    if (oVal > 0) {
                        player.base_hp += Math.floor(oVal * 0.01);
                        logMessage("ABYSSAL ASCENSION: Permanent Max HP increased!");
                    }
                }
                applyHealing(hVal);
            }

            // Karma System: Fleeing
            if (d !== player && d.hp > 0 && d.hp / d.max_hp < 0.15 && !d.isBoss && !battleState.fleeTriggered) {
                if (Math.random() < 0.3) {
                    battleState.active = false;
                    player.fleeingEnemy = d;
                    document.getElementById("karma-modal").style.display = "flex";
                    battleState.fleeTriggered = true;
                    logMessage(`${d.name} is pleading for mercy!`);
                    return; 
                }
            }

            if (excessDmg > 0 && enemies.some(e => e.hp > 0 && e !== d)) {
                let nextTarget = enemies.find(e => e.hp > 0 && e !== d);
                if (nextTarget) {
                    floatingTexts.push({ x: d.x, y: d.y-20, text: `OVERKILL!`, color: "#ff5722", alpha: 1.0, vx: 0, vy: -2 });
                    nextTarget.hp -= excessDmg;
                    floatingTexts.push({ x: nextTarget.x, y: nextTarget.y, text: `-${Math.floor(excessDmg)}`, color: "#ff5722", alpha: 1.0, vx: 0, vy: -4 });
                }
            }
        }
    }
    updateUI();
    if (player.hp <= 0) endBattle(false); else if (enemies.every(e => e.hp <= 0)) endBattle(true);
    else { 
        let nextA = (a === player) ? (enemies.find(e => e.hp > 0)) : player; 
        let nextD = (nextA === player) ? (enemies.find(e => e.hp > 0)) : player;
        if (nextA && nextD) {
            setTimeout(() => executeTurn(nextA, nextD), 800 / battleState.speed); 
        }
    }
function checkAchievements() {
    if (player.maxHit >= 1000000 && !player.achievements.includes("Millionaire")) {
        player.achievements.push("Millionaire");
        player.heroSouls += 100;
        showMessage("ACHIEVEMENT: MILLIONAIRE! (+100 Souls)", "#ffff00");
    }
    if (player.streak >= 50 && !player.achievements.includes("Survivor")) {
        player.achievements.push("Survivor");
        player.heroSouls += 500;
        showMessage("ACHIEVEMENT: SURVIVOR! (+500 Souls)", "#ffff00");
    }
}

function endBattle(playerWon) {
    battleState.active = false;
    player.combatDegradation = 0;
    battleState.fleeTriggered = false;

    // Bounty Payout
    if (playerWon && battleState.bounty) {
        if (battleState.bounty.currentTurns <= battleState.bounty.goal) {
            player.gold += battleState.bounty.reward;
            logMessage(`BOUNTY COMPLETE: Earned ${battleState.bounty.reward} Gold!`);
        }
    }
    checkAchievements();
        player.battleCount = (player.battleCount || 0) + 1;
        const maw = player.relics.find(r => r.parasitic);
        if (maw && player.battleCount % 5 === 0 && player.relics.length > 1) {
            const victims = player.relics.filter(r => !r.parasitic);
            const target = victims[Math.floor(Math.random() * victims.length)];
            player.relics = player.relics.filter(r => r !== target);
            maw.val *= 2;
            logMessage(`THE MAW: Consumed ${target.name}! Power now ${formatNum(maw.val)}x`);
        }
        if (battleState.isBoss) {
            checkMastery();
            // Monster Harvesting: Boss Organs
            const organType = ["hp", "dmg", "spd"][Math.floor(Math.random()*3)];
            const boost = organType === "hp" ? 10 : (organType === "dmg" ? 2 : 1);
            player[`base_${organType}`] += boost;
            showMessage(`HARVESTED: Boss Essence (+${boost} Permanent ${organType.toUpperCase()})!`, "#00e676");
        }
        let xp = Math.floor(75 * player.level * (player.xpBonus || 1)); 
        let gold = Math.floor(75 * player.level * (player.goldBonus || 1)); 
        let interest = Math.floor(player.gold * 0.10); 
        gold += interest;

        player.xp += xp; player.gold += gold; player.streak++;
        while (player.xp >= player.xp_to_next) { 
            player.xp -= player.xp_to_next; 
            player.level++; 
            player.xp_to_next *= 1.4; 
            player.free_points += (10 + (player.prof1?.pointsMod || 0) + (player.prof2?.pointsMod || 0)); 
        }

        // Rift Rewards
        if (battleState.isRift) {
            let pool = RELICS_DATA["Mythical"];
            let relicData = pool[Math.floor(Math.random() * pool.length)];
            player.relics.push({ ...relicData, rarity: "Mythical", level: 1 });
            showMessage("RIFT STABILIZED! Mythical Relic Found!", "#ff00ff");
            battleState.isRift = false;
        }

        if (dungeon.active && dungeon.currentNode < dungeon.nodes.length) {
            dungeon.nodes[dungeon.currentNode].completed = true;
            dungeon.currentNode++;
        }

        if (player.streak % 5 === 0) setTimeout(triggerCampfire, 1000);
        recalculateStats(); if (player.autoBuyRelics && player.gold >= 200) buyRelic(); 
        saveGame();

        if (battleState.auto && player.hp > 0 && player.streak % 5 !== 0) {
            if (dungeon.active && dungeon.currentNode < dungeon.nodes.length) {
                setTimeout(() => handleNode(dungeon.currentNode), 1200 / battleState.speed);
            } else {
                setTimeout(startBattle, 1200 / battleState.speed);
            }
        }
    } else {
        // Defeat
        const killer = enemies.find(e => e.hp > 0);
        if (killer) player.lastKiller = killer.name.replace("BOSS: ", "").replace("ELITE: ", "");

        // Save to History
        if (player.element_name !== "None") {
            playerHistory.push({ ...player, relics: [...player.relics], talents: [...player.talents] });
            if (playerHistory.length > 5) playerHistory.shift();
        }

        const tarot = player.tarot ? TAROT_CARDS[player.tarot] : null;
        let soulsEarned = 5 + (tarot?.soulsOnDeath || 0);
        player.heroSouls = (player.heroSouls || 0) + soulsEarned; 
        player.streak = 0; player.hp = player.max_hp; player.shield = 0;
        player.combo = 0;
        saveGame();
    }
    enemies = []; battleState.isRift = false; updateUI();
}``
function allocatePoint(stat) {
    if (player.free_points <= 0 || battleState.active) return;
    player[stat === 'hp' ? 'alloc_hp' : stat === 'dmg' ? 'alloc_dmg' : 'alloc_spd']++;
    player.free_points--; recalculateStats(); saveGame();
}

function buySkill(id) {
    const skill = SKILL_TREE.find(s => s.id === id);
    if (player.skillTree.includes(id)) return;
    if ((player.heroSouls || 0) >= skill.cost) {
        player.heroSouls -= skill.cost;
        player.skillTree.push(id);
        recalculateStats(); updateUI(); saveGame();
        showMessage(`UNLOCKED: ${skill.name}!`, "#ffeb3b");
    } else showMessage("Need more Hero Souls!", "#ff3c3c");
}

function useConsumable(idx) {
    const item = player.inventory[idx];
    if (!item || !battleState.active) return;

    if (item === "Time Rewind") {
        player.hp = player.max_hp;
        showMessage("TIME REWIND: Health Restored!", "#40c4ff");
        logMessage("CHRONO SHIFT: Undid all damage taken in this battle!");
    } else if (item === "Liquid Gold") {
        player.gold += 5000;
        showMessage("LIQUID GOLD: +5000 Gold!", "#ffd700");
    }

    player.inventory.splice(idx, 1);
    updateUI(); saveGame();
}

function lerp(a, b, t) { return a + (b - a) * t; }

function draw() {
    ctx.save(); if (cameraShake > 0) { ctx.translate((Math.random()-0.5)*cameraShake, (Math.random()-0.5)*cameraShake); cameraShake -= 0.5 * battleState.speed; }
    const biome = getBiome(); ctx.fillStyle = biome.sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = biome.ground; ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    if (!player.x) { player.x = 60; player.y = canvas.height - 70; }
    
    const tanks = [player, ...enemies];
    if (ghost) tanks.push(ghost);

    tanks.forEach(tank => {
        if (!tank || (tank.hp <= 0 && tank !== player && !tank.isGhost)) return;
        if (tank.visualHP === undefined) tank.visualHP = tank.hp; tank.visualHP = lerp(tank.visualHP, tank.hp, 0.1);
        
        ctx.globalAlpha = tank.isGhost ? 0.4 : 1.0;
        ctx.fillStyle = tank.color; ctx.fillRect(tank.x, tank.y, 60, 35);
        ctx.fillStyle = "red"; ctx.fillRect(tank.x, tank.y - 20, 60, 5);
        ctx.fillStyle = "green"; ctx.fillRect(tank.x, tank.y - 20, 60 * (tank.visualHP / tank.max_hp), 5);
        if (tank === player && player.shield > 0) { ctx.fillStyle = "#03a9f4"; ctx.fillRect(tank.x, tank.y - 25, 60 * (player.shield / player.max_hp), 3); }
        ctx.globalAlpha = 1.0;
    });
    player.companions?.forEach((c, i) => {
        const angle = Date.now() * 0.002 + i;
        ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(player.x + 30 + Math.cos(angle)*50, player.y - 20 + Math.sin(angle)*20, 5, 0, Math.PI*2); ctx.fill();
    });
    projectiles.forEach((p, i) => {
        p.x += p.speed; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fill();
        if (Math.abs(p.x - p.targetX) < 10) { resolveHit(p); projectiles.splice(i, 1); }
    });
    floatingTexts.forEach((ft, i) => {
        ft.x += ft.vx || 0; 
        ft.y += ft.vy || 0; 
        ft.vy += ft.gravity || 0.1; // Physics
        ft.alpha -= 0.01;
        
        ctx.save();
        ctx.globalAlpha = ft.alpha; 
        ctx.fillStyle = ft.color; 
        ctx.font = ft.font || "14px Arial";
        ctx.translate(ft.x, ft.y);
        if (ft.rotation) ctx.rotate(ft.rotation);
        ctx.fillText(ft.text, 0, 0);
        ctx.restore();
        
        if (ft.alpha <= 0 || ft.y > canvas.height) floatingTexts.splice(i, 1);
    });

    ctx.globalAlpha = 1.0; ctx.restore(); requestAnimationFrame(draw);
}

function updateUI() {
    document.getElementById("ui-level").innerText = player.level;
    document.getElementById("ui-xp").innerText = formatNum(player.xp);
    document.getElementById("ui-xp-next").innerText = formatNum(player.xp_to_next);
    document.getElementById("ui-gold").innerText = formatNum(player.gold);
    document.getElementById("ui-streak").innerText = player.streak;
    document.getElementById("ui-max-hit").innerText = formatNum(player.maxHit || 0);
    document.getElementById("ui-points").innerText = player.free_points;
    document.getElementById("ui-hp").innerText = `${formatNum(player.hp)}/${formatNum(player.max_hp)}`;
    document.getElementById("ui-dmg").innerText = formatNum(player.dmg);
    document.getElementById("ui-spd").innerText = formatNum(player.spd);
    document.getElementById("ui-hp-mult").innerText = `(x${player.current_mults[0].toFixed(2)})`;
    document.getElementById("ui-dmg-mult").innerText = `(x${player.current_mults[1].toFixed(2)})`;
    document.getElementById("ui-spd-mult").innerText = `(x${player.current_mults[2].toFixed(2)})`;
    document.getElementById("ui-souls").innerText = player.heroSouls || 0;
    document.getElementById("ui-perm-hp").innerText = `x${(player.permStats?.hp || 1).toFixed(2)}`;
    document.getElementById("ui-perm-dmg").innerText = `x${(player.permStats?.dmg || 1).toFixed(2)}`;
    document.getElementById("ui-perm-spd").innerText = `x${(player.permStats?.spd || 1).toFixed(2)}`;
    document.getElementById("limit-break-fill").style.width = `${player.limitBreak || 0}%`;

    // Tarot & Cycle
    let cycleInfo = `Cycle: ${player.cycle}`;
    const tData = player.tarot ? TAROT_CARDS[player.tarot] : null;
    if (tData) {
        cycleInfo = `[${player.tarot}] | ${tData.forcedCycle || player.cycle}`;
    }
    const overlay = document.getElementById("message-overlay");
    if (overlay && !battleState.active && !battleState.pickingClass) {
        overlay.innerHTML = `<span style="color:#ffeb3b">${cycleInfo}</span>`;
    }

    let comboString = "None";
    if (player.element_name !== "None") {
        const eClass = `rarity-${player.rarity.toLowerCase()}`;
        if (player.class_name !== "None") {
            const classRarity = player.class_rarity || player.rarity;
            const cClass = `rarity-${classRarity.toLowerCase()}`;
            comboString = `<span class="${cClass}">[${classRarity}]</span> <span class="${eClass}">${player.class_name}</span>`;
        } else {
            comboString = `<span class="${eClass}">[${player.rarity}] ${player.element_name}</span> (Picking...)`;
        }
        if (player.combo > 0) comboString += ` <span style="color:#00e676; font-size:12px;">(Combo x${player.combo})</span>`;
    }
    document.getElementById("ui-element").innerHTML = comboString;

    // Black Market Logic
    const marketBtn = document.getElementById("tab-btn-market");
    if (marketBtn) {
        const canSeeMarket = (player.hp / player.max_hp < 0.2) || (player.streak > 0 && player.streak % 5 === 0);
        marketBtn.style.display = canSeeMarket ? "block" : "none";

        const marketUI = document.getElementById("ui-black-market");
        if (marketUI) {
            marketUI.innerHTML = BLACK_MARKET_DATA.map((item, i) => `
                <div class="class-card" style="width: 100%;" onclick="buyBlackMarketItem(${i})">
                    <h3>${item.name}</h3>
                    <p>${item.desc}</p>
                    <button class="btn-upgrade" style="background:#ff00ff; width:100%;">SACRIFICE ${item.cost_hp} MAX HP</button>
                </div>
            `).join("");
        }
    }

    for (let i = 1; i <= 2; i++) {
        const profession = player[`prof${i}`];
        const label = document.getElementById(`ui-prof${i}`);
        const button = document.getElementById(`btn-roll-prof${i}`);

        if (profession) label.innerHTML = `<span class="rarity-${profession.rarity.toLowerCase()}">[${profession.rarity}] ${profession.name}</span>`;
        else label.innerText = "None";

        button.innerText = profession ? "Reroll (50 XP)" : "Roll (50 XP)";
        button.disabled = battleState.active || battleState.pickingClass || player.element_name === "None" || player.xp < 50;
    }

    const autoRelicBtn = document.getElementById("btn-auto-relic");
    if (autoRelicBtn) { autoRelicBtn.classList.toggle("active", player.autoBuyRelics); autoRelicBtn.innerText = `Auto-Buy Relics: ${player.autoBuyRelics ? "ON" : "OFF"}`; }

    const relicHTML = player.relics.map((r, i) => `
        <div class="relic-item" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="tooltip">
                <strong class="rarity-${r.rarity.toLowerCase()}">L${r.level || 1} ${r.name}</strong>
                <span class="tooltiptext">${r.desc}</span>
            </div>
            <div>
                <button class="btn-lvl" onclick="levelUpRelic(${i})">UP</button>
                <button onclick="sellRelic(${i})" style="background: #f44336; font-size: 9px; padding: 2px 5px;">X</button>
            </div>
        </div>
    `).join("");
    document.getElementById("ui-relic-text").innerHTML = relicHTML || "None";

    const rarities = Object.keys(RARITY_WEIGHTS);
    const currentIdx = rarities.indexOf(player.rarity);
    const cost = currentIdx >= 0 ? 1000 * Math.pow(4, currentIdx) : 0;
    const costDisp = document.getElementById("fusion-cost-display");
    if(costDisp) costDisp.innerText = currentIdx >= 0 ? `${cost} Gold` : "Roll First";
    const fusionSlot = document.getElementById("fusion-slot-1");
    if (fusionSlot) fusionSlot.innerHTML = player.element_name === "None" ? "Current Element" : `<span class="rarity-${player.rarity.toLowerCase()}">${player.element_name}</span>`;

    const hasFreePoints = player.free_points > 0 && !battleState.active && !battleState.pickingClass;
    document.getElementById("btn-up-hp").disabled = !hasFreePoints;
    document.getElementById("btn-up-dmg").disabled = !hasFreePoints;
    document.getElementById("btn-up-spd").disabled = !hasFreePoints;
    document.getElementById("btn-roll").disabled = battleState.active || battleState.pickingClass || (player.element_name !== "None" && player.xp < 100);
    document.getElementById("btn-battle").disabled = battleState.active || battleState.pickingClass || player.element_name === "None";
    document.getElementById("btn-scout").disabled = battleState.active;
    document.getElementById("btn-shop-heal").disabled = battleState.active || player.gold < 50 || player.hp >= player.max_hp;
    document.getElementById("btn-shop-relic").disabled = battleState.active || player.gold < 200;
    document.getElementById("btn-shop-pet").disabled = battleState.active || player.gold < 1000;
    document.getElementById("btn-fusion").disabled = battleState.active || battleState.pickingClass || player.element_name === "None" || currentIdx < 0 || player.gold < cost;
    document.getElementById("btn-evolve-class").disabled = battleState.active || battleState.pickingClass || player.element_name === "None" || player.level < 10 || player.gold < 1000;

    if (document.getElementById("btn-shop-dice")) document.getElementById("btn-shop-dice").disabled = battleState.active || player.gold < 500;
    if (document.getElementById("btn-shop-anvil")) document.getElementById("btn-shop-anvil").disabled = battleState.active || player.gold < 300 || player.relics.length === 0;
    if (document.getElementById("btn-ascend")) document.getElementById("btn-ascend").disabled = battleState.active || player.streak < 10;

    renderMap(); 
    renderTalents();

    // Skill Tree Rendering
    const skillUI = document.getElementById("ui-skill-tree");
    if (skillUI) {
        skillUI.innerHTML = SKILL_TREE.map(s => {
            const owned = player.skillTree.includes(s.id);
            return `
                <div class="talent-card ${owned ? 'owned' : ''}" onclick="buySkill('${s.id}')">
                    <strong>${s.name}</strong><br>
                    <span>${s.desc}</span><br>
                    <small>Cost: ${s.cost} Souls</small>
                </div>
            `;
        }).join("");
    }

    // Inventory Rendering
    const invUI = document.getElementById("ui-inventory");
    if (invUI) {
        invUI.innerHTML = player.inventory.map((item, i) => `
            <button class="btn-speed" onclick="useConsumable(${i})" style="font-size:10px; margin-bottom:5px;">${item}</button>
        `).join("");
    }
}function triggerScout() {
    if (battleState.active) return;
    const events = [
        { name: "Shrine", roll: () => { player.hp -= 20; player.relics.push({...RELICS_DATA["Epic"][0], rarity: "Epic", level: 1}); }},
        { name: "Gold", roll: () => { player.gold += 500; }},
        { name: "Ambush", roll: () => startBattle() }
    ];
    let e = events[Math.floor(Math.random() * events.length)];
    if(confirm(`Scout Event: ${e.name}. Proceed?`)) e.roll();
    updateUI(); saveGame();
}

draw();