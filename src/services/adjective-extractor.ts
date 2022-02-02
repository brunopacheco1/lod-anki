import { inject, injectable } from "inversify";
import { Word, WordMeaning, WordTranslation, WordUsageExample } from "../model/word";
import { TYPES } from "../types";
import { KeyGenerator } from "./key-generator";

export interface AdjectiveExtractor {
    extract(lodKey: string, word: string, structure: any): Word;
}

@injectable()
export class AdjectiveExtractorImpl implements AdjectiveExtractor {

    constructor(
        @inject(TYPES.KeyGenerator) private readonly keyGenerator: KeyGenerator
    ) { }

    public extract(lodKey: string, word: string, structure: any): Word {
        return {
            id: this.keyGenerator.generateWordKey(word),
            word: word,
            types: [{
                type: "adjective",
                lodKey: lodKey,
                details: {
                    variationOf: this.extractVariantOf(structure)
                },
                meanings: this.extractMeanings(word, structure)
            }]
        };
    }

    private extractVariantOf(structure: any): string | undefined {
        let variantOf: string | undefined = undefined;
        const variantOfStructure = structure["lod:RENVOI-ADJ"];
        if (!!variantOfStructure) {
            variantOf = variantOfStructure[0]["attributes"]["lod:REF-ID-ITEM-ADRESSE"].slice(0, -3);
        }
        return variantOf;
    }

    private extractMeanings(word: string, structure: any): WordMeaning[] {
        const meanings: WordMeaning[] = [];

        const meaningsStructure = structure["lod:TRAITEMENT-LING-ADJ"];
        if (!!meaningsStructure) {
            for (const meaningStructure of meaningsStructure) {
                const translationStructures = meaningStructure["lod:UNITE-TRAD"];
                for (const translationStructure of translationStructures) {
                    const translation = translationStructure["lod:PAS-DE-TRAD-SUBORDONNANTE"][0]["lod:UNITE-DE-SENS"][0];

                    meanings.push({
                        examples: this.extractExamples(word, translation),
                        synonyms: this.extractSynonyms(translation),
                        translations: [
                            this.extractTranslation("ALL", translation),
                            this.extractTranslation("FR", translation),
                            this.extractTranslation("PO", translation),
                            this.extractTranslation("EN", translation)
                        ]
                    });
                }
            }
        }
        return meanings;
    }

    private extractExamples(word: string, translationStructure: any): WordUsageExample[] {
        const examples: WordUsageExample[] = [];
        const examplesStructure = translationStructure["lod:EXEMPLIFICATION"][0]["lod:EXEMPLE"];
        for (const exampleStructure of examplesStructure) {
            const usage = exampleStructure["attributes"]["lod:MARQUE-USAGE"];
            const texts = exampleStructure["lod:TEXTE-EX"][0]["lod:TEXTE"];

            // TODO improve example concatenation
            // perhaps XML parsing is wrongly reordering the text elements.
            examples.push({
                example: `${texts[0]} ${word}${texts[1] || ""}`.trim(),
                usage: usage
            });
        }
        return examples;
    }

    private extractSynonyms(translationStructure: any): string[] {
        const synonymsStructure = translationStructure["lod:SYNONYMES"][0]["lod:SYN-PRESENTS"];
        if (!synonymsStructure) {
            return [];
        }

        const synonyms: string[] = [];
        for (const synonymStructure of synonymsStructure) {
            synonyms.push(synonymStructure["lod:TERME-SYN"][0]);
        }
        return [];
    }

    private extractTranslation(languageKey: string, translationStructure: any): WordTranslation {
        const translationObj = translationStructure[`lod:EQUIV-TRAD-${languageKey}`];
        if (!translationObj) {
            return {
                language: languageKey,
                translation: undefined
            };
        }

        const translation = translationObj[0][`lod:ET${languageKey[0]}-EXPLICITE`][0]["_"];
        let complement = undefined;
        let complementStructure = translationObj[0][`lod:RS-ET${languageKey[0]}-PRESENTE`];
        if (!!complementStructure) {
            complement = complementStructure[0].trim();
        }
        return {
            language: languageKey,
            translation: translation,
            complement: complement
        };
    }
}
