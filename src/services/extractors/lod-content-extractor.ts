import * as fs from "node:fs";
import * as path from "node:path";
import { CONSTANTS } from "../../model/constants";
import { Word } from "../../model/word";
import { wordId } from "../word-id-generator";
import { mapEntry } from "./lod-entry-mapper";
import { streamElements } from "./xml-tree";

/**
 * Extracts words from the LOD linguistic dataset XML published on data.public.lu
 * into one JSON file per word under `<outputDirectory>/lod/words`.
 */
export async function extractLodContent(lodDumpFile: string, outputDirectory: string): Promise<void> {
    const extractedWords = new Map<string, Word>();
    let entries = 0;

    await streamElements(lodDumpFile, "entry", (entry) => {
        entries++;
        for (const word of mapEntry(entry, wordId)) {
            const previous = extractedWords.get(word.id);
            if (previous) {
                previous.types.push(...word.types);
            } else {
                extractedWords.set(word.id, word);
            }
        }
    });

    const wordsFolder = path.join(outputDirectory, CONSTANTS.DATA_FOLDER, CONSTANTS.WORDS_FOLDER);
    fs.mkdirSync(wordsFolder, { recursive: true });
    const typeCounts = new Map<string, number>();
    for (const word of extractedWords.values()) {
        fs.writeFileSync(path.join(wordsFolder, `${word.id}.json`), JSON.stringify(word));
        for (const type of word.types) {
            typeCounts.set(type.type, (typeCounts.get(type.type) || 0) + 1);
        }
    }

    console.log(`Read ${entries} entries and wrote ${extractedWords.size} words to ${wordsFolder}`);
    for (const [type, count] of typeCounts) {
        console.log(`  ${type}: ${count}`);
    }
}
