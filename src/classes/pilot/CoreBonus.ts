import { Synergy, Bonus, Action, Counter, Deployable } from "@/class";

import {
    IActionData,
    ISynergyData,
    PackedDeployableData,
    PackedCounterData,
    IBonusData,
} from "@/interface";
import { EntryType, RegEntry, Registry, RegRef, RegSer, SerUtil } from "@/registry";
import { RegCounterData } from "../Counter";

// These attrs are shared
interface AllCoreBonusData {
    id: string;
    name: string;
    source: string; // must be the same as the Manufacturer ID to sort correctly
    effect: string; // v-html
    description: string; // v-html
    mounted_effect?: string;
    actions?: IActionData[];
    bonuses?: IBonusData[];
    synergies?: ISynergyData[];
}
export interface PackedCoreBonusData extends AllCoreBonusData {
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
}

export interface RegCoreBonusData extends Required<AllCoreBonusData> {
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
}

export class CoreBonus extends RegEntry<EntryType.CORE_BONUS, RegCoreBonusData> {
    // Basic data
    ID!: string;
    Name!: string;
    Source!: string; // No licensing info is needed other than manufacturer
    Description!: string;
    Effect!: string;
    MountedEffect!: string;

    // Common subfields
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any, any>[];

    protected async load(data: RegCoreBonusData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this.Source = data.source;
        this.Description = data.description;
        this.Effect = data.effect;
        this.MountedEffect = data.mounted_effect;
        this.Actions = SerUtil.process_actions(data.actions);
        this.Bonuses = SerUtil.process_bonuses(data.bonuses);
        this.Synergies = SerUtil.process_synergies(data.synergies);
        this.Deployables = await this.Registry.resolve_many(data.deployables);
        this.Counters = SerUtil.process_counters(data.counters);
        this.Integrated = await this.Registry.resolve_many(data.integrated);
    }
    public async save(): Promise<RegCoreBonusData> {
        return {
            description: this.Description,
            effect: this.Effect,
            id: this.ID,
            name: this.Name,
            source: this.Source,
            actions: SerUtil.sync_save_all(this.Actions),
            bonuses: SerUtil.sync_save_all(this.Bonuses),
            counters: SerUtil.sync_save_all(this.Counters),
            deployables: SerUtil.ref_all(this.Deployables),
            integrated: SerUtil.ref_all(this.Integrated),
            mounted_effect: this.MountedEffect,
            synergies: SerUtil.sync_save_all(this.Synergies)
        };
    }

    // Initializes self and all subsidiary items. DO NOT REPEATEDLY CALL LEST YE GET TONS OF DUPS
    static async unpack(cor: PackedCoreBonusData, reg: Registry): Promise<CoreBonus> {
        // Create deployable entries
        let dep_entries = await SerUtil.unpack_children(Deployable.unpack, reg, cor.deployables);
        let deployables = SerUtil.ref_all(dep_entries);

        // Get integrated refs
        let integrated = SerUtil.parse_integrated(cor.integrated || []);

        // Get the counters
        let counters = SerUtil.unpack_counters_default(cor.counters);
        let cbdata: RegCoreBonusData = {
            ...cor,
            integrated,
            deployables,
            counters,
            mounted_effect: cor.mounted_effect ?? "",
            actions: cor.actions ?? [],
            bonuses: cor.bonuses ?? [],
            synergies: cor.synergies ?? []
        };
        return reg.create(EntryType.CORE_BONUS, cbdata);
    }
}
