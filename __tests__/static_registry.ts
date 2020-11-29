// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx } from "../src/registry";
import { Counter, Frame, MechSystem, MechWeapon } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import { DEFAULT_PILOT } from "../src/classes/default_entries";
import { validate_props } from "../src/classes/key_util";

type DefSetup = {
    reg: StaticReg;
    env: RegEnv;
}

async function init_basic_setup(include_base: boolean = true): Promise<DefSetup> {
    let env = new RegEnv();
    let reg = new StaticReg(env);

    if(include_base) {
        let bcp = get_base_content_pack();
        await intake_pack(bcp, reg);
    }

    return {env, reg};
}

describe("Static Registry Reference implementation", () => {
    it("Initializes at all", () => {
        expect(init_basic_setup).toReturn;
    });

    it("Can retrieve all categories", async () => {
        let s = await init_basic_setup(false);
        for(let et of Object.values(EntryType)) {
            expect(s.reg.get_cat(et as EntryType)).toBeDefined();
        }
    });

    it("Can manipulate a very simple item", async () => {
        expect.assertions(15);
        let s = await init_basic_setup(false);
        let c = s.reg.get_cat(EntryType.MANUFACTURER);
        let ctx = new OpCtx();


        let man = await c.create_live(ctx, {
            id: "bmw",
            name: "Big Mech Weapons",
            dark: "black",
            light: "white",
            logo: "",
            quote: "My strongest weapons are too expensive for you, traveller.",
            description: "big gunz"
        });

        expect(man).toBeTruthy();

        // Make sure it has flags
        expect(man.flags?.test).toEqual("itworks");

        // Try retreiving raw 
        let raw = await c.get_raw(man.RegistryID);
        expect(raw).toBeTruthy();
        expect(raw!.id).toEqual("bmw");

        // Try retrieving by mmid
        expect(await c.lookup_mmid(ctx, "bmw")).toBeTruthy();
        expect(await c.lookup_mmid(ctx, "zoop")).toBeNull(); // 5

        // Check listing of both types
        expect((await c.list_raw()).length).toEqual(1);
        expect((await c.list_live(ctx)).length).toEqual(1);

        // Try modifying and saving
        man.ID = "smz";
        man.Description = "small gunz";
        await man.writeback();

        // Make sure writeback didn't break things in the live copy somehow.
        expect(man.ID).toEqual("smz");

        // Check listing of both types again
        expect((await c.list_raw()).length).toEqual(1);
        expect((await c.list_live(ctx)).length).toEqual(1); // 10

        // Check raw matches expected updated value
        raw = await c.get_raw(man.RegistryID);
        expect(raw).toBeTruthy();
        expect(raw!.id).toEqual("smz");
        expect(raw!.description).toEqual("small gunz");

        // Delete it, make sure it is gone
        await man.destroy_entry();
        expect((await c.list_raw()).length).toEqual(0); // 14
    });

    it("Initializes if given content packs", async () => {
        expect.assertions(2);
        let env = await init_basic_setup();
        expect(env).toBeTruthy();

        // Should have items in every category. just check frames
        expect((await env.reg.get_cat(EntryType.FRAME).list_raw()).length).toEqual(4*7 + 1); // 7 by each manufacturer, 1 gms
    });

    it("Gets basic frame information right", async () => {
        expect.assertions(10);
        let env = await init_basic_setup();
        let ctx = new OpCtx();

        let ever: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_standard_pattern_i_everest")
        expect(ever).toBeTruthy();
        expect(ever.Name).toEqual("EVEREST")

        // Trivial
        expect(ever.Stats.armor).toEqual(0);
        expect(ever.Stats.sensor_range).toEqual(10); // that's enough I think

        // Traits are "items" in our system, so this is slightly more complex
        expect(ever.Traits[0].Name).toEqual("Initiative"); // 5
        expect(ever.Traits[1].Name).toEqual("Replaceable parts");
        expect(ever.Traits[1].Bonuses[0].Title).toEqual("Half Cost for Structure Repairs");

        // Check a lancaster - should have an integrated
        let lanny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_lancaster")
        expect(lanny.CoreSystem).toBeTruthy();
        expect(lanny.CoreSystem.Integrated.length).toEqual(1);
        expect(lanny.CoreSystem.Integrated[0]).toBeInstanceOf(MechWeapon); // 10
    });

    it("Can create inventories things", async () => {
        expect.assertions(7);
        let env = await init_basic_setup();

        // make a pilot
        let ctx = new OpCtx();
        let pilots = env.reg.get_cat(EntryType.PILOT);
        let steve = await pilots.create_default(ctx);
        steve.Name = "Steve";
        let steve_inv = steve.get_inventory()

        // Inventory should be unique
        expect(steve_inv == env.reg).toBeFalsy();

        // Make an armor (in the global scope!)
        let armors = env.reg.get_cat(EntryType.PILOT_ARMOR);
        let global_armor = await armors.create_default(ctx);
        global_armor.Name = "Steve's global armor";
        await global_armor.writeback();

        // Insinuate the armor into steve's personal inventory
        let personal_armor = await global_armor.insinuate(steve_inv);

        // Moving reg's should've changed registry ids, barring hilariously bad luck
        expect(personal_armor.RegistryID == global_armor.RegistryID).toBeFalsy();
        expect(personal_armor.Registry == global_armor.Registry).toBeFalsy();
        expect(personal_armor.Registry == env.reg).toBeFalsy();
        expect(global_armor.Registry == steve.get_inventory()).toBeFalsy(); // 5

        // Change its name
        personal_armor.Name = "Steve's personal armor";
        await personal_armor.writeback();

        // Let's check our raws, to be sure what we wanted to change changed
        let old_raw = await env.reg.get_cat(EntryType.PILOT_ARMOR).get_raw(global_armor.RegistryID);
        let new_raw = await steve_inv.get_cat(EntryType.PILOT_ARMOR).get_raw(personal_armor.RegistryID); 
        expect(old_raw.name).toEqual("Steve's global armor"); 
        expect(new_raw.name).toEqual("Steve's personal armor"); // 7
        // Wowie zowie!
    });

    it("Properly re-finds the same live item", async () => {
        expect.assertions(7);
        let env = await init_basic_setup();

        // Oops! All lannies
        let ctx = new OpCtx();

        // Regardless of id resolution method we expect these to be the same
        let lanny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_lancaster");
        lanny.flags = "alpha"; // for later test
        let lenny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_lancaster"); // Double identical lookup via mmid
        expect(lanny === lenny).toBeTruthy();
        let larry: Frame = await env.reg.get_cat(EntryType.FRAME).get_live(ctx, lanny.RegistryID); // Repeat lookup by reg iD
        expect(lanny === larry).toBeTruthy();
        let harry: Frame = await env.reg.resolve_wildcard_mmid(ctx, "mf_lancaster");
        harry.flags = "beta"; // for later test
        expect(lanny === harry).toBeTruthy();
        let terry: Frame = await env.reg.resolve(ctx, lanny.as_ref());
        expect(lanny === terry).toBeTruthy();

        // Do they all have the same flags? They should, and it should reflect our modification to harry
        expect(lanny.flags == lenny.flags && lanny.flags == larry.flags && lanny.flags == harry.flags && lanny.flags == terry.flags).toBeTruthy();
        expect(lanny.flags).toEqual("beta");

        // Does changing the ctx break it? (it should)
        let ctx_2 = new OpCtx();
        let gary: Frame = await env.reg.get_cat(EntryType.FRAME).get_live(ctx_2, lanny.RegistryID);
        expect(gary === lanny).toBeFalsy();
    });

    it("Can handle some more peculiar insinuation/ctx cases", async () => {
        expect.assertions(5);
        let full_env = await init_basic_setup();
        let empty_env = await init_basic_setup(false);

        // Insinuate the lancaster from the full to the empty, using a refresh to ensure things remain cool
        let ctx = new OpCtx();
        let moved_ctx = new OpCtx();
        let lanny: Frame = await full_env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_lancaster")
        lanny.flags = "alpha";
        let moved_lanny = await lanny.insinuate(empty_env.reg, moved_ctx);
        
        // Modified shouldn't have carried over
        expect(moved_lanny.flags).not.toEqual("alpha");

        // Should share nothing in common
        expect(lanny === moved_lanny).toBeFalsy(); // 2
        expect(ctx === moved_ctx).toBeFalsy(); 
        expect(lanny.Registry === moved_lanny.Registry).toBeFalsy(); 
        expect(lanny.RegistryID === moved_lanny.RegistryID).toBeFalsy(); // 5
    });

    it("Properly transfers inventory items while insinuating", async () => {
        expect.assertions(8);
        let source_env = await init_basic_setup(false);
        let dest_env = await init_basic_setup(false);

        // Create the pilot and give them a basic gun and some armor
        let ctx = new OpCtx();
        let source_pilot = await source_env.reg.create_live(EntryType.PILOT, ctx);

        // The gun, we build directly in the source pilot reg
        let source_gun = await source_pilot.get_inventory().create_live(EntryType.PILOT_WEAPON, ctx);
        // The armor, we make then insinuate
        let source_world_armor = await source_env.reg.create_live(EntryType.PILOT_ARMOR, ctx);
        let source_pilot_armor = await source_world_armor.insinuate(source_pilot.get_inventory());

        // Sanity check. Pilot should have one of each type. World should only have the single armor
        let check_ctx = new OpCtx();
        let source_pilot_check = await source_pilot.refreshed(check_ctx);
        expect(source_pilot_check.OwnedWeapons.length).toEqual(1);
        expect(source_pilot_check.OwnedArmor.length).toEqual(1);
        expect((await source_env.reg.get_cat(EntryType.PILOT_ARMOR).list_live(check_ctx)).length).toEqual(1);
        expect((await source_env.reg.get_cat(EntryType.PILOT_WEAPON).list_live(check_ctx)).length).toEqual(0); // 4

        // Ok here we go - do the transfer. Can just re-use source pilot - though it won't have the items visible in its fields, they have been stored in its reg
        let dest_pilot = await source_pilot.insinuate(dest_env.reg);

        // Did it bring its items?
        expect(source_pilot_check.OwnedWeapons.length).toEqual(1);
        expect(source_pilot_check.OwnedArmor.length).toEqual(1);

        // Dest reg should also not have any items in global space
        expect((await dest_env.reg.get_cat(EntryType.PILOT_ARMOR).list_live(check_ctx)).length).toEqual(0);
        expect((await dest_env.reg.get_cat(EntryType.PILOT_WEAPON).list_live(check_ctx)).length).toEqual(0); // 8
    });

    it("Can handle circular loops", async () => {
        let env = await init_basic_setup();

        let ctx = new OpCtx();
        // Make our pilot and mech
        let pilot = await env.reg.create_live(EntryType.PILOT, ctx);
        let mech = await env.reg.create_live(EntryType.MECH, ctx);

        // Make them friends
        pilot.Mechs.push(mech);
        mech.Pilot = pilot;
        
        // Write them back
        await pilot.writeback();
        await mech.writeback();

        // Read them back in a new ctx
        ctx = new OpCtx();
        let pilot = await env.reg.get_cat(EntryType.PILOT).create_default(ctx);

    });

    it("Properly brings along child entries", async () => {
        expect.assertions(6);
        let source_env = await init_basic_setup(true);
        let dest_env = await init_basic_setup(false);

        // Dest env should be empty
        let ctx_orig = new OpCtx();
        let dest_frames = await dest_env.reg.get_cat(EntryType.FRAME).list_live(ctx_orig);
        let dest_cores = await dest_env.reg.get_cat(EntryType.CORE_SYSTEM).list_live(ctx_orig);
        let dest_weapons = await dest_env.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx_orig);
        expect(dest_frames.length).toEqual(0);
        expect(dest_cores.length).toEqual(0);
        expect(dest_weapons.length).toEqual(0); // 3

        // Take the sherman, which has a native weapon, and send it over.
        let sherman = await source_env.reg.get_cat(EntryType.FRAME).lookup_mmid(new OpCtx(), "mf_sherman");
        let dest_sherman = await sherman.insinuate(dest_env.reg);

        // Dest env should have one frame, one core, and one weapon now
        let ctx_final = new OpCtx();
        dest_frames = await dest_env.reg.get_cat(EntryType.FRAME).list_live(ctx_final);
        dest_cores = await dest_env.reg.get_cat(EntryType.CORE_SYSTEM).list_live(ctx_final);
        dest_weapons = await dest_env.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx_final);
        expect(dest_frames.length).toEqual(1);
        expect(dest_cores.length).toEqual(1);
        expect(dest_weapons.length).toEqual(1); // 6
    });

    it("Doesn't drag along parent entries", async () => {
        // Identical to above test, but we send over the solidcore
        expect.assertions(4);
        let source_env = await init_basic_setup(true);
        let dest_env = await init_basic_setup(false);

        // Dest env should be empty
        let ctx_orig = new OpCtx();
        let dest_frames = await dest_env.reg.get_cat(EntryType.FRAME).list_live(ctx_orig);
        let dest_weapons = await dest_env.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx_orig);
        expect(dest_frames.length).toEqual(0);
        expect(dest_weapons.length).toEqual(0); // 2

        // Take the sherman, which has a native weapon, and send it over.
        let solidcore = await source_env.reg.get_cat(EntryType.MECH_WEAPON).lookup_mmid(new OpCtx(), "mw_sherman_integrated");
        await solidcore.insinuate(dest_env.reg);

        // Dest env should have just the weapon. 
        let ctx_final = new OpCtx();
        dest_frames = await dest_env.reg.get_cat(EntryType.FRAME).list_live(ctx_final);
        dest_weapons = await dest_env.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx_final);
        expect(dest_frames.length).toEqual(0);
        expect(dest_weapons.length).toEqual(1); // 4
    });
    
    it("Calls insinuation hooks", async () => {
        expect.assertions(3);
        class HookyReg extends StaticReg {
            hook_post_insinuate(t, o, n) {
                expect(t).toEqual(EntryType.MECH_SYSTEM);
                expect(o.Name).toEqual("ns");
                expect(n.Name).toEqual("ns");
            }
        }

        let env = new RegEnv();
        let reg1 = new HookyReg(env);
        let reg2 = new HookyReg(env);
        let ctx = new OpCtx();
        let old_sys = await reg1.create_live(EntryType.MECH_SYSTEM, ctx, {name: "ns"});
        let new_sys = await old_sys.insinuate(reg2);
    });

    it("Preserves misc original data", async () => {
        expect.assertions(4);
        let setup = await init_basic_setup(true);
        let reg = setup.reg;
        let ctx = new OpCtx();
        let sys = await reg.create_live(EntryType.MECH_SYSTEM, ctx, {name: "ns", nonspec_data: "test"});

        // Initial write should still have the field
        expect((await reg.get_raw(EntryType.MECH_SYSTEM, sys.RegistryID)).name).toEqual("ns");
        expect((await reg.get_raw(EntryType.MECH_SYSTEM, sys.RegistryID)).nonspec_data).toEqual("test");

        // Modify sys slightly and writeback. Modification shouldn't matter but we want to be sure
        sys.Name = "newname";
        await sys.writeback();

        // Should still be the same, but name should be updated
        expect((await reg.get_raw(EntryType.MECH_SYSTEM, sys.RegistryID)).name).toEqual("newname");
        expect((await reg.get_raw(EntryType.MECH_SYSTEM, sys.RegistryID)).nonspec_data).toEqual("test");
    });
});
