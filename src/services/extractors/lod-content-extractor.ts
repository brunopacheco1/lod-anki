import { inject, injectable } from "inversify";
import * as path from "path";
import { TYPES } from "../types";
import { FileWriter } from "../file-writer";
import { CONSTANTS } from "../../model/constants";
import { Word } from "../../model/word";
import { WordIdGenerator } from "../word-id-generator";
import { mapEntry } from "./lod-entry-mapper";
import { streamElements } from "./xml-tree";

export interface LodContentExtractor {
    extract(lodDumpFile: string, outputDirectory: string): Promise<void>;
}

/**
 * Extracts words from the LOD linguistic dataset XML published on data.public.lu
 * into one JSON file per word under `<outputDirectory>/lod/words`.
 */
@injectable()
export class LodContentExtractorImpl implements LodContentExtractor {

    constructor(
        @inject(TYPES.FileWriter) private readonly fileWriter: FileWriter,
        @inject(TYPES.WordIdGenerator) private readonly wordIdGenerator: WordIdGenerator,
    ) { }

    public async extract(lodDumpFile: string, outputDirectory: string): Promise<void> {
        const extractedWords = new Map<string, Word>();
        let entries = 0;

        await streamElements(lodDumpFile, "entry", (entry) => {
            entries++;
            for (const word of mapEntry(entry, (text) => this.wordIdGenerator.generate(text))) {
                const previous = extractedWords.get(word.id);
                if (previous) {
                    previous.types.push(...word.types);
                } else {
                    extractedWords.set(word.id, word);
                }
            }
        });

        const wordsFolder = path.join(outputDirectory, CONSTANTS.DATA_FOLDER, CONSTANTS.WORDS_FOLDER);
        for (const word of extractedWords.values()) {
            this.fileWriter.write(wordsFolder, `${word.id}.json`, Buffer.from(JSON.stringify(word)).toString("base64"));
        }

        const typeCounts = new Map<string, number>();
        for (const word of extractedWords.values()) {
            for (const type of word.types) {
                typeCounts.set(type.type, (typeCounts.get(type.type) || 0) + 1);
            }
        }
        console.log(`Read ${entries} entries and wrote ${extractedWords.size} words to ${wordsFolder}`);
        for (const [type, count] of typeCounts) {
            console.log(`  ${type}: ${count}`);
        }
    }
}
