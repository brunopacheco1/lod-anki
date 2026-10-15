import * as fs from "node:fs";
import * as path from "node:path";
import { Word, WordType, WordUsageExample } from "../../model/word";
import { CONSTANTS } from "../../model/constants";
import { wordId } from "../word-id-generator";
import { label } from "../label-provider";
import { AudioProvider } from "../audio-provider";
import { Card } from "./custom-cards";
import { wordTypeHeader } from "./word-headers";

const PARALLEL_DOWNLOADS = 8;

export interface LodCard extends Card {
    /** Stable key of the note, so re-importing an updated deck updates the card instead of duplicating it. */
    noteId: string,
    tags: string[],
    /** Audio files (name and local path) the card plays. */
    media: { name: string, file: string }[]
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
        const queue = [...audios];
        const audiosFolder = path.join(dataDirectory, CONSTANTS.AUDIOS_FOLDER);
        const worker = async () => {
            for (let audio = queue.shift(); audio; audio = queue.shift()) {
                await this.audioProvider.get(audio, audiosFolder);
            }
        };
        await Promise.all(Array.from({ length: PARALLEL_DOWNLOADS }, worker));
    }

    /** Builds the card of a word, or returns undefined when the word is unknown or has none of `types`. */
    public async buildCard(language: string, flashcard: string, types: string[], dataDirectory: string): Promise<LodCard | undefined> {
        const word = this.readWord(flashcard, dataDirectory);
        if (!word) {
            console.error(`${flashcard} not found!`);
            return undefined;
        }

        const selectedTypes = word.types.filter((type) => types.length === 0 || types.includes(type.type));
        if (selectedTypes.length === 0) {
            return undefined;
        }

        const audiosFolder = path.join(dataDirectory, CONSTANTS.AUDIOS_FOLDER);
        const media: LodCard["media"] = [];
        let back = "";
        for (const type of selectedTypes) {
            if (type.details.audio) {
                const audioFile = await this.audioProvider.get(type.details.audio, audiosFolder);
                if (audioFile) {
                    media.push({ name: type.details.audio, file: audioFile });
                } else {
                    type.details.audio = undefined;
                }
            }
            back += `<div style="margin-bottom: 25px;">${wordTypeHeader(language, word, type)}${this.translationContent(language, type)}</div>`;
        }

        return {
            front: word.word,
            back,
            noteId: `lod:${word.word}`,
            tags: [...new Set(selectedTypes.map((type) => type.type))],
            media,
        };
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
        return `${usages}${example.example}`;
    }
}
