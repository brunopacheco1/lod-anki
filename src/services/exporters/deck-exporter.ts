import * as fs from "node:fs";
import * as path from "node:path";
import { AnkiExport } from "anki-apkg-export";
import { Deck } from "../../model/word";
import { label } from "../label-provider";
import { basicCard, Card, clozeCard } from "./custom-cards";
import { LodContentExporter } from "./lod-content-exporter";

const LEFT_ALIGNED = (html: string) => `<div style="text-align: left">${html}</div>`;

/** Exports a deck definition into one Anki package per language. */
export class DeckExporter {

    constructor(private readonly lodContentExporter: LodContentExporter) { }

    public async export(deck: Deck, outputDirectory: string, dataDirectory: string): Promise<void> {
        const flashcards = [...new Set(deck.flashcards)];
        await this.lodContentExporter.prefetchAudio(flashcards.filter((flashcard) => !flashcard.includes(":")), dataDirectory);
        for (const language of deck.languages) {
            const deckFile = path.join(outputDirectory, `${deck.fileName}_${label("LANGUAGE_FILENAME", language)}.apkg`);
            const apkg = await AnkiExport.create(`${deck.name} - ${label("LANGUAGE", language)}`);
            try {
                await this.addCards(apkg, flashcards, language, deck.types || [], dataDirectory);
                fs.writeFileSync(deckFile, await apkg.save());
            } finally {
                apkg.close();
            }
        }
    }

    private async addCards(apkg: AnkiExport, flashcards: string[], language: string, types: string[], dataDirectory: string): Promise<void> {
        const media = new Set<string>();
        for (const flashcard of flashcards) {
            if (flashcard.startsWith("basic:") || flashcard.startsWith("cloze:")) {
                const card: Card = flashcard.startsWith("basic:") ? basicCard(flashcard) : clozeCard(flashcard);
                this.addCard(apkg, flashcard, card);
                continue;
            }
            const card = await this.lodContentExporter.buildCard(language, flashcard, types, dataDirectory);
            if (!card) {
                continue;
            }
            for (const audio of card.media.filter((it) => !media.has(it.name))) {
                apkg.addMedia(audio.name, fs.readFileSync(audio.file));
                media.add(audio.name);
            }
            this.addCard(apkg, flashcard, card, { noteId: card.noteId, tags: card.tags });
        }
    }

    private addCard(apkg: AnkiExport, flashcard: string, card: Card, options?: { noteId: string, tags: string[] }): void {
        try {
            apkg.addCard(LEFT_ALIGNED(card.front), LEFT_ALIGNED(card.back), options);
        } catch (error) {
            console.error(`Skipped ${flashcard}: ${error instanceof Error ? error.message : error}`);
        }
    }
}
