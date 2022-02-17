import { inject, injectable } from "inversify";
import { WordTypeDetails } from "@model/word";
import { TYPES } from "@services/types";
import { WordIdGenerator } from "@services/word-id-generator";
import { BaseLodWordExtractor, BaseLodWordExtractorImpl } from "./base-lod-word-extractor";

export interface VerbExtractor extends BaseLodWordExtractor {
}

@injectable()
export class VerbExtractorImpl extends BaseLodWordExtractorImpl implements VerbExtractor {

    constructor(
        @inject(TYPES.WordIdGenerator) wordIdGenerator: WordIdGenerator
    ) {
        super(wordIdGenerator);
    }

    public wordType(): string {
        return "verb";
    }

    public lodWordType(): string {
        return "VRB";
    }

    protected extractDetails(structure: any): WordTypeDetails {
        const { variationOfLodKey, variationType } = this.extractVariantOf(structure);
        return {
            variationOfLodKey: variationOfLodKey,
            variationType: variationType,
            auxiliaryVerb: this.extractAuxiliaryVerb(structure),
            pastParticiples: this.extractPastParticiples(structure)
        };
    }

    private extractAuxiliaryVerb(structure: any): string | undefined {
        let auxiliaryVerb: string | undefined = undefined;
        const auxiliaryVerbStructure = structure["lod:VRB-AUXILIAIRE"];
        if (!!auxiliaryVerbStructure) {
            auxiliaryVerb = auxiliaryVerbStructure[0]["attributes"]["lod:AUXIL"];
        }
        return auxiliaryVerb;
    }

    private extractPastParticiples(structure: any): string[] {
        return structure["lod:PARTICIPE-PASSE"];
    }
}
