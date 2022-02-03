import { injectable } from "inversify";
import * as crypto from "crypto";

export interface WordIdGenerator {
    generate(word: string): string;
}

@injectable()
export class WordIdGeneratorImpl implements WordIdGenerator {

    public generate(word: string): string {
        return crypto.createHash("md5").update(word, "utf-8").digest("hex");
    }
}
