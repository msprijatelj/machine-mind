import JSZip, { JSZipObject } from "jszip";
import * as lancerData from "@src/classes/utility/typed_lancerdata";
import {
    IContentPackManifest,
    IContentPack,
    PackedFactionData,
    PackedCoreBonusData,
    PackedFrameData,
    PackedMechWeaponData,
    PackedMechSystemData,
    PackedWeaponModData,
    PackedPilotEquipmentData,
    PackedTalentData,
    PackedManufacturerData,
    PackedNpcTemplateData,
    PackedNpcClassData,
    AnyPackedNpcFeatureData,
    PackedTagTemplateData,
} from "@src/interface";
import { CORE_BREW_ID } from "@src/consts";

const isValidManifest = function(obj: any): obj is IContentPackManifest {
    return (
        "name" in obj &&
        typeof obj.name === "string" &&
        "author" in obj &&
        typeof obj.author === "string" &&
        "version" in obj &&
        typeof obj.version === "string"
    );
};

const readZipJSON = async function<T>(zip: JSZip, filename: string): Promise<T | null> {
    const file: JSZipObject | null = zip.file(filename);
    if (!file) return null;
    const text = await file.async("text");
    return JSON.parse(text);
};

const getPackID = async function(manifest: IContentPackManifest): Promise<string> {
    return `${manifest.author}/${manifest.name}`;
};

async function getZipData<T>(zip: JSZip, filename: string): Promise<T[]> {
    let readResult: T[] | null;
    try {
        readResult = await readZipJSON<T[]>(zip, filename);
    } catch (e) {
        console.error(`Error reading file ${filename} from package, skipping. Error follows:`);
        console.trace(e);
        readResult = null;
    }
    return readResult || [];
}

export async function parseContentPack(binString: Buffer | string): Promise<IContentPack> {
    const zip = await JSZip.loadAsync(binString);

    const manifest = await readZipJSON<IContentPackManifest>(zip, "lcp_manifest.json");
    if (!manifest) throw new Error("Content pack has no manifest");
    if (!isValidManifest(manifest)) throw new Error("Content manifest is invalid");

    const generateItemID = (type: string, name: string): string => {
        const sanitizedName = name
            .replace(/[ \/-]/g, "_")
            .replace(/[^A-Za-z0-9_]/g, "")
            .toLowerCase();
        if (manifest.item_prefix) {
            // return `${manifest.item_prefix}__${type}_${sanitizedName}`;
            // return `${manifest.item_prefix}__${sanitizedName}`;
        }
        return sanitizedName;
        // return `${type}_${sanitizedName}`;
    };

    function generateIDs<T extends { id: string, name: string }>(data: T[], dataPrefix?: string): T[] {
        if (dataPrefix) {
            for (let d of data) {
                d.id = d.id || generateItemID(dataPrefix, d.name);
            }
        }
        return data;
    }

    const manufacturers = await getZipData<PackedManufacturerData>(zip, "manufacturers.json");
    const factions = await getZipData<PackedFactionData>(zip, "factions.json");
    const coreBonuses = generateIDs(
        await getZipData<PackedCoreBonusData>(zip, "core_bonuses.json"),
        "cb"
    );
    const frames = generateIDs(await getZipData<PackedFrameData>(zip, "frames.json"), "mf");
    const weapons = generateIDs(await getZipData<PackedMechWeaponData>(zip, "weapons.json"), "mw");
    const systems = generateIDs(await getZipData<PackedMechSystemData>(zip, "systems.json"), "ms");
    const mods = generateIDs(await getZipData<PackedWeaponModData>(zip, "mods.json"), "wm");
    const pilotGear = generateIDs(
        await getZipData<PackedPilotEquipmentData>(zip, "pilot_gear.json"),
        "pg"
    );
    const talents = generateIDs(await getZipData<PackedTalentData>(zip, "talents.json"), "t");
    const tags = generateIDs(await getZipData<PackedTagTemplateData>(zip, "tags.json"), "tg");

    const npcClasses = (await readZipJSON<PackedNpcClassData[]>(zip, "npc_classes.json")) || [];
    const npcFeatures =
        (await readZipJSON<AnyPackedNpcFeatureData[]>(zip, "npc_features.json")) || [];
    const npcTemplates =
        (await readZipJSON<PackedNpcTemplateData[]>(zip, "npc_templates.json")) || [];

    const id = await getPackID(manifest);

    return {
        id,
        active: false,
        manifest,
        data: {
            manufacturers,
            factions,
            coreBonuses,
            frames,
            weapons,
            systems,
            mods,
            pilotGear,
            talents,
            tags,
            npcClasses,
            npcFeatures,
            npcTemplates,
        },
    };
}

// So we don't have to treat it separately
export function get_base_content_pack(): IContentPack {
    // lancerData.
    return {
        active: true,
        id: CORE_BREW_ID,
        manifest: {
            author: "Massif-Press",
            item_prefix: "", // Don't want one
            name: "Lancer Core Book Data",
            version: "1.X",
        },
        data: {
            coreBonuses: lancerData.core_bonuses,
            factions: lancerData.factions,
            frames: lancerData.frames.filter(m => m.id != "missing_frame"), // yeet the unresolved frame
            manufacturers: lancerData.manufacturers,
            mods: lancerData.mods,
            npcClasses: lancerData.npc_classes,
            npcFeatures: lancerData.npc_features,
            npcTemplates: lancerData.npc_templates,
            pilotGear: lancerData.pilot_gear,
            systems: lancerData.systems,
            tags: lancerData.tags,
            talents: lancerData.talents,
            weapons: lancerData.weapons,

            quirks: lancerData.quirks,
            environments: lancerData.environments,
            reserves: lancerData.reserves,
            sitreps: lancerData.sitreps,
            skills: lancerData.skills,
            statuses: lancerData.statuses,
        },
    };
}
