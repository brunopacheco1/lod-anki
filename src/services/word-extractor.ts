import { inject, injectable } from "inversify";
import { Dictionary, Word } from "../model/word";
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
                    const {type, gender, verbGroup} = this.extractWordTypeAndGenderAndVerbGroup(meanings);
                    const wordObj: Word = {
                        id: this.keyGenerator.generateWordKey(wordFound),
                        word: wordFound,
                        type: type,
                        wordDetails: {
                            nounGender: gender
                        },
                        meanings: [],
                    };
                    console.log(wordObj);
                    console.log(`${lodKey} was extracted.`);
                }
            } catch(exception) {
                console.error(exception);
            }
        }
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

    private extractWordTypeAndGenderAndVerbGroup(dom: JSDOM): {
        type: string;
        gender?: string;
        verbGroup?: string;
    } {
        const element = dom.window.document.querySelector("div#article > span:nth-child(2)");
        if(!element || !element.textContent) {
            throw new Error("Word Type not found.");
        }
        const rawType = element.textContent.trim().toLowerCase();

        let notTranslatedType = rawType;
        let notTranslatedGender: string | null = null;
        let verbGroup: string | undefined = undefined;
        if(rawType.includes(" ")) {
            [notTranslatedGender, notTranslatedType] = rawType.split(" ");
        }

        let type: string;
        console.log(notTranslatedType);
        switch(notTranslatedType) {
            case "adjektiv": type = "adjective"; break;
            case "adverb": type = "adverb"; break;
            case "hëllefsverb": type = "verb"; verbGroup = "auxiliary"; break;
            case "konjunktioun": type = "conjunction"; break;
            case "modalverb": type = "modal verb"; break;
            case "substantiv": type = "noun"; break;
            case "verb": type = "verb"; break;
            default: throw new Error("Word Type not found.");
        }

        if(!notTranslatedGender) {
            return {type: type, gender: undefined, verbGroup: verbGroup};
        }

        let gender: string;
        switch(notTranslatedGender) {
            case "weiblecht": gender = "feminine"; break;
            case "männlecht": gender = "masculine"; break;
            default: gender = "neutral"; break;
        }
        return {type: type, gender: gender, verbGroup: verbGroup};
    }
}
