import { inject, injectable } from "inversify";
import * as fs from "fs";
import * as path from "path";
import { Dictionary, Word } from "../model/word";
import { CONSTANTS } from "../constants";
import { TYPES } from "../types";
import { KeyGenerator } from "./key-generator";
import { LabelProvider } from "./label-provider";

export interface DeckExporter {
    export(dictionary: Dictionary, outputDirectory: string): void;
}

@injectable()
export class DeckExporterImpl implements DeckExporter {

    constructor(
        @inject(TYPES.KeyGenerator) private readonly keyGenerator: KeyGenerator,
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider
    ) { }

    public export(dictionary: Dictionary, outputDirectory: string): void {
        const wordsFolder = path.join(outputDirectory, CONSTANTS.WORDS_FOLDER);
        let jsonFiles: string[] = [];

        if (!!dictionary.words) {
            jsonFiles = dictionary.words.map(word => {
                const wordId = this.keyGenerator.generateWordKey(word);
                return `${wordId}.json`;
            });
        }

        if (dictionary.exportAll) {
            jsonFiles = fs.readdirSync(wordsFolder);
        }

        if (jsonFiles.length > 0) {
            this.exportJsonToAnki(jsonFiles, dictionary, wordsFolder, outputDirectory);
        } else {
            console.error("Nothing to export");
        }
    }

    private exportJsonToAnki(files: string[], dictionary: Dictionary, wordsFolder: string, outputDirectory: string): void {
        const deckFile = path.join(outputDirectory, `${dictionary.fileName}.txt`);
        const fileStream = fs.createWriteStream(deckFile);

        for (const file of files) {
            const wordFile = path.join(wordsFolder, file);
            if (!fs.existsSync(wordFile)) {
                console.error(`${wordFile} not found!`);
                continue;
            }
            const word: Word = JSON.parse(fs.readFileSync(wordFile).toString());

            let flashcardBack = "";
            let anyContentPresent = false;
            for (const type of word.types) {
                flashcardBack += `<b>${this.labelProvider.get(type.type.toUpperCase(), dictionary.language)} [sound:${type.lodKey.toLowerCase()}.mp3]</b>:`;
                flashcardBack += `<ul>`;
                for (const meaning of type.meanings) {
                    const translation = meaning.translations.find(it => it.language === dictionary.language);
                    if (!translation || !translation.translation) {
                        continue;
                    }

                    if (!!translation.complement) {
                        flashcardBack += `<li>${translation.translation} [${translation.complement}]</li>`;
                    } else {
                        flashcardBack += `<li>${translation.translation}</li>`;
                    }
                    anyContentPresent = true;
                }
                if (!!type.details.variationOfLodKey) {
                    flashcardBack += `<li>${this.labelProvider.get("VARIANT_OF", dictionary.language)} ${type.details.variationOfLodKey}</li>`;
                    anyContentPresent = true;
                }

                flashcardBack += `</ul><br>`;
            }

            if (anyContentPresent) {
                fileStream.write(`${word.word};${flashcardBack}\n`);
            } else {
                console.error(`No content found for ${word.word}#${word.id} in ${dictionary.language}!`);
            }
        }

        fileStream.end();
    }
}
