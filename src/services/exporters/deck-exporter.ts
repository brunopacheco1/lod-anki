import * as fs from "node:fs";
import * as path from "node:path";
import { AnkiExport } from "anki-apkg-export";
import { Deck } from "../../model/word";
import { label } from "../label-provider";
import { basicCard, Card, clozeCard } from "./custom-cards";
import { LodContentExporter, WordFilter } from "./lod-content-exporter";

const LEFT_ALIGNED = (html: string) => `<div style="text-align: left">${html}</div>`;

/** Exports a deck definition into one Anki package per language. */
export class DeckExporter {

    constructor(private readonly lodContentExporter: LodContentExporter) { }

    public async export(deck: Deck, outputDirectory: string, dataDirectory: string): Promise<void> {
        const filter: WordFilter = { types: deck.types || [], categories: deck.categories || [] };
        const flashcards = [...new Set(deck.flashcards || [])];
        if (!deck.flashcards && filter.categories.length > 0) {
            flashcards.push(...this.lodContentExporter.listWords(filter.categories, dataDirectory));
            console.log(`Found ${flashcards.length} words in ${filter.categories.join(", ")}`);
            if (flashcards.length === 0) {
                console.warn("No words found in these categories. Run 'lod-anki update' if your LOD data predates categories.");
            }
        }
        await this.lodContentExporter.prefetchAudio(flashcards.filter((flashcard) => !flashcard.includes(":")), dataDirectory);
        for (const language of deck.languages) {
            const deckFile = path.join(outputDirectory, `${deck.fileName}_${label("LANGUAGE_FILENAME", language)}.apkg`);
            const apkg = await AnkiExport.create(`${deck.name} - ${label("LANGUAGE", language)}`);
            try {
                await this.addCards(apkg, flashcards, language, filter, dataDirectory);
                fs.writeFileSync(deckFile, await apkg.save());
            } finally {
                apkg.close();
            }
        }
    }

    private async addCards(apkg: AnkiExport, flashcards: string[], language: string, filter: WordFilter, dataDirectory: string): Promise<void> {
        const media = new Set<string>();
        for (const flashcard of flashcards) {
            if (flashcard.startsWith("basic:") || flashcard.startsWith("cloze:")) {
                const card: Card = flashcard.startsWith("basic:") ? basicCard(flashcard) : clozeCard(flashcard);
                this.addCard(apkg, flashcard, card);
                continue;
            }
            const card = await this.lodContentExporter.buildCard(language, flashcard, filter, dataDirectory);
            if (!card) {
                continue;
            }
            for (const audio of card.media) {
                // Word types from the same LOD entry share one audio file, so a card can list it twice.
                if (!media.has(audio.name)) {
                    apkg.addMedia(audio.name, fs.readFileSync(audio.file));
                    media.add(audio.name);
                }
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
