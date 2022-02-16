import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { FileWriter } from "@services/file-writer";
import * as xml2js from "xml2js";
import * as fs from "fs";
import * as path from "path";
import { CONSTANTS } from "@model/constants";
import { NounExtractor } from "@services/extractors/noun-extractor";
import { Word } from "@model/word";
import { AdjectiveExtractor } from "@services/extractors/adjective-extractor";
import { AdverbExtractor } from "@services/extractors/adverb-extractor";
import { VerbExtractor } from "@services/extractors/verb-extractor";

export interface WordExtractor {
    extract(lodDumpFile: string, outputDirectory: string): Promise<void>;
}

@injectable()
export class WordExtractorImpl implements WordExtractor {

    private genders = new Set<string>();

    constructor(
        @inject(TYPES.FileWriter) private readonly fileWriter: FileWriter,
        @inject(TYPES.NounExtractor) private readonly nounExtraxtor: NounExtractor,
        @inject(TYPES.AdjectiveExtractor) private readonly adjectiveExtractor: AdjectiveExtractor,
        @inject(TYPES.AdverbExtractor) private readonly adverbExtractor: AdverbExtractor,
        @inject(TYPES.VerbExtractor) private readonly verbExtractor: VerbExtractor
    ) { }

    public async extract(lodDumpFile: string, outputDirectory: string): Promise<void> {
        const extractedWords = new Map<string, Word>();
        const lodKeysToWords = new Map<string, string>();
        const parser = new xml2js.Parser({ attrkey: "attributes" });
        try {
            let xmlStr = fs.readFileSync(lodDumpFile);
            const xml: any = await parser.parseStringPromise(xmlStr);
            const items: any = xml["lod:LOD"]["lod:ITEM"];

            for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                const article: any = items[itemIndex]["lod:ARTICLE"][0];
                const lodKey: string = items[itemIndex]["lod:META"][0]["attributes"]["lod:ID"].trim();

                let wordObjs = this.extractArticle(lodKey, article);

                for (const wordObj of wordObjs) {
                    lodKeysToWords.set(lodKey, wordObj.word);
                    if (extractedWords.has(wordObj.id)) {
                        const previousWordObj = extractedWords.get(wordObj.id);
                        for (const type of wordObj.types) {
                            previousWordObj!.types.push(type);
                        }
                    } else {
                        extractedWords.set(wordObj.id, wordObj);
                    }
                }
            }

            const wordsJsonFolder = path.join(outputDirectory, CONSTANTS.WORDS_FOLDER);
            for (const word of extractedWords.values()) {
                for (const type of word.types) {
                    if (!!type.details.variationOfLodKey) {
                        type.details.variationOf = lodKeysToWords.get(type.details.variationOfLodKey);
                    }
                }
                this.persistJson(word.id, wordsJsonFolder, Buffer.from(JSON.stringify(word)).toString("base64"));
            };
        } catch (exception) {
            console.error(exception);
        }
    }

    public extractArticle(lodKey: string, article: any): Word[] {
        const word: any = article["lod:ITEM-ADRESSE"][0]["_"].replace(/\_/g, " ").replace(/\#/g, "'");
        const structures: any = article["lod:MICROSTRUCTURE"];

        const words: Word[] = [];
        for (const structure of structures) {
            const typeKey = Object.keys(structure)[0];
            for (const type of structure[typeKey]) {
                let wordObj;
                switch (typeKey) {
                    case "lod:MS-TYPE-SUBST":
                        wordObj = this.nounExtraxtor.extract(lodKey, word, type);
                        wordObj.types.forEach(type => this.genders.add(type.details.nounGender!));
                        break;
                    case "lod:MS-TYPE-INTERJ": break;
                    case "lod:MS-TYPE-ADJ":
                        wordObj = this.adjectiveExtractor.extract(lodKey, word, type);
                        break;
                    case "lod:MS-TYPE-ADV":
                        wordObj = this.adverbExtractor.extract(lodKey, word, type);
                        break;
                    case "lod:MS-TYPE-PREP": break;
                    case "lod:MS-TYPE-VRB":
                        wordObj = this.verbExtractor.extract(lodKey, word, type);
                        break;
                    case "lod:MS-TYPE-PRON": break;
                    case "lod:MS-TYPE-CONJ": break;
                    case "lod:MS-TYPE-PART": break;
                    case "lod:MS-TYPE-PREP-plus-ART": break;
                    case "lod:MS-TYPE-VRBPART": break;
                    case "lod:MS-TYPE-ART": break;
                    case "lod:MS-TYPE-ELEM-COMP": break;
                    case "lod:MS-TYPE-PRONADV": break;
                    case "lod:MS-TYPE-INDEF": break;
                    default: throw new Error(`${type} not recognized.`);
                }

                if (!!wordObj) {
                    words.push(wordObj);
                }
            }
        }
        return words;
    }

    private persistJson(wordKey: string, outputDirectory: string, body: string): void {
        this.fileWriter.write(outputDirectory, `${wordKey}.json`, body);
    }
}
