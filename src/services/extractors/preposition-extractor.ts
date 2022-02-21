import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { WordIdGenerator } from "@services/word-id-generator";
import { BaseLodWordExtractor, BaseLodWordExtractorImpl } from "./base-lod-word-extractor";
import { WordMeaning } from "@model/word";

export interface PrepositionExtractor extends BaseLodWordExtractor {
}

@injectable()
export class PrepositionExtractorImpl extends BaseLodWordExtractorImpl implements PrepositionExtractor {

    constructor(
        @inject(TYPES.WordIdGenerator) wordIdGenerator: WordIdGenerator
    ) {
        super(wordIdGenerator);
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
                    case: this.extractCase(meaningStructure),
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

    private extractCase(meaningStructure: any): string {
        return meaningStructure["lod:CAS-ATTENDU"][0]["attributes"]["lod:CAS"];
    }
}
