import { Word, WordMeaning, WordTranslation, WordTypeDetails, WordUsageExample } from "@model/word";
import { WordIdGenerator } from "@services/word-id-generator";
import { injectable } from "inversify";

export interface BaseLodWordExtractor {
    extract(lodKey: string, word: string, structure: any): Word;
}

@injectable()
export abstract class BaseLodWordExtractorImpl implements BaseLodWordExtractor {

    constructor(
        private readonly wordIdGenerator: WordIdGenerator
    ) { }

    public abstract wordType(): string;

    public abstract lodWordType(): string;

    public extract(lodKey: string, word: string, structure: any): Word {
        return {
            id: this.wordIdGenerator.generate(word),
            word: word,
            types: [{
                type: this.wordType(),
                lodKey: lodKey,
                details: this.extractDetails(structure),
                meanings: this.extractMeanings(word, structure)
            }]
        };
    }

    protected extractDetails(structure: any): WordTypeDetails {
        const { variationOfLodKey, variationType } = this.extractVariantOf(structure);
        return {
            variationOfLodKey: variationOfLodKey,
            variationType: variationType
        };
    }

    protected extractVariantOf(structure: any): {
        variationOfLodKey: string | undefined,
        variationType: string | undefined
    } {
        let variationOfLodKey: string | undefined = undefined;
        let variationType: string | undefined = undefined;
        const variantOfStructure = structure[`lod:RENVOI-${this.lodWordType()}`];
        if (!!variantOfStructure) {
            variationOfLodKey = variantOfStructure[0]["attributes"]["lod:REF-ID-ITEM-ADRESSE"].slice(0, -3);
            variationType = Object.keys(variantOfStructure[0])[1];
            switch (variationType) {
                case "lod:VARIANTE-HOMOSEME":
                case "lod:VARIANTE-ORTHOGRAPHIQUE":
                case "lod:VARIANTE-LOCALE": variationType = "VARIANT_OF"; break;
                case "lod:FORME-FEM": variationType = "FEMININE_FORM_OF"; break;
                case "lod:FORME-ABREGEE": variationType = "SHORT_FORM_OF"; break;
                case "lod:FORME-DIMINUTIVE": variationType = "DIMINUTIVE_FORM_OF"; break;
                case "lod:FORME-MASC": variationType = "MASCULINE_FORM_OF"; break;
                default: throw new Error(`${variationType} not recognized.`);
            }
        }
        return { variationOfLodKey, variationType };
    }

    protected extractMeanings(word: string, structure: any): WordMeaning[] {
        const meanings: WordMeaning[] = [];

        const meaningsStructure = structure[`lod:TRAITEMENT-LING-${this.lodWordType()}`];
        if (!!meaningsStructure) {
            for (const meaningStructure of meaningsStructure) {
                const translationStructures = meaningStructure["lod:UNITE-TRAD"];
                for (const translationStructure of translationStructures) {
                    const translation = translationStructure["lod:PAS-DE-TRAD-SUBORDONNANTE"][0]["lod:UNITE-DE-SENS"][0];

                    meanings.push({
                        examples: this.extractExamples(word, translation),
                        synonyms: this.extractSynonyms(translation),
                        polyLex: this.extractPolyLex(translation),
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

    protected extractExamples(word: string, translationStructure: any): WordUsageExample[] {
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

    protected extractSynonyms(translationStructure: any): string[] {
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

    protected extractPolyLex(translationStructure: any): string | undefined {
        const polyLexStructure = translationStructure["lod:UNITE-POLYLEX-LUX"];
        if (!polyLexStructure) {
            return undefined;
        }
        return polyLexStructure[0];
    }

    protected extractTranslation(languageKey: string, translationStructure: any): WordTranslation {
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
