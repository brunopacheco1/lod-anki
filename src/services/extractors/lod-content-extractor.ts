import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { FileWriter } from "@services/file-writer";
import * as xml2js from "xml2js";
import * as fs from "fs";
import * as path from "path";
import { CONSTANTS } from "@model/constants";
import { NounExtractor } from "@services/extractors/noun-extractor";
import { Word } from "@model/word";
import { VerbExtractor } from "@services/extractors/verb-extractor";
import { PrepositionExtractor } from "./preposition-extractor";
import { BaseLodWordExtractor } from "./base-lod-word-extractor";
import * as https from "https";
import { execSync } from "child_process";

export interface LodContentExtractor {
    extract(lodDumpFile: string, outputDirectory: string): Promise<void>;
}

@injectable()
export class LodContentExtractorImpl implements LodContentExtractor {

    constructor(
        @inject(TYPES.FileWriter) private readonly fileWriter: FileWriter,
        @inject(TYPES.NounExtractor) private readonly nounExtraxtor: NounExtractor,
        @inject(TYPES.VerbExtractor) private readonly verbExtractor: VerbExtractor,
        @inject(TYPES.PrepositionExtractor) private readonly prepositionExtractor: PrepositionExtractor,
        @inject(TYPES.BaseLodWordExtractor) private readonly baseLodWordExtractor: BaseLodWordExtractor
    ) { }

    public async extract(lodDumpFile: string, outputDirectory: string): Promise<void> {
        const lodAudiosFolder = path.join(outputDirectory, CONSTANTS.LOD_AUDIOS_FOLDER);
        const extractedWords = new Map<string, Word>();
        const lodKeysToWords = new Map<string, string>();
        const parser = new xml2js.Parser({ attrkey: "attributes" });

        try {
            let xmlStr = fs.readFileSync(lodDumpFile);
            const xml: any = await parser.parseStringPromise(xmlStr);
            const items: any = xml["lod:LOD"]["lod:ITEM"];

            for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                const article: any = items[itemIndex]["lod:ARTICLE"][0];
                const hasAudio: any = !!items[itemIndex]["lod:AUDIO"];
                const lodKey: string = items[itemIndex]["lod:META"][0]["attributes"]["lod:ID"].trim();

                if (hasAudio) {
                    if (!this.audioExists(lodKey, lodAudiosFolder)) {
                        await this.persistMp3(lodKey, lodAudiosFolder);
                        this.persistM4a(lodKey, lodAudiosFolder);
                    }
                } else {
                    console.log(`${lodKey} does not have audio file.`);
                }

                let wordObjs = this.extractArticle(lodKey, article);

                for (const wordObj of wordObjs) {
                    for (const type of wordObj.types) {
                        type.details.audio = `${lodKey.toLowerCase()}.m4a`;
                    }
                }

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
                let extractor: BaseLodWordExtractor;
                let lodWordType: string = typeKey.slice(typeKey.lastIndexOf("-") + 1);
                switch (typeKey) {
                    case "lod:MS-TYPE-PREP-plus-ART":
                    case "lod:MS-TYPE-PART":
                    case "lod:MS-TYPE-VRBPART":
                    case "lod:MS-TYPE-ELEM-COMP":
                    case "lod:MS-TYPE-PRONADV":
                    case "lod:MS-TYPE-INDEF":
                    case "lod:MS-TYPE-INTERJ":
                    case "lod:MS-TYPE-PRON":
                    case "lod:MS-TYPE-ART":
                        continue;
                    case "lod:MS-TYPE-SUBST":
                        extractor = this.nounExtraxtor;
                        break;
                    case "lod:MS-TYPE-PREP":
                        extractor = this.prepositionExtractor;
                        break;
                    case "lod:MS-TYPE-VRB":
                        extractor = this.verbExtractor;
                        break;
                    case "lod:MS-TYPE-CONJ":
                    case "lod:MS-TYPE-ADJ":
                    case "lod:MS-TYPE-ADV":
                        extractor = this.baseLodWordExtractor;
                        break;
                    default: throw new Error(`${type} not recognized.`);
                }

                const wordObj = extractor.extract(lodKey, lodWordType, word, type);

                if (!!wordObj) {
                    words.push(wordObj);
                }
            }
        }
        return words;
    }

    private audioExists(lodKey: string, lodAudiosFolder: string): boolean {
        return fs.existsSync(path.join(lodAudiosFolder, `${lodKey.toLowerCase()}.m4a`));
    }

    private async persistMp3(lodKey: string, outputDirectory: string): Promise<void> {
        const waitPromise: Promise<void> = new Promise((resolve, reject) => {
            https.get(`https://www.lod.lu/audio/${lodKey.toLowerCase()}.mp3`, (response) => {
                response.setEncoding("base64");
                let body = "";
                response.on("error", reject);
                response.on("data", (data) => { body += data });
                response.on("end", () => {
                    this.fileWriter.write(outputDirectory, `${lodKey.toLowerCase()}.mp3`, body);
                    resolve();
                });
            });
        });
        return waitPromise;
    }

    private persistM4a(lodKey: string, outputDirectory: string): void {
        const mp3File = path.join(outputDirectory, `${lodKey.toLowerCase()}.mp3`);
        const m4aFile = path.join(outputDirectory, `${lodKey.toLowerCase()}.m4a`);
        try {
            execSync(`ffmpeg -i "${mp3File}" -map a:0 -c:a aac "${m4aFile}"`);
        } catch (e) {
            console.log(`${lodKey} audio file is broken.`);
        }
        fs.rmSync(mp3File);
    }

    private persistJson(wordKey: string, outputDirectory: string, body: string): void {
        this.fileWriter.write(outputDirectory, `${wordKey}.json`, body);
    }
}
