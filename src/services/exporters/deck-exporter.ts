import { inject, injectable } from "inversify";
import * as fs from "fs";
import * as path from "path";
import { Deck } from "@model/word";
import { TYPES } from "@services/types";
import { BasicCardExporter } from "@services/exporters/basic-card-exporter";
import { ClozeCardExporter } from "@services/exporters/cloze-card-exporter";
import { LodContentExporter } from "@services/exporters/lod-content-exporter";
import { LabelProvider } from "@services/label-provider";
const initSqlJs = require("sql.js");
const { default: AnkiExport } = require("anki-apkg-export/dist/exporter");
const { default: createTemplate } = require("anki-apkg-export/dist/template");


export interface DeckExporter {
    export(deck: Deck, outputDirectory: string): Promise<void>;
}

@injectable()
export class DeckExporterImpl implements DeckExporter {

    constructor(
        @inject(TYPES.LodContentExporter) private readonly lodContentExporter: LodContentExporter,
        @inject(TYPES.BasicCardExporter) private readonly basicCardExporter: BasicCardExporter,
        @inject(TYPES.ClozeCardExporter) private readonly clozeCardExporter: ClozeCardExporter,
        @inject(TYPES.LabelProvider) private readonly labelProvider: LabelProvider,
    ) { }

    public async export(deck: Deck, outputDirectory: string): Promise<void> {
        for (const language of deck.languages) {
            const apkg = await this.generateAnki(deck.flashcards, deck.name, language, deck.types, outputDirectory);
            await this.saveAnkiToFile(deck.fileName, language, apkg, outputDirectory);
        }
    }

    private async generateAnki(flashcards: string[], deckName: string, language: string, types: string[], outputDirectory: string): Promise<any> {
        const sql = await initSqlJs({});
        const apkg = new AnkiExport(`${deckName} - ${this.labelProvider.get("LANGUAGE", language)}`, {
            template: createTemplate(),
            sql
        });
        const uniqueFlashcards = [...new Set(flashcards)];
        for (const flashcard of uniqueFlashcards) {
            if (flashcard.startsWith("basic:")) {
                this.basicCardExporter.export(apkg, flashcard);
            } else if (flashcard.startsWith("cloze:")) {
                this.clozeCardExporter.export(apkg, flashcard);
            } else {
                this.lodContentExporter.export(apkg, language, flashcard, types, outputDirectory);
            }
        }

        return apkg;
    }

    private async saveAnkiToFile(fileName: string, language: string, apkg: any, outputDirectory: string): Promise<void> {
        const zip = await apkg.save();
        const deckFile = path.join(outputDirectory, `${fileName}_${this.labelProvider.get("LANGUAGE_FILENAME", language)}.apkg`);
        fs.writeFileSync(deckFile, zip, "binary");
    }
}
