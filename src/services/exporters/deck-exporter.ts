import { inject, injectable } from "inversify";
import * as fs from "fs";
import * as path from "path";
import { Deck, Word, WordType } from "@model/word";
import { CONSTANTS } from "@model/constants";
import { TYPES } from "@services/types";
import { WordIdGenerator } from "@services/word-id-generator";
import { LabelProvider } from "@services/label-provider";
import { BasicCardExporter } from "@services/exporters/basic-card-exporter";
import { ClozeCardExporter } from "@services/exporters/cloze-card-exporter";
import { LodContentExporter } from "@services/exporters/lod-content-exporter";
const { default: AnkiExport } = require("anki-apkg-export");

export interface DeckExporter {
    export(deck: Deck, outputDirectory: string): Promise<void>;
}

@injectable()
export class DeckExporterImpl implements DeckExporter {

    constructor(
        @inject(TYPES.WordIdGenerator) private readonly keyGenerator: WordIdGenerator,
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider,
        @inject(TYPES.LodContentExporter) private readonly lodContentExporter: LodContentExporter,
        @inject(TYPES.BasicCardExporter) private readonly basicCardExporter: BasicCardExporter,
        @inject(TYPES.ClozeCardExporter) private readonly clozeCardExporter: ClozeCardExporter,
    ) { }

    public async export(deck: Deck, outputDirectory: string): Promise<void> {
        const wordsFolder = path.join(outputDirectory, CONSTANTS.WORDS_FOLDER);
        const lodAudiosFolder = path.join(outputDirectory, CONSTANTS.LOD_AUDIOS_FOLDER);

        let flashcards: string[] = [];

        if (!!deck.flashcards) {
            flashcards = deck.flashcards.map(flashcard => {
                if (flashcard.startsWith("basic:") || flashcard.startsWith("cloze:")) {
                    return flashcard;
                }
                const wordId = this.keyGenerator.generate(flashcard);
                return `${wordId}.json`;
            });
        }

        if (flashcards.length > 0) {
            for (const language of deck.languages) {
                const apkg = this.generateAnki(flashcards, deck.name, language, wordsFolder, lodAudiosFolder);
                await this.saveAnkiToFile(deck.fileName, language, apkg, outputDirectory);
            }
        } else {
            console.error("Nothing to export.");
        }
    }

    private generateAnki(flashcards: string[], deckName: string, language: string, wordsFolder: string, lodAudiosFolder: string): any {
        const apkg = new AnkiExport(`${deckName} - ${language}`);

        for (const flashcard of flashcards) {
            if (flashcard.startsWith("basic:")) {
                this.basicCardExporter.export(apkg, flashcard);
            } else if (flashcard.startsWith("cloze:")) {
                this.clozeCardExporter.export(apkg, flashcard);
            } else {
                this.lodContentExporter.export(apkg, language, flashcard, wordsFolder, lodAudiosFolder);
            }
        }

        return apkg;
    }

    private async saveAnkiToFile(fileName: string, language: string, apkg: any, outputDirectory: string): Promise<void> {
        const zip = await apkg.save();
        const deckFile = path.join(outputDirectory, `${fileName}_${language.toLowerCase()}.apkg`);
        fs.writeFileSync(deckFile, zip, "binary");
    }
}
