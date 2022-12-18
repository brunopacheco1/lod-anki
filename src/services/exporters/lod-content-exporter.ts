import * as fs from "fs";
import * as path from "path";
import { Word, WordType, WordUsageExample } from "@model/word";
import { inject, injectable } from "inversify";
import { TYPES } from "@services/types";
import { NounExporter } from "@services/exporters/noun-exporter";
import { VerbExporter } from "@services/exporters/verb-exporter";
import { WordIdGenerator } from "@services/word-id-generator";
import { CONSTANTS } from "@model/constants";
import { BaseLodWordExporter } from "./base-lod-word-exporter";
import { LabelProvider } from "@services/label-provider";

export interface LodContentExporter {
    export(apkg: any, language: string, flashcard: string, types: string[], outputDirectory: string): void;
}

@injectable()
export class LodContentExporterImpl implements LodContentExporter {

    constructor(
        @inject(TYPES.WordIdGenerator) private readonly keyGenerator: WordIdGenerator,
        @inject(TYPES.BaseLodWordExporter) private readonly baseLodWordExporter: BaseLodWordExporter,
        @inject(TYPES.NounExporter) private readonly nounExporter: NounExporter,
        @inject(TYPES.VerbExporter) private readonly verbExporter: VerbExporter,
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider
    ) { }


    public export(apkg: any, language: string, flashcard: string, types: string[], outputDirectory: string): void {
        const wordsFolder = path.join(outputDirectory, CONSTANTS.WORDS_FOLDER);
        const lodAudiosFolder = path.join(outputDirectory, CONSTANTS.AUDIOS_FOLDER);

        const wordId = this.keyGenerator.generate(flashcard);
        const wordFile = path.join(wordsFolder, `${wordId}.json`);
        if (!fs.existsSync(wordFile)) {
            console.error(`${flashcard} not found!`);
            return;
        }

        const word: Word = JSON.parse(fs.readFileSync(wordFile).toString());

        let flashcardBack = "<div style=\"text-align: left\">";
        let shouldAddCard = false;
        for (const type of word.types) {
            if (types.length !== 0 && !types.includes(type.type)) {
                continue;
            }
            shouldAddCard = true;
            
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

        if(shouldAddCard) {
            apkg.addCard(`<div style="text-align: left">${word.word}</div>`, flashcardBack);
        }
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

                let examples = "";
                if (!!meaning.examples) {
                    examples = `<br><span style="font-size: 85%; color: #595959;">${this.labelProvider.get("EXAMPLE", language)}</span><br>${meaning.examples.map(it => this.buildExample(it, language)).join("<br>")}`;
                }

                content += `<li>${polyLex}${translation.translation}${complement}${examples}</li>`;
            }
        }
        content += `</ol>`;
        return content;
    }

    private buildExample(example: WordUsageExample, language: string): string {
        let usages = example.usage.split(" ")
            .filter(it => it !== "ALLG")
            .map(it => `<span style="color: #595959; padding-left: 2px; padding-right: 2px; border-style: solid; border-color: #A4A4A4; border-width: thin; font-size: 90%;">${this.labelProvider.get(it + "_USAGE", language)}</span> `)
            .join(" ");

        return `${usages || ""}${example.example}`;
    }
}
