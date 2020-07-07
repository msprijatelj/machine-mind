import { IEffectData } from "@/interface";
import { ActivationType, EffectType, ItemEffect } from "@/class";

class GenericEffect extends ItemEffect {
    public readonly Detail: string;

    public constructor(effect: string, err?: boolean) {
        super(err);
        this.Detail = effect;
        this.activation = ActivationType.None;
        this.effectType = EffectType.Generic;
        this.tags = [];
    }
}

export { GenericEffect };
