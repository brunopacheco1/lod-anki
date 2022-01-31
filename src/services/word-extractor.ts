import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { FileOutputStream } from "./file-output-stream";
import { KeyGenerator } from "./key-generator";

export interface WordExtractor {
    extract(wordList: string[], outputDirectory: string): Promise<void>;
}

@injectable()
export class WordExtractorImpl implements WordExtractor {

    constructor(
        @inject(TYPES.FileOutputStream) private readonly outputStream: FileOutputStream,
        @inject(TYPES.KeyGenerator) private readonly keyGenerator: KeyGenerator
    ) { }

    public async extract(wordList: string[], outputDirectory: string): Promise<void> {
        for (const lodKey of wordList) {
            try {
                console.log(`Extracting [${lodKey}]...`);
                console.log(`${lodKey} was extracted.`);
            } catch (exception) {
                console.error(exception);
            }
        }
    }
}
