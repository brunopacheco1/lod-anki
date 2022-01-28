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

                    const meaningsHtml = this.readMeaningsHtml(lodKey, lodTempFolder);
                    const wordFound = this.extractWord(meaningsHtml);
                    const wordFoundKey = this.keyGenerator.generateWordKey(wordFound);
                    const wordTypes = this.extractWordTypes(lodKey, meaningsHtml);

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

    private readMeaningsHtml(lodKey: string, lodTempFolder: string): JSDOM {
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

    private extractWordTypes(lodKey: string, meaningsHtml: JSDOM): WordType[] {
        const element = meaningsHtml.window.document.querySelector("div#article > span:nth-child(2)");
        if(!element || !element.textContent) {
            throw new Error(`WordType element not found for ${lodKey}`);
        }
        const rawType = element.textContent.trim().toLowerCase();

        let notTranslatedType = rawType;
        let notTranslatedGender: string | undefined = undefined;
        if(rawType.includes(" ")) {
            [notTranslatedGender, notTranslatedType] = rawType.split(" ");
        }

        let typeKeys: string[];
        switch(notTranslatedType) {
            case "adjektiv": typeKeys = ["adjective"]; break;
            case "partikel": typeKeys = ["particle"]; break;
            case "adverb": typeKeys = ["adverb"]; break;
            case "konjunktioun": typeKeys = ["conjunction"]; break;
            case "substantiv": typeKeys = ["noun"]; break;
            case "verbpartikel": typeKeys = ["verb particle"]; break;
            case "hëllefsverb": typeKeys = ["auxiliary verb"]; break;
            case "modalverb": typeKeys = ["modal verb"]; break;
            case "verb": typeKeys = ["transitive verb", "reflexive verb", "intransitive verb", "transitive impersonal verb", "intransitive impersonal verb"]; break;
            default: throw new Error(`WordType[${notTranslatedType}] not found for ${lodKey}`);
        }
        
        let nounGender: string | undefined = undefined;
        let plural: string | undefined = undefined;
        if("substantiv" === notTranslatedType) {
            switch(notTranslatedGender) {
                case "weiblecht": nounGender = "feminine"; break;
                case "männlecht": nounGender = "masculine"; break;
                default: nounGender = "neutral"; break;
            }

            const pluralEl = meaningsHtml.window.document.querySelector("div#article > span.text_gen > span.mentioun_adress");
            if(!pluralEl || !pluralEl.textContent) {
                throw new Error(`Plural not found for ${lodKey}`);
            }
            const popupEl = pluralEl.querySelector("span.popuptext");
            if(!!popupEl) {
                popupEl.remove();
            }
            plural = pluralEl.textContent.trim();
        }

        let auxiliaryVerb: string | undefined = undefined;
        let pastParticiple: string | undefined = undefined;
        if(["hëllefsverb", "modalverb", "verb"].includes(notTranslatedType)) {
            const auxiliaryVerbEl = meaningsHtml.window.document.querySelector("div#article > span:nth-child(3)");
            if(!auxiliaryVerbEl || !auxiliaryVerbEl.textContent) {
                throw new Error(`Auxiliary verb not found for ${lodKey}`);
            }
            auxiliaryVerb = auxiliaryVerbEl.textContent.trim().split(" ")[1];
            const pastParticipleEl = meaningsHtml.window.document.querySelector("div#article > span:nth-child(6)");
            if(!pastParticipleEl || !pastParticipleEl.textContent) {
                throw new Error(`Past participle not found for ${lodKey}`);
            }
            pastParticiple = pastParticipleEl.textContent.trim();
        }

        const types: WordType[] = [];

        for(const key of typeKeys) {
            const typeDetails: WordTypeDetails = {};

            if(key === "noun") {
                typeDetails.nounGender = nounGender;
                typeDetails.plural =  plural;
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

        this.extractMeanings(lodKey, meaningsHtml, types, typeKeys);

        return types;
    }

    private extractMeanings(lodKey: string, meaningsHtml: JSDOM, wordTypes: WordType[], extractedTypes: string[]): void {
        let blocks = meaningsHtml.window.document.querySelectorAll("div#article > div.tl_block");
        if(blocks.length === 0) {
            blocks = meaningsHtml.window.document.querySelectorAll("div#article");
        }

        blocks.forEach(block => {
            let blockWordTypes = [extractedTypes[0]];
            let notTranslatedBlockWordType : string = block.querySelector(":scope > span.info_gramm_tl")?.textContent?.trim() || "";
            if(!!notTranslatedBlockWordType) {
                notTranslatedBlockWordType += block.querySelector(":scope > span.text_gen")?.textContent?.trim() || "";
                switch(notTranslatedBlockWordType) {
                    case "intransitiv": blockWordTypes = ["intransitive verb"]; break;
                    case "transitiv": blockWordTypes = ["transitive verb"]; break;
                    case "reflexiv": blockWordTypes = ["reflexive verb"]; break;
                    case "intransitiv- onperséinlech": blockWordTypes = ["intransitive impersonal verb"]; break;
                    case "intransitiv- och onperséinlech": blockWordTypes = ["intransitive verb", "intransitive impersonal verb"]; break;
                    case "transitiv- onperséinlech": blockWordTypes = ["transitive impersonal verb"]; break;
                    default: throw new Error(`WordType[${notTranslatedBlockWordType}] not found for ${lodKey}`);
                }
            }

            for(const blockWordType of blockWordTypes) {
                const wordType = wordTypes.find(it => it.type === blockWordType);
                if(!wordType) {
                    throw new Error(`WordType[${notTranslatedBlockWordType}] not found for ${lodKey}`);
                }

                const meanings = block.querySelectorAll(":scope > div.uds_block");

                meanings.forEach(meaning => {
                    const translations = meaning.querySelectorAll(":scope > span.et");
                    const complements = meaning.querySelectorAll(":scope > span.et + span.text_gen");
                    translations.forEach(translation => {
                        const language = translation.getAttribute("lang")!.toUpperCase();
                        const text = translation.textContent;
                        let complement = "";
                        if(translation.childElementCount < translation.parentElement!.children.length - 1) {
                            const textGen = translation.parentElement!.children[translation.childElementCount + 1];
                            if(textGen.className === "text_gen" && !!textGen!.textContent) {
                                complement = ` [${complement}]`;
                            }
                        }

                        //console.log(`${language} - ${text}${complement}`);
                    });

                    translations.forEach(translation => {
                        const language = translation.getAttribute("lang")!.toUpperCase();
                        const text = translation.textContent;
                        let complement = "";
                        if(translation.childElementCount < translation.parentElement!.children.length - 1) {
                            const textGen = translation.parentElement!.children[translation.childElementCount + 1];
                            if(textGen.className === "text_gen" && !!textGen!.textContent) {
                                complement = ` [${complement}]`;
                            }
                        }

                        //console.log(`${language} - ${text}${complement}`);
                    });
                });
            }
        });
    }
}
