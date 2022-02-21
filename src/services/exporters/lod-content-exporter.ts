import * as fs from "fs";
import * as path from "path";
import { Word, WordType } from "@model/word";
import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { NounExporter } from "@services/exporters/noun-exporter";
import { VerbExporter } from "@services/exporters/verb-exporter";
import { WordIdGenerator } from "@services/word-id-generator";
import { CONSTANTS } from "@model/constants";
import { BaseLodWordExporter } from "./base-lod-word-exporter";

export interface LodContentExporter {
    export(apkg: any, language: string, jsonFile: string, outputDirectory: string): void;
}

@injectable()
export class LodContentExporterImpl implements LodContentExporter {

    constructor(
        @inject(TYPES.WordIdGenerator) private readonly keyGenerator: WordIdGenerator,
        @inject(TYPES.BaseLodWordExporter) private readonly baseLodWordExporter: BaseLodWordExporter,
        @inject(TYPES.NounExporter) private readonly nounExporter: NounExporter,
        @inject(TYPES.VerbExporter) private readonly verbExporter: VerbExporter
    ) { }


    public export(apkg: any, language: string, flashcard: string, outputDirectory: string): void {
        const wordsFolder = path.join(outputDirectory, CONSTANTS.WORDS_FOLDER);
        const lodAudiosFolder = path.join(outputDirectory, CONSTANTS.LOD_AUDIOS_FOLDER);

        const wordId = this.keyGenerator.generate(flashcard);
        const wordFile = path.join(wordsFolder, `${wordId}.json`);
        if (!fs.existsSync(wordFile)) {
            console.error(`${flashcard} not found!`);
            return;
        }

        const word: Word = JSON.parse(fs.readFileSync(wordFile).toString());

        let flashcardBack = "<div style=\"text-align: left\">";
        for (const type of word.types) {
            flashcardBack += "<div style=\"margin-bottom: 25px;\">";

            if (!!type.details.audio) {
                apkg.addMedia(`${type.details.audio}`, fs.readFileSync(path.join(lodAudiosFolder, `${type.details.audio}`)));
            }

            switch (type.type) {
                case "noun": flashcardBack += this.nounExporter.rerieveWordTypeHeader(language, word, type); break;
                case "verb": flashcardBack += this.verbExporter.rerieveWordTypeHeader(language, word, type); break;
                case "preposition":
                case "conjunction":
                case "adjective":
                case "adverb": flashcardBack += this.baseLodWordExporter.rerieveWordTypeHeader(language, word, type); break;
            }
            flashcardBack += this.retrieveTranslationContent(language, type);
            flashcardBack += "</div>";
        }
        flashcardBack += "</div>";

        apkg.addCard(`<div style="text-align: left">${word.word}</div>`, flashcardBack);
    }

    private retrieveTranslationContent(language: string, type: WordType): string {
        if (type.meanings.length === 0) {
            return "";
        }

        let content = `<ol>`;
        for (const meaning of type.meanings) {
            const translation = meaning.translations.find(it => it.language === language);
            if (!!translation?.translation) {
                let polyLex = "";
                if (!!meaning.polyLex) {
                    polyLex = `<span style="color: #b00c12;">${meaning.polyLex}</span><br>`;
                }

                let complement = "";
                if (!!translation.complement) {
                    complement = ` [${translation.complement}]`;
                }

                content += `<li>${polyLex}${translation.translation}${complement}</li>`;
            }
        }
        content += `</ol>`;
        return content;
    }
}
