import {
    RegCoreSystemData,
    RegDeployableData,
    RegFrameData,
    RegFrameTraitData,
    RegLicenseData,
    RegMechData,
    RegMechSystemData,
    RegMechWeaponData,
    RegPilotArmorData,
    RegPilotData,
    RegPilotGearData,
    RegPilotWeaponData,
    RegWeaponModData,
} from "@src/interface";
import { nanoid } from "nanoid";
import {
    ActivationType,
    CC_VERSION,
    DamageType,
    FrameEffectUse,
    RangeType,
    ReserveType,
    SystemType,
    WeaponSize,
    WeaponType,
} from "./enums";
import { RegReserveData } from './pilot/reserves/Reserve';

export function CORE_SYSTEM(): RegCoreSystemData {
    return {
        name: "New Core Active",
        description: "",
        use: FrameEffectUse.Unknown,

        activation: ActivationType.Quick,
        active_name: "Core Active",
        active_effect: "effect",
        active_actions: [],
        active_bonuses: [],
        active_synergies: [],
        deactivation: ActivationType.None,

        counters: [],
        deployables: [],
        integrated: [],
        passive_actions: [],
        passive_effect: "effect",
        passive_name: "Core Passive",
        passive_bonuses: [],
        passive_synergies: [],
        tags: [],
    };
}

export function DEPLOYABLE(): RegDeployableData {
    return {
        actions: [],
        bonuses: [],
        counters: [],
        synergies: [],
        tags: [],
        activation: ActivationType.None,
        armor: 0,
        cost: 1,
        current_hp: 0,
        deactivation: ActivationType.None,
        detail: "",
        edef: 0,
        evasion: 0,
        heatcap: 0,
        max_hp: 0,
        name: "New Deployable",
        overshield: 0,
        recall: ActivationType.None,
        redeploy: ActivationType.None,
        repcap: 0,
        save: 0,
        sensor_range: 0,
        size: 0,
        speed: 0,
        tech_attack: 0,
        type: "",
    };
}

export function FRAME_TRAIT(): RegFrameTraitData {
    return {
        actions: [],
        bonuses: [],
        counters: [],
        synergies: [],
        // tags: [],
        deployables: [],
        integrated: [],
        description: "",
        name: "New Fraame Trait",
        use: FrameEffectUse.Unknown,
    };
}

export function FRAME(): RegFrameData {
    return {
        description: "",
        id: nanoid(),
        license_level: 2,
        mechtype: ["BALANCED"],
        mounts: [],
        name: "New Mech",
        source: null,
        stats: {
            armor: 0,
            edef: 8,
            evasion: 8,
            heatcap: 5,
            hp: 8,
            repcap: 5,
            save: 10,
            sensor_range: 10,
            size: 1,
            sp: 5,
            speed: 5,
            stress: 4,
            structure: 4,
            tech_attack: 0,
        },
        traits: [],
        y_pos: 0,
        core_system: null,
        image_url: "",
        other_art: [],
    };
}

export function LICENSE(): RegLicenseData {
    return {
        manufacturer: null,
        name: "New License",
        rank: 0,
        unlocks: [],
    };
}

export function MECH(): RegMechData {
    return {
        activations: 1,
        burn: 0,
        cc_ver: CC_VERSION,
        cloud_portrait: "",
        core_active: false,
        current_core_energy: 1,
        current_heat: 0,
        current_hp: 0,
        current_overcharge: 0,
        current_repairs: 0,
        current_stress: 0,
        current_structure: 0,
        ejected: false,
        gm_note: "",
        id: nanoid(),
        loadout: {
            frame: null,
            system_mounts: [],
            weapon_mounts: [],
        },
        meltdown_imminent: false,
        name: "New Mech",
        notes: "",
        overshield: 0,
        pilot: null,
        portrait: "",
        reactions: [],
        resistances: [],
        statuses_and_conditions: [],
    };
}

export function MECH_WEAPON(): RegMechWeaponData {
    return {
        cascading: false,
        deployables: [],
        destroyed: false,
        id: nanoid(),
        integrated: [],
        license: "",
        license_level: 0,
        name: "New Mech Weapon",
        source: null,
        sp: 0,
        profiles: [
            {
                actions: [],
                bonuses: [],
                synergies: [],
                description: "",
                type: WeaponType.Rifle,
                counters: [],
                damage: [{ type: DamageType.Kinetic, val: "1d6" }],
                effect: "Shoots enemies",
                name: "Default Profile",
                on_attack: "",
                on_crit: "",
                on_hit: "",
                range: [{ type: RangeType.Range, val: 8 }],
                tags: [],
            },
        ],
        loaded: false,
        selected_profile: 0,
        size: WeaponSize.Main,
    };
}

export function MECH_SYSTEM(): RegMechSystemData {
    return {
        cascading: false,
        counters: [],
        deployables: [],
        destroyed: false,
        effect: "",
        id: nanoid(),
        integrated: [],
        license: "",
        license_level: 0,
        name: "New Mech System",
        source: null,
        tags: [],
        sp: 0,
        uses: 0,
        actions: [],
        bonuses: [],
        synergies: [],
        description: "",
        type: SystemType.System,
    };
}

export function PILOT_GEAR(): RegPilotGearData {
    return {
        actions: [],
        bonuses: [],
        deployables: [],
        description: "",
        id: nanoid(),
        name: "New Gear",
        synergies: [],
        tags: [],
    };
}

export function PILOT_ARMOR(): RegPilotArmorData {
    // Provides the basic bonus stat info
    return {
        ...PILOT_GEAR(),
        name: "New Armor",
        bonuses: [
            {
                id: "pilot_hp",
                val: 3,
            },
            {
                id: "pilot_evasion",
                val: 8,
            },
            {
                id: "pilot_edef",
                val: 8,
            },
            {
                id: "pilot_speed",
                val: 4,
            },
            {
                id: "pilot_armor",
                val: 1,
            },
        ],
    };
}

export function PILOT_WEAPON(): RegPilotWeaponData {
    // Provides the basic bonus stat info
    return {
        ...PILOT_GEAR(),
        name: "New Pilot Weapon",
        range: [
            {
                type: RangeType.Range,
                val: 5,
            },
        ],
        damage: [
            {
                type: DamageType.Kinetic,
                val: "1d3",
            },
        ],
        effect: "",
    };
}

export function PILOT(): RegPilotData {
    return {
        name: "New Pilot",
        active_mech: null,
        background: "",
        callsign: "",
        campaign: "",
        cc_ver: CC_VERSION,
        cloudID: "",
        cloudOwnerID: "",
        cloud_portrait: "",
        core_bonuses: [],
        current_hp: 0,
        custom_counters: [],
        faction: null,
        group: "",
        history: "",
        id: nanoid(),
        lastCloudUpdate: "",
        level: 0,
        loadout: {
            id: nanoid(),
            name: "Foundry Loadout",
            armor: [null],
            gear: [null, null, null],
            weapons: [null, null],
            extendedGear: [null, null],
            extendedWeapons: [null],
        },
        mechSkills: [0, 0, 0, 0],
        mechs: [],
        mounted: false,
        notes: "",
        organizations: [],
        owned_armor: [],
        owned_gear: [],
        owned_weapons: [],
        player_name: "",
        portrait: "",
        quirk: null,
        skills: [],
        sort_index: 0,
        status: "",
        talents: [],
        text_appearance: "",
    };
}

export function RESERVE(): RegReserveData {
    return {
        name: "New Reserve",
        consumable: true,
        counters: [],
        integrated: [],
        label: "",
        resource_name: "",
        resource_note: "",
        resource_cost: "",
        type: ReserveType.Resources,
        used: false,
        actions: [],
        bonuses: [],
        deployables: [],
        description: "",
        id: nanoid(),
        synergies: [],
    }

}

export function WEAPON_MOD(): RegWeaponModData {
    return {
        added_damage: [],
        added_tags: [],
        cascading: false,
        counters: [],
        deployables: [],
        destroyed: false,
        effect: "",
        id: nanoid(),
        integrated: [],
        license: "",
        license_level: 0,
        loaded: true,
        name: "New Weapon Mod",
        source: null,
        tags: [],
        sp: 0,
        uses: 0,
        allowed_sizes: [],
        allowed_types: [],
        actions: [],
        added_range: [],
        bonuses: [],
        synergies: [],
    };
}
