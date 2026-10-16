import * as fs from "node:fs";
import * as path from "node:path";
import { AudioMode, Deck } from "../model/word";

/** Deck languages, as written in deck files: ALL is German, PO is Portuguese. */
export const LANGUAGES = ["ALL", "EN", "FR", "PO"];

const DEFAULT_LANGUAGES = ["EN"];

const AUDIO_MODES: AudioMode[] = ["offline", "online"];

export interface DeckOptions {
    name?: string,
    /** Comma-separated deck languages, such as "EN,FR". */
    languages?: string,
    /** "offline" bundles the audio in the deck; "online" streams it. */
    audio?: string
}

/**
 * Reads a deck from a `.json` deck file, or from a plain text file with one word per line
 * (blank lines and lines starting with # are skipped). Options override the file's name, languages and audio mode.
 */
export function loadDeck(deckFile: string, options: DeckOptions = {}): Deck {
    const content = fs.readFileSync(deckFile).toString();
    const deck: Deck = path.extname(deckFile).toLowerCase() === ".json"
        ? JSON.parse(content) as Deck
        : textDeck(path.basename(deckFile, path.extname(deckFile)), content);
    if (options.name) {
        deck.name = options.name;
    }
    if (options.languages) {
        deck.languages = parseLanguages(options.languages);
    }
    if (options.audio) {
        deck.audio = options.audio.toLowerCase() as AudioMode;
    }
    if (deck.audio && !AUDIO_MODES.includes(deck.audio)) {
        throw new Error(`Unknown audio mode ${deck.audio}. Use ${AUDIO_MODES.join(" or ")}.`);
    }
    if (!deck.languages?.length) {
        throw new Error(`The deck has no languages. Add "languages" to the deck file or pass --languages (${LANGUAGES.join(", ")}).`);
    }
    return deck;
}

function textDeck(name: string, content: string): Deck {
    const flashcards = content.split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
    return { name, fileName: fileNameOf(name), flashcards, languages: DEFAULT_LANGUAGES };
}

function fileNameOf(name: string): string {
    return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "deck";
}

function parseLanguages(languages: string): string[] {
    const parsed = [...new Set(languages.split(",").map((language) => language.trim().toUpperCase()).filter(Boolean))];
    const unknown = parsed.filter((language) => !LANGUAGES.includes(language));
    if (unknown.length > 0) {
        throw new Error(`Unknown language ${unknown.join(", ")}. Use ${LANGUAGES.join(", ")} (ALL is German, PO is Portuguese).`);
    }
    return parsed;
}
