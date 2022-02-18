import { inject, injectable } from "inversify";
import { WordMeaning, WordTypeDetails } from "@model/word";
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

    protected extractDetails(lodWordType: string, structure: any): WordTypeDetails {
        const { variationOfLodKey, variationType } = this.extractVariantOf(lodWordType, structure);
        return {
            variationOfLodKey: variationOfLodKey,
            variationType: variationType,
            auxiliaryVerb: this.extractAuxiliaryVerb(structure),
            pastParticiples: this.extractPastParticiples(structure),
            verbCategory: this.extractVerbCategory(structure)
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

    private extractVerbCategory(structure: any): string | undefined {
        let verbCategory: string | undefined = undefined;
        const verbCategoryStructure = structure["lod:CAT-GRAM-VRB"][0]["attributes"];
        if (!!verbCategoryStructure) {
            verbCategory = verbCategoryStructure["lod:C-G-VRB"];
        }
        return verbCategory;
    }

    protected extractMeaningsFromStructure(word: string, meaningStructure: any): WordMeaning[] {
        const meanings: WordMeaning[] = [];

        const translationUnitStructures = meaningStructure["lod:UNITE-TRAD"];
        for (const translationUnitStructure of translationUnitStructures) {
            const translationStructures = translationUnitStructure["lod:PAS-DE-TRAD-SUBORDONNANTE"];

            for (const translationStructure of translationStructures) {
                const translation = translationStructure["lod:UNITE-DE-SENS"][0];

                meanings.push({
                    examples: this.extractExamples(word, translation),
                    synonyms: this.extractSynonyms(translation),
                    polyLex: this.extractPolyLex(translation),
                    reflexivePronoun: this.extractReflexivePronoum(meaningStructure),
                    employsImpersonal: this.extractImpersonalPronoum(meaningStructure),
                    translations: [
                        this.extractTranslation("ALL", translation),
                        this.extractTranslation("FR", translation),
                        this.extractTranslation("PO", translation),
                        this.extractTranslation("EN", translation)
                    ]
                });
            }
        }

        return meanings;
    }

    private extractReflexivePronoum(meaningStructure: any): string {
        return meaningStructure["lod:REFLEX-PRONOM"][0]["attributes"]["lod:REFPRON"];
    }

    private extractImpersonalPronoum(meaningStructure: any): string {
        return meaningStructure["lod:EMPLOI-IMPERS"][0]["attributes"]["lod:EMPLOI-IMPERS"];
    }
}
