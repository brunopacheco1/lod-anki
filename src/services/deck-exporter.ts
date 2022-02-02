import { inject, injectable } from "inversify";
import * as fs from "fs";
import * as path from "path";
import { Dictionary, Word } from "../model/word";
import { CONSTANTS } from "../constants";
import { TYPES } from "../types";
import { KeyGenerator } from "./key-generator";
import { LabelProvider } from "./label-provider";
const { default: AnkiExport } = require("anki-apkg-export");

export interface DeckExporter {
    export(dictionary: Dictionary, outputDirectory: string): Promise<void>;
}

@injectable()
export class DeckExporterImpl implements DeckExporter {

    constructor(
        @inject(TYPES.KeyGenerator) private readonly keyGenerator: KeyGenerator,
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider
    ) { }

    public async export(dictionary: Dictionary, outputDirectory: string): Promise<void> {
        const wordsFolder = path.join(outputDirectory, CONSTANTS.WORDS_FOLDER);
        const lodAudiosFolder = path.join(outputDirectory, CONSTANTS.LOD_AUDIOS_FOLDER);

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
            await this.exportJsonToAnki(jsonFiles, dictionary, wordsFolder, lodAudiosFolder, outputDirectory);
        } else {
            console.error("Nothing to export");
        }
    }

    private async exportJsonToAnki(files: string[], dictionary: Dictionary, wordsFolder: string, lodAudiosFolder: string, outputDirectory: string): Promise<void> {
        const apkg = new AnkiExport(dictionary.fileName);

        for (const file of files) {
            const wordFile = path.join(wordsFolder, file);
            if (!fs.existsSync(wordFile)) {
                console.error(`${wordFile} not found!`);
                continue;
            }
            const word: Word = JSON.parse(fs.readFileSync(wordFile).toString());

            let flashcardBack = "<div style=\"text-align: left\">";
            let anyContentPresent = false;
            const mediaToAdd: string[] = [];
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
                    mediaToAdd.push(`${type.lodKey.toLowerCase()}.mp3`);
                    anyContentPresent = true;
                }
                if (!!type.details.variationOfLodKey) {
                    flashcardBack += `<li>${this.labelProvider.get("VARIANT_OF", dictionary.language)} ${type.details.variationOf}</li>`;
                    anyContentPresent = true;
                }

                flashcardBack += `</ul><br>`;
            }

            flashcardBack += "</div>";

            if (anyContentPresent) {
                for(const media of mediaToAdd) {
                    apkg.addMedia(media, fs.readFileSync(path.join(lodAudiosFolder, media)));
                }
                apkg.addCard(`<div style="text-align: left">${word.word}</div>`, flashcardBack);
            } else {
                console.error(`No content found for ${word.word}#${word.id} in ${dictionary.language}!`);
            }
        }

        const zip = await apkg.save();
        const deckFile = path.join(outputDirectory, `${dictionary.fileName}.apkg`);
        fs.writeFileSync(deckFile, zip, "binary");
    }
}
