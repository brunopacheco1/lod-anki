import { inject, injectable } from "inversify";
import { WordTypeDetails } from "@model/word";
import { TYPES } from "@services/types";
import { WordIdGenerator } from "@services/word-id-generator";
import { BaseLodWordExtractor, BaseLodWordExtractorImpl } from "./base-lod-word-extractor";

export interface NounExtractor extends BaseLodWordExtractor {
}

@injectable()
export class NounExtractorImpl extends BaseLodWordExtractorImpl implements NounExtractor {

    constructor(
        @inject(TYPES.WordIdGenerator) wordIdGenerator: WordIdGenerator
    ) {
        super(wordIdGenerator);
    }

    public wordType(): string {
        return "noun";
    }

    public lodWordType(): string {
        return "SUBST";
    }

    protected extractDetails(lodWordType: string, structure: any): WordTypeDetails {
        const { variationOfLodKey, variationType } = this.extractVariantOf(lodWordType, structure);
        return {
            nounGender: this.extractGender(structure),
            nounCategory: this.extractNounCategory(structure),
            plural: this.extractPlural(structure),
            variationOfLodKey: variationOfLodKey,
            variationType: variationType
        };
    }

    private extractGender(structure: any): string {
        return structure["lod:GENRE"][0]["attributes"]["lod:GEN"].trim();
    }

    private extractNounCategory(structure: any): string | undefined {
        const attributes = structure["lod:CAT-GRAM-SUBST"][0]["attributes"];
        if (!!attributes) {
            return attributes["lod:C-G-SUBST"].trim();
        }
        return undefined;
    }

    private extractPlural(structure: any): string | undefined {
        let plural: string | undefined;
        const pluralType = Object.keys(structure["lod:PLURIEL"][0])[0];
        const pluralStructure = structure["lod:PLURIEL"][0][pluralType];
        switch (pluralType) {
            case "lod:TJ-NOMBRABLE":
            case "lod:ALT-MASSIF-NOMBRABLE":
                const pluralObj = pluralStructure[0]["lod:FORME-PLURIEL"][0];
                if ((!!pluralObj) && (pluralObj.constructor === Object)) {
                    plural = pluralObj["_"].trim();
                } else {
                    plural = pluralObj.trim();
                }
                break;
            case "lod:PLURALE-TANTUM":
            case "lod:TJ-MASSIF":
            case "lod:SITUATION-PLURIEL-COMPLEXE":
                plural = undefined;
                break;
            default: throw new Error(`${pluralType} not recognized.`);
        }
        return plural;
    }
}
