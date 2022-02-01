import { inject, injectable } from "inversify";
import { Word, WordMeaning, WordTranslation } from "../model/word";
import { TYPES } from "../types";
import { KeyGenerator } from "./key-generator";

export interface NounExtractor {
    extract(lodKey: string, word: string, structure: any): Word;
}

@injectable()
export class NounExtractorImpl implements NounExtractor {

    constructor(
        @inject(TYPES.KeyGenerator) private readonly keyGenerator: KeyGenerator
    ) { }

    public extract(lodKey: string, word: string, structure: any): Word {
        const gender: string = this.extractGender(structure);
        const plural: string | undefined = this.extractPlural(structure);
        const variantOf: string | undefined = this.extractVariantOf(structure);
        const meanings = this.extractMeanings(lodKey, structure);

        return {
            id: this.keyGenerator.generateWordKey(word),
            word: word,
            types: [{
                type: "noun",
                details: {
                    nounGender: gender,
                    plural: plural,
                    variationOfLodKey: variantOf
                },
                meanings: meanings
            }]
        };
    }

    private extractGender(structure: any): string {
        return structure["lod:GENRE"][0]["attributes"]["lod:GEN"].trim();
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

    private extractVariantOf(structure: any): string | undefined {
        let variantOf: string | undefined = undefined;
        const variantOfStructure = structure["lod:RENVOI-SUBST"];
        if (!!variantOfStructure) {
            variantOf = variantOfStructure[0]["attributes"]["lod:REF-ID-ITEM-ADRESSE"].slice(0, -3);
        }
        return variantOf;
    }

    private extractMeanings(lodKey: string, structure: any): WordMeaning[] {
        const meanings: WordMeaning[] = [];

        const nounTranslationStructure = structure["lod:TRAITEMENT-LING-SUBST"];
        if (!!nounTranslationStructure) {
            const translationStructures = nounTranslationStructure[0]["lod:UNITE-TRAD"];
            for (const translationStructure of translationStructures) {
                const translation = translationStructure["lod:PAS-DE-TRAD-SUBORDONNANTE"][0]["lod:UNITE-DE-SENS"][0];
                const deTranslation = this.extractTranslation("ALL", translation);
                const frTranslation = this.extractTranslation("FR", translation);
                const ptTranslation = this.extractTranslation("PO", translation);
                const enTranslation = this.extractTranslation("EN", translation);

                // TODO lod:EXEMPLIFICATION
                // TODO lod:SYNONYMES

                meanings.push({
                    lodKey: lodKey,
                    translations: [deTranslation, frTranslation, ptTranslation, enTranslation]
                });
            }
        }
        return meanings;
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
