import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { FileOutputStream } from "./file-output-stream";
import * as xml2js from "xml2js";
import * as fs from "fs";
import * as path from "path";
import { CONSTANTS } from "../constants";
import { NounExtractor } from "./noun-extractor";
import { Word } from "../model/word";
import { AdjectiveExtractor } from "./adjective-extractor";
import { AdverbExtractor } from "./adverb-extractor";
import { VerbExtractor } from "./verb-extractor";

export interface WordExtractor {
    extract(lodDumpFile: string, outputDirectory: string): Promise<void>;
}

@injectable()
export class WordExtractorImpl implements WordExtractor {

    constructor(
        @inject(TYPES.FileOutputStream) private readonly outputStream: FileOutputStream,
        @inject(TYPES.NounExtractor) private readonly nounExtraxtor: NounExtractor,
        @inject(TYPES.AdjectiveExtractor) private readonly adjectiveExtractor: AdjectiveExtractor,
        @inject(TYPES.AdverbExtractor) private readonly adverbExtractor: AdverbExtractor,
        @inject(TYPES.VerbExtractor) private readonly verbExtractor: VerbExtractor
    ) { }

    public async extract(lodDumpFile: string, outputDirectory: string): Promise<void> {
        const extractedWords = new Map<string, Word>();
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
            extractedWords.forEach(word => {
                this.persistJson(word.id, wordsJsonFolder, Buffer.from(JSON.stringify(word)).toString("base64"));
            });
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
        this.outputStream.write(outputDirectory, `${wordKey}.json`, body);
    }
}
