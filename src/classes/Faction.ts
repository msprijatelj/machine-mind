import { EntryType, RegEntry, Registry, SimSer } from "@src/registry";

export interface IFactionData {
    id: string;
    name: string;
    description: string;
    logo: string;
    color: string;
    logo_url?: string;
}

export class Faction extends RegEntry<EntryType.FACTION, IFactionData> {
    ID!: string;
    Name!: string;
    Description!: string;
    Logo!: string;
    LogoURL!: string | null;
    Color!: string;

    public async load(data: IFactionData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this.Description = data.description;
        this.Logo = data.logo;
        this.LogoURL = data.logo_url || null;
        this.Color = data.color;
    }

    public async save(): Promise<IFactionData> {
        return {
            id: this.ID,
            name: this.Name,
            description: this.Description,
            logo: this.Logo,
            color: this.Color,
            logo_url: undefined,
        };
    }

    public static async unpack(dep: IFactionData, reg: Registry): Promise<Faction> {
        return reg.get_cat(EntryType.FACTION).create(dep);
    }
}
