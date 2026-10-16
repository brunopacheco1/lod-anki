import * as fs from "node:fs";
import * as path from "node:path";
import { AudioMode, Word, WordType, WordUsageExample } from "../../model/word";
import { CONSTANTS } from "../../model/constants";
import { wordId } from "../word-id-generator";
import { label } from "../label-provider";
import { categoryTag, registerTag, wordTypeTag } from "../category-tags";
import { AudioProvider } from "../audio-provider";
import { Card } from "./custom-cards";
import { exampleAudioUrl, wordTypeHeader } from "./word-headers";

const PARALLEL_DOWNLOADS = 8;

export interface WordFilter {
    /** Word types to keep, such as noun; empty keeps all. */
    types: string[],
    /** LOD categories to keep, such as A1; empty keeps all. */
    categories: string[]
}

export interface LodCard extends Card {
    /** Stable key of the note, so re-importing an updated deck updates the card instead of duplicating it. */
    noteId: string,
    tags: string[],
    /** Audio files (name and local path) the card plays. */
    media: { name: string, file: string }[]
}

function matches(type: WordType, filter: WordFilter): boolean {
    return (filter.types.length === 0 || filter.types.includes(type.type))
        && (filter.categories.length === 0 || (type.categories || []).some((category) => filter.categories.includes(category)));
}

/** Builds cards for LOD words from the extracted LOD data. */
export class LodContentExporter {

    constructor(private readonly audioProvider: AudioProvider) { }

    /** Downloads the audio of all words in parallel, so building the cards only reads local files. */
    public async prefetchAudio(flashcards: string[], dataDirectory: string): Promise<void> {
        const audios = new Set<string>();
        for (const flashcard of flashcards) {
            const word = this.readWord(flashcard, dataDirectory);
            word?.types.filter((type) => !!type.details.audio).forEach((type) => audios.add(type.details.audio!));
        }
        const audiosFolder = path.join(dataDirectory, CONSTANTS.AUDIOS_FOLDER);
        const queue = [...audios].filter((audio) => !fs.existsSync(path.join(audiosFolder, audio)));
        const cached = audios.size - queue.length;
        let downloaded = 0;
        const worker = async () => {
            for (let audio = queue.shift(); audio; audio = queue.shift()) {
                if (await this.audioProvider.get(audio, audiosFolder)) {
                    downloaded++;
                }
            }
        };
        await Promise.all(Array.from({ length: PARALLEL_DOWNLOADS }, worker));
        if (audios.size > 0) {
            console.log(`Audio: ${downloaded} downloaded, ${cached} already cached, ${audios.size - cached - downloaded} unavailable`);
        }
    }

    /** Returns every word that has a word type in one of `categories` (every word when empty), sorted alphabetically. */
    public listWords(categories: string[], dataDirectory: string): string[] {
        const wordsFolder = path.join(dataDirectory, CONSTANTS.WORDS_FOLDER);
        const words: string[] = [];
        for (const file of fs.readdirSync(wordsFolder)) {
            const word = JSON.parse(fs.readFileSync(path.join(wordsFolder, file)).toString()) as Word;
            if (word.types.some((type) => matches(type, { types: [], categories }))) {
                words.push(word.word);
            }
        }
        return words.sort((a, b) => a.localeCompare(b, "lb"));
    }

    /** Builds the card of a word, or returns undefined when the word is unknown or none of its types pass `filter`. */
    public async buildCard(language: string, flashcard: string, filter: WordFilter, dataDirectory: string, audio: AudioMode = "offline"): Promise<LodCard | undefined> {
        const word = this.readWord(flashcard, dataDirectory);
        if (!word) {
            console.error(`${flashcard} not found!`);
            return undefined;
        }

        const selectedTypes = word.types.filter((type) => matches(type, filter));
        if (selectedTypes.length === 0) {
            return undefined;
        }

        const audiosFolder = path.join(dataDirectory, CONSTANTS.AUDIOS_FOLDER);
        const media: LodCard["media"] = [];
        let back = "";
        // Online audio plays the first pronunciation on its own, like Anki does with bundled audio.
        let autoplay = audio === "online";
        for (const type of selectedTypes) {
            if (type.details.audio && audio === "offline") {
                const audioFile = await this.audioProvider.get(type.details.audio, audiosFolder);
                if (audioFile) {
                    media.push({ name: type.details.audio, file: audioFile });
                } else {
                    type.details.audio = undefined;
                }
            }
            const header = wordTypeHeader(language, word, type, audio, autoplay && !!type.details.audio);
            autoplay = autoplay && !type.details.audio;
            back += `<div style="margin-bottom: 25px;">${header}${this.translationContent(language, type)}</div>`;
        }

        return {
            front: word.word,
            back,
            noteId: `lod:${word.word}`,
            tags: this.tags(selectedTypes, language),
            media,
        };
    }

    /** Word type, level, topic and register tags of the selected word types, in the deck language. */
    private tags(types: WordType[], language: string): string[] {
        const tags = types.flatMap((type) => [
            wordTypeTag(type.type, language),
            ...(type.categories || []).map((category) => categoryTag(category, language)),
            ...type.meanings.flatMap((meaning) => meaning.examples || [])
                .flatMap((example) => example.usage.split(" "))
                .filter((usage) => usage !== "ALLG")
                .map((usage) => registerTag(usage, language)),
        ]);
        return [...new Set(tags.filter((tag): tag is string => !!tag))];
    }

    private readWord(flashcard: string, dataDirectory: string): Word | undefined {
        const wordFile = path.join(dataDirectory, CONSTANTS.WORDS_FOLDER, `${wordId(flashcard)}.json`);
        if (!fs.existsSync(wordFile)) {
            return undefined;
        }
        return JSON.parse(fs.readFileSync(wordFile).toString()) as Word;
    }

    private translationContent(language: string, type: WordType): string {
        if (type.meanings.length === 0) {
            return "";
        }

        let content = "<ol>";
        for (const meaning of type.meanings) {
            const translation = meaning.translations.find((it) => it.language === language);
            if (!translation?.translation) {
                continue;
            }
            const polyLex = meaning.polyLex ? `<span style="color: #b00c12;">${meaning.polyLex}</span><br>` : "";
            const complement = translation.complement ? ` [${translation.complement}]` : "";
            let examples = "";
            if (meaning.examples && meaning.examples.length > 0) {
                examples = `<br><span style="font-size: 85%; color: #595959;">${label("EXAMPLE", language)}</span><br>${meaning.examples.map((it) => this.example(it, language)).join("<br>")}`;
            }
            content += `<li>${polyLex}${translation.translation}${complement}${examples}</li>`;
        }
        return `${content}</ol>`;
    }

    private example(example: WordUsageExample, language: string): string {
        const usages = example.usage.split(" ")
            .filter((it) => it !== "ALLG")
            .map((it) => `<span style="color: #595959; padding-left: 2px; padding-right: 2px; border-style: solid; border-color: #A4A4A4; border-width: thin; font-size: 90%;">${label(`${it}_USAGE`, language)}</span> `)
            .join(" ");
        // A small play button streams the recording, so a card with many examples stays tidy and the deck small.
        const play = example.id
            ? ` <a href="#" style="text-decoration: none;" onclick="new Audio('${exampleAudioUrl(example.id)}').play(); return false;">&#128264;</a>`
            : "";
        return `${usages}${example.example}${play}`;
    }
}
