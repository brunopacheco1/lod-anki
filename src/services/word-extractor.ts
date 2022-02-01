import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { FileOutputStream } from "./file-output-stream";
import * as xml2js from "xml2js";
import * as fs from "fs";
import { CONSTANTS } from "../constants";
import { NounExtractor } from "./noun-extractor";
import { Word } from "../model/word";

export interface WordExtractor {
    extract(wordList: string[], outputDirectory: string): Promise<void>;
}

@injectable()
export class WordExtractorImpl implements WordExtractor {

    constructor(
        @inject(TYPES.FileOutputStream) private readonly outputStream: FileOutputStream,
        @inject(TYPES.NounExtractor) private readonly nounExtraxtor: NounExtractor
    ) { }

    public async extract(wordList: string[], outputDirectory: string): Promise<void> {
        const extractedWords = new Map<string, Word>();
        const parser = new xml2js.Parser({ attrkey: "attributes" });
        try {
            let xmlStr = fs.readFileSync(CONSTANTS.LOD_XML);
            const xml: any = await parser.parseStringPromise(xmlStr);
            const items: any = xml["lod:LOD"]["lod:ITEM"];

            for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                const article: any = items[itemIndex]["lod:ARTICLE"][0];
                const lodKey: string = items[itemIndex]["lod:META"][0]["attributes"]["lod:ID"].trim();

                let wordObj = this.extractArticle(lodKey, article);
                if (!wordObj) continue;

                if (extractedWords.has(wordObj.id)) {
                    const previousWordObj = extractedWords.get(wordObj.id);
                    for (const type of wordObj.types) {
                        const previousOtherType = previousWordObj!.types.find(otherType => otherType.type === type.type);
                        if (!!previousOtherType) {
                            previousOtherType.meanings = [...previousOtherType.meanings, ...type.meanings];
                        } else {
                            previousWordObj!.types.push(type);
                        }
                    }
                } else {
                    extractedWords.set(wordObj.id, wordObj);
                }
            }

            extractedWords.forEach(word => {
                if (word.word === "Béier") console.log(JSON.stringify(word));
            });
            console.log(extractedWords.size);
        } catch (exception) {
            console.error(exception);
        }
    }

    public extractArticle(lodKey: string, article: any): Word | undefined {
        const word: any = article["lod:ITEM-ADRESSE"][0]["_"];
        const structure: any = article["lod:MICROSTRUCTURE"][0];
        const type = Object.keys(structure)[0];
        let wordObj;
        switch (type) {
            case "lod:MS-TYPE-SUBST":
                wordObj = this.nounExtraxtor.extract(lodKey, word, structure[type][0]);
                break;
            case "lod:MS-TYPE-INTERJ": break;
            case "lod:MS-TYPE-ADJ": break;
            case "lod:MS-TYPE-ADV": break;
            case "lod:MS-TYPE-PREP": break;
            case "lod:MS-TYPE-VRB": break;
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
        return wordObj;
    }
}
