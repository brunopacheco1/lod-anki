import { inject, injectable } from "inversify";
import { Dictionary, Word, WordType, WordTypeDetails } from "../model/word";
import * as fs from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";
import { TYPES } from "../types";
import { FileOutputStream } from "./file-output-stream";
import { KeyGenerator } from "./key-generator";
import { CONSTANTS } from "../constants";

export interface WordExtractor {
    extract(dictionary: Dictionary, outputDirectory: string): Promise<void>;
}

@injectable()
export class WordExtractorImpl implements WordExtractor {

    constructor(
        @inject(TYPES.FileOutputStream) private readonly outputStream: FileOutputStream,
        @inject(TYPES.KeyGenerator) private readonly keyGenerator: KeyGenerator
    ) { }

    public async extract(dictionary: Dictionary, outputDirectory: string): Promise<void> {
        const extractedWords = new Map<string, Word>();
        const lodTempFolder = path.join(outputDirectory, CONSTANTS.LOD_TEMP_FOLDER);
        const wordTempFolder = path.join(outputDirectory, CONSTANTS.WORD_TEMP_FOLDER);
        
        word_loop:
        for (const word of dictionary.words) {
            try {
                console.log(`Extracting [${word}]...`);
                const wordKey = this.keyGenerator.generateWordKey(word);

                for (let index = 1;; index++) {

                    const lodKey = this.keyGenerator.generateLodKey(word, index);
                    
                    if(this.cannotExtractWord(lodKey, wordKey, lodTempFolder, wordTempFolder)) {
                        console.warn(`${lodKey} extracted before or the word hasn't been fetched from LOD.`);
                        continue word_loop;
                    }

                    const meanings = this.readMeanings(lodKey, lodTempFolder);
                    const wordFound = this.extractWord(meanings);
                    const wordFoundKey = this.keyGenerator.generateWordKey(wordFound);
                    const wordTypes = this.extractWordTypes(meanings);

                    const wordObj: Word = {
                        id: wordFoundKey,
                        word: wordFound,
                        types: wordTypes 
                    };

                    if(extractedWords.has(wordFoundKey)) {
                        const previousWordObj = extractedWords.get(wordFoundKey);
                        for(const type of wordObj.types) {
                            const previousOtherType = previousWordObj!.types.find(otherType => otherType.type === type.type);
                            if(!!previousOtherType) {
                                previousOtherType.meanings = [...previousOtherType.meanings, ...type.meanings];
                            } else {
                                previousWordObj!.types.push(type);
                            }
                        }
                    } else {
                        extractedWords.set(wordFoundKey, wordObj);
                    }

                    console.log(`${lodKey} was extracted.`);
                }
            } catch(exception) {
                console.error(exception);
            }
        }

        extractedWords.forEach(word => console.log(JSON.stringify(word)));
    }

    private cannotExtractWord(lodKey: string, wordKey: string, lodTempFolder: string, wordTempFolder: string): boolean {
        const existsMeanings = fs.existsSync(path.join(lodTempFolder, `${lodKey.toLowerCase()}${CONSTANTS.MEANINGS_SUFFIX}`));
        const existsWord = fs.existsSync(path.join(wordTempFolder, `${wordKey}.json`));
        return !existsMeanings || existsWord;
    }

    private readMeanings(lodKey: string, lodTempFolder: string): JSDOM {
        const file = path.join(lodTempFolder, `${lodKey.toLowerCase()}_meanings.html`);
        const html = fs.readFileSync(file);
        return new JSDOM(`<div id="article">${html}</div>`);
    }

    private extractWord(dom: JSDOM): string {
        const element = dom.window.document.querySelector("div#article > span:nth-child(1)");
        if(!element || !element.textContent) {
            throw new Error("Word not found.");
        }
        return element.textContent.trim();
    }

    private extractWordTypes(dom: JSDOM): WordType[] {
        const element = dom.window.document.querySelector("div#article > span:nth-child(2)");
        if(!element || !element.textContent) {
            throw new Error("Word Type not found.");
        }
        const rawType = element.textContent.trim().toLowerCase();

        let notTranslatedType = rawType;
        let notTranslatedGender: string | null = null;
        if(rawType.includes(" ")) {
            [notTranslatedGender, notTranslatedType] = rawType.split(" ");
        }

        let typeKeys: string[];
        console.log(notTranslatedType);
        switch(notTranslatedType) {
            case "adjektiv": typeKeys = ["adjective"]; break;
            case "partikel": typeKeys = ["particle"]; break;
            case "adverb": typeKeys = ["adverb"]; break;
            case "konjunktioun": typeKeys = ["conjunction"]; break;
            case "substantiv": typeKeys = ["noun"]; break;
            case "verbpartikel": typeKeys = ["verb particle"]; break;
            case "hëllefsverb": typeKeys = ["auxiliary verb"]; break;
            case "modalverb": typeKeys = ["modal verb"]; break;
            case "verb": typeKeys = ["transitive verb", "reflexive verb", "intransitive verb", "transitive impersonal verb"]; break;
            default: throw new Error("Word Type not found.");
        }

        let auxiliaryVerb: string | undefined = undefined;
        let pastParticiple: string | undefined = undefined;
        if(["hëllefsverb", "modalverb", "verb"].includes(notTranslatedType)) {
            const auxiliaryVerbEl = dom.window.document.querySelector("div#article > span:nth-child(3)");
            if(!auxiliaryVerbEl || !auxiliaryVerbEl.textContent) {
                throw new Error("Auxiliary Verb not found.");
            }
            auxiliaryVerb = auxiliaryVerbEl.textContent.trim().split(" ")[1];
            const pastParticipleEl = dom.window.document.querySelector("div#article > span:nth-child(6)");
            if(!pastParticipleEl || !pastParticipleEl.textContent) {
                throw new Error("Past Participle not found.");
            }
            pastParticiple = pastParticipleEl.textContent.trim();
        }

        const types: WordType[] = [];

        for(const key of typeKeys) {
            const typeDetails: WordTypeDetails = {};

            if(key === "noun") {
                let gender: string;
                switch(notTranslatedGender) {
                    case "weiblecht": gender = "feminine"; break;
                    case "männlecht": gender = "masculine"; break;
                    default: gender = "neutral"; break;
                }
                typeDetails.nounGender = gender;
            }

            if(key.endsWith("verb")) {
                typeDetails.auxiliaryVerb = auxiliaryVerb;
                typeDetails.pastParticiple = pastParticiple;
            }

            types.push({
                type: key,
                details: typeDetails,
                meanings: []
            });
        }

        return types;
    }
}
