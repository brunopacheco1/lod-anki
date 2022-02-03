import { inject, injectable } from "inversify";
import * as fs from "fs";
import * as path from "path";
import { Dictionary, Word, WordType } from "@model/word";
import { CONSTANTS } from "@model/constants";
import { TYPES } from "@services/types";
import { WordIdGenerator } from "@services/word-id-generator";
import { LabelProvider } from "@services/label-provider";
const { default: AnkiExport } = require("anki-apkg-export");

export interface DeckExporter {
    export(dictionary: Dictionary, outputDirectory: string): Promise<void>;
}

@injectable()
export class DeckExporterImpl implements DeckExporter {

    constructor(
        @inject(TYPES.WordIdGenerator) private readonly keyGenerator: WordIdGenerator,
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider
    ) { }

    public async export(dictionary: Dictionary, outputDirectory: string): Promise<void> {
        const wordsFolder = path.join(outputDirectory, CONSTANTS.WORDS_FOLDER);
        const lodAudiosFolder = path.join(outputDirectory, CONSTANTS.LOD_AUDIOS_FOLDER);

        let jsonFiles: string[] = [];

        if (!!dictionary.words) {
            jsonFiles = dictionary.words.map(word => {
                const wordId = this.keyGenerator.generate(word);
                return `${wordId}.json`;
            });
        }

        if (dictionary.exportAll) {
            jsonFiles = fs.readdirSync(wordsFolder);
        }

        if (jsonFiles.length > 0) {
            for (const language of ["ALL", "PO", "FR", "EN"]) {
                await this.exportJsonToAnki(jsonFiles, dictionary, language, wordsFolder, lodAudiosFolder, outputDirectory);
            }
        } else {
            console.error("Nothing to export");
        }
    }

    private async exportJsonToAnki(files: string[], dictionary: Dictionary, language: string, wordsFolder: string, lodAudiosFolder: string, outputDirectory: string): Promise<void> {
        const apkg = new AnkiExport(`${dictionary.name} - ${language}`);

        for (const file of files) {
            const wordFile = path.join(wordsFolder, file);
            if (!fs.existsSync(wordFile)) {
                console.error(`${wordFile} not found!`);
                continue;
            }

            const word: Word = JSON.parse(fs.readFileSync(wordFile).toString());

            let flashcardBack = "<div style=\"text-align: left\">";
            for (const type of word.types) {
                apkg.addMedia(`${type.lodKey.toLowerCase()}.mp3`, fs.readFileSync(path.join(lodAudiosFolder, `${type.lodKey.toLowerCase()}.mp3`)));
                flashcardBack += this.rerieveWordTypeHeader(language, word, type);
                flashcardBack += this.retrieveTranslationContent(language, type);
            }
            flashcardBack += "</div>";

            apkg.addCard(`<div style="text-align: left">${word.word}</div>`, flashcardBack);
        }

        const zip = await apkg.save();
        const deckFile = path.join(outputDirectory, `${dictionary.fileName}_${language.toLowerCase()}.apkg`);
        fs.writeFileSync(deckFile, zip, "binary");
    }

    private rerieveWordTypeHeader(language: string, word: Word, type: WordType): string {
        let content = `<b><a href="https://www.lod.lu/?${type.lodKey}">${word.word}</a>`;
        let typeStr = this.labelProvider.get(type.type.toUpperCase(), language);
        if (type.type === "noun") {
            if (type.details.nounCategory === "NOM-PROPRE") {
                typeStr = this.labelProvider.get("PROPER_NOUN", language);
            } else {
                typeStr = this.labelProvider.get(`${type.details.nounGender!.toUpperCase()}_${type.type.toUpperCase()}`, language);
            }
            if (type.details.nounGender === "INDEF") {
                typeStr += ` (${this.labelProvider.get("NO_SINGULAR", language)})`;
            } else if (!!type.details.plural) {
                typeStr += ` (${this.labelProvider.get("PLURAL", language)} ${type.details.plural})`;
            }
        }
        content += ` ${typeStr}`;
        if (!!type.details.variationOfLodKey) {
            content += ` - ${this.labelProvider.get("VARIANT_OF", language)} ${type.details.variationOf}`;
        }
        content += ` [sound:${type.lodKey.toLowerCase()}.mp3]</b>`;
        return content;
    }

    private retrieveTranslationContent(language: string, type: WordType): string {
        if (type.meanings.length === 0) {
            return "";
        }

        let content = `<ul>`;
        for (const meaning of type.meanings) {
            const translation = meaning.translations.find(it => it.language === language);
            if (!!translation?.translation) {
                if (!!translation.complement) {
                    content += `<li>${translation.translation} [${translation.complement}]</li>`;
                } else {
                    content += `<li>${translation.translation}</li>`;
                }
            }
        }
        content += `</ul>`;
        return content;
    }
}
